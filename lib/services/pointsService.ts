/**
 * Points service - handles awarding and tracking points
 */

import { supabase } from '../supabase';

// Point values
export const POINTS = {
  RESPONSE: 3,
  PHOTO_BONUS: 1,
  FIRST_RESPONDER: 1,
  COMMENT: 1,
  LIKE_RECEIVED: 1,
  RATING: 1,
  QUIPLASH_WIN: 5,
  FIRESIDE: 5,
  PERFECT_WEEK: 10,
  STREAK_BONUS: 1,
} as const;

export type PointEventType =
  | 'response'
  | 'photo_bonus'
  | 'first_responder'
  | 'comment'
  | 'like_received'
  | 'rating'
  | 'quiplash_win'
  | 'fireside'
  | 'perfect_week'
  | 'streak_bonus';

export interface PointEvent {
  event_type: PointEventType;
  points: number;
  created_at: string;
}

export interface PointsSummary {
  total_points: number;
  weekly_points: number;
  current_streak: number;
  longest_streak: number;
  recent_events: PointEvent[];
}

// Event emitter for point animations
type PointsListener = (points: number, eventType: PointEventType) => void;
const listeners: PointsListener[] = [];

export function onPointsAwarded(listener: PointsListener) {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) listeners.splice(index, 1);
  };
}

export function emitPointsAwarded(points: number, eventType: PointEventType) {
  listeners.forEach(listener => listener(points, eventType));
}

/**
 * Award points to the current user
 */
export async function awardPoints(
  eventType: PointEventType,
  groupId?: string,
  referenceId?: string
): Promise<{ success: boolean; points: number; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { success: false, points: 0, error: 'Not authenticated' };
  }

  // Determine points based on event type
  let points = 0;
  switch (eventType) {
    case 'response':
      points = POINTS.RESPONSE;
      break;
    case 'photo_bonus':
      points = POINTS.PHOTO_BONUS;
      break;
    case 'first_responder':
      points = POINTS.FIRST_RESPONDER;
      break;
    case 'comment':
      points = POINTS.COMMENT;
      break;
    case 'like_received':
      points = POINTS.LIKE_RECEIVED;
      break;
    case 'rating':
      points = POINTS.RATING;
      break;
    case 'quiplash_win':
      points = POINTS.QUIPLASH_WIN;
      break;
    case 'fireside':
      points = POINTS.FIRESIDE;
      break;
    case 'perfect_week':
      points = POINTS.PERFECT_WEEK;
      break;
    case 'streak_bonus':
      points = POINTS.STREAK_BONUS;
      break;
  }

  const { error } = await supabase.rpc('award_points', {
    p_user_id: userData.user.id,
    p_event_type: eventType,
    p_points: points,
    p_group_id: groupId || null,
    p_reference_id: referenceId || null,
  });

  if (error) {
    console.error('Error awarding points:', error);
    return { success: false, points: 0, error: error.message };
  }

  // Emit event for animation
  emitPointsAwarded(points, eventType);

  return { success: true, points };
}

/**
 * Award points for submitting a response
 * Handles both base points and photo bonus
 */
export async function awardResponsePoints(
  groupId: string,
  responseId: string,
  isPhotoPrompt: boolean
): Promise<{ success: boolean; totalPoints: number }> {
  let totalPoints = 0;

  // Award base response points
  const baseResult = await awardPoints('response', groupId, responseId);
  if (baseResult.success) {
    totalPoints += baseResult.points;
  }

  // Award photo bonus if applicable
  if (isPhotoPrompt) {
    const photoResult = await awardPoints('photo_bonus', groupId, responseId);
    if (photoResult.success) {
      totalPoints += photoResult.points;
    }
  }

  return { success: totalPoints > 0, totalPoints };
}

/**
 * Get points summary for current user
 */
export async function getPointsSummary(): Promise<PointsSummary | null> {
  const { data, error } = await supabase.rpc('get_points_summary');

  if (error) {
    console.error('Error getting points summary:', error);
    return null;
  }

  return data as PointsSummary;
}

/**
 * Check and award streak bonus (call on app open or weekly)
 */
export async function checkStreakBonus(): Promise<{ awarded: boolean; points: number }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { awarded: false, points: 0 };
  }

  const { data, error } = await supabase.rpc('check_streak_bonus', {
    p_user_id: userData.user.id,
  });

  if (error) {
    console.error('Error checking streak bonus:', error);
    return { awarded: false, points: 0 };
  }

  const points = data as number;
  if (points > 0) {
    emitPointsAwarded(points, 'streak_bonus');
  }

  return { awarded: points > 0, points };
}

/**
 * Get user's leaderboard position
 */
export async function getLeaderboard(limit: number = 10): Promise<Array<{
  user_id: string;
  display_name: string;
  avatar_config: any;
  total_points: number;
  rank: number;
}>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_config, total_points')
    .order('total_points', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }

  return (data || []).map((p, index) => ({
    user_id: p.id,
    display_name: p.display_name || 'Anonymous',
    avatar_config: p.avatar_config,
    total_points: p.total_points || 0,
    rank: index + 1,
  }));
}
