import { useParams, useSearchParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Skeleton } from '../shared/ui/Skeleton';
import { Tabs } from '../shared/ui/Tabs';
import { ItemTooltip } from '../widgets/ItemTooltip/ui/ItemTooltip';
import { PriceBadge } from '../widgets/PriceBadge/ui/PriceBadge';
import { CoinBadge } from '../widgets/PriceBadge/ui/PriceBadge';
import { ItemModal } from '../widgets/ItemModal';
import { AnalyzeButton } from '../widgets/AnalyzeButton';
import { CharacterTabs } from '../widgets/CharacterTabs';
import { FilterBar } from '../widgets/FilterBar';
import { useCharacterInventory } from '../entities/character/api/getCharacters';
import { useBank } from '../entities/bank/api/getBank';
import { useItemDetails, useItemPrices } from '../entities/item/api/getItems';
import { getRarityColor, getRarityBorderClass } from '../entities/item/lib/getRarityColor';
import { deepseekClient } from '../shared/api/deepseekClient';
import { gw2Client } from '../shared/api/gw2Client';
import type { ItemDetails } from '../entities/item/model/types';
import type { MaterialItem, LegendaryArmoryItem } from '../shared/api/gw2Client';

const TABS = [
  { id: 'inventory', label: 'Сумки' },
  { id: 'bank', label: 'Банк' },
  { id: 'materials', label: 'Материалы' },
  { id: 'legendary', label: 'Легендарки' },
];

const RARITY_OPTIONS = [
  { value: 'Junk', label: 'Мусор' },
  { value: 'Basic', label: 'Базовый' },
  { value: 'Fine', label: 'Тонкая' },
  { value: 'Masterwork', label: 'Отличная' },
  { value: 'Rare', label: 'Редкая' },
  { value: 'Exotic', label: 'Экзотическая' },
  { value: 'Ascended', label: 'Возвышенная' },
  { value: 'Legendary', label: 'Легендарная' },
];

const TYPE_RU: Record<string, string> = {
  Weapon: 'Оружие',
  Armor: 'Броня',
  Trinket: 'Аксессуар',
  Back: 'Спина',
  Bag: 'Сумка',
  Consumable: 'Расходник',
  Trophy: 'Трофей',
  CraftingMaterial: 'Материал',
  UpgradeComponent: 'Улучшение',
  Gizmo: 'Гизмо',
  MiniPet: 'Мини-питомец',
  Gathering: 'Инструмент',
  Container: 'Контейнер',
  Key: 'Ключ',
  Recipe: 'Рецепт',
};

function getItemType(_item: { id: number; name: string; icon: string; rarity: string; level: number }, details?: ItemDetails): string {
  if (details?.type) return details.type;
  return '';
}

function buildDisplayItem(item: { id: number; name: string; icon: string; rarity: string; level: number }, details?: ItemDetails): ItemDetails {
  if (details) return details;
  return {
    id: item.id,
    name: item.name,
    icon: item.icon,
    description: '',
    type: '',
    rarity: item.rarity,
    level: item.level,
    vendor_value: 0,
    flags: [],
    chat_link: '',
  };
}

function ItemCell({ item, details, buys, sells, onItemClick }: {
  item: { id: number; name: string; icon: string; rarity: string; level: number; count?: number };
  details?: ItemDetails;
  buys?: { unit_price: number } | null;
  sells?: { unit_price: number } | null;
  onItemClick?: (item: ItemDetails) => void;
}) {
  const displayItem = buildDisplayItem(item, details);

  return (
    <ItemTooltip item={displayItem} buys={buys} sells={sells}>
      <div
        className={`relative bg-bg-secondary border-2 rounded-lg p-1.5 text-center transition-all hover:bg-bg-hover hover:scale-105 cursor-pointer ${getRarityBorderClass(item.rarity)}`}
        onClick={() => onItemClick?.(displayItem)}
      >
        <div className="w-10 h-10 mx-auto bg-bg-tertiary rounded flex items-center justify-center">
          <img src={item.icon} alt={item.name} className="w-9 h-9" />
        </div>
        {item.count && item.count > 1 && (
          <span className="absolute top-0.5 right-1 text-[10px] font-bold text-text-primary bg-bg-primary/80 px-1 rounded">
            {item.count}
          </span>
        )}
        <p
          className="text-[10px] font-medium truncate mt-0.5"
          style={{ color: getRarityColor(item.rarity) }}
          title={item.name}
        >
          {item.name}
        </p>
        <PriceBadge
          buys={buys}
          sells={sells}
          count={item.count}
          showEmpty={false}
        />
      </div>
    </ItemTooltip>
  );
}

const MATERIAL_RARITY_ORDER: Record<string, number> = {
  Junk: 0, Basic: 1, Fine: 2, Masterwork: 3, Rare: 4, Exotic: 5, Ascended: 6, Legendary: 7,
};

const MATERIAL_RARITY_COLORS: Record<string, string> = {
  Junk: 'text-gray-500', Basic: 'text-gray-300', Fine: 'text-green-400',
  Masterwork: 'text-yellow-400', Rare: 'text-orange-400', Exotic: 'text-purple-400',
  Ascended: 'text-pink-400', Legendary: 'text-red-400',
};

type MaterialsSortKey = 'name' | 'count' | 'tp_sell' | 'rarity';

function MaterialsTabContent() {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<MaterialsSortKey>('name');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: gw2Client.getMaterials,
    refetchInterval: 60_000,
  });

  const filtered = useMemo(() => {
    if (!data?.materials) return [];
    let items = [...data.materials];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter((m) => m.name.toLowerCase().includes(q));
    }
    if (sortKey === 'name') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortKey === 'count') {
      items.sort((a, b) => b.count - a.count);
    } else if (sortKey === 'tp_sell') {
      items.sort((a, b) => (b.tp_sell * b.count) - (a.tp_sell * a.count));
    } else if (sortKey === 'rarity') {
      items.sort((a, b) => (MATERIAL_RARITY_ORDER[b.rarity] ?? 1) - (MATERIAL_RARITY_ORDER[a.rarity] ?? 1) || a.name.localeCompare(b.name));
    }
    return items;
  }, [data, search, sortKey]);

  const grouped = useMemo(() => {
    const map = new Map<string, MaterialItem[]>();
    for (const item of filtered) {
      const cat = item.category_name || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const totalItems = data?.materials?.length ?? 0;
  const totalValue = data?.materials?.reduce((s, m) => s + (m.tp_sell * m.count), 0) ?? 0;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск материалов..."
            className="w-full bg-[#1a1d2a] border border-[#2d3246] rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-[#c9a84c]/50"
          />
        </div>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as MaterialsSortKey)}
          className="bg-[#1a1d2a] border border-[#2d3246] rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-[#c9a84c]/50"
        >
          <option value="name">По имени</option>
          <option value="count">По количеству</option>
          <option value="tp_sell">По цене TP</option>
          <option value="rarity">По редкости</option>
        </select>
        <div className="text-sm text-text-secondary whitespace-nowrap">
          {totalItems} материалов · общая стоимость <CoinBadge value={totalValue} />
        </div>
      </div>

      {grouped.length === 0 && (
        <Card className="p-8 text-center text-text-secondary">
          {search ? 'Ничего не найдено' : 'Нет материалов'}
        </Card>
      )}

      <div className="space-y-2">
        {grouped.map(([category, items]) => {
          const isExpanded = expandedCategories.has(category) || search.length > 0;
          const catTotal = items.reduce((s, m) => s + m.count, 0);
          const catValue = items.reduce((s, m) => s + (m.tp_sell * m.count), 0);

          return (
            <Card key={category} className="p-0 overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#1a1d2a] hover:bg-[#1e2130] transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#c9a84c] text-sm font-medium">{category}</span>
                  <span className="text-text-tertiary text-xs">({items.length})</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <span>{catTotal} шт.</span>
                  {catValue > 0 && <CoinBadge value={catValue} />}
                  <span className="text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </button>
              {isExpanded && (
                <div className="divide-y divide-[#2d3246]/50">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1a1d2a]/50 transition-colors"
                    >
                      <img src={item.icon} alt={item.name} className="w-8 h-8 rounded flex-shrink-0" loading="lazy" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm truncate ${MATERIAL_RARITY_COLORS[item.rarity] || 'text-text-primary'}`}>
                            {item.name}
                          </span>
                          <span className="text-text-tertiary text-[10px] flex-shrink-0">ур. {item.level}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-sm font-medium text-text-primary">x{item.count}</div>
                        <div className="min-w-[100px] text-right">
                          {item.tp_sell > 0 || item.tp_buy > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              {item.tp_sell > 0 && (
                                <div className="flex items-center justify-end gap-1 text-xs">
                                  <span className="text-green-400">прод.</span>
                                  <CoinBadge value={item.tp_sell} />
                                </div>
                              )}
                              {item.tp_buy > 0 && (
                                <div className="flex items-center justify-end gap-1 text-xs">
                                  <span className="text-orange-400">куп.</span>
                                  <CoinBadge value={item.tp_buy} />
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-text-tertiary">—</span>
                          )}
                        </div>
                        {item.tp_sell > 0 && (
                          <div className="text-xs text-text-secondary text-right min-w-[60px]">
                            <CoinBadge value={item.tp_sell * item.count} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

const LEGENDARY_TYPE_ORDER: Record<string, number> = {
  Weapon: 0, Armor: 1, Trinket: 2, Back: 3, UpgradeComponent: 4,
};

const LEGENDARY_TYPE_LABELS: Record<string, string> = {
  Weapon: 'Оружие', Armor: 'Броня', Trinket: 'Аксессуары', Back: 'Спина', UpgradeComponent: 'Улучшения',
};

function LegendaryTabContent() {
  const [search, setSearch] = useState('');
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(Object.keys(LEGENDARY_TYPE_ORDER)));

  const { data, isLoading } = useQuery({
    queryKey: ['legendary-armory'],
    queryFn: gw2Client.getLegendaryArmory,
    refetchInterval: 60_000,
  });

  const grouped = useMemo(() => {
    if (!data?.items) return {};
    let items = data.items;

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((item) => item.name.toLowerCase().includes(q));
    }

    const groups: Record<string, LegendaryArmoryItem[]> = {};
    for (const item of items) {
      const type = item.type || 'Other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(item);
    }

    const ordered: Record<string, LegendaryArmoryItem[]> = {};
    for (const key of Object.keys(LEGENDARY_TYPE_ORDER)) {
      if (groups[key]) ordered[key] = groups[key];
    }
    for (const key of Object.keys(groups)) {
      if (!LEGENDARY_TYPE_ORDER.hasOwnProperty(key)) ordered[key] = groups[key];
    }

    return ordered;
  }, [data, search]);

  const toggleType = (type: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const totalUnlocked = data?.items?.length ?? 0;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Поиск легендарок..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-[#1a1d2a] border border-[#2d3246] rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-[#c9a84c]/50"
        />
        <div className="text-sm text-text-secondary whitespace-nowrap">
          Всего: <span className="text-yellow-400 font-medium">{totalUnlocked}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-48 mb-3" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="h-16 w-full" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        Object.entries(grouped).map(([type, items]) => (
          <Card key={type} className="p-4">
            <button
              onClick={() => toggleType(type)}
              className="flex items-center justify-between w-full text-left mb-3"
            >
              <h3 className="text-lg font-semibold text-yellow-400">
                {LEGENDARY_TYPE_LABELS[type] || type}
                <span className="text-sm text-text-secondary ml-2">({items.length})</span>
              </h3>
              <span className="text-text-tertiary text-xl transition-transform duration-200"
                style={{ transform: expandedTypes.has(type) ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                ▼
              </span>
            </button>

            {expandedTypes.has(type) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 bg-[#1a1d2a] rounded-lg p-2 hover:bg-[#1e2130] transition-colors"
                    title={item.name}
                  >
                    <img src={item.icon} alt={item.name} className="w-8 h-8 rounded flex-shrink-0" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-orange-400 truncate font-medium">{item.name}</div>
                      <div className="text-xs text-text-tertiary">
                        {item.count > 0 ? (
                          <span className="text-green-400">Разблокировано</span>
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}

export function InventoryPage() {
  const { name } = useParams<{ name: string }>();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'inventory');

  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  const [selectedItem, setSelectedItem] = useState<ItemDetails | null>(null);

  const {
    data: invData,
    isLoading: invLoading,
    isError: invError,
    error: invErr,
  } = useCharacterInventory(name || '');

  const {
    data: bankData,
    isLoading: bankLoading,
    isError: bankError,
    error: bankErr,
  } = useBank();

  const allItemIds = useMemo(() => {
    const ids: number[] = [];
    if (invData?.bags) {
      for (const bag of invData.bags) {
        if (!bag) continue;
        for (const item of bag) {
          if (item?.id) ids.push(item.id);
        }
      }
    }
    if (bankData?.bank) {
      for (const item of bankData.bank) {
        if (item?.id) ids.push(item.id);
      }
    }
    return [...new Set(ids)];
  }, [invData, bankData]);

  const { data: detailsData } = useItemDetails(allItemIds);
  const { data: pricesData } = useItemPrices(allItemIds);

  const detailsMap = useMemo(() => {
    const map: Record<number, ItemDetails> = {};
    detailsData?.items?.forEach(item => { map[item.id] = item; });
    return map;
  }, [detailsData]);

  interface PriceEntry {
    buys: { unit_price: number } | null;
    sells: { unit_price: number } | null;
  }
  const pricesMap = useMemo(() => {
    const map: Record<number, PriceEntry> = {};
    pricesData?.prices?.forEach(p => {
      map[p.id] = {
        buys: p.buys as unknown as { unit_price: number } | null,
        sells: p.sells as unknown as { unit_price: number } | null,
      };
    });
    return map;
  }, [pricesData]);

  const isError = activeTab === 'inventory' ? invError : activeTab === 'bank' ? bankError : false;
  const isLoading = activeTab === 'inventory' ? invLoading : activeTab === 'bank' ? bankLoading : false;
  const error = activeTab === 'inventory' ? invErr : activeTab === 'bank' ? bankErr : null;

  const inventoryItems = useMemo(() => {
    if (!invData?.bags) return [];
    const items: NonNullable<typeof invData.bags[0][number]>[] = [];
    for (const bag of invData.bags) {
      if (!bag) continue;
      for (const item of bag) {
        if (item) items.push(item);
      }
    }
    return items;
  }, [invData]);

  const bankItems = useMemo(() => {
    if (!bankData?.bank) return [];
    return bankData.bank.filter((item): item is NonNullable<typeof item> => item !== null);
  }, [bankData]);

  const currentItems = activeTab === 'inventory' ? inventoryItems : bankItems;

  const typeOptions = useMemo(() => {
    const types = new Set<string>();
    for (const item of currentItems) {
      const t = getItemType(item, detailsMap[item.id]);
      if (t && TYPE_RU[t]) types.add(t);
    }
    return Array.from(types).map(t => ({ value: t, label: TYPE_RU[t] || t }));
  }, [currentItems, detailsMap]);

  const filteredItems = useMemo(() => {
    return currentItems.filter((item) => {
      if (search) {
        const q = search.toLowerCase();
        if (!item.name.toLowerCase().includes(q)) return false;
      }
      if (rarityFilter.length > 0) {
        if (!rarityFilter.includes(item.rarity)) return false;
      }
      if (typeFilter.length > 0) {
        const t = getItemType(item, detailsMap[item.id]);
        if (!t || !typeFilter.includes(t)) return false;
      }
      return true;
    });
  }, [currentItems, search, rarityFilter, typeFilter, detailsMap]);

  const hasActiveFilters = !!search || rarityFilter.length > 0 || typeFilter.length > 0;

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    inventory: { title: name || 'Персонаж', subtitle: 'Сумки персонажа' },
    bank: { title: 'Банк', subtitle: 'Общий банк' },
    materials: { title: 'Материалы', subtitle: 'Склад материалов' },
    legendary: { title: 'Легендарки', subtitle: 'Легендарное хранилище' },
  };
  const tabInfo = tabTitles[activeTab] || tabTitles.inventory;

  return (
    <Layout>
      <CharacterTabs name={name || ''} />
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-[#f3c623] via-[#c9a84c] to-[#a68a3c] bg-clip-text text-transparent">
              {tabInfo.title}
            </span>
          </h1>
          <p className="text-text-secondary text-sm mt-1">{tabInfo.subtitle}</p>
        </div>
        {(activeTab === 'inventory' || activeTab === 'bank') && (
          <AnalyzeButton
            label="AI Анализ"
            onAnalyze={(apiKey) => deepseekClient.analyzeInventory(name || '', activeTab as 'inventory' | 'bank', apiKey).then(r => r.analysis)}
            historyInfo={{ name: name || '', type: activeTab as 'inventory' | 'bank' }}
          />
        )}
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} variant="gw2" />

      {(activeTab === 'inventory' || activeTab === 'bank') && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <div className="lg:sticky lg:top-4 lg:self-start">
            <FilterBar
              search={search}
              onSearchChange={setSearch}
              rarity={rarityFilter}
              onRarityChange={setRarityFilter}
              type={typeFilter}
              onTypeChange={setTypeFilter}
              rarityOptions={RARITY_OPTIONS}
              typeOptions={typeOptions}
              onReset={() => { setSearch(''); setRarityFilter([]); setTypeFilter([]); }}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          <div>
            {isLoading && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-9 gap-2">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <div key={i} className="bg-bg-secondary border border-border-primary rounded-lg p-1.5">
                      <Skeleton className="w-10 h-10 mx-auto mb-1 rounded" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isError && !isLoading && (
              <Card>
                <p className="text-red-400">
                  {(error as any)?.response?.data?.detail || 'Ошибка загрузки'}
                </p>
              </Card>
            )}

            {!isLoading && !isError && filteredItems.length === 0 && (
              <Card>
                <p className="text-text-secondary text-center py-8">
                  {currentItems.length === 0
                    ? (activeTab === 'inventory' ? 'Инвентарь пуст' : 'Банк пуст')
                    : 'Ничего не найдено по фильтру'}
                </p>
              </Card>
            )}

            {!isLoading && !isError && filteredItems.length > 0 && (
              <>
                {hasActiveFilters && (
                  <p className="text-xs text-text-tertiary mb-3">
                    Показано {filteredItems.length} из {currentItems.length}
                  </p>
                )}
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-9 gap-2">
                  {filteredItems.map((item, idx) => {
                    const price = pricesMap[item.id];
                    return (
                      <ItemCell
                        key={`${item.id}-${idx}`}
                        item={item}
                        details={detailsMap[item.id]}
                        buys={price?.buys}
                        sells={price?.sells}
                        onItemClick={(fullItem) => setSelectedItem(fullItem)}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'materials' && <MaterialsTabContent />}

      {activeTab === 'legendary' && <LegendaryTabContent />}

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </Layout>
  );
}
