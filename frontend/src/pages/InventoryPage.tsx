import { useParams, useSearchParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Skeleton } from '../shared/ui/Skeleton';
import { Tabs } from '../shared/ui/Tabs';
import { ItemTooltip } from '../widgets/ItemTooltip/ui/ItemTooltip';
import { PriceBadge } from '../widgets/PriceBadge/ui/PriceBadge';
import { ItemModal } from '../widgets/ItemModal';
import { AnalyzeButton } from '../widgets/AnalyzeButton';
import { CharacterTabs } from '../widgets/CharacterTabs';
import { FilterBar } from '../widgets/FilterBar';
import { useCharacterInventory } from '../entities/character/api/getCharacters';
import { useBank } from '../entities/bank/api/getBank';
import { useItemDetails, useItemPrices } from '../entities/item/api/getItems';
import { getRarityColor, getRarityBorderClass } from '../entities/item/lib/getRarityColor';
import { deepseekClient } from '../shared/api/deepseekClient';
import type { ItemDetails } from '../entities/item/model/types';

const TABS = [
  { id: 'inventory', label: 'Инвентарь' },
  { id: 'bank', label: 'Банк' },
];

const RARITY_OPTIONS = [
  { value: 'Junk', label: 'Мусор' },
  { value: 'Basic', label: 'Базовый' },
  { value: 'Fine', label: 'Тонкая' },
  { value: 'Masterwork', label: 'Отличная' },
  { value: 'Rare', label: 'Редкая' },
  { value: 'Exotic', label: 'Экзотическая' },
  { value: 'Ascended', label: 'Возвышенная' },
  { value: 'Legendary', label: 'Легендарная' },
];

const TYPE_RU: Record<string, string> = {
  Weapon: 'Оружие',
  Armor: 'Броня',
  Trinket: 'Аксессуар',
  Back: 'Спина',
  Bag: 'Сумка',
  Consumable: 'Расходник',
  Trophy: 'Трофей',
  CraftingMaterial: 'Материал',
  UpgradeComponent: 'Улучшение',
  Gizmo: 'Гизмо',
  MiniPet: 'Мини-питомец',
  Gathering: 'Инструмент',
  Container: 'Контейнер',
  Key: 'Ключ',
  Recipe: 'Рецепт',
};

function getItemType(_item: { id: number; name: string; icon: string; rarity: string; level: number }, details?: ItemDetails): string {
  if (details?.type) return details.type;
  return '';
}

function buildDisplayItem(item: { id: number; name: string; icon: string; rarity: string; level: number }, details?: ItemDetails): ItemDetails {
  if (details) return details;
  return {
    id: item.id,
    name: item.name,
    icon: item.icon,
    description: '',
    type: '',
    rarity: item.rarity,
    level: item.level,
    vendor_value: 0,
    flags: [],
    chat_link: '',
  };
}

function ItemCell({ item, details, buys, sells, onItemClick }: {
  item: { id: number; name: string; icon: string; rarity: string; level: number; count?: number };
  details?: ItemDetails;
  buys?: { unit_price: number } | null;
  sells?: { unit_price: number } | null;
  onItemClick?: (item: ItemDetails) => void;
}) {
  const displayItem = buildDisplayItem(item, details);

  return (
    <ItemTooltip item={displayItem} buys={buys} sells={sells}>
      <div
        className={`relative bg-bg-secondary border-2 rounded-lg p-1.5 text-center transition-all hover:bg-bg-hover hover:scale-105 cursor-pointer ${getRarityBorderClass(item.rarity)}`}
        onClick={() => onItemClick?.(displayItem)}
      >
        <div className="w-10 h-10 mx-auto bg-bg-tertiary rounded flex items-center justify-center">
          <img src={item.icon} alt={item.name} className="w-9 h-9" />
        </div>
        {item.count && item.count > 1 && (
          <span className="absolute top-0.5 right-1 text-[10px] font-bold text-text-primary bg-bg-primary/80 px-1 rounded">
            {item.count}
          </span>
        )}
        <p
          className="text-[10px] font-medium truncate mt-0.5"
          style={{ color: getRarityColor(item.rarity) }}
          title={item.name}
        >
          {item.name}
        </p>
        {item.count && item.count > 1 && (buys || sells) && (
          <PriceBadge
            buys={buys}
            sells={sells}
            count={item.count}
            showEmpty={false}
          />
        )}
        {(!item.count || item.count <= 1) && (buys || sells) && (
          <PriceBadge
            buys={buys}
            sells={sells}
            showEmpty={false}
          />
        )}
      </div>
    </ItemTooltip>
  );
}

export function InventoryPage() {
  const { name } = useParams<{ name: string }>();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'inventory');

  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  const [selectedItem, setSelectedItem] = useState<ItemDetails | null>(null);

  const {
    data: invData,
    isLoading: invLoading,
    isError: invError,
    error: invErr,
  } = useCharacterInventory(name || '');

  const {
    data: bankData,
    isLoading: bankLoading,
    isError: bankError,
    error: bankErr,
  } = useBank();

  const allItemIds = useMemo(() => {
    const ids: number[] = [];
    if (invData?.bags) {
      for (const bag of invData.bags) {
        if (!bag) continue;
        for (const item of bag) {
          if (item?.id) ids.push(item.id);
        }
      }
    }
    if (bankData?.bank) {
      for (const item of bankData.bank) {
        if (item?.id) ids.push(item.id);
      }
    }
    return [...new Set(ids)];
  }, [invData, bankData]);

  const { data: detailsData } = useItemDetails(allItemIds);
  const { data: pricesData } = useItemPrices(allItemIds);

  const detailsMap = useMemo(() => {
    const map: Record<number, ItemDetails> = {};
    detailsData?.items?.forEach(item => { map[item.id] = item; });
    return map;
  }, [detailsData]);

  interface PriceEntry {
    buys: { unit_price: number } | null;
    sells: { unit_price: number } | null;
  }
  const pricesMap = useMemo(() => {
    const map: Record<number, PriceEntry> = {};
    pricesData?.prices?.forEach(p => {
      map[p.id] = {
        buys: p.buys as unknown as { unit_price: number } | null,
        sells: p.sells as unknown as { unit_price: number } | null,
      };
    });
    return map;
  }, [pricesData]);

  const isError = activeTab === 'inventory' ? invError : bankError;
  const isLoading = activeTab === 'inventory' ? invLoading : bankLoading;
  const error = activeTab === 'inventory' ? invErr : bankErr;

  const inventoryItems = useMemo(() => {
    if (!invData?.bags) return [];
    const items: NonNullable<typeof invData.bags[0][number]>[] = [];
    for (const bag of invData.bags) {
      if (!bag) continue;
      for (const item of bag) {
        if (item) items.push(item);
      }
    }
    return items;
  }, [invData]);

  const bankItems = useMemo(() => {
    if (!bankData?.bank) return [];
    return bankData.bank.filter((item): item is NonNullable<typeof item> => item !== null);
  }, [bankData]);

  const currentItems = activeTab === 'inventory' ? inventoryItems : bankItems;

  const typeOptions = useMemo(() => {
    const types = new Set<string>();
    for (const item of currentItems) {
      const t = getItemType(item, detailsMap[item.id]);
      if (t && TYPE_RU[t]) types.add(t);
    }
    return Array.from(types).map(t => ({ value: t, label: TYPE_RU[t] || t }));
  }, [currentItems, detailsMap]);

  const filteredItems = useMemo(() => {
    return currentItems.filter((item) => {
      if (search) {
        const q = search.toLowerCase();
        if (!item.name.toLowerCase().includes(q)) return false;
      }
      if (rarityFilter.length > 0) {
        if (!rarityFilter.includes(item.rarity)) return false;
      }
      if (typeFilter.length > 0) {
        const t = getItemType(item, detailsMap[item.id]);
        if (!t || !typeFilter.includes(t)) return false;
      }
      return true;
    });
  }, [currentItems, search, rarityFilter, typeFilter, detailsMap]);

  const hasActiveFilters = !!search || rarityFilter.length > 0 || typeFilter.length > 0;

  return (
    <Layout>
      <CharacterTabs name={name || ''} />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-text-primary">
          {activeTab === 'inventory' ? `Инвентарь: ${name}` : 'Банк'}
        </h1>
        <AnalyzeButton
          label="AI Анализ"
          onAnalyze={(apiKey) => deepseekClient.analyzeInventory(name || '', activeTab as 'inventory' | 'bank', apiKey).then(r => r.analysis)}
        />
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <div className="lg:sticky lg:top-4 lg:self-start">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            rarity={rarityFilter}
            onRarityChange={setRarityFilter}
            type={typeFilter}
            onTypeChange={setTypeFilter}
            rarityOptions={RARITY_OPTIONS}
            typeOptions={typeOptions}
            onReset={() => { setSearch(''); setRarityFilter([]); setTypeFilter([]); }}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        <div>
          {isLoading && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-9 gap-2">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={i} className="bg-bg-secondary border border-border-primary rounded-lg p-1.5">
                    <Skeleton className="w-10 h-10 mx-auto mb-1 rounded" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {isError && !isLoading && (
            <Card>
              <p className="text-red-400">
                {(error as any)?.response?.data?.detail || 'Ошибка загрузки'}
              </p>
            </Card>
          )}

          {!isLoading && !isError && filteredItems.length === 0 && (
            <Card>
              <p className="text-text-secondary text-center py-8">
                {currentItems.length === 0
                  ? (activeTab === 'inventory' ? 'Инвентарь пуст' : 'Банк пуст')
                  : 'Ничего не найдено по фильтру'}
              </p>
            </Card>
          )}

          {!isLoading && !isError && filteredItems.length > 0 && (
            <>
              {hasActiveFilters && (
                <p className="text-xs text-text-tertiary mb-3">
                  Показано {filteredItems.length} из {currentItems.length}
                </p>
              )}
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-9 gap-2">
                {filteredItems.map((item, idx) => {
                  const price = pricesMap[item.id];
                  return (
                    <ItemCell
                      key={`${item.id}-${idx}`}
                      item={item}
                      details={detailsMap[item.id]}
                      buys={price?.buys}
                      sells={price?.sells}
                      onItemClick={(fullItem) => setSelectedItem(fullItem)}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </Layout>
  );
}
