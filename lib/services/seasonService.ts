/**
 * Season service — monthly season leaderboards and trophy tracking
 */

import { supabase } from '../supabase';

export interface SeasonLeaderboardEntry {
  user_id: string;
  username: string;
  avatar_config: any;
  total_points: number;
}

export interface TrophyLeader {
  user_id: string;
  username: string;
  avatar_config: any;
  trophy_count: number;
  total_season_points: number;
}

/** First day of the current month */
export function getCurrentSeasonStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

/** First day of the next month */
export function getSeasonEnd(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];
}

/** Days remaining in the current season */
export function getDaysRemaining(): number {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return Math.max(0, endOfMonth.getDate() - now.getDate());
}

/** Medieval-themed season name based on month */
export function getSeasonName(seasonStart?: string): string {
  const date = seasonStart ? new Date(seasonStart + 'T00:00:00') : new Date();
  const month = date.getMonth(); // 0-indexed
  const medievalNames: Record<number, string> = {
    0: 'The Deep Winter',
    1: 'The Late Winter',
    2: 'The Thawing',
    3: 'The Spring March',
    4: 'The Green Season',
    5: 'The Long Days',
    6: 'The High Summer',
    7: 'The Harvest Moon',
    8: 'The Autumn Siege',
    9: 'The Fall of Leaves',
    10: 'The First Frost',
    11: 'The Dark Solstice',
  };
  return medievalNames[month] || 'The Unknown Season';
}

/** Date subtitle, e.g. "February 2026" */
export function getSeasonDateLabel(seasonStart?: string): string {
  const date = seasonStart ? new Date(seasonStart + 'T00:00:00') : new Date();
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

/** Get season leaderboard for a group */
export async function getSeasonLeaderboard(
  groupId: string,
  seasonStart?: string,
): Promise<SeasonLeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_season_leaderboard', {
    p_group_id: groupId,
    p_season_start: seasonStart || null,
  });

  if (error) {
    console.error('Error getting season leaderboard:', error);
    return [];
  }

  return (data as SeasonLeaderboardEntry[]) || [];
}

/** Get all-time trophy leaders for a group */
export async function getTrophyLeaders(groupId: string): Promise<TrophyLeader[]> {
  const { data, error } = await supabase.rpc('get_season_trophy_leaders', {
    p_group_id: groupId,
  });

  if (error) {
    console.error('Error getting trophy leaders:', error);
    return [];
  }

  return (data as TrophyLeader[]) || [];
}

/** Finalize the previous month's season (idempotent) */
export async function finalizeSeason(
  groupId: string,
  seasonMonth: string,
): Promise<{ success: boolean; alreadyFinalized?: boolean }> {
  const { data, error } = await supabase.rpc('finalize_season', {
    p_group_id: groupId,
    p_season_month: seasonMonth,
  });

  if (error) {
    console.error('Error finalizing season:', error);
    return { success: false };
  }

  const result = data as any;
  return {
    success: !result?.error,
    alreadyFinalized: result?.already_finalized || false,
  };
}
