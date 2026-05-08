import type { ItemDetails } from '../../../entities/item/model/types';
import { formatStats } from '../../ItemTooltip';
import { RUS_ATTRIBUTES } from '../../ItemTooltip/lib/rusAttributes';
import { getRarityColor } from '../../../entities/item/lib/getRarityColor';
import { getItemIconUrl } from '../../../entities/item/lib/getItemIconUrl';
import { getItemTypeRu } from '../lib/getTypeRu';
import { CoinBadge } from '../../PriceBadge/ui/PriceBadge';
import { useEffect, useCallback } from 'react';

interface SlotInfo {
  slot: string;
  stats?: Record<string, number>;
  infusions?: { id: number }[];
  upgrades?: { id: number }[];
}

interface ItemModalProps {
  item: ItemDetails;
  slot?: SlotInfo;
  onClose: () => void;
}

const FLAGS_RU: Record<string, string> = {
  'AccountBound': 'Привязано к аккаунту',
  'AccountBindOnUse': 'Привязывается при использовании',
  'Soulbound': 'Привязано к персонажу',
  'SoulbindOnUse': 'Привязывается при надевании',
  'SoulbindOnAcquire': 'Привязывается при получении',
  'Unique': 'Уникальное',
  'NotSellable': 'Не продаётся',
  'NoSell': 'Не продаётся',
  'HideSuffix': 'Скрывать суффикс',
  'MonsterOnly': 'Только для монстров',
  'Previewable': 'Можно предпросмотреть',
};

const SLOT_RU: Record<string, string> = {
  Helm: 'Шлем',
  Shoulders: 'Наплечники',
  Coat: 'Куртка',
  Gloves: 'Перчатки',
  Leggings: 'Поножи',
  Boots: 'Сапоги',
  HelmAquatic: 'Подводная маска',
  Backpack: 'Рюкзак',
};

const WEAPON_TYPE_RU: Record<string, string> = {
  Sword: 'Меч',
  Axe: 'Топор',
  Dagger: 'Кинжал',
  Mace: 'Булава',
  Greatsword: 'Большой меч',
  Hammer: 'Молот',
  Staff: 'Посох',
  Scepter: 'Скипетр',
  Focus: 'Фокус',
  Shield: 'Щит',
  Torch: 'Факел',
  Warhorn: 'Рог',
  ShortBow: 'Короткий лук',
  LongBow: 'Длинный лук',
  Rifle: 'Винтовка',
  Pistol: 'Пистолет',
  HarpoonGun: 'Гарпун',
  Trident: 'Трезубец',
  Speargun: 'Гарпун',
  Spear: 'Копьё',
  StaffWater: 'Водный посох',
  Scythe: 'Коса',
};

const DAMAGE_TYPE_RU: Record<string, string> = {
  Physical: 'Физический',
  Fire: 'Огонь',
  Ice: 'Лёд',
  Lightning: 'Молния',
  Dark: 'Тьма',
  Chilling: 'Холод',
  Light: 'Свет',
};

const TRINKET_TYPE_RU: Record<string, string> = {
  Accessory: 'Аксессуар',
  Ring: 'Кольцо',
  Amulet: 'Амулет',
};

const INFUSION_FLAGS_RU: Record<string, string> = {
  Offensive: 'Атакующее',
  Defensive: 'Защитное',
  Utility: 'Утилитарное',
  Infusion: 'Инфузия',
};

const ITEM_FLAGS_RU: Record<string, string> = {
  AccountBound: 'Аккаунт',
  AccountBindOnUse: 'При использовании',
  Soulbound: 'Персонаж',
  SoulbindOnUse: 'При надевании',
};

export function ItemModal({ item, slot, onClose }: ItemModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const rarityColor = getRarityColor(item.rarity);
  const iconUrl = getItemIconUrl(item.icon, 128);

  const slotStats = formatStats(slot?.stats || null);
  const itemAttrs = item.attributes
    ? Object.entries(item.attributes)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({
          label: RUS_ATTRIBUTES[k] || k,
          value: v,
        }))
    : [];

  const allAttributes = [...itemAttrs];
  for (const s of slotStats) {
    if (!allAttributes.find(a => a.label === s.label)) {
      allAttributes.push(s);
    }
  }

  const hasAttributes = allAttributes.length > 0;

  const knownFlags = (item.flags || [])
    .map((f) => FLAGS_RU[f])
    .filter(Boolean);
  const flagsText = knownFlags.length > 0 ? knownFlags.join(', ') : '';

  const typeInfo = item.weight_class
    ? `${getItemTypeRu(item.type)} (${item.weight_class === 'Heavy' ? 'Тяжёлая' : item.weight_class === 'Medium' ? 'Средняя' : item.weight_class === 'Light' ? 'Лёгкая' : item.weight_class})`
    : getItemTypeRu(item.type);

  const armorType = item.armor_type
    ? SLOT_RU[item.armor_type] || item.armor_type
    : null;

  const weaponType = item.weapon_type
    ? WEAPON_TYPE_RU[item.weapon_type] || item.weapon_type
    : null;

  const damageType = item.weapon_damage_type
    ? DAMAGE_TYPE_RU[item.weapon_damage_type] || item.weapon_damage_type
    : null;

  const trinketType = item.trinket_type
    ? TRINKET_TYPE_RU[item.trinket_type] || item.trinket_type
    : null;

  const containerType = item.container_type
    ? getItemTypeRu(item.container_type)
    : null;

  const consumableType = item.consumable_type
    ? getItemTypeRu(item.consumable_type)
    : null;

  const bindingFlags = (item.flags || []).filter(f =>
    ['AccountBound', 'AccountBindOnUse', 'Soulbound', 'SoulbindOnUse', 'SoulbindOnAcquire'].includes(f)
  );
  const bindingText = bindingFlags.length > 0
    ? bindingFlags.map(f => ITEM_FLAGS_RU[f] || f).join(', ')
    : '';

  const prefixLabel = item.suffix && !item.flags?.includes('HideSuffix')
    ? item.suffix
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-primary border border-border-primary rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0">
              <img
                src={iconUrl}
                alt={item.name}
                className="w-24 h-24 rounded-xl bg-bg-tertiary shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" fill="%236366f1"><rect width="96" height="96" rx="8"/><text x="48" y="52" text-anchor="middle" font-size="10" fill="white">GW2</text></svg>';
                }}
              />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xl font-bold truncate" style={{ color: rarityColor }}>
                  {item.name}
                </h2>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-text-secondary mt-1">{typeInfo}</p>
            </div>
          </div>

          {item.description && (
            <div className="mb-4 p-3 bg-bg-tertiary/50 rounded-xl">
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          )}

          {hasAttributes && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Характеристики</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {allAttributes.map((s) => (
                  <span
                    key={s.label}
                    className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 text-xs font-medium rounded-lg inline-flex items-center justify-between"
                  >
                    <span>{s.label}</span>
                    <span className="ml-2 text-indigo-200">+{s.value}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.upgrade_component && (
            <div className="mb-4 p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Улучшение</p>
              <p className="text-sm font-medium text-text-primary">{item.upgrade_component.name}</p>
              {item.upgrade_component.description && (
                <p className="text-xs text-text-secondary mt-1">{item.upgrade_component.description}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            {item.rarity && (
              <DetailRow label="Редкость" value={item.rarity} color={rarityColor} />
            )}

            {item.level > 0 && (
              <DetailRow label="Треб. уровень" value={String(item.level)} />
            )}

            {item.vendor_value != null && item.vendor_value > 0 && (
              <div className="flex items-center gap-2 py-1">
                <span className="text-xs text-text-secondary min-w-[140px]">Продажа торговцу:</span>
                <CoinBadge value={item.vendor_value} />
              </div>
            )}

            {item.armor_class && (
              <DetailRow
                label="Класс брони"
                value={item.armor_class === 'Heavy' ? 'Тяжёлая броня' : item.armor_class === 'Medium' ? 'Средняя броня' : item.armor_class === 'Light' ? 'Лёгкая броня' : item.armor_class}
              />
            )}

            {armorType && (
              <DetailRow label="Тип" value={armorType} />
            )}

            {item.armor_defense != null && item.armor_defense > 0 && (
              <DetailRow label="Защита" value={String(item.armor_defense)} />
            )}

            {weaponType && (
              <DetailRow label="Тип оружия" value={weaponType} />
            )}

            {damageType && (
              <DetailRow label="Тип урона" value={damageType} />
            )}

            {item.weapon_min_power != null && item.weapon_max_power != null && (
              <DetailRow label="Урон" value={`${item.weapon_min_power} – ${item.weapon_max_power}`} />
            )}

            {trinketType && (
              <DetailRow label="Тип аксессуара" value={trinketType} />
            )}

            {item.bag_size != null && item.bag_size > 0 && (
              <DetailRow label="Размер сумки" value={`${item.bag_size} слотов`} />
            )}

            {containerType && (
              <DetailRow label="Тип контейнера" value={containerType} />
            )}

            {consumableType && (
              <DetailRow label="Тип расходника" value={consumableType} />
            )}

            {item.gathering_tool_type && (
              <DetailRow label="Тип инструмента" value={item.gathering_tool_type} />
            )}

            {item.gizmo_type && (
              <DetailRow label="Тип гизмо" value={item.gizmo_type} />
            )}

            {prefixLabel && (
              <DetailRow label="Префикс" value={prefixLabel} />
            )}

            {item.default_skin != null && item.default_skin > 0 && (
              <DetailRow label="ID скина" value={`#${item.default_skin}`} />
            )}

            {item.suffix_item_id != null && item.suffix_item_id > 0 && (
              <DetailRow label="ID суффикса" value={String(item.suffix_item_id)} />
            )}

            {item.infusion_slots && item.infusion_slots.length > 0 && (
              <div className="flex items-start gap-2 py-1">
                <span className="text-xs text-text-secondary min-w-[140px] pt-0.5">Слоты инфузий:</span>
                <div className="flex flex-wrap gap-1">
                  {item.infusion_slots.map((slot, i) => {
                    const flags = slot.flags?.map(f => INFUSION_FLAGS_RU[f] || f).join(', ') || '';
                    return (
                      <span key={i} className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        {flags || `Слот ${i + 1}`}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {bindingText && (
              <DetailRow label="Привязка" value={bindingText} />
            )}

            {flagsText && (
              <DetailRow label="Флаги" value={flagsText} />
            )}
          </div>

          {item.chat_link && (
            <div className="pt-3 border-t border-border-primary mt-3">
              <p className="text-xs text-text-secondary mb-1">Чат-ссылка (для передачи в игре):</p>
              <p className="text-xs text-text-tertiary font-mono select-all bg-bg-tertiary px-2 py-1 rounded break-all">
                {item.chat_link}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-xs text-text-secondary min-w-[140px]">{label}:</span>
      {color ? (
        <span className="text-sm font-medium" style={{ color }}>{value}</span>
      ) : (
        <span className="text-sm text-text-primary">{value}</span>
      )}
    </div>
  );
}