/**
 * Fireside service - handles Lowdown/Fireside operations
 */

import { supabase } from '../supabase';

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
  response: {
    id: string;
    content: string;
  } | null;
  votes: number;
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
  points_answering: number;
  points_voting: number;
  points_quiplash_wins: number;
  total_points: number;
}

export interface WeeklyWinner {
  user_id: string;
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
  content: string;
  created_at: string;
}

/**
 * Check if Fireside is currently unlocked (Sunday 9pm ET to Monday 3am ET)
 */
export function isFiresideUnlocked(): boolean {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find(p => p.type === 'weekday')?.value;
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);

  // Sunday 9pm ET (21:00) or later, OR Monday before 3am
  if (weekday === 'Sun' && hour >= 21) return true;
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

  return data as FiresideComment;
}

/**
 * Get comments for a response
 */
export async function getComments(responseId: string): Promise<FiresideComment[]> {
  const { data, error } = await supabase
    .from('fireside_comments')
    .select('*')
    .eq('response_id', responseId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error getting comments:', error);
    return [];
  }

  return (data as FiresideComment[]) || [];
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
  if (!url) return null;

  try {
    // If it's already a public URL, just return it as-is
    if (url.includes('/storage/v1/object/public/')) {
      return url;
    }

    // If it's a signed URL that might still be valid, return it
    if (url.includes('/storage/v1/object/sign/')) {
      return url;
    }

    // Extract path if needed
    let storagePath = url;

    if (url.includes('/uploads/')) {
      storagePath = url.split('/uploads/')[1]?.split('?')[0] || url;
    } else if (url.startsWith('http')) {
      // Unknown URL format - try to use as-is
      return url;
    }
    // else: Already just a path

    // Decode any URL-encoded characters
    storagePath = decodeURIComponent(storagePath);

    // First try to get public URL
    const { data: publicData } = supabase.storage
      .from('uploads')
      .getPublicUrl(storagePath);

    if (publicData?.publicUrl) {
      return publicData.publicUrl;
    }

    // Fallback to signed URL
    const { data, error } = await supabase.storage
      .from('uploads')
      .createSignedUrl(storagePath, 60 * 60 * 24);

    if (error || !data?.signedUrl) {
      console.error('Error creating signed URL:', error, 'for path:', storagePath);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error('Error in getSignedImageUrl:', err);
    return null;
  }
}
