import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Skeleton } from '../shared/ui/Skeleton';
import { CharacterTabs } from '../widgets/CharacterTabs';
import { gw2Client } from '../shared/api/gw2Client';

export function CharacterCollectionsPage() {
  const { name } = useParams<{ name: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['account-collections'],
    queryFn: () => gw2Client.getAccountCollections(),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Layout>
        <CharacterTabs name={name || ''} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <CharacterTabs name={name || ''} />

      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <h3 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider mb-1">Красители</h3>
            <p className="text-2xl font-bold text-text-primary">{data?.dye_count || 0}</p>
          </Card>
          <Card>
            <h3 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider mb-1">Скины</h3>
            <p className="text-2xl font-bold text-text-primary">{data?.skins?.length || 0}</p>
          </Card>
          <Card>
            <h3 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider mb-1">Миниатюры</h3>
            <p className="text-2xl font-bold text-text-primary">{data?.minis?.length || 0}</p>
          </Card>
          <Card>
            <h3 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider mb-1">Финишеры</h3>
            <p className="text-2xl font-bold text-text-primary">{data?.finishers?.length || 0}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-sm font-semibold text-[#c9a84c] uppercase tracking-wider mb-3">Скины ({data?.skins?.length || 0})</h2>
            <div className="max-h-80 overflow-y-auto grid grid-cols-5 gap-2">
              {(data?.skins || []).map((skin: any) => (
                <div key={skin.id} className="bg-bg-secondary rounded p-1.5 flex flex-col items-center gap-1" title={skin.name}>
                  {skin.icon && (
                    <img src={skin.icon} alt={skin.name} className="w-8 h-8 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  <span className="text-[10px] text-text-secondary text-center truncate w-full leading-tight">
                    {skin.name || `#${skin.id}`}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-[#c9a84c] uppercase tracking-wider mb-3">Миниатюры ({data?.minis?.length || 0})</h2>
            <div className="max-h-80 overflow-y-auto grid grid-cols-5 gap-2">
              {(data?.minis || []).map((mini: any) => (
                <div key={mini.id} className="bg-bg-secondary rounded p-1.5 flex flex-col items-center gap-1" title={mini.name}>
                  {mini.icon && (
                    <img src={mini.icon} alt={mini.name} className="w-8 h-8 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  <span className="text-[10px] text-text-secondary text-center truncate w-full leading-tight">
                    {mini.name || `#${mini.id}`}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <h2 className="text-sm font-semibold text-[#c9a84c] uppercase tracking-wider mb-3">Финишеры ({data?.finishers?.length || 0})</h2>
            <div className="max-h-60 overflow-y-auto grid grid-cols-4 gap-2">
              {(data?.finishers || []).map((f: any) => (
                <div key={f.id} className="bg-bg-secondary rounded p-1.5 flex flex-col items-center gap-1" title={f.name}>
                  {f.icon && (
                    <img src={f.icon} alt={f.name} className="w-8 h-8 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  <span className="text-[10px] text-text-secondary text-center truncate w-full leading-tight">{f.name}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-[#c9a84c] uppercase tracking-wider mb-3">Планеры ({data?.gliders?.length || 0})</h2>
            <div className="max-h-60 overflow-y-auto grid grid-cols-4 gap-2">
              {(data?.gliders || []).map((g: any) => (
                <div key={g.id} className="bg-bg-secondary rounded p-1.5 flex flex-col items-center gap-1" title={g.name}>
                  {g.icon && (
                    <img src={g.icon} alt={g.name} className="w-8 h-8 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  <span className="text-[10px] text-text-secondary text-center truncate w-full leading-tight">{g.name}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-[#c9a84c] uppercase tracking-wider mb-3">Почтальоны ({data?.mailcarriers?.length || 0})</h2>
            <div className="max-h-60 overflow-y-auto grid grid-cols-4 gap-2">
              {(data?.mailcarriers || []).map((c: any) => (
                <div key={c.id} className="bg-bg-secondary rounded p-1.5 flex flex-col items-center gap-1" title={c.name}>
                  {c.icon && (
                    <img src={c.icon} alt={c.name} className="w-8 h-8 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  <span className="text-[10px] text-text-secondary text-center truncate w-full leading-tight">{c.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
