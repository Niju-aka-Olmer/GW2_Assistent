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

const ITEM_CATEGORIES: Record<string, { label: string; icon: string; sub: Record<string, string> }> = {
  Armor: {
    label: 'Броня', icon: '🛡️',
    sub: { Boots: 'Ботинки', Coat: 'Куртка', Gloves: 'Перчатки', Helm: 'Шлем', Leggings: 'Штаны', Shoulders: 'Наплечники' },
  },
  Weapon: {
    label: 'Оружие', icon: '⚔️',
    sub: { Axe: 'Топор', Dagger: 'Кинжал', Focus: 'Фокус', Greatsword: 'Большой меч', Hammer: 'Молот', LongBow: 'Длинный лук', Mace: 'Булава', Pistol: 'Пистолет', Rifle: 'Винтовка', Scepter: 'Скипетр', Shield: 'Щит', ShortBow: 'Короткий лук', Staff: 'Посох', Sword: 'Меч', Torch: 'Факел', Trident: 'Трезубец', Warhorn: 'Рог' },
  },
  Trinket: {
    label: 'Аксессуары', icon: '💍',
    sub: { Ring: 'Кольцо', Accessory: 'Аксессуар', Amulet: 'Амулет' },
  },
  Back: {
    label: 'Спина', icon: '🎒',
    sub: { Back: 'Спина' },
  },
  Consumable: {
    label: 'Расходники', icon: '🧪',
    sub: { Food: 'Еда', Utility: 'Утилита', Transmutation: 'Трансмутация', Generic: 'Общее' },
  },
  UpgradeComponent: {
    label: 'Улучшения', icon: '🔧',
    sub: { Rune: 'Руна', Sigil: 'Сигила', Gem: 'Самоцвет' },
  },
  CraftingMaterial: {
    label: 'Материалы', icon: '📦',
    sub: { CraftingMaterial: 'Материал' },
  },
  Container: {
    label: 'Контейнеры', icon: '📁',
    sub: { Container: 'Контейнер', Gift: 'Подарок' },
  },
  Gathering: {
    label: 'Сбор', icon: '⛏️',
    sub: { Foraging: 'Сбор', Logging: 'Рубка', Mining: 'Добыча' },
  },
  Bag: {
    label: 'Сумки', icon: '👜',
    sub: { Bag: 'Сумка' },
  },
  MiniPet: {
    label: 'Миниатюры', icon: '🐾',
    sub: { Mini: 'Миниатюра' },
  },
  Trophy: {
    label: 'Трофеи', icon: '🏆',
    sub: { Trophy: 'Трофей' },
  },
};

const RECIPE_CATEGORIES: Record<string, { label: string; icon: string }> = {
  Weaponsmith: { label: 'Кузнец', icon: '🔨' },
  Armorsmith: { label: 'Бронник', icon: '🛡️' },
  Tailor: { label: 'Закройщик', icon: '🧵' },
  Leatherworker: { label: 'Кожевник', icon: '👞' },
  Artificer: { label: 'Артефактор', icon: '🔮' },
  Huntsman: { label: 'Оружейник', icon: '🏹' },
  Jeweler: { label: 'Ювелир', icon: '💎' },
  Chef: { label: 'Повар', icon: '🍳' },
  Scribe: { label: 'Писец', icon: '📜' },
};

export function ReferencePage() {
  const [tab, setTab] = useState<ReferenceTab>('items');
  const [search, setSearch] = useState('');
  const [itemCategory, setItemCategory] = useState<string | null>(null);
  const [itemSubcategory, setItemSubcategory] = useState<string | null>(null);
  const [recipeDiscipline, setRecipeDiscipline] = useState<string | null>(null);

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
            onClick={() => { setTab(t); setSearch(''); setItemCategory(null); setItemSubcategory(null); setRecipeDiscipline(null); }}
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

      {tab === 'items' && (
        <ItemsTab
          search={search}
          onSearch={setSearch}
          category={itemCategory}
          onCategory={setItemCategory}
          subcategory={itemSubcategory}
          onSubcategory={setItemSubcategory}
        />
      )}
      {tab === 'recipes' && (
        <RecipesTab
          search={search}
          onSearch={setSearch}
          discipline={recipeDiscipline}
          onDiscipline={setRecipeDiscipline}
        />
      )}
      {tab === 'professions' && <ProfessionsList />}
    </Layout>
  );
}

function ItemsTab({
  search, onSearch, category, onCategory, subcategory, onSubcategory,
}: {
  search: string; onSearch: (v: string) => void;
  category: string | null; onCategory: (v: string | null) => void;
  subcategory: string | null; onSubcategory: (v: string | null) => void;
}) {
  const catKeys = Object.keys(ITEM_CATEGORIES);

  const searchQuery = subcategory || (search.length >= 2 ? search : '');

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['reference-items', searchQuery],
    queryFn: () => gw2Client.searchItems(searchQuery),
    enabled: searchQuery.length >= 2,
    staleTime: 60 * 1000,
  });

  const itemIds = (searchResults?.items || []).map((i: any) => i.id);
  const { data: details } = useQuery({
    queryKey: ['reference-item-details', itemIds],
    queryFn: () => gw2Client.getItemDetails(itemIds),
    enabled: itemIds.length > 0,
    staleTime: 60 * 1000,
  });

  const detailsMap = new Map((details || []).map((d: any) => [d.id, d]));

  let filtered = (searchResults?.items || []).slice(0, 100);
  if (category) {
    const catInfo = ITEM_CATEGORIES[category];
    filtered = filtered.filter((item: any) => {
      const det = detailsMap.get(item.id);
      if (!det) return true;
      const itemType = det.type || '';
      if (category === 'Armor' && itemType === 'Armor') return true;
      if (category === 'Weapon' && itemType === 'Weapon') return true;
      if (category === 'Trinket' && (itemType === 'Trinket' || itemType === 'Accessory' || itemType === 'Ring' || itemType === 'Amulet')) return true;
      return itemType === category;
    });
  }
  if (subcategory && category) {
    const subLower = subcategory.toLowerCase();
    filtered = filtered.filter((item: any) => {
      const det = detailsMap.get(item.id);
      if (!det) return true;
      const detailsType = (det.type || '').toLowerCase();
      const detailsSub = (det.details?.type || '').toLowerCase();
      return detailsType === subLower || detailsSub === subLower;
    });
  }

  if (!category) {
    return (
      <div>
        <p className="text-xs text-text-secondary mb-3 uppercase tracking-wider font-semibold">Выберите категорию</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {catKeys.map((key) => {
            const cat = ITEM_CATEGORIES[key];
            return (
              <button
                key={key}
                onClick={() => onCategory(key)}
                className="flex items-center gap-3 px-4 py-3 bg-bg-secondary rounded-xl border border-border-primary hover:border-indigo-500/40 hover:bg-bg-tertiary transition-all text-left"
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="text-sm font-medium text-text-primary">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const catInfo = ITEM_CATEGORIES[category];
  const subKeys = Object.keys(catInfo.sub);

  if (!subcategory) {
    return (
      <div>
        <button onClick={() => onCategory(null)} className="text-xs text-text-tertiary hover:text-amber-400 mb-3 flex items-center gap-1">
          ← {catInfo.icon} {catInfo.label} / Выберите подкатегорию
        </button>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {subKeys.map((key) => (
            <button
              key={key}
              onClick={() => { onSubcategory(key); onSearch(''); }}
              className="flex items-center gap-2 px-4 py-3 bg-bg-secondary rounded-xl border border-border-primary hover:border-indigo-500/40 hover:bg-bg-tertiary transition-all text-left"
            >
              <span className="text-sm font-medium text-text-primary">{catInfo.sub[key]}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-xs text-text-tertiary flex-wrap">
        <button onClick={() => onCategory(null)} className="hover:text-amber-400">{catInfo.icon} {catInfo.label}</button>
        <span>/</span>
        <button onClick={() => onSubcategory(null)} className="hover:text-amber-400">{catInfo.sub[subcategory]}</button>
      </div>

      <div className="mb-3">
        <Input
          placeholder={`Поиск среди ${catInfo.sub[subcategory]}...`}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      {searchLoading && <Skeleton className="h-40 w-full rounded-xl" />}
      {!searchLoading && filtered.length === 0 && (
        <Card><p className="text-text-secondary text-sm">Ничего не найдено</p></Card>
      )}
      <div className="space-y-2">
        {filtered.map((item: any) => {
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
                      {det.details?.type && <span>{det.details.type}</span>}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function RecipesTab({
  search, onSearch, discipline, onDiscipline,
}: {
  search: string; onSearch: (v: string) => void;
  discipline: string | null; onDiscipline: (v: string | null) => void;
}) {
  const searchQuery = search.length >= 2 ? search : '';

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['reference-recipes', searchQuery],
    queryFn: () => gw2Client.searchItems(searchQuery),
    enabled: searchQuery.length >= 2,
    staleTime: 60 * 1000,
  });

  const itemIds = (searchResults?.items || []).map((i: any) => i.id);
  const { data: recipes } = useQuery({
    queryKey: ['reference-recipes-details', itemIds],
    queryFn: () => gw2Client.getRecipes(itemIds),
    enabled: itemIds.length > 0,
    staleTime: 60 * 1000,
  });

  const { data: details } = useQuery({
    queryKey: ['reference-recipes-items', itemIds],
    queryFn: () => gw2Client.getItemDetails(itemIds),
    enabled: itemIds.length > 0,
    staleTime: 60 * 1000,
  });

  const detailsMap = new Map((details || []).map((d: any) => [d.id, d]));
  const recipeList = recipes || [];

  let filteredRecipes = recipeList;
  if (discipline) {
    filteredRecipes = filteredRecipes.filter((r: any) =>
      (r.discipline || '').toLowerCase() === discipline.toLowerCase()
    );
  }

  if (!discipline) {
    return (
      <div>
        <p className="text-xs text-text-secondary mb-3 uppercase tracking-wider font-semibold">Выберите дисциплину</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Object.entries(RECIPE_CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => onDiscipline(key)}
              className="flex items-center gap-3 px-4 py-3 bg-bg-secondary rounded-xl border border-border-primary hover:border-indigo-500/40 hover:bg-bg-tertiary transition-all text-left"
            >
              <span className="text-xl">{cat.icon}</span>
              <span className="text-sm font-medium text-text-primary">{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <Input
            placeholder="Поиск рецепта по названию предмета..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        {searchLoading && <Skeleton className="h-40 w-full rounded-xl mt-3" />}
        {!searchLoading && search && filteredRecipes.length === 0 && (
          <Card className="mt-3"><p className="text-text-secondary text-sm">Ничего не найдено</p></Card>
        )}
        {filteredRecipes.length > 0 && (
          <div className="space-y-2 mt-3">
            {filteredRecipes.slice(0, 50).map((recipe: any) => {
              const outputItem = detailsMap.get(recipe.output_item_id);
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
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-xs text-text-tertiary">
        <button onClick={() => onDiscipline(null)} className="hover:text-amber-400">{RECIPE_CATEGORIES[discipline]?.icon} {RECIPE_CATEGORIES[discipline]?.label}</button>
      </div>

      <Input
        placeholder={`Поиск рецептов ${RECIPE_CATEGORIES[discipline]?.label}...`}
        value={search}
        onChange={(e) => onSearch(e.target.value)}
      />

      {searchLoading && <Skeleton className="h-40 w-full rounded-xl mt-3" />}
      {!searchLoading && filteredRecipes.length === 0 && (
        <Card className="mt-3"><p className="text-text-secondary text-sm">Ничего не найдено</p></Card>
      )}
      {filteredRecipes.length > 0 && (
        <div className="space-y-2 mt-3">
          {filteredRecipes.slice(0, 50).map((recipe: any) => {
            const outputItem = detailsMap.get(recipe.output_item_id);
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
      )}
    </div>
  );
}

function ProfessionsList() {
  const { data, isLoading } = useQuery({
    queryKey: ['professions'],
    queryFn: () => gw2Client.getProfessions(),
    staleTime: 10 * 60 * 1000,
  });

  const [selectedProf, setSelectedProf] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  const profs = data?.professions || [];

  if (!selectedProf) {
    return (
      <div>
        <p className="text-xs text-text-secondary mb-3 uppercase tracking-wider font-semibold">Выберите профессию</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {profs.map((prof: any) => (
            <button
              key={prof.id}
              onClick={() => setSelectedProf(prof.id)}
              className="flex items-center gap-3 px-4 py-3 bg-bg-secondary rounded-xl border border-border-primary hover:border-indigo-500/40 hover:bg-bg-tertiary transition-all text-left"
            >
              {prof.icon_big && (
                <img src={prof.icon_big} alt="" className="w-10 h-10 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
              <div className="text-left">
                <p className="text-sm text-text-primary font-medium">{prof.name || prof.id}</p>
                <p className="text-[11px] text-text-secondary">
                  {prof.specializations?.length || 0} специализаций
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const prof = profs.find((p: any) => p.id === selectedProf);
  if (!prof) return null;

  return (
    <div>
      <button onClick={() => setSelectedProf(null)} className="text-xs text-text-tertiary hover:text-amber-400 mb-3 flex items-center gap-1">
        ← Профессии / {prof.name || prof.id}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-4 mb-4">
            {prof.icon_big && (
              <img src={prof.icon_big} alt="" className="w-16 h-16 rounded-xl" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
            <div>
              <h2 className="text-lg font-bold text-text-primary">{prof.name || prof.id}</h2>
              <p className="text-sm text-text-secondary">
                {prof.specializations?.length || 0} специализаций
              </p>
            </div>
          </div>
          {prof.weapons && (
            <div>
              <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-1">Оружие</p>
              <p className="text-sm text-text-primary">{Object.keys(prof.weapons).join(', ')}</p>
            </div>
          )}
        </Card>

        {prof.specializations && prof.specializations.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-[#c9a84c] uppercase tracking-wider mb-3">Специализации</h3>
            <div className="space-y-3">
              {prof.specializations.map((spec: any) => (
                <div key={spec.id} className="flex items-start gap-3 bg-bg-secondary rounded-lg p-3 border border-border-primary">
                  {spec.icon && (
                    <img src={spec.icon} alt={spec.name} className="w-10 h-10 rounded-lg flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  <div>
                    <p className="text-sm font-medium text-text-primary">{spec.name}</p>
                    <p className="text-[11px] text-text-secondary">{spec.profession}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
