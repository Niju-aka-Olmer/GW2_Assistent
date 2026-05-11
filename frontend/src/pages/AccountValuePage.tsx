import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Skeleton } from '../shared/ui/Skeleton';
import { CharacterTabs } from '../widgets/CharacterTabs/ui/CharacterTabs';
import { gw2Client } from '../shared/api/gw2Client';

function formatGold(coins: number): string {
  const abs = Math.abs(coins);
  const g = Math.floor(abs / 10000);
  const remainder = abs % 10000;
  const s = Math.floor(remainder / 100);
  const c = remainder % 100;
  const sign = coins < 0 ? '-' : '';
  if (g > 0) return `${sign}${g}з ${s}с ${c}м`;
  if (s > 0) return `${sign}${s}с ${c}м`;
  return `${sign}${c}м`;
}

function AccountValuePageContent({ characterName }: { characterName: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['account-value'],
    queryFn: gw2Client.getAccountValue,
    refetchInterval: 120_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-6 w-32" />
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-32 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-yellow-900/30 to-amber-900/20 border-yellow-700/30">
        <div className="text-sm text-gray-400 mb-1">Общая стоимость аккаунта</div>
        <div className="text-3xl font-bold text-yellow-400">
          {formatGold(data.total_value_coins)}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          ~{data.total_value_gold.toFixed(2)} золота
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">💰</span>
            <h3 className="font-semibold text-gray-100">Кошелёк</h3>
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            {formatGold(data.wallet.coins)}
          </div>
          <div className="text-sm text-gray-500">
            ~{data.wallet.gold.toFixed(2)} золота
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📦</span>
            <h3 className="font-semibold text-gray-100">Материалы</h3>
          </div>
          <div className="text-2xl font-bold text-green-400">
            {formatGold(data.materials.total_coins)}
          </div>
          <div className="text-sm text-gray-500">
            {data.materials.items.length} предметов
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🏦</span>
            <h3 className="font-semibold text-gray-100">Банк</h3>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {formatGold(data.bank.total_coins)}
          </div>
          <div className="text-sm text-gray-500">
            {data.bank.items.length} предметов
          </div>
        </Card>
      </div>

      {data.materials.items.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-gray-100 mb-3">
            Топ материалов по стоимости
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {data.materials.items
              .slice(0, 20)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center text-sm py-1 border-b border-gray-800 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    {item.icon && (
                      <img src={item.icon} alt="" className="w-6 h-6 rounded" loading="lazy" />
                    )}
                    <span className="text-gray-300">
                      {item.name || `ID:${item.id}`} x{item.count}
                    </span>
                  </div>
                  <span className="text-green-400 font-medium">
                    {formatGold(item.total)}
                  </span>
                </div>
              ))}
          </div>
        </Card>
      )}

      {data.bank.items.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-gray-100 mb-3">
            Топ предметов в банке по стоимости
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {data.bank.items
              .slice(0, 20)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center text-sm py-1 border-b border-gray-800 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    {item.icon && (
                      <img src={item.icon} alt="" className="w-6 h-6 rounded" loading="lazy" />
                    )}
                    <span className="text-gray-300">
                      {item.name || `ID:${item.id}`} x{item.count}
                    </span>
                  </div>
                  <span className="text-blue-400 font-medium">
                    {formatGold(item.total)}
                  </span>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export function AccountValuePage() {
  const { name } = useParams<{ name: string }>();
  if (!name) return null;

  return (
    <Layout>
      <CharacterTabs name={name} />
      <h1 className="text-2xl font-bold mb-4 text-gray-100">Стоимость аккаунта</h1>
      <AccountValuePageContent characterName={name} />
    </Layout>
  );
}
