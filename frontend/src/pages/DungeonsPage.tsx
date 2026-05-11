import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Skeleton } from '../shared/ui/Skeleton';
import { CharacterTabs } from '../widgets/CharacterTabs/ui/CharacterTabs';
import { gw2Client } from '../shared/api/gw2Client';

interface DungeonPath {
  id: string;
  name: string;
  type: string;
  completed: boolean;
}

interface Dungeon {
  id: string;
  name: string;
  icon: string;
  paths: DungeonPath[];
  completed_count: number;
  total_count: number;
}

interface DailyCraftingItem {
  id: string;
  name: string;
  completed: boolean;
}

function DungeonsPageContent({ characterName }: { characterName: string }) {
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

export function DungeonsPage() {
  const { name } = useParams<{ name: string }>();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {name && <CharacterTabs name={name} />}
        <h2 className="text-2xl font-bold text-gray-100 mb-6 mt-4">Данжи</h2>
        {name ? (
          <DungeonsPageContent characterName={name} />
        ) : (
          <p className="text-gray-400">Выберите персонажа для просмотра прогресса данжей.</p>
        )}
      </div>
    </Layout>
  );
}
