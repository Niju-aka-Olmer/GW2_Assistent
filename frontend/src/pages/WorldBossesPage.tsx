import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Skeleton } from '../shared/ui/Skeleton';
import { CharacterTabs } from '../widgets/CharacterTabs/ui/CharacterTabs';
import { gw2Client } from '../shared/api/gw2Client';

interface WorldBoss {
  id: string;
  name: string;
  icon: string;
  map: string;
  defeated: boolean;
}

function WorldBossesPageContent({ characterName }: { characterName: string }) {
  const [search, setSearch] = useState('');
  const [showDefeated, setShowDefeated] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['world-bosses'],
    queryFn: gw2Client.getWorldBosses,
    refetchInterval: 60_000,
  });

  const filtered = useMemo(() => {
    if (!data?.bosses) return [];
    let list = data.bosses;
    if (!showDefeated) {
      list = list.filter((b) => !b.defeated);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) => b.name.toLowerCase().includes(q) || b.map.toLowerCase().includes(q),
      );
    }
    return list;
  }, [data, search, showDefeated]);

  const defeatedCount = data?.bosses.filter((b) => b.defeated).length ?? 0;
  const totalCount = data?.bosses.length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <input
          type="text"
          placeholder="Поиск босса или локации..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-gray-800 text-gray-100 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
        />
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={showDefeated}
            onChange={(e) => setShowDefeated(e.target.checked)}
            className="rounded"
          />
          Показывать убитых
        </label>
      </div>

      <div className="text-sm text-gray-400 text-right">
        Убито боссов:{' '}
        <span className="text-yellow-400 font-medium">
          {defeatedCount}/{totalCount}
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-32" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((boss) => (
            <Card
              key={boss.id}
              className={`p-4 transition-colors ${
                boss.defeated ? 'opacity-60' : 'opacity-100'
              }`}
            >
              <div className="flex items-center gap-3">
                {boss.icon ? (
                  <img src={boss.icon} alt="" className="w-10 h-10 rounded" />
                ) : (
                  <div className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center text-lg">
                    👹
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-100 truncate">
                      {boss.name}
                    </span>
                    {boss.defeated && (
                      <span className="text-xs bg-green-700 text-green-200 px-2 py-0.5 rounded-full shrink-0">
                        Убит
                      </span>
                    )}
                  </div>
                  {boss.map && (
                    <div className="text-sm text-gray-500">{boss.map}</div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function WorldBossesPage() {
  const { name } = useParams<{ name: string }>();
  if (!name) return null;

  return (
    <Layout>
      <CharacterTabs name={name} />
      <h1 className="text-2xl font-bold mb-4 text-gray-100">Мировые боссы</h1>
      <WorldBossesPageContent characterName={name} />
    </Layout>
  );
}
