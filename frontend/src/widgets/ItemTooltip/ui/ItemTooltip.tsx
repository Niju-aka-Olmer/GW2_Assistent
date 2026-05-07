import { getRarityColor, getRarityBorderClass } from '../../../entities/item/lib/getRarityColor';
import { CoinBadge } from '../../PriceBadge/ui/PriceBadge';
import type { ItemDetails } from '../../../entities/item/model/types';

const RUS_ATTRIBUTES: Record<string, string> = {
  Power: 'Сила',
  Precision: 'Точность',
  Ferocity: 'Свирепость',
  Vitality: 'Живучесть',
  Toughness: 'Стойкость',
  ConditionDamage: 'Урон состояниями',
  ConditionDuration: 'Длительность состояний',
  Expertise: 'Мастерство',
  Concentration: 'Концентрация',
  HealingPower: 'Сила исцеления',
  AgonyResistance: 'Сопротивление агонии',
  BoonDuration: 'Длительность благословений',
  Healing: 'Исцеление',
  CritDamage: 'Крит. урон',
  Armor: 'Броня',
  Health: 'Здоровье',
};

interface ItemTooltipProps {
  item: ItemDetails;
  buys?: { unit_price: number } | null;
  sells?: { unit_price: number } | null;
  children: React.ReactNode;
}

export function ItemTooltip({ item, buys, sells, children }: ItemTooltipProps) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
        <div
          className={`bg-bg-secondary border-2 rounded-lg p-3 shadow-xl min-w-[200px] max-w-[300px] ${getRarityBorderClass(item.rarity)}`}
        >
          <p
            className="font-bold text-sm mb-1"
            style={{ color: getRarityColor(item.rarity) }}
          >
            {item.name}
          </p>
          {item.type && (
            <p className="text-xs text-text-secondary mb-1 capitalize">{item.type}</p>
          )}
          {item.level > 0 && (
            <p className="text-xs text-text-secondary mb-1">
              Требуется уровень: {item.level}
            </p>
          )}

          {item.attributes && Object.keys(item.attributes).length > 0 && (
            <div className="border-t border-border-primary pt-1.5 mt-1.5 space-y-0.5">
              {Object.entries(item.attributes).map(([attr, val]) => (
                <p key={attr} className="text-xs text-text-secondary">
                  {RUS_ATTRIBUTES[attr] || attr}: <span className="text-text-primary font-medium">{val}</span>
                </p>
              ))}
            </div>
          )}

          {item.defense && item.defense > 0 && (
            <p className="text-xs text-text-secondary mt-1.5 border-t border-border-primary pt-1.5">
              Защита: <span className="text-text-primary font-medium">{item.defense}</span>
            </p>
          )}

          {item.description && (
            <p className="text-xs text-text-secondary mt-1.5 border-t border-border-primary pt-1.5">
              {item.description}
            </p>
          )}

          {(item.vendor_value && item.vendor_value > 0) || (buys && buys.unit_price) || (sells && sells.unit_price) ? (
            <div className="flex items-center gap-3 mt-2 border-t border-border-primary pt-2">
              {item.vendor_value && item.vendor_value > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-text-tertiary">Продажа:</span>
                  <CoinBadge value={item.vendor_value} size={10} />
                </div>
              )}
              {buys && buys.unit_price > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-text-tertiary">Покупка:</span>
                  <CoinBadge value={buys.unit_price} size={10} />
                </div>
              )}
              {sells && sells.unit_price > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-text-tertiary">TP:</span>
                  <CoinBadge value={sells.unit_price} size={10} />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
