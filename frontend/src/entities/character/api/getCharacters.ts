import { useQuery } from '@tanstack/react-query';
import { gw2Client } from '../../../shared/api/gw2Client';

export function useCharacters() {
  return useQuery({
    queryKey: ['characters'],
    queryFn: () => gw2Client.getCharacters(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useCharacterBuild(name: string) {
  return useQuery({
    queryKey: ['character-build', name],
    queryFn: () => gw2Client.getCharacterBuild(name),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: !!name,
  });
}

export function useCharacterInventory(name: string) {
  return useQuery({
    queryKey: ['character-inventory', name],
    queryFn: () => gw2Client.getCharacterInventory(name),
    staleTime: 2 * 60 * 1000,
    retry: 2,
    enabled: !!name,
  });
}
