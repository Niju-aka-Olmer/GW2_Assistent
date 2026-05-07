import type { PriceData } from '../../../entities/price/model/types';
import { splitCoins } from '../lib/formatCoin';

function GoldCoin({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block align-middle">
      <circle cx="8" cy="8" r="7.5" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
      <circle cx="8" cy="8" r="5.5" fill="#f59e0b" />
      <text x="8" y="10.5" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#b45309">G</text>
    </svg>
  );
}

function SilverCoin({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block align-middle">
      <circle cx="8" cy="8" r="7.5" fill="#d1d5db" stroke="#9ca3af" strokeWidth="0.5" />
      <circle cx="8" cy="8" r="5.5" fill="#9ca3af" />
      <text x="8" y="10.5" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#4b5563">S</text>
    </svg>
  );
}

function CopperCoin({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block align-middle">
      <circle cx="8" cy="8" r="7.5" fill="#fb923c" stroke="#ea580c" strokeWidth="0.5" />
      <circle cx="8" cy="8" r="5.5" fill="#f97316" />
      <text x="8" y="10.5" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#9a3412">C</text>
    </svg>
  );
}

interface CoinBadgeProps {
  value: number;
  size?: number;
}

export function CoinBadge({ value, size = 12 }: CoinBadgeProps) {
  const { gold, silver, copper } = splitCoins(value);
  const parts: { amount: number; type: 'gold' | 'silver' | 'copper' }[] = [];
  if (gold > 0) parts.push({ amount: gold, type: 'gold' });
  if (silver > 0) parts.push({ amount: silver, type: 'silver' });
  if (copper > 0 || parts.length === 0) parts.push({ amount: copper, type: 'copper' });

  return (
    <span className="inline-flex items-center gap-1 align-middle">
      {parts.map((p, i) => (
        <span key={i} className="inline-flex items-center gap-0.5">
          {p.type === 'gold' && <GoldCoin size={size} />}
          {p.type === 'silver' && <SilverCoin size={size} />}
          {p.type === 'copper' && <CopperCoin size={size} />}
          <span className={
            p.type === 'gold' ? 'text-yellow-400' :
            p.type === 'silver' ? 'text-gray-300' :
            'text-orange-400'
          }>
            {p.amount}
          </span>
        </span>
      ))}
    </span>
  );
}

interface PriceBadgeProps {
  price?: PriceData;
  buys?: { unit_price: number } | null;
  sells?: { unit_price: number } | null;
  count?: number;
  showEmpty?: boolean;
}

export function PriceBadge({ price, buys: directBuys, sells: directSells, count, showEmpty = true }: PriceBadgeProps) {
  const sellPrice = directSells?.unit_price ?? (price?.sells?.unit_price as number | undefined) ?? 0;
  const buyPrice = directBuys?.unit_price ?? (price?.buys?.unit_price as number | undefined) ?? 0;

  if (!sellPrice && !buyPrice) return showEmpty ? <span className="text-[10px] text-text-secondary">—</span> : null;

  const multiplier = count && count > 1 ? count : 1;

  return (
    <div className="flex flex-col gap-0.5 text-xs">
      {sellPrice > 0 && (
        <div className="flex items-center gap-1">
          <span className="font-medium text-green-400">Sell</span>
          <CoinBadge value={sellPrice * multiplier} />
        </div>
      )}
      {buyPrice > 0 && (
        <div className="flex items-center gap-1">
          <span className="font-medium text-orange-400">Buy</span>
          <CoinBadge value={buyPrice * multiplier} />
        </div>
      )}
    </div>
  );
}
