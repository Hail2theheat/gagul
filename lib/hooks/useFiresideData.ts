// lib/hooks/useFiresideData.ts
import { useQuery } from '@tanstack/react-query';
import { getFiresideData, finalizeWeek, FiresideData } from '../services/firesideService';

async function fetchFiresideData(groupId: string): Promise<FiresideData | null> {
  // Finalize the week first (idempotent)
  await finalizeWeek(groupId);
  return getFiresideData(groupId);
}

export function useFiresideData(groupId: string | undefined) {
  return useQuery({
    queryKey: ['firesideData', groupId],
    queryFn: () => fetchFiresideData(groupId!),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 5, // 5 minutes - fireside data doesn't change often
  });
}
