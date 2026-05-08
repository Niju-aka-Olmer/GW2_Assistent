import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Skeleton } from '../shared/ui/Skeleton';
import { gw2Client } from '../shared/api/gw2Client';

export function CharacterMasteriesPage() {
  const { name } = useParams<{ name: string }>();

  const { data: allMasteries, isLoading: allLoading } = useQuery({
    queryKey: ['masteries'],
    queryFn: () => gw2Client.getMasteries(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: accountMasteriesData, isLoading: accLoading } = useQuery({
    queryKey: ['account-masteries'],
    queryFn: () => gw2Client.getAccountMasteries(),
    staleTime: 30 * 1000,
  });

  const { data: masteryPoints, isLoading: pointsLoading } = useQuery({
    queryKey: ['mastery-points'],
    queryFn: () => gw2Client.getAccountMasteryPoints(),
    staleTime: 30 * 1000,
  });

  const allMasteriesList = useMemo(() => {
    if (!allMasteries) return [];
    const raw = allMasteries.masteries || allMasteries;
    return Array.isArray(raw) ? raw : [];
  }, [allMasteries]);

  const accountMasteries = useMemo(() => {
    if (!accountMasteriesData) return [];
    const raw = accountMasteriesData.masteries || accountMasteriesData;
    return Array.isArray(raw) ? raw : [];
  }, [accountMasteriesData]);

  const masteryDefMap = useMemo(() => {
    return new Map(allMasteriesList.map((m: any) => [m.id, m]));
  }, [allMasteriesList]);

  const sortedMasteries = useMemo(() => {
    return [...accountMasteries].sort((a: any, b: any) => (a.id || 0) - (b.id || 0));
  }, [accountMasteries]);

  const totalPoints = masteryPoints?.totals?.total || masteryPoints?.total || 0;
  const unspentPoints = masteryPoints?.totals?.unspent || masteryPoints?.unspent || 0;

  const isLoading = allLoading || accLoading || pointsLoading;

  if (isLoading) {
    return (
      <Layout>
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl mt-4" />
      </Layout>
    );
  }

  if (sortedMasteries.length === 0) {
    return (
      <Layout>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-[#f3c623] via-[#c9a84c] to-[#a68a3c] bg-clip-text text-transparent">
              Мастерство
            </span>
          </h1>
        </div>
        <Card>
          <p className="text-text-secondary text-sm">Нет данных о мастерстве</p>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-[#f3c623] via-[#c9a84c] to-[#a68a3c] bg-clip-text text-transparent">
            Мастерство
          </span>
        </h1>
      </div>

      {(totalPoints > 0 || unspentPoints > 0) && (
        <Card className="mb-4">
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-text-secondary">Всего очков: </span>
              <span className="text-[#f3c623] font-bold">{totalPoints}</span>
            </div>
            <div>
              <span className="text-text-secondary">Не потрачено: </span>
              <span className="text-green-400 font-bold">{unspentPoints}</span>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {sortedMasteries.map((m: any) => {
          const def = masteryDefMap.get(m.id);
          const level = m.level || 0;
          const maxLevel = def?.levels?.length || def?.max_level || level;
          const hasProgress = def?.levels && Array.isArray(def.levels) && def.levels[level - 1];
          const totalXp = hasProgress ? def.levels[level - 1].total_xp || 0 : 0;
          const currentXp = hasProgress ? def.levels[level - 1].current_xp || 0 : 0;
          const pct = totalXp > 0 ? Math.min(100, Math.round((currentXp / totalXp) * 100)) : 0;

          return (
            <Card key={m.id} className="hover:border-indigo-500/30 transition-colors">
              <div className="flex items-center gap-4">
                {def?.icon ? (
                  <img
                    src={def.icon}
                    alt=""
                    className="w-10 h-10 rounded-lg flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center text-xl">
                    🌟
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {def?.name || `Мастерство #${m.id}`}
                    </p>
                    <span className="text-xs text-text-secondary whitespace-nowrap">
                      Уровень: {level}/{maxLevel}
                    </span>
                  </div>
                  {def?.description && (
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                      {def.description}
                    </p>
                  )}
                  {totalXp > 0 && (
                    <div className="mt-1.5">
                      <div className="w-full h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-text-secondary mt-0.5">
                        XP: {currentXp}/{totalXp} ({pct}%)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Layout>
  );
}
