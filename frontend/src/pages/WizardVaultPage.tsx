import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Skeleton } from '../shared/ui/Skeleton';
import { gw2Client } from '../shared/api/gw2Client';

type Tab = 'daily' | 'weekly' | 'special' | 'rewards';

const TAB_LABELS: Record<Tab, string> = {
  daily: 'Ежедневно',
  weekly: 'Еженедельно',
  special: 'Спец. задания',
  rewards: 'Награды',
};

const TRACK_COLORS: Record<string, string> = {
  PvE: 'bg-green-500/20 text-green-400 border-green-500/30',
  PvP: 'bg-red-500/20 text-red-400 border-red-500/30',
  WvW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const TRACK_LABELS: Record<string, string> = {
  PvE: 'ПвЕ',
  PvP: 'ПвП',
  WvW: 'ПвП-Мист',
};

interface WizardsVaultObjective {
  id: number;
  title: string;
  track: 'PvE' | 'PvP' | 'WvW';
  acclaim: number;
  progress_current: number;
  progress_complete: number;
  claimed: boolean;
}

interface WizardsVaultResponse {
  objectives: WizardsVaultObjective[];
}

function ObjectiveCard({ obj }: { obj: WizardsVaultObjective }) {
  const progress = obj.progress_complete > 0
    ? (obj.progress_current / obj.progress_complete) * 100
    : 0;
  const done = obj.progress_current >= obj.progress_complete && obj.progress_complete > 0;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-text-primary text-sm font-medium leading-tight">
            {obj.title}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[11px] px-1.5 py-0.5 rounded border ${TRACK_COLORS[obj.track] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
              {TRACK_LABELS[obj.track] || obj.track}
            </span>
            <span className="text-[#c9a84c] text-xs flex items-center gap-0.5">
              <span className="inline-block w-3 h-3 rounded-full bg-[#c9a84c]/20 flex items-center justify-center text-[10px]">★</span>
              {obj.acclaim}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 text-right min-w-[70px]">
          {done ? (
            <span className="text-green-400 text-sm font-medium">
              {obj.claimed ? '✓ Получено' : '✓ Готово'}
            </span>
          ) : (
            <div>
              <div className="w-full bg-[#1a1d2a] rounded-full h-1.5 mb-1">
                <div
                  className="bg-[#c9a84c] h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <span className="text-text-tertiary text-[11px]">
                {obj.progress_current} / {obj.progress_complete}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function ObjectiveList({
  data,
  isLoading,
  label,
}: {
  data: WizardsVaultResponse | undefined;
  isLoading: boolean;
  label: string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data?.objectives || data.objectives.length === 0) {
    return (
      <p className="text-text-tertiary text-center py-8">
        Нет активных заданий
      </p>
    );
  }

  const claimed = data.objectives.filter(o => o.claimed).length;
  const done = data.objectives.filter(o =>
    o.progress_current >= o.progress_complete && o.progress_complete > 0 && !o.claimed
  ).length;
  const inProgress = data.objectives.filter(o =>
    o.progress_current < o.progress_complete || o.progress_complete === 0
  ).length;

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 text-sm">
        <span className="text-green-400">✓ {done + claimed}</span>
        <span className="text-[#c9a84c]">⏳ {inProgress}</span>
        <span className="text-text-tertiary">из {data.objectives.length}</span>
      </div>
      <div className="space-y-2">
        {data.objectives.map(obj => (
          <ObjectiveCard key={obj.id} obj={obj} />
        ))}
      </div>
    </div>
  );
}

function RewardsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['wizardsvault-listings'],
    queryFn: () => gw2Client.getWizardsVaultListings(),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const listings = data?.listings || [];
  const season = data?.season;
  const totalSpent = listings.reduce(
    (sum: number, l: any) => sum + (l.price || 0) * (l.purchased || 0),
    0
  );

  return (
    <div>
      {season && (
        <div className="mb-4 text-sm text-text-secondary">
          Сезон:{' '}
          <span className="text-[#c9a84c]">{season.title || "Wizard's Vault"}</span>
          <span className="ml-3">
            ★ потрачено:{' '}
            <span className="text-[#c9a84c]">{totalSpent}</span>
          </span>
        </div>
      )}
      {listings.length === 0 ? (
        <p className="text-text-tertiary text-center py-8">
          Нет купленных наград
        </p>
      ) : (
        <div className="space-y-2">
          {listings.map((item: any) => (
            <Card key={item.id} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-primary text-sm">
                    Награда #{item.id}
                    {item.item_id && (
                      <span className="text-text-tertiary text-xs ml-1">
                        (предмет {item.item_id})
                      </span>
                    )}
                  </p>
                  <p className="text-text-tertiary text-xs">
                    Куплено: {item.purchased || 0}
                  </p>
                </div>
                <span className="text-[#c9a84c] text-sm flex items-center gap-0.5">
                  ★ {item.price}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function WizardVaultPage() {
  const [tab, setTab] = useState<Tab>('daily');

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-[#f3c623] via-[#c9a84c] to-[#a68a3c] bg-clip-text text-transparent">
              Wizard's Vault
            </span>
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Ежедневные и еженедельные задания, награды за астральные очки
          </p>
        </div>

        <div className="flex gap-1 mb-6 border-b border-[#2d3246]">
          {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm rounded-t-lg transition-all relative ${
                tab === t
                  ? 'text-[#f3c623] bg-[#c9a84c]/5 border border-[#c9a84c]/20 border-b-transparent'
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-[#1e212d]'
              }`}
            >
              {TAB_LABELS[t]}
              {tab === t && (
                <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent rounded-full" />
              )}
            </button>
          ))}
        </div>

        <TabContent tab={tab} />
      </div>
    </Layout>
  );
}

function TabContent({ tab }: { tab: Tab }) {
  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['wizardsvault-daily'],
    queryFn: () => gw2Client.getWizardsVaultDaily(),
    staleTime: 2 * 60 * 1000,
    enabled: tab === 'daily',
  });

  const { data: weeklyData, isLoading: weeklyLoading } = useQuery({
    queryKey: ['wizardsvault-weekly'],
    queryFn: () => gw2Client.getWizardsVaultWeekly(),
    staleTime: 5 * 60 * 1000,
    enabled: tab === 'weekly',
  });

  const { data: specialData, isLoading: specialLoading } = useQuery({
    queryKey: ['wizardsvault-special'],
    queryFn: () => gw2Client.getWizardsVaultSpecial(),
    staleTime: 10 * 60 * 1000,
    enabled: tab === 'special',
  });

  switch (tab) {
    case 'daily':
      return (
        <ObjectiveList
          data={dailyData}
          isLoading={dailyLoading}
          label="Ежедневные задания"
        />
      );
    case 'weekly':
      return (
        <ObjectiveList
          data={weeklyData}
          isLoading={weeklyLoading}
          label="Еженедельные задания"
        />
      );
    case 'special':
      return (
        <ObjectiveList
          data={specialData}
          isLoading={specialLoading}
          label="Специальные задания"
        />
      );
    case 'rewards':
      return <RewardsTab />;
    default:
      return null;
  }
}
