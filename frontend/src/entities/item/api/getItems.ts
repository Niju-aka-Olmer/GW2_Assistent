import { useQuery } from '@tanstack/react-query';
import { gw2Client } from '../../../shared/api/gw2Client';

export function useItemDetails(itemIds: number[]) {
  return useQuery({
    queryKey: ['item-details', itemIds],
    queryFn: () => gw2Client.getItemDetails(itemIds),
    staleTime: 60 * 60 * 1000,
    retry: 2,
    enabled: itemIds.length > 0,
  });
}

export function useItemPrices(itemIds: number[]) {
  return useQuery({
    queryKey: ['item-prices', itemIds],
    queryFn: () => gw2Client.getItemPrices(itemIds),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: itemIds.length > 0,
  });
}
