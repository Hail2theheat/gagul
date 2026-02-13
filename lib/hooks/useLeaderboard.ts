// lib/hooks/useLeaderboard.ts
import { useQuery } from '@tanstack/react-query';
import { getLeaderboard, getPointsSummary } from '../services/pointsService';

export function useLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: () => getLeaderboard(limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function usePointsSummary() {
  return useQuery({
    queryKey: ['pointsSummary'],
    queryFn: getPointsSummary,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
