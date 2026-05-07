import { useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Skeleton } from '../shared/ui/Skeleton';
import { ItemTooltip } from '../widgets/ItemTooltip/ui/ItemTooltip';
import { ItemModal } from '../widgets/ItemModal';
import { AnalyzeButton } from '../widgets/AnalyzeButton';
import { CharacterTabs } from '../widgets/CharacterTabs';
import { useCharacterBuild } from '../entities/character/api/getCharacters';
import { useItemDetails, useItemPrices } from '../entities/item/api/getItems';
import { getRarityColor, getRarityBorderClass } from '../entities/item/lib/getRarityColor';
import { formatStats } from '../widgets/ItemTooltip/lib/formatStats';
import { deepseekClient } from '../shared/api/deepseekClient';
import type { ItemDetails } from '../entities/item/model/types';

const SLOT_RU: Record<string, string> = {
  Helm: 'Шлем',
  Shoulders: 'Наплечники',
  Coat: 'Куртка',
  Gloves: 'Перчатки',
  Leggings: 'Поножи',
  Boots: 'Сапоги',
  HelmAquatic: 'Подводная маска',
  Backpack: 'Рюкзак',
  Accessory1: 'Аксессуар 1',
  Accessory2: 'Аксессуар 2',
  Ring1: 'Кольцо 1',
  Ring2: 'Кольцо 2',
  Amulet: 'Амулет',
  WeaponA1: 'Оружие',
  WeaponA2: 'Оружие (2)',
  WeaponB1: 'Оружие (набор 2)',
  WeaponB2: 'Оружие (набор 2)',
  WeaponAquatic: 'Подводное оружие',
  Scythe: 'Коса',
};

interface CategoryInfo {
  label: string;
  slots: string[];
}

const CATEGORIES: CategoryInfo[] = [
  { label: 'Броня', slots: ['Helm', 'Shoulders', 'Coat', 'Gloves', 'Leggings', 'Boots'] },
  { label: 'Аксессуары', slots: ['Backpack', 'Amulet', 'Accessory1', 'Accessory2', 'Ring1', 'Ring2'] },
  { label: 'Оружие (набор 1)', slots: ['WeaponA1', 'WeaponA2'] },
  { label: 'Оружие (набор 2)', slots: ['WeaponB1', 'WeaponB2'] },
  { label: 'Подводное', slots: ['WeaponAquatic', 'HelmAquatic'] },
];

const SLOT_ORDER: Record<string, number> = {};
CATEGORIES.forEach((cat, ci) => {
  cat.slots.forEach((slot, si) => {
    SLOT_ORDER[slot] = ci * 10 + si;
  });
});
SLOT_ORDER['Scythe'] = 99;

interface EquipmentItem {
  id: number;
  name: string;
  icon: string;
  slot: string;
  rarity: string;
  level: number;
  stats: Record<string, unknown> | null;
  infusions?: number[];
  upgrades?: number[];
}

function BuildEquipmentGrid({ equipment, detailsMap, pricesMap, onItemClick }: {
  equipment: EquipmentItem[];
  detailsMap: Record<number, ItemDetails>;
  pricesMap: Record<number, { buys: { unit_price: number } | null; sells: { unit_price: number } | null }>;
  onItemClick: (item: ItemDetails, slot: EquipmentItem) => void;
}) {
  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.slots
      .map((slot) => equipment.find((e) => e.slot === slot))
      .filter((e): e is EquipmentItem => e !== undefined),
  }));

  const otherSlots = equipment.filter(
    (e) => !CATEGORIES.some((cat) => cat.slots.includes(e.slot)),
  );

  return (
    <div className="space-y-8">
      {grouped.map((cat) => {
        if (cat.items.length === 0) return null;
        return (
          <div key={cat.label}>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
              {cat.label}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {cat.items.map((item) => {
                const details = detailsMap[item.id];
                const stats = item.stats ? formatStats(item.stats as Record<string, number>) : [];
                const displayItem: ItemDetails = details || {
                  id: item.id,
                  name: item.name,
                  icon: item.icon,
                  description: '',
                  type: item.slot,
                  rarity: item.rarity,
                  level: item.level,
                  vendor_value: 0,
                  flags: [],
                  chat_link: '',
                };
                const price = pricesMap[item.id];

                return (
                  <ItemTooltip key={item.slot} item={displayItem} buys={price?.buys} sells={price?.sells}>
                    <div
                      className={`bg-bg-secondary border-2 rounded-lg p-2 text-center cursor-pointer transition-all hover:bg-bg-hover hover:scale-105 ${getRarityBorderClass(item.rarity)}`}
                      onClick={() => onItemClick(displayItem, item)}
                    >
                      <div className="w-12 h-12 mx-auto mb-1 bg-bg-tertiary rounded flex items-center justify-center">
                        <img src={item.icon} alt={item.name} className="w-10 h-10" />
                      </div>
                      <p
                        className="text-xs font-medium truncate"
                        style={{ color: getRarityColor(item.rarity) }}
                        title={item.name}
                      >
                        {item.name}
                      </p>
                      <p className="text-[10px] text-text-tertiary mt-0.5">
                        {SLOT_RU[item.slot] || item.slot}
                      </p>
                      {stats.length > 0 && (
                        <div className="mt-1 text-[10px] text-text-secondary leading-tight">
                          {stats.slice(0, 2).map((s, i) => (
                            <div key={i}>{s.label}: {s.value}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </ItemTooltip>
                );
              })}
            </div>
          </div>
        );
      })}

      {otherSlots.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Прочее
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {otherSlots.map((item) => {
              const details = detailsMap[item.id];
              const displayItem: ItemDetails = details || {
                id: item.id,
                name: item.name,
                icon: item.icon,
                description: '',
                type: item.slot,
                rarity: item.rarity,
                level: item.level,
                vendor_value: 0,
                flags: [],
                chat_link: '',
              };
              const price = pricesMap[item.id];
              return (
                <ItemTooltip key={item.slot} item={displayItem} buys={price?.buys} sells={price?.sells}>
                  <div
                    className={`bg-bg-secondary border-2 rounded-lg p-2 text-center cursor-pointer transition-all hover:bg-bg-hover hover:scale-105 ${getRarityBorderClass(item.rarity)}`}
                    onClick={() => onItemClick(displayItem, item)}
                  >
                    <div className="w-12 h-12 mx-auto mb-1 bg-bg-tertiary rounded flex items-center justify-center">
                      <img src={item.icon} alt={item.name} className="w-10 h-10" />
                    </div>
                    <p className="text-xs font-medium truncate" style={{ color: getRarityColor(item.rarity) }}>{item.name}</p>
                    <p className="text-[10px] text-text-tertiary mt-0.5">{SLOT_RU[item.slot] || item.slot}</p>
                  </div>
                </ItemTooltip>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function BuildPage() {
  const { name } = useParams<{ name: string }>();
  const { data: buildData, isLoading, isError, error } = useCharacterBuild(name || '');

  const [modalItem, setModalItem] = useState<{ item: ItemDetails; slot?: { slot: string; stats?: Record<string, number> } } | null>(null);

  const itemIds = useMemo(() => {
    if (!buildData?.equipment) return [];
    const ids = buildData.equipment.map(e => e.id);
    buildData.equipment.forEach(e => {
      if (e.infusions) e.infusions.forEach(id => { if (id) ids.push(id); });
      if (e.upgrades) e.upgrades.forEach(id => { if (id) ids.push(id); });
    });
    return [...new Set(ids)];
  }, [buildData]);

  const { data: detailsData } = useItemDetails(itemIds);
  const { data: pricesData } = useItemPrices(itemIds);

  const detailsMap = useMemo(() => {
    const map: Record<number, ItemDetails> = {};
    detailsData?.items?.forEach(item => { map[item.id] = item; });
    return map;
  }, [detailsData]);

  const pricesMap = useMemo(() => {
    const map: Record<number, { buys: { unit_price: number } | null; sells: { unit_price: number } | null }> = {};
    pricesData?.prices?.forEach(p => {
      map[p.id] = {
        buys: p.buys as unknown as { unit_price: number } | null,
        sells: p.sells as unknown as { unit_price: number } | null,
      };
    });
    return map;
  }, [pricesData]);

  if (isLoading) {
    return (
      <Layout>
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="mb-8">
          <Skeleton className="h-6 w-40 mb-3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-bg-secondary border border-border-primary rounded-xl p-4">
                <Skeleton className="h-12 w-12 rounded-lg mb-3" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24 mb-2" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-bg-secondary border border-border-primary rounded-lg p-2">
              <Skeleton className="w-12 h-12 mx-auto mb-2 rounded" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-2/3 mx-auto" />
            </div>
          ))}
        </div>
      </Layout>
    );
  }

  if (isError || !buildData) {
    return (
      <Layout>
        <Card>
          <p className="text-red-400">
            {(error as any)?.response?.data?.detail || 'Ошибка загрузки билда'}
          </p>
        </Card>
      </Layout>
    );
  }

  const sortedEquipment = [...(buildData.equipment || [])].sort(
    (a, b) => (SLOT_ORDER[a.slot] || 99) - (SLOT_ORDER[b.slot] || 99),
  );

  return (
    <Layout>
      <CharacterTabs name={name || ''} />
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-[#f3c623] via-[#c9a84c] to-[#a68a3c] bg-clip-text text-transparent">
                {buildData.name}
              </span>
            </h1>
            <p className="text-text-secondary text-sm mt-1">{buildData.profession}</p>
          </div>
          <AnalyzeButton
            label="AI Анализ билда"
            onAnalyze={(apiKey) => deepseekClient.analyzeBuild(name || '', apiKey).then(r => r.analysis)}
          />
        </div>
      </div>

      {buildData.specializations && buildData.specializations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[#c9a84c] mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
            Специализации
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {buildData.specializations.map((spec) => (
              <Card key={spec.id} className="overflow-hidden">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-bg-tertiary">
                    <img src={spec.icon} alt={spec.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{spec.name}</p>
                    <p className="text-xs text-text-secondary">Выбранных черт: {spec.selected_traits.filter(Boolean).length}/{spec.traits.length}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {spec.selected_traits.filter(Boolean).map((traitId, i) => (
                    <span key={i} className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      Черта {traitId}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {sortedEquipment.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[#c9a84c] mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="7" width="18" height="14" rx="2" /><path d="M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2" />
            </svg>
            Экипировка
          </h2>
          <BuildEquipmentGrid
            equipment={sortedEquipment}
            detailsMap={detailsMap}
            pricesMap={pricesMap}
            onItemClick={(item, slot) => setModalItem({ item, slot: { slot: slot.slot, stats: slot.stats as unknown as Record<string, number> | undefined } })}
          />
        </div>
      )}

      {(!buildData.specializations || buildData.specializations.length === 0) && sortedEquipment.length === 0 && (
        <Card>
          <p className="text-text-secondary text-center py-8">Нет данных о билде</p>
        </Card>
      )}

      {modalItem && (
        <ItemModal
          item={modalItem.item}
          slot={modalItem.slot}
          onClose={() => setModalItem(null)}
        />
      )}
    </Layout>
  );
}
