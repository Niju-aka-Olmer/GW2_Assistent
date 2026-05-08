import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Skeleton } from '../shared/ui/Skeleton';
import { CharacterTabs } from '../widgets/CharacterTabs';
import { gw2Client } from '../shared/api/gw2Client';

export function CharacterRaidsPage() {
  const { name } = useParams<{ name: string }>();

  const { data: raidsData, isLoading: raidsLoading } = useQuery({
    queryKey: ['raids'],
    queryFn: () => gw2Client.getRaids(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: accountRaids, isLoading: accRaidsLoading } = useQuery({
    queryKey: ['account-raids'],
    queryFn: () => gw2Client.getAccountRaids(),
    staleTime: 60 * 1000,
  });

  if (raidsLoading || accRaidsLoading) {
    return (
      <Layout>
        <CharacterTabs name={name || ''} />
        <Skeleton className="h-40 w-full rounded-xl" />
      </Layout>
    );
  }

  return (
    <Layout>
      <CharacterTabs name={name || ''} />

      <div className="space-y-6">
        <Card>
          <h2 className="text-sm font-semibold text-[#c9a84c] uppercase tracking-wider mb-3">Рейды</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(raidsData?.raids || []).map((raid: string) => (
              <div key={raid} className="bg-bg-secondary rounded px-3 py-2 text-xs text-text-primary">
                {raid}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-[#c9a84c] uppercase tracking-wider mb-3">
            Прогресс рейдов (сбросы)
          </h2>
          <div className="space-y-2">
            {(accountRaids?.raids || []).length === 0 ? (
              <p className="text-xs text-text-secondary">Нет данных о рейдах</p>
            ) : (
              (accountRaids?.raids || []).map((raid: any, idx: number) => (
                <div key={idx} className="bg-bg-secondary rounded p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-primary font-medium">{raid.id}</span>
                    {raid.reset_time && (
                      <span className="text-text-secondary">
                        Сброс: {new Date(raid.reset_time).toLocaleString('ru-RU')}
                      </span>
                    )}
                  </div>
                  {raid.killed && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {raid.killed.map((wing: string, wi: number) => (
                        <span key={wi} className="text-[11px] text-green-400 bg-green-400/10 rounded px-1.5 py-0.5">
                          {wing}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
