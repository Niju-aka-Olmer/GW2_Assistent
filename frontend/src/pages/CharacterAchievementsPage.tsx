import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Skeleton } from '../shared/ui/Skeleton';
import { gw2Client } from '../shared/api/gw2Client';

const DAILY_CATEGORY_LABELS: Record<string, string> = {
  pve: 'PvE',
  pvp: 'PvP',
  wvw: 'WvW',
};

const RARITY_COLORS: Record<string, string> = {
  Basic: 'text-gray-400',
  Fine: 'text-green-400',
  Masterwork: 'text-blue-400',
  Rare: 'text-yellow-400',
  Exotic: 'text-orange-400',
  Legendary: 'text-purple-400',
  Ascended: 'text-pink-400',
};

const ACHIEVEMENT_ICONS: Record<string, string> = {
  'Daily': 'https://render.guildwars2.com/file/A7B5A9A9E2A74F0B4F0EB2A9A9E2A74F0B4F0EB2/156646.png',
  'Default': 'https://render.guildwars2.com/file/DFB1201043DF1AB6ECF60742AE3F4EFC0C3F0F1/156647.png',
};

export function CharacterAchievementsPage() {
  const { name } = useParams<{ name: string }>();

  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['daily-achievements'],
    queryFn: () => gw2Client.getDailyAchievements(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: accountData, isLoading: accountLoading } = useQuery({
    queryKey: ['account-achievements'],
    queryFn: () => gw2Client.getAccountAchievements(),
    staleTime: 30 * 1000,
  });

  const { data: accountInfo, isLoading: infoLoading } = useQuery({
    queryKey: ['account-info'],
    queryFn: () => gw2Client.getAccountInfo(),
    staleTime: 30 * 1000,
  });

  const dailyAchievementIds = useMemo(() => {
    if (!dailyData) return [];
    const ids: number[] = [];
    for (const category of ['pve', 'pvp', 'wvw'] as const) {
      const items = dailyData[category] || dailyData.tomorrow?.[category] || [];
      for (const item of items) {
        if (item?.id) ids.push(item.id);
      }
    }
    return [...new Set(ids)].slice(0, 200);
  }, [dailyData]);

  const accountAchievementIds = useMemo(() => {
    if (!accountData?.achievements) return [];
    const ids = accountData.achievements.map((a: any) => a.id);
    return ids.slice(0, 200);
  }, [accountData]);

  const { data: dailyDetails } = useQuery({
    queryKey: ['achievement-details-daily', dailyAchievementIds],
    queryFn: () => gw2Client.getAchievements(dailyAchievementIds),
    enabled: dailyAchievementIds.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  const { data: accountAchievementDetails } = useQuery({
    queryKey: ['achievement-details-account', accountAchievementIds],
    queryFn: () => gw2Client.getAchievements(accountAchievementIds),
    enabled: accountAchievementIds.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  const dailyDetailsMap = useMemo(() => {
    if (!dailyDetails) return new Map<number, any>();
    const arr = Array.isArray(dailyDetails) ? dailyDetails : dailyDetails.achievements || [];
    return new Map(arr.map((a: any) => [a.id, a]));
  }, [dailyDetails]);

  const accountDetailsMap = useMemo(() => {
    if (!accountAchievementDetails) return new Map<number, any>();
    const arr = Array.isArray(accountAchievementDetails) ? accountAchievementDetails : accountAchievementDetails.achievements || [];
    return new Map(arr.map((a: any) => [a.id, a]));
  }, [accountAchievementDetails]);

  const isLoading = dailyLoading || accountLoading || infoLoading;

  if (isLoading) {
    return (
      <Layout>
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-60 w-full rounded-xl mt-4" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-[#f3c623] via-[#c9a84c] to-[#a68a3c] bg-clip-text text-transparent">
            Достижения
          </span>
        </h1>
      </div>

      {accountInfo && (
        <Card className="mb-4">
          <div className="flex flex-wrap gap-4 text-sm">
            {accountInfo.world && (
              <div>
                <span className="text-text-secondary">Мир: </span>
                <span className="text-text-primary font-medium">{accountInfo.world}</span>
              </div>
            )}
            {accountInfo.created && (
              <div>
                <span className="text-text-secondary">Создан: </span>
                <span className="text-text-primary font-medium">
                  {new Date(accountInfo.created).toLocaleDateString('ru-RU')}
                </span>
              </div>
            )}
            {accountInfo.access && (
              <div>
                <span className="text-text-secondary">Тип: </span>
                <span className="text-text-primary font-medium">
                  {accountInfo.access === 'PlayForFree' ? 'Free' : accountInfo.access || '—'}
                </span>
              </div>
            )}
            <div>
              <span className="text-text-secondary">Всего AP: </span>
              <span className="text-[#f3c623] font-bold">{accountInfo.daily_ap || accountInfo.ap || '—'}</span>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-6">
        <DailyAchievementsSection
          dailyData={dailyData}
          detailsMap={dailyDetailsMap}
        />

        <AccountAchievementsSection
          accountData={accountData}
          detailsMap={accountDetailsMap}
        />
      </div>
    </Layout>
  );
}

function DailyAchievementsSection({
  dailyData,
  detailsMap,
}: {
  dailyData: any;
  detailsMap: Map<number, any>;
}) {
  const sectionData = dailyData?.tomorrow || dailyData;
  if (!sectionData) {
    return (
      <Card>
        <h2 className="text-lg font-semibold mb-2">Ежедневные достижения</h2>
        <p className="text-text-secondary text-sm">Нет данных</p>
      </Card>
    );
  }

  const categories = ['pve', 'pvp', 'wvw'] as const;

  return (
    <Card>
      <h2 className="text-lg font-semibold mb-4">Ежедневные достижения</h2>
      <div className="space-y-4">
        {categories.map((cat) => {
          const items = sectionData[cat] || [];
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <h3 className="text-sm font-medium text-indigo-400 mb-2">
                {DAILY_CATEGORY_LABELS[cat]}
              </h3>
              <div className="space-y-2">
                {items.slice(0, 10).map((item: any, idx: number) => {
                  const detail = detailsMap.get(item.id);
                  return (
                    <div key={item.id || idx} className="flex items-start gap-3 p-2 rounded-lg bg-bg-hover">
                      {detail?.icon ? (
                        <img
                          src={detail.icon}
                          alt=""
                          className="w-8 h-8 rounded mt-0.5"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-bg-tertiary flex items-center justify-center text-xs text-text-secondary">
                          {item.id?.toString().slice(-2) || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary font-medium">
                          {detail?.name || `Достижение #${item.id}`}
                        </p>
                        {detail?.description && (
                          <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                            {detail.description}
                          </p>
                        )}
                        {item.min && (
                          <p className="text-xs text-text-secondary mt-0.5">
                            AP: {item.min || 0}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function AccountAchievementsSection({
  accountData,
  detailsMap,
}: {
  accountData: any;
  detailsMap: Map<number, any>;
}) {
  const achievements = accountData?.achievements || [];
  if (achievements.length === 0) {
    return (
      <Card>
        <h2 className="text-lg font-semibold mb-2">Прогресс достижений</h2>
        <p className="text-text-secondary text-sm">Нет данных</p>
      </Card>
    );
  }

  const getStatusLabel = (ach: any) => {
    if (ach.done) return { text: 'Выполнено', color: 'text-green-400' };
    if (ach.repeated !== undefined && ach.repeated !== null) return { text: 'Повторяется', color: 'text-yellow-400' };
    if (ach.max !== undefined && ach.max !== null && ach.current >= ach.max) return { text: 'Максимум', color: 'text-blue-400' };
    return { text: 'В процессе', color: 'text-indigo-400' };
  };

  const sorted = [...achievements].sort((a: any, b: any) => {
    if (a.done && !b.done) return 1;
    if (!a.done && b.done) return -1;
    return 0;
  });

  return (
    <Card>
      <h2 className="text-lg font-semibold mb-4">
        Прогресс достижений
        <span className="text-text-secondary text-sm ml-2">({achievements.length})</span>
      </h2>
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {sorted.slice(0, 200).map((ach: any) => {
          const detail = detailsMap.get(ach.id);
          const status = getStatusLabel(ach);

          return (
            <div key={ach.id} className="flex items-start gap-3 p-2 rounded-lg bg-bg-hover">
              {detail?.icon ? (
                <img
                  src={detail.icon}
                  alt=""
                  className="w-8 h-8 rounded mt-0.5"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-8 h-8 rounded bg-bg-tertiary flex items-center justify-center text-xs text-text-secondary">
                  {String(ach.id).slice(-2)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-text-primary font-medium truncate">
                    {detail?.name || `Достижение #${ach.id}`}
                  </p>
                  <span className={`text-[10px] whitespace-nowrap ${status.color}`}>
                    {status.text}
                  </span>
                </div>
                {detail?.description && (
                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                    {detail.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-text-secondary mt-0.5">
                  {ach.current !== undefined && ach.max !== undefined && (
                    <span>Прогресс: {ach.current}/{ach.max}</span>
                  )}
                  {ach.repeated !== undefined && ach.repeated !== null && (
                    <span>Повторений: {ach.repeated}</span>
                  )}
                  {ach.bits && ach.bits.length > 0 && (
                    <span>Этапов: {ach.bits.filter(Boolean).length}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
