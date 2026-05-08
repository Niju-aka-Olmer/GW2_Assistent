import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Skeleton } from '../shared/ui/Skeleton';
import { CharacterTabs } from '../widgets/CharacterTabs';
import { gw2Client } from '../shared/api/gw2Client';

const ACHIEVEMENT_TYPE_RU: Record<string, string> = {
  PvE: 'PvE',
  PvP: 'PvP',
  WvW: 'WvW',
  Special: 'Особые',
};

export function CharacterAchievementsPage() {
  const { name } = useParams<{ name: string }>();

  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['daily-achievements'],
    queryFn: () => gw2Client.getDailyAchievements(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: accAchievements, isLoading: accLoading } = useQuery({
    queryKey: ['account-achievements'],
    queryFn: () => gw2Client.getAccountAchievements(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: accountInfo, isLoading: infoLoading } = useQuery({
    queryKey: ['account-info'],
    queryFn: () => gw2Client.getAccountInfo(),
    staleTime: 5 * 60 * 1000,
  });

  if (dailyLoading || accLoading || infoLoading) {
    return (
      <Layout>
        <CharacterTabs name={name || ''} />
        <Skeleton className="h-40 w-full mb-4 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </Layout>
    );
  }

  const dailyPveIds = dailyData?.pve?.map((a: any) => a.id) || [];
  const dailyPvpIds = dailyData?.pvp?.map((a: any) => a.id) || [];
  const dailyWvwIds = dailyData?.wvw?.map((a: any) => a.id) || [];

  return (
    <Layout>
      <CharacterTabs name={name || ''} />

      <div className="space-y-6">
        {accountInfo && (
          <Card>
            <h2 className="text-sm font-semibold text-[#c9a84c] uppercase tracking-wider mb-3">Информация об аккаунте</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-text-secondary">Мир (WvW): </span>
                <span className="text-text-primary">{accountInfo.world}</span>
              </div>
              <div>
                <span className="text-text-secondary">Создан: </span>
                <span className="text-text-primary">{accountInfo.created}</span>
              </div>
              <div>
                <span className="text-text-secondary">Доступ: </span>
                <span className="text-text-primary">{(accountInfo.access || []).join(', ')}</span>
              </div>
              <div>
                <span className="text-text-secondary">Очки достижений (ежедн.): </span>
                <span className="text-text-primary">{accountInfo.daily_ap}</span>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <h2 className="text-sm font-semibold text-[#c9a84c] uppercase tracking-wider mb-3">
            Ежедневные достижения
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-xs font-medium text-text-secondary mb-2">PvE ({dailyPveIds.length})</h3>
              <div className="space-y-1">
                {dailyPveIds.slice(0, 10).map((id: number) => (
                  <div key={id} className="text-xs text-text-primary bg-bg-secondary rounded px-2 py-1">
                    Достижение #{id}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-medium text-text-secondary mb-2">PvP ({dailyPvpIds.length})</h3>
              <div className="space-y-1">
                {dailyPvpIds.slice(0, 10).map((id: number) => (
                  <div key={id} className="text-xs text-text-primary bg-bg-secondary rounded px-2 py-1">
                    Достижение #{id}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-medium text-text-secondary mb-2">WvW ({dailyWvwIds.length})</h3>
              <div className="space-y-1">
                {dailyWvwIds.slice(0, 10).map((id: number) => (
                  <div key={id} className="text-xs text-text-primary bg-bg-secondary rounded px-2 py-1">
                    Достижение #{id}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-[#c9a84c] uppercase tracking-wider mb-3">
            Прогресс достижений ({accAchievements?.achievements?.length || 0})
          </h2>
          <div className="max-h-96 overflow-y-auto space-y-1">
            {(accAchievements?.achievements || []).slice(0, 200).map((ach: any) => (
              <div key={ach.id} className="flex items-center justify-between bg-bg-secondary rounded px-3 py-1.5 text-xs">
                <span className="text-text-primary">Достижение #{ach.id}</span>
                <span className="text-text-secondary">
                  {ach.done ? '✅' : `${ach.current || 0}/${ach.max || 1} ${ach.repeated ? `(повторов: ${ach.repeated})` : ''}`}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
