import type { PriceData } from '../../../entities/price/model/types';
import { formatCoin } from '../lib/formatCoin';

interface PriceBadgeProps {
  price: PriceData;
}

export function PriceBadge({ price }: PriceBadgeProps) {
  const sellPrice = price.sells?.unit_price as number | undefined;
  const buyPrice = price.buys?.unit_price as number | undefined;

  if (!sellPrice && !buyPrice) return null;

  return (
    <div className="flex flex-col gap-0.5 text-xs">
      {sellPrice && (
        <div className="flex items-center gap-1">
          <span className="text-green-400 font-medium">Sell</span>
          <span className="text-text-secondary">{formatCoin(sellPrice)}</span>
        </div>
      )}
      {buyPrice && (
        <div className="flex items-center gap-1">
          <span className="text-orange-400 font-medium">Buy</span>
          <span className="text-text-secondary">{formatCoin(buyPrice)}</span>
        </div>
      )}
    </div>
  );
}
