const GOLD_COIN = 10000;
const SILVER_COIN = 100;

export interface CoinAmount {
  gold: number;
  silver: number;
  copper: number;
}

export function splitCoins(value: number): CoinAmount {
  if (!value || value <= 0) return { gold: 0, silver: 0, copper: 0 };
  const gold = Math.floor(value / GOLD_COIN);
  const remainder = value % GOLD_COIN;
  const silver = Math.floor(remainder / SILVER_COIN);
  const copper = remainder % SILVER_COIN;
  return { gold, silver, copper };
}

export function formatCoin(value: number): string {
  const { gold, silver, copper } = splitCoins(value);
  const parts: string[] = [];
  if (gold > 0) parts.push(`${gold}з`);
  if (silver > 0) parts.push(`${silver}с`);
  if (copper >= 0 && parts.length === 0) parts.push(`${copper}м`);
  else if (copper > 0) parts.push(`${copper}м`);
  return parts.join(' ');
}
