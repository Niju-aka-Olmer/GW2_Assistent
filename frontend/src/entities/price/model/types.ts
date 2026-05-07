export interface PriceData {
  id: number;
  buys: Record<string, unknown> | null;
  sells: Record<string, unknown> | null;
}

export interface PriceResponse {
  prices: PriceData[];
}
