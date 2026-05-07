import { useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Spinner } from '../shared/ui/Spinner';
import { ItemTooltip } from '../widgets/ItemTooltip/ui/ItemTooltip';
import { useCharacterBuild } from '../entities/character/api/getCharacters';
import { useItemDetails } from '../entities/item/api/getItems';
import { getRarityColor, getRarityBorderClass } from '../entities/item/lib/getRarityColor';
import { formatStats } from '../widgets/ItemTooltip/lib/formatStats';
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

const SLOT_ORDER: Record<string, number> = {
  Helm: 1, Shoulders: 2, Coat: 3, Gloves: 4, Leggings: 5, Boots: 6,
  Backpack: 7, Amulet: 8, Accessory1: 9, Accessory2: 10, Ring1: 11, Ring2: 12,
  WeaponA1: 13, WeaponA2: 14, WeaponB1: 15, WeaponB2: 16,
  WeaponAquatic: 17, HelmAquatic: 18, Scythe: 19,
};

export function BuildPage() {
  const { name } = useParams<{ name: string }>();
  const { data: buildData, isLoading, isError, error } = useCharacterBuild(name || '');

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

  const detailsMap = useMemo(() => {
    const map: Record<number, ItemDetails> = {};
    detailsData?.items?.forEach(item => { map[item.id] = item; });
    return map;
  }, [detailsData]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Spinner className="w-10 h-10 mx-auto mb-4" />
            <p className="text-text-secondary">Загрузка билда...</p>
          </div>
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">{buildData.name}</h1>
        <p className="text-text-secondary">{buildData.profession}</p>
      </div>

      {buildData.specializations && buildData.specializations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-3">Специализации</h2>
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
          <h2 className="text-lg font-semibold text-text-primary mb-3">Экипировка</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {sortedEquipment.map((item, idx) => {
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

              return (
                <ItemTooltip key={`${item.slot}-${idx}`} item={displayItem}>
                  <div
                    className={`bg-bg-secondary border-2 rounded-lg p-2 text-center cursor-pointer transition-all hover:bg-bg-hover hover:scale-105 ${getRarityBorderClass(item.rarity)}`}
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
      )}

      {(!buildData.specializations || buildData.specializations.length === 0) && sortedEquipment.length === 0 && (
        <Card>
          <p className="text-text-secondary text-center py-8">Нет данных о билде</p>
        </Card>
      )}
    </Layout>
  );
}
