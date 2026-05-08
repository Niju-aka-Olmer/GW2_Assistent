import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { Spinner } from '../shared/ui/Spinner';
import { SimpleMarkdown } from '../shared/ui/SimpleMarkdown';
import { apiClient } from '../shared/api/apiClient';
import { deepseekClient } from '../shared/api/deepseekClient';
import { useAnalysisHistory } from '../shared/hooks/useAnalysisHistory';

interface SearchItem {
  id: number;
  name: string;
  icon: string;
  rarity: string;
  level: number;
  type: string;
}

interface SearchResult {
  items: SearchItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
  building?: boolean;
  retry_after?: number;
}

interface PriceInfo {
  id: number;
  buys: { unit_price: number; quantity: number };
  sells: { unit_price: number; quantity: number };
}

interface WatchedItem extends SearchItem {
  buy_price?: number;
  sell_price?: number;
  buy_quantity?: number;
  sell_quantity?: number;
}

interface ExchangeRate {
  coins_per_gem: number;
  quantity: number;
}

function formatGold(copper: number): string {
  const abs = Math.abs(copper);
  const g = Math.floor(abs / 10000);
  const s = Math.floor((abs % 10000) / 100);
  const c = abs % 100;
  if (g > 0) return `${g}з ${s}с ${c}м`;
  if (s > 0) return `${s}с ${c}м`;
  return `${c}м`;
}

function rarityColor(rarity: string): string {
  const map: Record<string, string> = {
    Junk: 'text-gray-400',
    Basic: 'text-gray-300',
    Fine: 'text-blue-400',
    Masterwork: 'text-green-400',
    Rare: 'text-yellow-400',
    Exotic: 'text-orange-400',
    Ascended: 'text-pink-400',
    Legendary: 'text-purple-400',
  };
  return map[rarity] || 'text-gray-300';
}

export function TradingPostPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [watchedItems, setWatchedItems] = useState<WatchedItem[]>([]);
  const [deepseekKey, setDeepseekKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const { saveAnalysis } = useAnalysisHistory();

  const searchQuery_ = useQuery({
    queryKey: ['commerce-search', debouncedQuery, page],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return { items: [], total: 0, page: 0, page_size: 24, has_more: false } as SearchResult;
      const { data } = await apiClient.get('/commerce/search', {
        params: { q: debouncedQuery, page, page_size: 24 },
        timeout: 60000,
      });
      return data as SearchResult;
    },
    enabled: debouncedQuery.length >= 2,
    retry: (failureCount, error: any) => {
      if (error?.response?.data?.building) return false;
      return failureCount < 2;
    },
    refetchInterval: (query) => {
      const data = query.state.data as SearchResult | undefined;
      if (data?.building && data?.retry_after) {
        return data.retry_after * 1000;
      }
      return false;
    },
  });

  const pricesQuery = useQuery({
    queryKey: ['commerce-prices', watchedItems.map(i => i.id)],
    queryFn: async () => {
      const ids = watchedItems.map(i => i.id);
      if (ids.length === 0) return [];
      const { data } = await apiClient.get('/commerce/prices', {
        params: { item_ids: ids.join(',') },
      });
      return (data.prices || []) as PriceInfo[];
    },
    refetchInterval: 30000,
    enabled: watchedItems.length > 0,
  });

  const exchangeQuery = useQuery({
    queryKey: ['commerce-exchange'],
    queryFn: async () => {
      const { data } = await apiClient.get('/commerce/exchange', {
        params: { quantity: 10000, type: 'coins' },
      });
      return data as ExchangeRate;
    },
    refetchInterval: 60000,
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const ids = watchedItems.map(i => i.id);
      const exchangeData = exchangeQuery.data ? {
        coins_per_gem: exchangeQuery.data.coins_per_gem,
        gold_for_100gems: exchangeQuery.data.quantity,
      } : undefined;
      return deepseekClient.analyzeTradingPost(ids, deepseekKey.trim() || undefined, exchangeData);
    },
    onSuccess: (data) => {
      saveAnalysis({ name: 'Аукцион', type: 'build', analysis: data.analysis });
    },
  });

  const handleSearch = useCallback(() => {
    setDebouncedQuery(searchQuery);
    setPage(0);
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const toggleItemSelection = (id: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addToWatched = () => {
    if (!searchQuery_.data?.items) return;
    const selected = searchQuery_.data.items.filter(i => selectedItems.has(i.id));
    setWatchedItems(prev => {
      const existing = new Set(prev.map(i => i.id));
      const newItems = selected.filter(i => !existing.has(i.id));
      return [...prev, ...newItems];
    });
    setSelectedItems(new Set());
  };

  const removeFromWatched = (id: number) => {
    setWatchedItems(prev => prev.filter(i => i.id !== id));
  };

  const clearWatched = () => {
    setWatchedItems([]);
  };

  const priceMap = new Map<number, PriceInfo>();
  (pricesQuery.data || []).forEach(p => priceMap.set(p.id, p));

  const watchedWithPrices = watchedItems.map(item => {
    const price = priceMap.get(item.id);
    return {
      ...item,
      buy_price: price?.buys?.unit_price,
      sell_price: price?.sells?.unit_price,
      buy_quantity: price?.buys?.quantity,
      sell_quantity: price?.sells?.quantity,
    };
  });

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-[#f3c623] via-[#c9a84c] to-[#a68a3c] bg-clip-text text-transparent">
            Торговая площадка
          </span>
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Поиск предметов, цены и AI-анализ аукциона
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#f3c623]/40 to-transparent" />
            <h2 className="text-lg font-semibold text-[#c9a84c] mb-3">Поиск предметов</h2>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-bg-secondary border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-[#c9a84c]"
                placeholder="Введите название предмета..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button variant="gold" onClick={handleSearch} disabled={searchQuery.trim().length < 2}>
                Поиск
              </Button>
            </div>

            {searchQuery_.isLoading && (
              <div className="flex justify-center py-8">
                <Spinner className="w-8 h-8" />
              </div>
            )}

            {searchQuery_.data?.building && !searchQuery_.isLoading && (
              <div className="flex flex-col items-center justify-center py-8 text-sm text-[#c9a84c]">
                <Spinner className="w-6 h-6 mb-3" />
                <p>База данных предметов загружается...</p>
                <p className="text-text-tertiary text-xs mt-1">
                  Это займёт около минуты при первом запуске
                </p>
              </div>
            )}

            {searchQuery_.isError && !searchQuery_.data?.building && (
              <div className="text-center py-8 text-sm text-red-400">
                Ошибка при поиске. Проверьте подключение к GW2 API.
              </div>
            )}

            {searchQuery_.data?.items && searchQuery_.data.items.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">
                    Найдено: {searchQuery_.data.total}
                  </span>
                  {selectedItems.size > 0 && (
                    <Button variant="gold" onClick={addToWatched} className="text-xs px-3 py-1">
                      Добавить ({selectedItems.size})
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {searchQuery_.data.items.map((item) => {
                    const isSelected = selectedItems.has(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleItemSelection(item.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all border ${
                          isSelected
                            ? 'bg-[#c9a84c]/15 border-[#c9a84c]/40'
                            : 'bg-bg-secondary/50 border-border-primary/30 hover:bg-bg-hover hover:border-[#c9a84c]/20'
                        }`}
                      >
                        <div className="w-8 h-8 rounded bg-bg-tertiary flex-shrink-0 overflow-hidden">
                          {item.icon && (
                            <img
                              src={item.icon}
                              alt=""
                              className="w-full h-full object-contain"
                              loading="lazy"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`text-xs truncate ${rarityColor(item.rarity)}`}>
                            {item.name}
                          </div>
                          <div className="text-[10px] text-text-tertiary">
                            {item.level > 0 ? `Ур. ${item.level}` : ''} {item.type}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {searchQuery_.data.has_more && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button
                      variant="gw2"
                      className="text-xs px-3 py-1"
                      disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                    >
                      Назад
                    </Button>
                    <span className="text-sm text-text-secondary self-center">
                      Страница {page + 1}
                    </span>
                    <Button
                      variant="gw2"
                      className="text-xs px-3 py-1"
                      onClick={() => setPage(p => p + 1)}
                    >
                      Вперёд
                    </Button>
                  </div>
                )}
              </div>
            )}

            {searchQuery_.data?.items?.length === 0 && debouncedQuery.length >= 2 && !searchQuery_.isLoading && !searchQuery_.data?.building && (
              <p className="text-text-secondary text-center py-8 text-sm">
                Ничего не найдено
              </p>
            )}
          </Card>

          <Card variant="gw2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[#c9a84c]">Отслеживаемые предметы</h2>
              {watchedItems.length > 0 && (
                <button
                  onClick={clearWatched}
                  className="text-xs text-text-tertiary hover:text-red-400 transition-colors"
                >
                  Очистить все
                </button>
              )}
            </div>

            {watchedWithPrices.length === 0 && (
              <p className="text-text-secondary text-center py-8 text-sm">
                Найдите предметы и добавьте их для отслеживания цен
              </p>
            )}

            {watchedWithPrices.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-text-tertiary text-xs uppercase border-b border-border-primary">
                      <th className="text-left py-2 pr-2">Предмет</th>
                      <th className="text-right py-2 px-2">Цена покупки</th>
                      <th className="text-right py-2 px-2">Объём</th>
                      <th className="text-right py-2 px-2">Цена продажи</th>
                      <th className="text-right py-2 px-2">Объём</th>
                      <th className="text-right py-2 px-2">Спред</th>
                      <th className="text-right py-2 pl-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {watchedWithPrices.map((item) => {
                      const spread = item.sell_price && item.buy_price ? item.sell_price - item.buy_price : undefined;
                      const spreadPercent = item.buy_price && spread ? (spread / item.buy_price * 100) : undefined;
                      const isProfitable = spreadPercent && spreadPercent > 5;

                      return (
                        <tr key={item.id} className="border-b border-border-primary/50 hover:bg-bg-hover/30">
                          <td className="py-2 pr-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded bg-bg-tertiary flex-shrink-0 overflow-hidden">
                                {item.icon && (
                                  <img
                                    src={item.icon}
                                    alt=""
                                    className="w-full h-full object-contain"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                )}
                              </div>
                              <div>
                                <div className={`text-xs ${rarityColor(item.rarity)} truncate max-w-[120px] sm:max-w-[180px]`}>
                                  {item.name}
                                </div>
                                <div className="text-[10px] text-text-tertiary">{item.type}</div>
                              </div>
                            </div>
                          </td>
                          <td className="text-right py-2 px-2 text-xs text-green-400">
                            {item.buy_price != null ? formatGold(item.buy_price) : '-'}
                          </td>
                          <td className="text-right py-2 px-2 text-xs text-text-secondary">
                            {item.buy_quantity != null ? item.buy_quantity.toLocaleString() : '-'}
                          </td>
                          <td className="text-right py-2 px-2 text-xs text-red-400">
                            {item.sell_price != null ? formatGold(item.sell_price) : '-'}
                          </td>
                          <td className="text-right py-2 px-2 text-xs text-text-secondary">
                            {item.sell_quantity != null ? item.sell_quantity.toLocaleString() : '-'}
                          </td>
                          <td className={`text-right py-2 px-2 text-xs ${isProfitable ? 'text-green-400' : 'text-text-tertiary'}`}>
                            {spread != null ? formatGold(spread) : '-'}
                            {spreadPercent != null && (
                              <div className="text-[10px]">({spreadPercent.toFixed(1)}%)</div>
                            )}
                          </td>
                          <td className="text-right py-2 pl-2">
                            <button
                              onClick={() => removeFromWatched(item.id)}
                              className="text-text-tertiary hover:text-red-400 text-xs transition-colors"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {pricesQuery.isLoading && watchedItems.length > 0 && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-text-tertiary">
                <Spinner className="w-3 h-3" />
                Обновление цен...
              </div>
            )}

            {watchedItems.length > 0 && exchangeQuery.data && (
              <div className="mt-3 pt-3 border-t border-border-primary flex items-center gap-4 text-xs text-text-secondary">
                <span>💎 Курс: 1 gems = {formatGold(exchangeQuery.data.coins_per_gem)}</span>
                <span>100 gems = {formatGold(exchangeQuery.data.coins_per_gem * 100)}</span>
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <Card>
            <h2 className="text-lg font-semibold text-[#c9a84c] mb-3">AI-анализ</h2>

            <div className="space-y-3">
              <button
                className="text-sm text-[#c9a84c] hover:text-[#f3c623] transition-colors"
                onClick={() => setShowKeyInput(!showKeyInput)}
              >
                {showKeyInput ? 'Скрыть' : 'Указать свой'} DeepSeek API ключ
              </button>
              {showKeyInput && (
                <input
                  type="password"
                  className="w-full bg-bg-secondary border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-[#c9a84c]"
                  placeholder="DeepSeek API Key (опционально)"
                  value={deepseekKey}
                  onChange={e => setDeepseekKey(e.target.value)}
                />
              )}

              <Button
                variant="gold"
                className="w-full"
                disabled={watchedItems.length === 0 || analyzeMutation.isPending}
                onClick={() => analyzeMutation.mutate()}
              >
                {analyzeMutation.isPending
                  ? 'Анализирую...'
                  : watchedItems.length === 0
                    ? 'Добавьте предметы'
                    : `Анализировать (${watchedItems.length})`}
              </Button>

              {analyzeMutation.isPending && (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-text-secondary">
                  <Spinner className="w-5 h-5" />
                  Анализ рыночной ситуации...
                </div>
              )}

              {analyzeMutation.error && (
                <div className="text-red-400 text-sm">
                  {(analyzeMutation.error as any)?.response?.data?.detail || 'Ошибка анализа'}
                </div>
              )}
            </div>
          </Card>

          {analyzeMutation.data && (
            <Card variant="gw2">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-[#c9a84c]">Результат анализа</h2>
              </div>
              <div className="text-sm text-text-primary leading-relaxed max-h-[500px] overflow-y-auto">
                <SimpleMarkdown text={analyzeMutation.data.analysis} />
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
