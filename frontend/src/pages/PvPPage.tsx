import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Skeleton } from '../shared/ui/Skeleton';
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

function PvPContent() {
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
      {/* Overview card */}
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

      {/* Tab navigation */}
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

      {/* Ladders / Professions */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Ladders */}
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

          {/* Professions */}
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

      {/* Recent games */}
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

export function PvPPage() {
  const { name } = useParams<{ name: string }>();
  if (!name) return null;

  return (
    <Layout>
      <CharacterTabs name={name} />
      <h1 className="text-2xl font-bold mb-4 text-gray-100">PvP</h1>
      <PvPContent />
    </Layout>
  );
}
