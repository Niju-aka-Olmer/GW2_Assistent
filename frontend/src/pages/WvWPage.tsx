import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Skeleton } from '../shared/ui/Skeleton';
import { CharacterTabs } from '../widgets/CharacterTabs/ui/CharacterTabs';
import { gw2Client } from '../shared/api/gw2Client';

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

function WvWContent() {
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
      {/* Overall scores */}
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

        {/* Skirmish */}
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

      {/* Maps */}
      <h3 className="text-lg font-semibold text-gray-100">Карты</h3>
      {maps.map((wvwMap) => (
        <Card key={wvwMap.id} className="p-4">
          <h4 className="text-base font-medium text-gray-200 mb-3">
            {WvW_MAP_NAMES[wvwMap.id] || `Карта ${wvwMap.id}`}
          </h4>

          {/* Map scores */}
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

          {/* Objectives */}
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
                <div className={`truncate font-medium ${
                  TEAM_COLORS[obj.owner_raw] || 'text-gray-400'
                }`}>
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

export function WvWPage() {
  const { name } = useParams<{ name: string }>();
  if (!name) return null;

  return (
    <Layout>
      <CharacterTabs name={name} />
      <h1 className="text-2xl font-bold mb-4 text-gray-100">WvW (Мир против Мира)</h1>
      <WvWContent />
    </Layout>
  );
}
