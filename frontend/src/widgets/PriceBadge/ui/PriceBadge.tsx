import type { PriceData } from '../../../entities/price/model/types';
import { formatCoin } from '../lib/formatCoin';

interface PriceBadgeProps {
  price?: PriceData;
  buys?: { unit_price: number } | null;
  sells?: { unit_price: number } | null;
  count?: number;
  showEmpty?: boolean;
}

function CoinRow({ label, value, labelClass }: { label: string; value: number; labelClass: string }) {
  const parts = formatCoin(value).split(' ');
  return (
    <div className="flex items-center gap-1">
      <span className={`font-medium ${labelClass}`}>{label}</span>
      <span className="text-text-secondary">
        {parts.map((part, i) => {
          if (part.endsWith('з')) return <span key={i} className="text-yellow-400">{part} </span>;
          if (part.endsWith('с')) return <span key={i} className="text-gray-300">{part} </span>;
          if (part.endsWith('м')) return <span key={i} className="text-orange-400">{part} </span>;
          return <span key={i}>{part} </span>;
        })}
      </span>
    </div>
  );
}

export function PriceBadge({ price, buys: directBuys, sells: directSells, count, showEmpty = true }: PriceBadgeProps) {
  const sellPrice = directSells?.unit_price ?? price?.sells?.unit_price ?? 0;
  const buyPrice = directBuys?.unit_price ?? price?.buys?.unit_price ?? 0;

  if (!sellPrice && !buyPrice) return showEmpty ? <span className="text-[10px] text-text-secondary">—</span> : null;

  const multiplier = count && count > 1 ? count : 1;

  return (
    <div className="flex flex-col gap-0.5 text-xs">
      {sellPrice > 0 && (
        <CoinRow label="Sell" value={sellPrice * multiplier} labelClass="text-green-400" />
      )}
      {buyPrice > 0 && (
        <CoinRow label="Buy" value={buyPrice * multiplier} labelClass="text-orange-400" />
      )}
    </div>
  );
}
