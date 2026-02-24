import { useQuery } from '@tanstack/react-query';
import {
  getSeasonLeaderboard,
  getTrophyLeaders,
  getCurrentSeasonStart,
} from '../services/seasonService';

export function useSeasonLeaderboard(groupId: string | undefined) {
  return useQuery({
    queryKey: ['seasonLeaderboard', groupId],
    queryFn: () => getSeasonLeaderboard(groupId!, getCurrentSeasonStart()),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useTrophyLeaders(groupId: string | undefined) {
  return useQuery({
    queryKey: ['trophyLeaders', groupId],
    queryFn: () => getTrophyLeaders(groupId!),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
