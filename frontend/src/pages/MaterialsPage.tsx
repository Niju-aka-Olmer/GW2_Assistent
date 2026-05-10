import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Skeleton } from '../shared/ui/Skeleton';
import { CharacterTabs } from '../widgets/CharacterTabs/ui/CharacterTabs';
import { CoinBadge } from '../widgets/PriceBadge/ui/PriceBadge';
import { gw2Client } from '../shared/api/gw2Client';

interface MaterialItem {
  id: number;
  name: string;
  icon: string;
  rarity: string;
  level: number;
  type: string;
  count: number;
  category_id: number;
  category_name: string;
  vendor_value: number;
  flags: string[];
  tp_buy: number;
  tp_sell: number;
}

const RARITY_ORDER: Record<string, number> = {
  Junk: 0,
  Basic: 1,
  Fine: 2,
  Masterwork: 3,
  Rare: 4,
  Exotic: 5,
  Ascended: 6,
  Legendary: 7,
};

const RARITY_COLORS: Record<string, string> = {
  Junk: 'text-gray-500',
  Basic: 'text-gray-300',
  Fine: 'text-green-400',
  Masterwork: 'text-yellow-400',
  Rare: 'text-orange-400',
  Exotic: 'text-purple-400',
  Ascended: 'text-pink-400',
  Legendary: 'text-red-400',
};

type SortKey = 'name' | 'count' | 'tp_sell' | 'rarity';

function MaterialsPageContent({ characterName }: { characterName: string }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
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
    const rarityOrder = (r: string) => RARITY_ORDER[r] ?? 1;
    if (sortKey === 'name') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortKey === 'count') {
      items.sort((a, b) => b.count - a.count);
    } else if (sortKey === 'tp_sell') {
      items.sort((a, b) => (b.tp_sell * b.count) - (a.tp_sell * a.count));
    } else if (sortKey === 'rarity') {
      items.sort((a, b) => rarityOrder(b.rarity) - rarityOrder(a.rarity) || a.name.localeCompare(b.name));
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
      <Layout>
        <CharacterTabs name={characterName} />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Layout>
    );
  }

  const totalItems = data?.materials?.length ?? 0;
  const totalValue = data?.materials?.reduce((s, m) => s + (m.tp_sell * m.count), 0) ?? 0;

  return (
    <Layout>
      <CharacterTabs name={characterName} />
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Склад материалов</h1>
        <div className="flex flex-wrap items-center gap-3">
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
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="bg-[#1a1d2a] border border-[#2d3246] rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-[#c9a84c]/50"
          >
            <option value="name">По имени</option>
            <option value="count">По количеству</option>
            <option value="tp_sell">По цене TP</option>
            <option value="rarity">По редкости</option>
          </select>
          <div className="text-sm text-text-secondary">
            {totalItems} материалов · общая стоимость{' '}
            <CoinBadge value={totalValue} />
          </div>
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
                      <img
                        src={item.icon}
                        alt={item.name}
                        className="w-8 h-8 rounded flex-shrink-0"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm truncate ${RARITY_COLORS[item.rarity] || 'text-text-primary'}`}>
                            {item.name}
                          </span>
                          <span className="text-text-tertiary text-[10px] flex-shrink-0">ур. {item.level}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-medium text-text-primary">x{item.count}</div>
                        </div>
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
    </Layout>
  );
}

export function MaterialsPage() {
  const { name } = useParams<{ name: string }>();
  if (!name) return null;
  return <MaterialsPageContent characterName={name} />;
}
