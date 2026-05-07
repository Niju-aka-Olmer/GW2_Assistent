import { getRarityColor, getRarityBorderClass } from '../../../entities/item/lib/getRarityColor';
import type { ItemDetails } from '../../../entities/item/model/types';

interface ItemTooltipProps {
  item: ItemDetails;
  children: React.ReactNode;
}

export function ItemTooltip({ item, children }: ItemTooltipProps) {
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
          {item.description && (
            <p className="text-xs text-text-secondary mt-2 border-t border-border-primary pt-2">
              {item.description}
            </p>
          )}
          {item.vendor_value && item.vendor_value > 0 && (
            <p className="text-xs text-text-tertiary mt-2">
              Цена продажи: {item.vendor_value} 🪙
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
