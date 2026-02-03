/**
 * Reaction Service - handles emoji reactions on Fireside responses
 */

import { supabase } from '../supabase';

export interface ReactionSummary {
  emoji: string;
  count: number;
  users: { user_id: string }[];
}

export interface UserEmojis {
  emoji_slot_1: string;
  emoji_slot_2: string;
  emoji_slot_3: string;
  emoji_slot_4: string;
}

export const DEFAULT_EMOJIS: UserEmojis = {
  emoji_slot_1: '❤️',
  emoji_slot_2: '😂',
  emoji_slot_3: '🔥',
  emoji_slot_4: '😮',
};

/**
 * Get reactions for a response
 */
export async function getResponseReactions(responseId: string): Promise<ReactionSummary[]> {
  const { data, error } = await supabase.rpc('get_response_reactions', {
    p_response_id: responseId,
  });

  if (error) {
    console.error('Error getting reactions:', error);
    return [];
  }

  return (data as ReactionSummary[]) || [];
}

/**
 * Toggle a reaction on a response
 */
export async function toggleReaction(
  responseId: string,
  emoji: string
): Promise<{ action: 'added' | 'removed'; emoji?: string }> {
  const { data, error } = await supabase.rpc('toggle_reaction', {
    p_response_id: responseId,
    p_emoji: emoji,
  });

  if (error) {
    console.error('Error toggling reaction:', error);
    return { action: 'removed' };
  }

  return data as { action: 'added' | 'removed'; emoji?: string };
}

/**
 * Get user's emoji preferences
 */
export async function getUserEmojis(): Promise<UserEmojis> {
  const { data, error } = await supabase.rpc('get_user_emojis');

  if (error) {
    console.error('Error getting user emojis:', error);
    return DEFAULT_EMOJIS;
  }

  return (data as UserEmojis) || DEFAULT_EMOJIS;
}

/**
 * Update user's emoji preferences
 */
export async function updateUserEmojis(emojis: Partial<UserEmojis>): Promise<UserEmojis> {
  const { data, error } = await supabase.rpc('update_user_emojis', {
    p_slot_1: emojis.emoji_slot_1 || null,
    p_slot_2: emojis.emoji_slot_2 || null,
    p_slot_3: emojis.emoji_slot_3 || null,
    p_slot_4: emojis.emoji_slot_4 || null,
  });

  if (error) {
    console.error('Error updating user emojis:', error);
    return DEFAULT_EMOJIS;
  }

  return (data as UserEmojis) || DEFAULT_EMOJIS;
}

/**
 * Get user's current reaction on a response (if any)
 */
export async function getUserReaction(responseId: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('response_reactions')
    .select('emoji')
    .eq('response_id', responseId)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return null;
  return data.emoji;
}

/**
 * Subscribe to reaction changes for a response
 */
export function subscribeToReactions(
  responseId: string,
  callback: (reactions: ReactionSummary[]) => void
): () => void {
  const channel = supabase
    .channel(`reactions:${responseId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'response_reactions',
        filter: `response_id=eq.${responseId}`,
      },
      async () => {
        // Refetch all reactions when any change happens
        const reactions = await getResponseReactions(responseId);
        callback(reactions);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
