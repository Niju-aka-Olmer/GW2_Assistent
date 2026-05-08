import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Input } from '../shared/ui/Input';
import { Skeleton } from '../shared/ui/Skeleton';
import { gw2Client } from '../shared/api/gw2Client';

type ReferenceTab = 'items' | 'recipes' | 'professions';

const TAB_LABELS: Record<ReferenceTab, string> = {
  items: 'Предметы',
  recipes: 'Рецепты',
  professions: 'Профессии',
};

export function ReferencePage() {
  const [tab, setTab] = useState<ReferenceTab>('items');
  const [search, setSearch] = useState('');

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-[#f3c623] via-[#c9a84c] to-[#a68a3c] bg-clip-text text-transparent">
            Справочник
          </span>
        </h1>
        <p className="text-text-secondary text-sm mt-1">Поиск предметов, рецептов и профессий</p>
      </div>

      <div className="flex gap-1 mb-4 border-b border-border-primary pb-2">
        {(Object.keys(TAB_LABELS) as ReferenceTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-bg-tertiary text-text-primary border-b-2 border-indigo-500'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <Input
          placeholder={tab === 'items' ? 'Поиск предмета...' : tab === 'recipes' ? 'Поиск рецепта...' : 'Поиск профессии...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {tab === 'items' && <ItemSearch search={search} />}
      {tab === 'recipes' && <RecipeSearch search={search} />}
      {tab === 'professions' && <ProfessionsList />}
    </Layout>
  );
}

function ItemSearch({ search }: { search: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['search-items', search],
    queryFn: () => gw2Client.searchItems(search),
    enabled: search.length >= 2,
    staleTime: 30 * 1000,
  });

  const { data: details } = useQuery({
    queryKey: ['item-details', data?.map((i: any) => i.id)],
    queryFn: () => gw2Client.getItemDetails((data || []).map((i: any) => i.id)),
    enabled: !!data && data.length > 0,
    staleTime: 30 * 1000,
  });

  if (!search) {
    return <Card><p className="text-text-secondary text-sm">Введите минимум 2 символа для поиска</p></Card>;
  }

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  const items = data || [];
  const detailsMap = new Map((details || []).map((d: any) => [d.id, d]));

  return (
    <div className="space-y-2">
      {items.length === 0 && <Card><p className="text-text-secondary text-sm">Ничего не найдено</p></Card>}
      {items.slice(0, 50).map((item: any) => {
        const det = detailsMap.get(item.id);
        return (
          <Card key={item.id}>
            <div className="flex items-center gap-3">
              {item.icon && (
                <img src={item.icon} alt="" className="w-8 h-8 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary font-medium truncate">{item.name || `#${item.id}`}</p>
                {det && (
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-text-secondary mt-0.5">
                    {det.rarity && <span>{det.rarity}</span>}
                    {det.type && <span>{det.type}</span>}
                    {det.level > 0 && <span>Ур. {det.level}</span>}
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function RecipeSearch({ search }: { search: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['search-items', search],
    queryFn: () => gw2Client.searchItems(search),
    enabled: search.length >= 2,
    staleTime: 30 * 1000,
  });

  if (!search) {
    return <Card><p className="text-text-secondary text-sm">Введите рецепт по названию предмета</p></Card>;
  }

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  const items = data || [];
  if (items.length === 0) {
    return <Card><p className="text-text-secondary text-sm">Ничего не найдено</p></Card>;
  }

  const recipeIds = items.map((i: any) => i.id);

  const { data: recipes } = useQuery({
    queryKey: ['recipes-by-item', recipeIds],
    queryFn: () => gw2Client.getRecipes(recipeIds),
    enabled: recipeIds.length > 0,
    staleTime: 30 * 1000,
  });

  return (
    <div className="space-y-2">
      {(recipes?.recipes || []).slice(0, 50).map((recipe: any) => {
        const outputItem = items.find((i: any) => i.id === recipe.output_item_id);
        return (
          <Card key={recipe.id}>
            <div className="flex items-center gap-3">
              {outputItem?.icon && (
                <img src={outputItem.icon} alt="" className="w-8 h-8 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary font-medium">{outputItem?.name || `Рецепт #${recipe.id}`}</p>
                <p className="text-[11px] text-text-secondary">
                  Кол-во: {recipe.output_item_count || 1} | Дисциплина: {recipe.discipline || '—'} | Ур. {recipe.min_rating || '—'}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ProfessionsList() {
  const { data, isLoading } = useQuery({
    queryKey: ['professions'],
    queryFn: () => gw2Client.getProfessions(),
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {(data?.professions || []).map((prof: any) => (
        <Card key={prof.id}>
          <div className="flex items-center gap-3">
            {prof.icon_big && (
              <img src={prof.icon_big} alt="" className="w-10 h-10 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
            <div>
              <p className="text-sm text-text-primary font-medium">{prof.name || prof.id}</p>
              <p className="text-[11px] text-text-secondary">
                {prof.specializations?.length || 0} специализаций
              </p>
              {prof.weapons && (
                <p className="text-[11px] text-text-secondary">
                  Оружие: {Object.keys(prof.weapons).join(', ')}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
