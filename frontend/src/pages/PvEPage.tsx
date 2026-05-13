import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Skeleton } from '../shared/ui/Skeleton';
import { Tabs } from '../shared/ui/Tabs';
import { CharacterTabs } from '../widgets/CharacterTabs/ui/CharacterTabs';
import { gw2Client } from '../shared/api/gw2Client';

function DungeonsTabContent() {
  const [search, setSearch] = useState('');

  const { data: dungeonsData, isLoading: dungeonsLoading } = useQuery({
    queryKey: ['dungeons'],
    queryFn: gw2Client.getDungeons,
    refetchInterval: 60_000,
  });

  const { data: craftingData, isLoading: craftingLoading } = useQuery({
    queryKey: ['daily-crafting'],
    queryFn: gw2Client.getDailyCrafting,
    refetchInterval: 60_000,
  });

  const filteredDungeons = useMemo(() => {
    if (!dungeonsData?.dungeons) return [];
    let dungeons = dungeonsData.dungeons;
    if (search.trim()) {
      const q = search.toLowerCase();
      dungeons = dungeons.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.paths.some((p) => p.name.toLowerCase().includes(q)),
      );
    }
    return dungeons;
  }, [dungeonsData, search]);

  const totalCompleted = dungeonsData?.dungeons.reduce((sum, d) => sum + d.completed_count, 0) ?? 0;
  const totalPaths = dungeonsData?.dungeons.reduce((sum, d) => sum + d.total_count, 0) ?? 0;

  return (
    <div className="space-y-6">
      <input
        type="text"
        placeholder="Поиск данжа или пути..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-gray-800 text-gray-100 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
      />

      {dungeonsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-48 mb-3" />
              <Skeleton className="h-4 w-32 mb-2" />
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-10 w-full" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-400 text-right">
            Прогресс данжей:{' '}
            <span className="text-yellow-400 font-medium">
              {totalCompleted}/{totalPaths}
            </span>{' '}
            завершено
          </div>

          {filteredDungeons.map((dungeon) => (
            <Card key={dungeon.id} className="p-4">
              <div className="flex items-center gap-3 mb-3">
                {dungeon.icon && (
                  <img
                    src={dungeon.icon}
                    alt={dungeon.name}
                    className="w-10 h-10 rounded flex-shrink-0"
                    loading="lazy"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-100">{dungeon.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${(dungeon.completed_count / dungeon.total_count) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-400 whitespace-nowrap">
                      {dungeon.completed_count}/{dungeon.total_count}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                {dungeon.paths.map((path) => (
                  <div
                    key={path.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      path.completed
                        ? 'bg-green-900/30 text-green-300'
                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center text-xs transition-colors ${
                        path.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-600'
                      }`}
                    >
                      {path.completed && '✓'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm truncate block">
                        {path.name}
                        {path.type === 'story' && (
                          <span className="text-xs text-blue-400 ml-2">(Сюжет)</span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}

          {filteredDungeons.length === 0 && !dungeonsLoading && (
            <p className="text-gray-500 text-center py-8">
              {search ? 'Ничего не найдено' : 'Нет данных о данжах'}
            </p>
          )}
        </>
      )}

      <hr className="border-gray-700" />

      <div>
        <h3 className="text-xl font-bold text-gray-100 mb-4">Ежедневный крафт</h3>
        {craftingLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {craftingData?.items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  item.completed
                    ? 'bg-green-900/30 text-green-300'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                }`}
              >
                <span
                  className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center text-xs transition-colors ${
                    item.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-600'
                  }`}
                >
                  {item.completed && '✓'}
                </span>
                <span className="text-sm">{item.name}</span>
                {item.completed && (
                  <span className="text-xs text-green-400 ml-auto">Сделано</span>
                )}
              </div>
            ))}
            {(!craftingData?.items || craftingData.items.length === 0) && (
              <p className="text-gray-500 text-center py-4">Нет данных о ежедневном крафте</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BossesTabContent() {
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

const SUBTABS = [
  { id: 'dungeons', label: 'Данжи' },
  { id: 'bosses', label: 'Боссы' },
];

export function PvEPage() {
  const { name } = useParams<{ name: string }>();
  const [activeSubTab, setActiveSubTab] = useState('dungeons');

  if (!name) return null;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {name && <CharacterTabs name={name} />}
        <div className="flex items-center justify-between mt-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-100">
            {activeSubTab === 'dungeons' ? 'Данжи' : 'Мировые боссы'}
          </h2>
        </div>
        <Tabs tabs={SUBTABS} activeTab={activeSubTab} onChange={setActiveSubTab} variant="gw2" />
        <div className="mt-6">
          {activeSubTab === 'dungeons' && <DungeonsTabContent />}
          {activeSubTab === 'bosses' && <BossesTabContent />}
        </div>
      </div>
    </Layout>
  );
}
