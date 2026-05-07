const GOLD_COIN = 10000;
const SILVER_COIN = 100;

export function formatCoin(value: number): string {
  if (!value || value <= 0) return '0';

  const gold = Math.floor(value / GOLD_COIN);
  const remainder = value % GOLD_COIN;
  const silver = Math.floor(remainder / SILVER_COIN);
  const copper = remainder % SILVER_COIN;

  const parts: string[] = [];
  if (gold > 0) parts.push(`${gold}🪙`);
  if (silver > 0) parts.push(`${silver}⚪`);
  if (copper > 0 || parts.length === 0) parts.push(`${copper}🔴`);

  return parts.join(' ');
}
