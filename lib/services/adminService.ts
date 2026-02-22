/**
 * Admin service — schedule viewing, response browsing, prompt management
 */

import { supabase } from '../supabase';

// App admin user IDs (Stevo)
const APP_ADMIN_IDS = ['88a0c11a-fc1b-4d2e-8618-be871af2f5d9'];

export function isAppAdmin(userId: string | null): boolean {
  return !!userId && APP_ADMIN_IDS.includes(userId);
}

/** Compute the Monday week_of date for any given date */
export function getWeekOf(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

export interface AdminGroupPrompt {
  id: string;
  group_id: string;
  prompt_id: string;
  scheduled_for: string;
  expires_at: string;
  week_of: string;
  is_active: boolean;
  prompt: {
    id: string;
    type: string;
    content: string;
    title: string;
    category: string | null;
    options: string[] | null;
    correct_answer: string | null;
  } | null;
  response_count: number;
  // Quiplash-specific counts
  quiplash_assigned?: number;   // total players assigned
  quiplash_answered?: number;   // players who submitted an answer
  quiplash_vote_count?: number; // unique voters across all matchups
}

/** Fetch the week's schedule for a group with response counts.
 *  Uses scheduled_for date range (Mon-Sun) instead of exact week_of match,
 *  because some prompts have inconsistent week_of values (off by a day). */
export async function getWeekSchedule(
  groupId: string,
  weekOf: string
): Promise<AdminGroupPrompt[]> {
  // Build Mon 00:00 to Sun 23:59 range from the weekOf Monday date
  const mondayStart = weekOf + 'T00:00:00';
  const sunday = new Date(weekOf + 'T12:00:00');
  sunday.setDate(sunday.getDate() + 6);
  const sundayEnd = sunday.toISOString().split('T')[0] + 'T23:59:59';

  // Get group_prompts scheduled within this week's date range
  const { data: gps, error } = await supabase
    .from('group_prompts')
    .select(`
      id, group_id, prompt_id, scheduled_for, expires_at, week_of, is_active,
      prompts!inner(id, type, content, title, category, options, correct_answer)
    `)
    .eq('group_id', groupId)
    .gte('scheduled_for', mondayStart)
    .lte('scheduled_for', sundayEnd)
    .order('scheduled_for', { ascending: true });

  if (error) {
    console.error('Error fetching week schedule:', error);
    return [];
  }

  if (!gps || gps.length === 0) return [];

  // Get response counts for all group_prompt_ids
  const gpIds = gps.map((gp: any) => gp.id);
  const { data: responses } = await supabase
    .from('responses')
    .select('group_prompt_id')
    .in('group_prompt_id', gpIds);

  const countMap: Record<string, number> = {};
  for (const r of responses || []) {
    countMap[r.group_prompt_id] = (countMap[r.group_prompt_id] || 0) + 1;
  }

  // For quiplash prompts: answers are in the responses table (same as other types).
  // Votes are in quiplash_votes, linked via voted_for_response_id.
  // Each quiplash prompt has 2 answerers; everyone else votes.
  const quiplashGpIds = gps
    .filter((gp: any) => gp.prompts?.type === 'quiplash')
    .map((gp: any) => gp.id);

  // Get response IDs for quiplash prompts (to look up votes)
  const quiplashResponseIds: Record<string, string[]> = {}; // gpId -> response ids
  if (quiplashGpIds.length > 0) {
    const { data: qResps } = await supabase
      .from('responses')
      .select('id, group_prompt_id')
      .in('group_prompt_id', quiplashGpIds);

    for (const r of qResps || []) {
      if (!quiplashResponseIds[r.group_prompt_id]) quiplashResponseIds[r.group_prompt_id] = [];
      quiplashResponseIds[r.group_prompt_id].push(r.id);
    }
  }

  // Get vote counts by looking up quiplash_votes for those response IDs
  const allRespIds = Object.values(quiplashResponseIds).flat();
  const quiplashVoteCounts: Record<string, Set<string>> = {}; // gpId -> unique voter_ids
  if (allRespIds.length > 0) {
    const { data: votes } = await supabase
      .from('quiplash_votes')
      .select('voted_for_response_id, voter_id')
      .in('voted_for_response_id', allRespIds);

    // Map response_id back to group_prompt_id
    const respToGpId: Record<string, string> = {};
    for (const [gpId, rIds] of Object.entries(quiplashResponseIds)) {
      for (const rId of rIds) respToGpId[rId] = gpId;
    }

    for (const v of votes || []) {
      const gpId = respToGpId[v.voted_for_response_id];
      if (gpId) {
        if (!quiplashVoteCounts[gpId]) quiplashVoteCounts[gpId] = new Set();
        quiplashVoteCounts[gpId].add(v.voter_id);
      }
    }
  }

  return gps.map((gp: any) => {
    const isQuiplash = gp.prompts?.type === 'quiplash';
    const answerCount = countMap[gp.id] || 0;
    return {
      id: gp.id,
      group_id: gp.group_id,
      prompt_id: gp.prompt_id,
      scheduled_for: gp.scheduled_for,
      expires_at: gp.expires_at,
      week_of: gp.week_of,
      is_active: gp.is_active,
      prompt: gp.prompts,
      response_count: answerCount,
      ...(isQuiplash && {
        quiplash_assigned: answerCount,  // number of people who answered
        quiplash_answered: answerCount,
        quiplash_vote_count: quiplashVoteCounts[gp.id]?.size || 0,
      }),
    };
  });
}

export interface AdminResponse {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  selected_option: string | null;
  submitted_at: string;
  username: string;
  avatar_config: Record<string, unknown> | null;
}

/** Fetch all responses for a group_prompt with user profiles */
export async function getPromptResponses(
  groupPromptId: string,
  promptType?: string
): Promise<AdminResponse[]> {
  // All prompt types (including quiplash) store answers in the responses table
  const { data, error } = await supabase
    .from('responses')
    .select('id, user_id, content, media_url, selected_option, submitted_at')
    .eq('group_prompt_id', groupPromptId)
    .order('submitted_at', { ascending: true });

  if (error) {
    console.error('Error fetching prompt responses:', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Fetch profiles separately
  const userIds = data.map((r: any) => r.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_config')
    .in('id', userIds);

  const profileMap: Record<string, any> = {};
  for (const p of profiles || []) {
    profileMap[p.id] = p;
  }

  return data.map((r: any) => ({
    ...r,
    username: profileMap[r.user_id]?.username || '???',
    avatar_config: profileMap[r.user_id]?.avatar_config || null,
  }));
}

/** Get total member count for a group */
export async function getGroupMemberCount(groupId: string): Promise<number> {
  const { count, error } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId);

  if (error) {
    console.error('Error fetching member count:', error);
    return 0;
  }

  return count || 0;
}

/** Deactivate a group_prompt via RPC */
export async function deactivateGroupPrompt(
  groupPromptId: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('admin_deactivate_prompt', {
    p_group_prompt_id: groupPromptId,
  });

  if (error) {
    console.error('Error deactivating prompt:', error);
    return { success: false, error: error.message };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return { success: true };
}
