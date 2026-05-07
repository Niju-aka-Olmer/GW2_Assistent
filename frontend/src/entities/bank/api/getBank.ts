import { useQuery } from '@tanstack/react-query';
import { gw2Client } from '../../../shared/api/gw2Client';

export function useBank() {
  return useQuery({
    queryKey: ['bank'],
    queryFn: () => gw2Client.getBank(),
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
}
