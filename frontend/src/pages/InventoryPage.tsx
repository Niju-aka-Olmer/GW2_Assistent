import { useParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Spinner } from '../shared/ui/Spinner';
import { Tabs } from '../shared/ui/Tabs';
import { ItemTooltip } from '../widgets/ItemTooltip/ui/ItemTooltip';
import { PriceBadge } from '../widgets/PriceBadge/ui/PriceBadge';
import { useCharacterInventory } from '../entities/character/api/getCharacters';
import { useBank } from '../entities/bank/api/getBank';
import { useItemDetails, useItemPrices } from '../entities/item/api/getItems';
import { getRarityColor, getRarityBorderClass } from '../entities/item/lib/getRarityColor';
import type { ItemDetails } from '../entities/item/model/types';

const TABS = [
  { id: 'inventory', label: 'Инвентарь' },
  { id: 'bank', label: 'Банк' },
];

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

function ItemCell({ item, details, buys, sells }: {
  item: { id: number; name: string; icon: string; rarity: string; level: number; count?: number };
  details?: ItemDetails;
  buys?: { unit_price: number } | null;
  sells?: { unit_price: number } | null;
}) {
  const displayItem = buildDisplayItem(item, details);

  return (
    <ItemTooltip item={displayItem}>
      <div
        className={`relative bg-bg-secondary border-2 rounded-lg p-1.5 text-center transition-all hover:bg-bg-hover hover:scale-105 ${getRarityBorderClass(item.rarity)}`}
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
        {item.count && item.count > 1 && buys && (
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
  const [activeTab, setActiveTab] = useState('inventory');

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

  const pricesMap = useMemo(() => {
    const map: Record<number, { buys: { unit_price: number } | null; sells: { unit_price: number } | null }> = {};
    pricesData?.prices?.forEach(p => { map[p.id] = { buys: p.buys, sells: p.sells }; });
    return map;
  }, [pricesData]);

  const isError = activeTab === 'inventory' ? invError : bankError;
  const isLoading = activeTab === 'inventory' ? invLoading : bankLoading;
  const error = activeTab === 'inventory' ? invErr : bankErr;

  const inventoryItems = useMemo(() => {
    if (!invData?.bags) return [];
    const items: typeof invData.bags[0][number][] = [];
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

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-text-primary">
          {activeTab === 'inventory' ? `Инвентарь: ${name}` : 'Банк'}
        </h1>
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-4">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Spinner className="w-10 h-10 mx-auto mb-4" />
              <p className="text-text-secondary">Загрузка...</p>
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

        {!isLoading && !isError && currentItems.length === 0 && (
          <Card>
            <p className="text-text-secondary text-center py-8">
              {activeTab === 'inventory' ? 'Инвентарь пуст' : 'Банк пуст'}
            </p>
          </Card>
        )}

        {!isLoading && !isError && currentItems.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
            {currentItems.map((item, idx) => {
              const price = pricesMap[item.id];
              return (
                <ItemCell
                  key={`${item.id}-${idx}`}
                  item={item}
                  details={detailsMap[item.id]}
                  buys={price?.buys}
                  sells={price?.sells}
                />
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
