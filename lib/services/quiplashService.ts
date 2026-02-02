/**
 * Quiplash service - handles quiplash-specific operations
 */

import { supabase } from '../supabase';

export interface QuiplashAssignment {
  has_assignment: boolean;
  group_prompt_id?: string;
  matchup_id?: string;
  expires_at?: string;
  has_responded?: boolean;
  prompt?: {
    id: string;
    type: string;
    content: string;
    title: string;
    category?: string;
  };
}

export interface QuiplashMatchup {
  matchup_id: string;
  prompt_content: string;
  prompt_title: string;
  responses: {
    response_id: string;
    content: string;
    user_id: string;
  }[];
  can_vote: boolean;
  has_voted: boolean;
  voted_for?: string;
}

/**
 * Assign quiplash prompts to all members of a group
 */
export async function assignQuiplashPrompts(
  groupId: string,
  weekOf?: string
): Promise<{ success: boolean; error?: string; data?: any }> {
  const { data, error } = await supabase.rpc('assign_quiplash_prompts', {
    p_group_id: groupId,
    p_week_of: weekOf || null,
  });

  if (error) {
    console.error('Error assigning quiplash prompts:', error);
    return { success: false, error: error.message };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return { success: true, data };
}

/**
 * Get the current user's quiplash assignment for a group
 */
export async function getMyQuiplash(groupId: string): Promise<QuiplashAssignment | null> {
  const { data, error } = await supabase.rpc('get_my_quiplash', {
    p_group_id: groupId,
  });

  if (error) {
    console.error('Error getting quiplash assignment:', error);
    return null;
  }

  return data as QuiplashAssignment;
}

/**
 * Get all quiplash matchups for a group (for Lowdown voting)
 */
export async function getQuiplashMatchups(groupId: string): Promise<QuiplashMatchup[]> {
  const { data, error } = await supabase.rpc('get_quiplash_matchups', {
    p_group_id: groupId,
  });

  if (error) {
    console.error('Error getting quiplash matchups:', error);
    return [];
  }

  return (data as QuiplashMatchup[]) || [];
}

/**
 * Submit a vote for a quiplash matchup
 */
export async function submitQuiplashVote(
  matchupId: string,
  responseId: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('submit_quiplash_vote', {
    p_matchup_id: matchupId,
    p_response_id: responseId,
  });

  if (error) {
    console.error('Error submitting quiplash vote:', error);
    return { success: false, error: error.message };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return { success: true };
}

/**
 * Get vote counts for a matchup
 */
export async function getMatchupVoteCounts(
  matchupId: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('quiplash_votes')
    .select('voted_for_response_id')
    .eq('matchup_id', matchupId);

  if (error) {
    console.error('Error getting vote counts:', error);
    return {};
  }

  const counts: Record<string, number> = {};
  for (const vote of data || []) {
    const id = vote.voted_for_response_id;
    counts[id] = (counts[id] || 0) + 1;
  }

  return counts;
}
