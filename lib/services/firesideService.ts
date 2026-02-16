/**
 * Fireside service - handles Lowdown/Fireside operations
 */

import { supabase } from '../supabase';
import { awardPoints, emitPointsAwarded } from './pointsService';

// Types
export interface FiresideResponse {
  response_id: string;
  user_id: string;
  username?: string;
  avatar_config?: Record<string, unknown> | null;
  content?: string;
  media_url?: string;
  selected_option?: string;
  submitted_at: string;
}

export interface MCResultOption {
  option: string;
  count: number;
  percentage: number;
  is_correct?: boolean;
  user_id?: string;
  username?: string;
  avatar_config?: Record<string, unknown> | null;
}

export interface MCResults {
  group_prompt_id: string;
  prompt_type: string;
  is_most_likely: boolean;
  total_responses: number;
  results: MCResultOption[];
  majority_option: string | null;
  majority_count: number | null;
  correct_answer?: string;
}

export interface QuiplashParticipant {
  matchup_id: string;
  user_id: string;
  username?: string;
  avatar_config?: Record<string, unknown> | null;
  response: {
    id: string;
    content: string;
  } | null;
  votes: number;
}

export interface QuiplashVoter {
  voter_id: string;
  voted_for_response_id: string;
  username: string;
  avatar_config: Record<string, unknown> | null;
}

export interface FiresidePrompt {
  group_prompt_id: string;
  scheduled_for: string;
  prompt_id: string;
  type: string;
  content: string;
  title: string;
  options?: string[];
  correct_answer?: string;
  is_most_likely?: boolean;
  responses: FiresideResponse[];
  quiplash_data?: QuiplashParticipant[];
  mc_results?: MCResults; // Multiple choice results with vote counts
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_config: any;
  points_answering: number;
  points_voting: number;
  points_quiplash_wins: number;
  total_points: number;
}

export interface WeeklyWinner {
  user_id: string;
  username?: string;
  avatar_config?: Record<string, unknown> | null;
  has_chosen: boolean;
  chosen_prompt_id?: string;
  custom_prompt_content?: string;
  prompt_choices?: {
    id: string;
    type: string;
    content: string;
    title: string;
  }[];
}

export interface FiresideData {
  week_of: string;
  prompts: FiresidePrompt[];
  leaderboard: LeaderboardEntry[];
  winner: WeeklyWinner | null;
}

export interface FiresideComment {
  id: string;
  response_id: string;
  user_id: string;
  username?: string;
  content: string;
  created_at: string;
  parent_comment_id?: string;
  reply_count?: number;
  replies?: FiresideComment[];
}

/**
 * Check if Fireside is currently unlocked (Sunday 8pm ET to Monday 3am ET)
 */
export function isFiresideUnlocked(): boolean {
  // DEV ONLY: bypass time gate for testing
  if (__DEV__) return true;

  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find(p => p.type === 'weekday')?.value;
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);

  // Sunday 8pm ET (20:00) or later, OR Monday before 3am
  if (weekday === 'Sun' && hour >= 20) return true;
  if (weekday === 'Mon' && hour < 3) return true;
  return false;
}

/**
 * Get all Fireside data for a group
 */
export async function getFiresideData(
  groupId: string,
  weekOf?: string
): Promise<FiresideData | null> {
  const { data, error } = await supabase.rpc('get_fireside_data', {
    p_group_id: groupId,
    p_week_of: weekOf || null,
  });

  if (error) {
    console.error('Error getting fireside data:', error);
    return null;
  }

  return data as FiresideData;
}

/**
 * Get weekly leaderboard
 */
export async function getWeeklyLeaderboard(
  groupId: string,
  weekOf?: string
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_weekly_leaderboard', {
    p_group_id: groupId,
    p_week_of: weekOf || null,
  });

  if (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }

  return (data as LeaderboardEntry[]) || [];
}

/**
 * Finalize the week - calculate winners, award points
 */
export async function finalizeWeek(
  groupId: string,
  weekOf?: string
): Promise<{ success: boolean; winner_user_id?: string; error?: string }> {
  const { data, error } = await supabase.rpc('finalize_week', {
    p_group_id: groupId,
    p_week_of: weekOf || null,
  });

  if (error) {
    console.error('Error finalizing week:', error);
    return { success: false, error: error.message };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return { success: true, winner_user_id: data?.winner_user_id };
}

/**
 * Winner chooses a prompt for next week
 */
export async function winnerChoosePrompt(
  groupId: string,
  weekOf: string,
  chosenPromptId?: string,
  customContent?: string,
  customType?: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('winner_choose_prompt', {
    p_group_id: groupId,
    p_week_of: weekOf,
    p_chosen_prompt_id: chosenPromptId || null,
    p_custom_content: customContent || null,
    p_custom_type: customType || null,
  });

  if (error) {
    console.error('Error choosing prompt:', error);
    return { success: false, error: error.message };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return { success: true };
}

/**
 * Add a comment to a response
 */
export async function addComment(
  responseId: string,
  content: string
): Promise<FiresideComment | null> {
  const { data, error } = await supabase.rpc('add_fireside_comment', {
    p_response_id: responseId,
    p_content: content,
  });

  if (error) {
    console.error('Error adding comment:', error);
    return null;
  }

  // Award 2 pts to commenter for participating
  awardPoints('comment').catch(() => {});

  return data as FiresideComment;
}

/**
 * Get comment counts for multiple responses at once
 */
export async function getCommentCounts(responseIds: string[]): Promise<Record<string, number>> {
  if (responseIds.length === 0) return {};

  const { data, error } = await supabase
    .from('fireside_comments')
    .select('response_id', { count: 'exact', head: false })
    .in('response_id', responseIds)
    .is('parent_comment_id', null);

  if (error) {
    console.error('Error getting comment counts:', error);
    return {};
  }

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    counts[row.response_id] = (counts[row.response_id] || 0) + 1;
  }
  return counts;
}

/**
 * Get prompt views for multiple group_prompt_ids
 * Returns a map of group_prompt_id -> set of user_ids who viewed it
 */
export async function getPromptViews(groupPromptIds: string[]): Promise<Record<string, string[]>> {
  if (groupPromptIds.length === 0) return {};

  const { data, error } = await supabase
    .from('prompt_views')
    .select('group_prompt_id, user_id')
    .in('group_prompt_id', groupPromptIds);

  if (error) {
    console.error('Error getting prompt views:', error);
    return {};
  }

  const views: Record<string, string[]> = {};
  for (const row of data || []) {
    if (!views[row.group_prompt_id]) views[row.group_prompt_id] = [];
    views[row.group_prompt_id].push(row.user_id);
  }
  return views;
}

/**
 * Update the current user's fireside progress as they click through
 */
export async function updateFiresideProgress(
  groupId: string,
  weekOf: string,
  promptIndex: number,
  totalPrompts: number,
  completed: boolean = false
): Promise<void> {
  const { error } = await supabase.rpc('update_fireside_progress', {
    p_group_id: groupId,
    p_week_of: weekOf,
    p_prompt_index: promptIndex,
    p_total_prompts: totalPrompts,
    p_completed: completed,
  });
  if (error) {
    console.error('Error updating fireside progress:', error);
  }
}

/**
 * Get all members' fireside viewing progress for a group/week
 * Returns: { user_id, status: 'completed' | 'partial' | 'not_started' }[]
 */
export async function getFiresideProgress(
  groupId: string,
  weekOf: string
): Promise<{ user_id: string; status: 'completed' | 'partial' | 'not_started' }[]> {
  const { data, error } = await supabase.rpc('get_fireside_progress', {
    p_group_id: groupId,
    p_week_of: weekOf,
  });

  if (error) {
    console.error('Error getting fireside progress:', error);
    return [];
  }

  return (data as { user_id: string; status: 'completed' | 'partial' | 'not_started' }[]) || [];
}

/**
 * Get comments for a response (flat list, no threading)
 */
export async function getComments(responseId: string): Promise<FiresideComment[]> {
  const { data, error } = await supabase
    .from('fireside_comments')
    .select(`
      *,
      profiles:user_id (username)
    `)
    .eq('response_id', responseId)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error getting comments:', error);
    return [];
  }

  // Map the profile data to the expected format
  const comments = (data || []).map((comment: any) => ({
    ...comment,
    username: comment.profiles?.username || undefined,
  }));

  return comments as FiresideComment[];
}

/**
 * Get comments with replies for a response (threaded)
 */
export async function getCommentsWithReplies(responseId: string): Promise<FiresideComment[]> {
  const { data, error } = await supabase.rpc('get_comments_with_replies', {
    p_response_id: responseId,
  });

  if (error) {
    console.error('Error getting threaded comments:', error);
    return [];
  }

  return (data as FiresideComment[]) || [];
}

/**
 * Add a reply to a comment
 */
export async function addCommentReply(
  parentCommentId: string,
  content: string
): Promise<{ success: boolean; comment_id?: string; error?: string }> {
  const { data, error } = await supabase.rpc('add_comment_reply', {
    p_parent_comment_id: parentCommentId,
    p_content: content,
  });

  if (error) {
    console.error('Error adding reply:', error);
    return { success: false, error: error.message };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return { success: true, comment_id: data?.comment_id };
}

/**
 * Subscribe to real-time comments for a response
 */
export function subscribeToComments(
  responseId: string,
  onComment: (comment: FiresideComment) => void
) {
  const channel = supabase
    .channel(`comments:${responseId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'fireside_comments',
        filter: `response_id=eq.${responseId}`,
      },
      (payload) => {
        onComment(payload.new as FiresideComment);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Get user display info (for showing names in leaderboard, etc.)
 */
export async function getUserProfiles(
  userIds: string[]
): Promise<Record<string, { email?: string }>> {
  if (userIds.length === 0) return {};

  // For now, we'll just return empty profiles
  // In the future, you'd have a profiles table
  const profiles: Record<string, { email?: string }> = {};
  for (const id of userIds) {
    profiles[id] = { email: undefined };
  }

  return profiles;
}

/**
 * Get a working URL for a storage path
 * Handles public URLs, signed URLs, and raw paths
 */
export async function getSignedImageUrl(url: string): Promise<string | null> {
  if (!url) {
    console.log('[getSignedImageUrl] No URL provided');
    return null;
  }

  console.log('[getSignedImageUrl] Input URL:', url);

  try {
    // If it's already a full Supabase public URL, return it
    if (url.includes('/storage/v1/object/public/')) {
      console.log('[getSignedImageUrl] Already public URL');
      return url;
    }

    // If it's a signed URL that might still be valid, return it
    if (url.includes('/storage/v1/object/sign/')) {
      console.log('[getSignedImageUrl] Already signed URL');
      return url;
    }

    // Extract path from URL
    let storagePath = url;

    // Handle full URLs with /uploads/ bucket
    if (url.includes('/uploads/')) {
      storagePath = url.split('/uploads/')[1]?.split('?')[0] || url;
    } else if (url.startsWith('http')) {
      // Unknown URL format - could be external, try as-is
      console.log('[getSignedImageUrl] External URL, using as-is');
      return url;
    }
    // else: Already just a path

    // Decode any URL-encoded characters
    storagePath = decodeURIComponent(storagePath);
    console.log('[getSignedImageUrl] Storage path:', storagePath);

    // Always create a fresh signed URL (more reliable than public URLs for private buckets)
    const { data, error } = await supabase.storage
      .from('uploads')
      .createSignedUrl(storagePath, 60 * 60); // 1 hour expiry

    if (error) {
      console.error('[getSignedImageUrl] Error creating signed URL:', error.message);
      // Try public URL as fallback
      const { data: publicData } = supabase.storage
        .from('uploads')
        .getPublicUrl(storagePath);

      if (publicData?.publicUrl) {
        console.log('[getSignedImageUrl] Using public URL fallback');
        return publicData.publicUrl;
      }
      return null;
    }

    console.log('[getSignedImageUrl] Created signed URL successfully');
    return data.signedUrl;
  } catch (err) {
    console.error('[getSignedImageUrl] Exception:', err);
    return null;
  }
}

/**
 * Get voter details for a quiplash matchup
 */
export async function getQuiplashVoters(matchupId: string): Promise<QuiplashVoter[]> {
  const { data, error } = await supabase.rpc('get_quiplash_voters', {
    p_matchup_id: matchupId,
  });

  if (error) {
    console.error('Error getting quiplash voters:', error);
    return [];
  }

  return (data as QuiplashVoter[]) || [];
}
