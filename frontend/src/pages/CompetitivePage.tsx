import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Skeleton } from '../shared/ui/Skeleton';
import { Tabs } from '../shared/ui/Tabs';
import { CharacterTabs } from '../widgets/CharacterTabs/ui/CharacterTabs';
import { gw2Client } from '../shared/api/gw2Client';

const PROFESSION_ICONS: Record<string, string> = {
  Guardian: 'https://wiki.guildwars2.com/images/4/49/Guardian_tango_icon_20px.png',
  Warrior: 'https://wiki.guildwars2.com/images/2/2c/Warrior_tango_icon_20px.png',
  Engineer: 'https://wiki.guildwars2.com/images/2/2b/Engineer_tango_icon_20px.png',
  Ranger: 'https://wiki.guildwars2.com/images/e/e8/Ranger_tango_icon_20px.png',
  Thief: 'https://wiki.guildwars2.com/images/4/45/Thief_tango_icon_20px.png',
  Elementalist: 'https://wiki.guildwars2.com/images/a/a4/Elementalist_tango_icon_20px.png',
  Mesmer: 'https://wiki.guildwars2.com/images/1/1b/Mesmer_tango_icon_20px.png',
  Necromancer: 'https://wiki.guildwars2.com/images/b/b4/Necromancer_tango_icon_20px.png',
  Revenant: 'https://wiki.guildwars2.com/images/1/16/Revenant_tango_icon_20px.png',
};

type PvPTab = 'overview' | 'games';

const WvW_MAP_NAMES: Record<number, string> = {
  38: 'Граница Алого легиона',
  95: 'Граница Зелёного легиона',
  96: 'Граница Синего легиона',
  1099: 'Бездна вечной битвы',
};

const TEAM_COLORS: Record<string, string> = {
  red: 'text-red-400',
  green: 'text-green-400',
  blue: 'text-blue-400',
};

const TEAM_BG: Record<string, string> = {
  red: 'bg-red-500/10 border-red-500/30',
  green: 'bg-green-500/10 border-green-500/30',
  blue: 'bg-blue-500/10 border-blue-500/30',
};

function PvPTabContent() {
  const [activeTab, setActiveTab] = useState<PvPTab>('overview');

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['pvp-stats'],
    queryFn: gw2Client.getPvPStats,
    refetchInterval: 120_000,
  });

  const { data: gamesData, isLoading: gamesLoading } = useQuery({
    queryKey: ['pvp-games'],
    queryFn: gw2Client.getPvPGames,
    refetchInterval: 120_000,
  });

  if (statsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded" />
        <Skeleton className="h-32 w-full rounded" />
      </div>
    );
  }

  if (!statsData) {
    return <p className="text-gray-500">Не удалось загрузить PvP статистику</p>;
  }

  const { total_wins, total_losses, total_games, winrate, rank, rank_points, ladders, professions } = statsData;
  const games = gamesData?.games ?? [];

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-100 mb-3">Общая статистика</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-100">{total_games}</div>
            <div className="text-xs text-gray-500">Всего игр</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{total_wins}</div>
            <div className="text-xs text-gray-500">Побед</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{total_losses}</div>
            <div className="text-xs text-gray-500">Поражений</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${winrate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
              {winrate}%
            </div>
            <div className="text-xs text-gray-500">Винрейт</div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-sm text-gray-400">
          <span>Ранг: <strong className="text-yellow-400">{rank}</strong></span>
          <span>Очки ранга: <strong className="text-gray-200">{rank_points}</strong></span>
        </div>
      </Card>

      <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
          }`}
        >
          По режимам и классам
        </button>
        <button
          onClick={() => setActiveTab('games')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'games' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
          }`}
        >
          Последние игры ({games.length})
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {Object.keys(ladders).length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-100 mb-3">Режимы</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(ladders).map(([key, ladder]) => (
                  <Card key={key} className="p-4">
                    <h4 className="text-base font-medium text-gray-200 mb-2">{ladder.name}</h4>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <div className="text-green-400 font-bold">{ladder.wins}</div>
                        <div className="text-gray-500 text-xs">Победы</div>
                      </div>
                      <div>
                        <div className="text-red-400 font-bold">{ladder.losses}</div>
                        <div className="text-gray-500 text-xs">Поражения</div>
                      </div>
                      <div>
                        <div className="text-gray-200 font-bold">{ladder.winrate}%</div>
                        <div className="text-gray-500 text-xs">Винрейт</div>
                      </div>
                    </div>
                    {ladder.rating > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        Рейтинг: <span className="text-yellow-400">{ladder.rating}</span>
                        {ladder.division > 0 && ` · Дивизион: ${ladder.division}-${ladder.tier}`}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          )}

          {Object.keys(professions).length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-100 mb-3">По классам</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.entries(professions).sort((a, b) => b[1].total - a[1].total).map(([prof, profStats]) => (
                  <Card key={prof} className="p-3 flex items-center gap-3">
                    <img
                      src={PROFESSION_ICONS[prof] || ''}
                      alt=""
                      className="w-8 h-8 rounded object-contain shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="min-w-0">
                      <div className="text-sm text-gray-200 truncate">{prof}</div>
                      <div className="text-xs text-gray-500">
                        {profStats.wins}W / {profStats.losses}L
                        <span className="ml-1">
                          ({profStats.total > 0 ? Math.round(profStats.wins / profStats.total * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {activeTab === 'games' && (
        <section>
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Последние игры</h3>
          {gamesLoading ? (
            <Skeleton className="h-40 w-full rounded" />
          ) : games.length === 0 ? (
            <p className="text-gray-500 text-sm">Игры не найдены</p>
          ) : (
            <div className="space-y-1">
              {games.map((game) => (
                <Card key={game.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-sm font-medium ${
                      game.result === 'win' ? 'text-green-400' :
                      game.result === 'loss' ? 'text-red-400' :
                      'text-gray-400'
                    }`}>
                      {game.result === 'win' ? 'Победа' : game.result === 'loss' ? 'Поражение' : game.result}
                    </span>
                    <span className="text-xs text-gray-500">{game.type}</span>
                    <span className="text-xs text-gray-500">
                      {Math.floor(game.duration / 60)}:{String(game.duration % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {game.rating_change !== 0 && (
                      <span className={`text-xs ${game.rating_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {game.rating_change > 0 ? '+' : ''}{game.rating_change}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{game.rating_after}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function WvWTabContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['wvw-match'],
    queryFn: gw2Client.getWvWMatch,
    refetchInterval: 120_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded" />
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full rounded" />)}
      </div>
    );
  }

  if (!data || 'error' in data) {
    return <p className="text-gray-500">Не удалось загрузить WvW данные</p>;
  }

  const { scores, maps, skirmish } = data;

  const sortedTeams = Object.entries(scores).sort((a, b) => b[1].score - a[1].score);

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Общий счёт</h3>
        <div className="space-y-3">
          {sortedTeams.map(([team, score], index) => (
            <div key={team} className={`p-3 rounded-lg border ${TEAM_BG[team] || 'bg-gray-800 border-gray-700'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${TEAM_COLORS[team] || 'text-gray-400'}`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                  <span className="text-gray-200 font-medium">{score.name}</span>
                </div>
                <span className={`text-2xl font-bold ${TEAM_COLORS[team] || 'text-gray-200'}`}>
                  {score.score.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {skirmish.id > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-medium text-gray-400 mb-2">
              Текущая стычка #{skirmish.id}
            </h4>
            <div className="flex gap-4 text-sm">
              {Object.entries(skirmish.scores).map(([team, skScore]) => (
                <div key={team} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${
                    team === 'red' ? 'bg-red-500' : team === 'green' ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                  <span className="text-gray-400">{skScore}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <h3 className="text-lg font-semibold text-gray-100">Карты</h3>
      {maps.map((wvwMap) => (
        <Card key={wvwMap.id} className="p-4">
          <h4 className="text-base font-medium text-gray-200 mb-3">
            {WvW_MAP_NAMES[wvwMap.id] || `Карта ${wvwMap.id}`}
          </h4>

          <div className="flex gap-4 mb-3 text-sm">
            {Object.entries(wvwMap.scores).map(([team, score]) => (
              <div key={team} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${
                  team === 'red' ? 'bg-red-500' : team === 'green' ? 'bg-green-500' : 'bg-blue-500'
                }`} />
                <span className={TEAM_COLORS[team] || 'text-gray-400'}>{score.name}</span>
                <span className="text-gray-300 font-medium">{score.score}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
            {wvwMap.objectives.slice(0, 20).map((obj) => (
              <div
                key={obj.id}
                className={`p-2 rounded text-xs border ${
                  obj.owner_raw === 'red' ? 'border-red-500/30 bg-red-500/5' :
                  obj.owner_raw === 'green' ? 'border-green-500/30 bg-green-500/5' :
                  obj.owner_raw === 'blue' ? 'border-blue-500/30 bg-blue-500/5' :
                  'border-gray-700 bg-gray-800'
                }`}
              >
                <div className={`truncate font-medium ${TEAM_COLORS[obj.owner_raw] || 'text-gray-400'}`}>
                  {obj.name}
                </div>
                <div className="text-gray-500 mt-0.5">{obj.type}</div>
                {obj.claimed_by && (
                  <div className="text-gray-600 mt-0.5">⛑ {obj.claimed_by}</div>
                )}
              </div>
            ))}
          </div>
          {wvwMap.objectives.length > 20 && (
            <p className="text-xs text-gray-600 mt-2">
              +{wvwMap.objectives.length - 20} ещё
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}

const SUBTABS = [
  { id: 'pvp', label: 'PvP' },
  { id: 'wvw', label: 'WvW' },
];

export function CompetitivePage() {
  const { name } = useParams<{ name: string }>();
  const [activeSubTab, setActiveSubTab] = useState('pvp');

  if (!name) return null;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {name && <CharacterTabs name={name} />}
        <div className="flex items-center justify-between mt-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-100">
            {activeSubTab === 'pvp' ? 'PvP' : 'WvW (Мир против Мира)'}
          </h2>
        </div>
        <Tabs tabs={SUBTABS} activeTab={activeSubTab} onChange={setActiveSubTab} variant="gw2" />
        <div className="mt-6">
          {activeSubTab === 'pvp' && <PvPTabContent />}
          {activeSubTab === 'wvw' && <WvWTabContent />}
        </div>
      </div>
    </Layout>
  );
}
