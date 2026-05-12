import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Skeleton } from '../shared/ui/Skeleton';
import { CharacterTabs } from '../widgets/CharacterTabs/ui/CharacterTabs';
import { gw2Client } from '../shared/api/gw2Client';

type GuildTab = 'stash' | 'treasury' | 'members' | 'log' | 'upgrades';

function GuildContent({ guildId }: { guildId: string }) {
  const [activeTab, setActiveTab] = useState<GuildTab>('stash');

  const { data, isLoading } = useQuery({
    queryKey: ['guild', guildId],
    queryFn: () => gw2Client.getGuildDetail(guildId),
    refetchInterval: 120_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-60 rounded" />
        <Skeleton className="h-6 w-40 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded" />)}
        </div>
      </div>
    );
  }

  if (!data) {
    return <p className="text-gray-500">Не удалось загрузить данные гильдии</p>;
  }

  const { info, stash, treasury, members, log, upgrades } = data;

  const tabs: { key: GuildTab; label: string; count: number }[] = [
    { key: 'stash', label: 'Банк', count: stash.length },
    { key: 'treasury', label: 'Казна', count: treasury.length },
    { key: 'members', label: 'Участники', count: members.length },
    { key: 'log', label: 'Лог', count: log.length },
    { key: 'upgrades', label: 'Улучшения', count: upgrades.length },
  ];

  return (
    <div className="space-y-6">
      {/* Guild header */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          {info.emblem && (
            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-2xl shrink-0">
              {info.emblem.foreground ? (
                <img
                  src={`https://render.guildwars2.com/emblem/${info.emblem.foreground.id}.png`}
                  alt=""
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                '🏰'
              )}
            </div>
          )}
          {!info.emblem && <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-2xl shrink-0">🏰</div>}
          <div>
            <h2 className="text-xl font-bold text-gray-100">
              {info.name}
              {info.tag && <span className="ml-2 text-sm text-gray-500">[{info.tag}]</span>}
            </h2>
            <div className="text-sm text-gray-400">
              Уровень {info.level} · {info.member_count} участников
            </div>
          </div>
        </div>
        {info.motd && (
          <div className="mt-3 p-3 bg-gray-800 rounded text-sm text-gray-300 whitespace-pre-wrap">
            {info.motd}
          </div>
        )}
      </Card>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Stash tab */}
      {activeTab === 'stash' && (
        <section>
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Банк гильдии</h3>
          {stash.length === 0 ? (
            <p className="text-gray-500 text-sm">Банк пуст или нет доступа</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {stash.map((item) => (
                <Card key={`${item.item_id}-${item.count}`} className="p-3 flex items-center gap-3">
                  {item.icon ? (
                    <img src={item.icon} alt="" className="w-8 h-8 rounded object-contain shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center shrink-0">📦</div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm text-gray-200 truncate">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.count} шт.</div>
                    {item.coins > 0 && (
                      <div className="text-xs text-yellow-500">{Math.floor(item.coins / 10000)} золота</div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Treasury tab */}
      {activeTab === 'treasury' && (
        <section>
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Казна гильдии</h3>
          {treasury.length === 0 ? (
            <p className="text-gray-500 text-sm">Казна пуста или нет доступа</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {treasury.map((item) => (
                <Card key={item.item_id} className="p-3 flex items-center gap-3">
                  {item.icon ? (
                    <img src={item.icon} alt="" className="w-8 h-8 rounded object-contain shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center shrink-0">💰</div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm text-gray-200 truncate">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.count} шт.</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Members tab */}
      {activeTab === 'members' && (
        <section>
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Участники ({members.length})</h3>
          {members.length === 0 ? (
            <p className="text-gray-500 text-sm">Нет доступа к списку участников</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-2 px-3">Имя</th>
                    <th className="text-left py-2 px-3">Роль</th>
                    <th className="text-left py-2 px-3">Вступление</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.name} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="py-2 px-3 text-gray-200">{m.name}</td>
                      <td className="py-2 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          m.role_raw === 'Leader' ? 'bg-yellow-500/20 text-yellow-400' :
                          m.role_raw === 'Officer' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-600/30 text-gray-400'
                        }`}>
                          {m.role}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-500">{new Date(m.joined).toLocaleDateString('ru-RU')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Log tab */}
      {activeTab === 'log' && (
        <section>
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Лог гильдии</h3>
          {log.length === 0 ? (
            <p className="text-gray-500 text-sm">Лог пуст или нет доступа</p>
          ) : (
            <div className="space-y-1">
              {log.map((entry) => (
                <Card key={entry.id} className="p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-gray-500 shrink-0">{new Date(entry.time).toLocaleString('ru-RU')}</span>
                    <span className="text-sm text-gray-300 truncate">{entry.user}</span>
                    <span className="text-xs text-gray-500">{entry.type}</span>
                    {entry.motd && <span className="text-sm text-gray-400 truncate">: {entry.motd}</span>}
                  </div>
                  {entry.count && entry.count > 0 && (
                    <span className="text-xs text-gray-500 shrink-0 ml-2">×{entry.count}</span>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Upgrades tab */}
      {activeTab === 'upgrades' && (
        <section>
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Улучшения гильдии</h3>
          {upgrades.length === 0 ? (
            <p className="text-gray-500 text-sm">Нет улучшений или нет доступа</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {upgrades.map((u) => (
                <Card key={u.id} className="p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-lg shrink-0">⬆️</div>
                  <span className="text-sm text-gray-200 truncate">{u.name}</span>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export function GuildPage() {
  const { name } = useParams<{ name: string }>();
  if (!name) return null;

  const { data: guildsData, isLoading } = useQuery({
    queryKey: ['account-guilds'],
    queryFn: gw2Client.getGuilds,
  });

  return (
    <Layout>
      <CharacterTabs name={name} />
      <h1 className="text-2xl font-bold mb-4 text-gray-100">Гильдия</h1>
      {isLoading ? (
        <Skeleton className="h-8 w-48 rounded" />
      ) : guildsData && guildsData.guilds.length > 0 ? (
        <GuildContent guildId={guildsData.guilds[0].id} />
      ) : (
        <p className="text-gray-500">Вы не состоите в гильдии</p>
      )}
    </Layout>
  );
}
