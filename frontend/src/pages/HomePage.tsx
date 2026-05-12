import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Skeleton } from '../shared/ui/Skeleton';
import { CharacterTabs } from '../widgets/CharacterTabs/ui/CharacterTabs';
import { gw2Client } from '../shared/api/gw2Client';

function HomePageContent({ characterName }: { characterName: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['home-data'],
    queryFn: gw2Client.getHomeData,
    refetchInterval: 60_000,
  });

  const nodes = data?.nodes ?? [];
  const cats = data?.cats ?? [];
  const decorations = data?.decorations ?? [];
  const glyphs = data?.glyphs ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-6 w-40 mb-3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="h-6 w-40 mb-3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Nodes section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-100 mb-3 flex items-center gap-2">
          <span>Узлы домашней инстанции</span>
          <span className="text-sm text-gray-500 font-normal">({nodes.length})</span>
        </h2>
        {nodes.length === 0 ? (
          <p className="text-gray-500 text-sm">Нет разблокированных узлов</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {nodes.map((node) => (
              <Card key={node.id} className="p-3 flex items-center gap-3">
                {node.icon ? (
                  <img src={node.icon} alt="" className="w-8 h-8 rounded object-contain" />
                ) : (
                  <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-sm text-gray-400">
                    🌿
                  </div>
                )}
                <span className="text-sm text-gray-200 truncate">{node.name}</span>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Cats section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-100 mb-3 flex items-center gap-2">
          <span>Кошки домашней инстанции</span>
          <span className="text-sm text-gray-500 font-normal">({cats.length})</span>
        </h2>
        {cats.length === 0 ? (
          <p className="text-gray-500 text-sm">Кошки не найдены</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {cats.map((cat) => (
              <Card key={cat.id} className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-lg shrink-0">
                  🐱
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-gray-200 truncate">{cat.name}</div>
                  {cat.hint && (
                    <div className="text-xs text-gray-500 truncate">{cat.hint}</div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Homestead Decorations section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-100 mb-3 flex items-center gap-2">
          <span>Украшения усадьбы</span>
          <span className="text-sm text-gray-500 font-normal">({decorations.length})</span>
        </h2>
        {decorations.length === 0 ? (
          <p className="text-gray-500 text-sm">Нет украшений</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {decorations.map((dec) => (
              <Card key={dec.id} className="p-3 flex items-center gap-3">
                {dec.icon ? (
                  <img src={dec.icon} alt="" className="w-8 h-8 rounded object-contain" />
                ) : (
                  <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-sm text-gray-400">
                    🏠
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm text-gray-200 truncate">{dec.name}</div>
                  <div className="text-xs text-gray-500">
                    {dec.count} шт.
                    {dec.rarity !== 'Basic' && dec.rarity && (
                      <span className="ml-1 text-yellow-500">{dec.rarity}</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Homestead Glyphs section */}
      {glyphs.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-100 mb-3 flex items-center gap-2">
            <span>Глифы усадьбы</span>
            <span className="text-sm text-gray-500 font-normal">({glyphs.length})</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {glyphs.map((g) => (
              <Card key={g.id} className="p-3 flex items-center gap-3">
                {g.icon ? (
                  <img src={g.icon} alt="" className="w-8 h-8 rounded object-contain" />
                ) : (
                  <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-sm text-gray-400">
                    ✨
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm text-gray-200 truncate">{g.name}</div>
                  <div className="text-xs text-gray-500">
                    {g.count} шт.
                    {g.rarity !== 'Basic' && g.rarity && (
                      <span className="ml-1 text-purple-400">{g.rarity}</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function HomePage() {
  const { name } = useParams<{ name: string }>();
  if (!name) return null;

  return (
    <Layout>
      <CharacterTabs name={name} />
      <h1 className="text-2xl font-bold mb-4 text-gray-100">Домашняя инстанция / Усадьба</h1>
      <HomePageContent characterName={name} />
    </Layout>
  );
}
