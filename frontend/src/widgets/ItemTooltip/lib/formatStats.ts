import { RUS_ATTRIBUTES } from './rusAttributes';

export function formatStats(stats: Record<string, unknown> | null): { label: string; value: number }[] {
  if (!stats) return [];

  return Object.entries(stats)
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .map(([key, value]) => ({
      label: RUS_ATTRIBUTES[key] || key,
      value: value as number,
    }));
}
