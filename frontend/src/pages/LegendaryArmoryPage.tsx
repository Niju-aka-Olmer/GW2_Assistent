import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Skeleton } from '../shared/ui/Skeleton';
import { CharacterTabs } from '../widgets/CharacterTabs/ui/CharacterTabs';
import { gw2Client } from '../shared/api/gw2Client';

interface LegendaryArmoryItem {
  id: number;
  name: string;
  icon: string;
  rarity: string;
  level: number;
  type: string;
  subtype: string;
  count: number;
  flags: string[];
}

const TYPE_ORDER: Record<string, number> = {
  Weapon: 0,
  Armor: 1,
  Trinket: 2,
  Back: 3,
  UpgradeComponent: 4,
};

const TYPE_LABELS: Record<string, string> = {
  Weapon: 'Оружие',
  Armor: 'Броня',
  Trinket: 'Аксессуары',
  Back: 'Спина',
  UpgradeComponent: 'Улучшения',
};

function LegendaryArmoryPageContent({ characterName }: { characterName: string }) {
  const [search, setSearch] = useState('');
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(Object.keys(TYPE_ORDER)));

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
    for (const key of Object.keys(TYPE_ORDER)) {
      if (groups[key]) ordered[key] = groups[key];
    }
    for (const key of Object.keys(groups)) {
      if (!TYPE_ORDER.hasOwnProperty(key)) ordered[key] = groups[key];
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Поиск легендарок..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-gray-800 text-gray-100 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
        />
        <div className="text-sm text-gray-400 whitespace-nowrap">
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
                {TYPE_LABELS[type] || type}
                <span className="text-sm text-gray-400 ml-2">({items.length})</span>
              </h3>
              <span className="text-gray-500 text-xl transform transition-transform duration-200"
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
                    className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-2 hover:bg-gray-700/50 transition-colors"
                    title={item.name}
                  >
                    <img
                      src={item.icon}
                      alt={item.name}
                      className="w-8 h-8 rounded flex-shrink-0"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-orange-400 truncate font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">
                        {item.count > 0 ? (
                          <span className="text-green-400">Разблокировано</span>
                        ) : (
                          <span className="text-gray-500">—</span>
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

export function LegendaryArmoryPage() {
  const { name } = useParams<{ name: string }>();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {name && <CharacterTabs name={name} />}
        <h2 className="text-2xl font-bold text-gray-100 mb-6 mt-4">Легендарное хранилище</h2>
        {name ? (
          <LegendaryArmoryPageContent characterName={name} />
        ) : (
          <p className="text-gray-400">Выберите персонажа для просмотра легендарного хранилища.</p>
        )}
      </div>
    </Layout>
  );
}
