import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Skeleton } from '../shared/ui/Skeleton';
import { CharacterTabs } from '../widgets/CharacterTabs';
import { gw2Client } from '../shared/api/gw2Client';

export function CharacterMasteriesPage() {
  const { name } = useParams<{ name: string }>();

  const { data: masteriesData, isLoading: masteriesLoading } = useQuery({
    queryKey: ['masteries'],
    queryFn: () => gw2Client.getMasteries(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: accMasteries, isLoading: accMasteriesLoading } = useQuery({
    queryKey: ['account-masteries'],
    queryFn: () => gw2Client.getAccountMasteries(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: masteryPoints, isLoading: pointsLoading } = useQuery({
    queryKey: ['mastery-points'],
    queryFn: () => gw2Client.getAccountMasteryPoints(),
    staleTime: 5 * 60 * 1000,
  });

  if (masteriesLoading || accMasteriesLoading || pointsLoading) {
    return (
      <Layout>
        <CharacterTabs name={name || ''} />
        <Skeleton className="h-40 w-full rounded-xl" />
      </Layout>
    );
  }

  const masteryMap = new Map((masteriesData?.masteries || []).map((m: any) => [m.id, m]));

  return (
    <Layout>
      <CharacterTabs name={name || ''} />

      <div className="space-y-6">
        <Card>
          <h2 className="text-sm font-semibold text-[#c9a84c] uppercase tracking-wider mb-3">Очки мастерства</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-text-secondary">Всего: </span>
              <span className="text-text-primary font-medium">{masteryPoints?.total || 0}</span>
            </div>
            <div>
              <span className="text-text-secondary">Неиспользовано: </span>
              <span className="text-text-primary font-medium">{masteryPoints?.unspent || 0}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-[#c9a84c] uppercase tracking-wider mb-3">
            Прогресс мастерства
          </h2>
          <div className="space-y-2">
            {(accMasteries?.masteries || []).length === 0 ? (
              <p className="text-xs text-text-secondary">Нет данных о мастерстве</p>
            ) : (
              (accMasteries?.masteries || []).map((am: any) => {
                const mInfo = masteryMap.get(am.id);
                return (
                  <div key={am.id} className="bg-bg-secondary rounded p-3 flex items-start gap-3">
                    {mInfo?.icon && (
                      <img src={mInfo.icon} alt="" className="w-8 h-8 rounded flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary font-medium truncate">
                        {mInfo?.name || `Мастерство #${am.id}`}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Уровень: {am.level || 0}/{mInfo?.levels?.length || 1}
                      </p>
                      {am.level && mInfo?.levels && (
                        <div className="w-full bg-bg-tertiary rounded-full h-1.5 mt-1.5">
                          <div
                            className="bg-indigo-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${(am.level / (mInfo.levels.length || 1)) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
