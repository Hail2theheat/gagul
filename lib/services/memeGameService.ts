/**
 * Meme Game service - handles "What do you Meme" 3-day game operations
 */

import { supabase } from '../supabase';
import { uploadPhoto } from './promptService';
import type { MemeGameState, MemeVotingData, MemeResults } from '../types/prompts';

/**
 * Get current meme game status for a group
 */
export async function getMemeGameStatus(groupId: string): Promise<MemeGameState | null> {
  const { data, error } = await supabase.rpc('get_meme_game_status', {
    p_group_id: groupId,
  });

  if (error) {
    console.error('Error getting meme game status:', error);
    return null;
  }

  return data as MemeGameState | null;
}

/**
 * Submit meme photo + caption (Day 1 - uploader only)
 */
export async function submitMemePhoto(
  groupId: string,
  photoUri: string,
  caption: string
): Promise<{ success: boolean; error?: string }> {
  // Upload photo to Supabase Storage
  const uploadResult = await uploadPhoto(groupId, 'meme-game', photoUri);
  if (uploadResult.error || !uploadResult.url) {
    return { success: false, error: uploadResult.error || 'Failed to upload photo' };
  }

  const { data, error } = await supabase.rpc('submit_meme_photo', {
    p_group_id: groupId,
    p_photo_url: uploadResult.url,
    p_caption: caption,
  });

  if (error) {
    console.error('Error submitting meme photo:', error);
    return { success: false, error: error.message };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return { success: true };
}

/**
 * Get voting data for meme game (Day 3)
 */
export async function getMemeVotingData(groupId: string): Promise<MemeVotingData | null> {
  const { data, error } = await supabase.rpc('get_meme_voting_data', {
    p_group_id: groupId,
  });

  if (error) {
    console.error('Error getting meme voting data:', error);
    return null;
  }

  return data as MemeVotingData | null;
}

/**
 * Submit a vote for a meme caption (reuses caption_votes table)
 */
export async function submitMemeVote(
  captionGroupPromptId: string,
  responseId: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('submit_caption_vote', {
    p_group_prompt_id: captionGroupPromptId,
    p_response_id: responseId,
  });

  if (error) {
    console.error('Error submitting meme vote:', error);
    return { success: false, error: error.message };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return { success: true };
}

/**
 * Get meme results for fireside display
 */
export async function getMemeResults(
  groupId: string,
  weekOf?: string
): Promise<MemeResults | null> {
  const { data, error } = await supabase.rpc('get_meme_results', {
    p_group_id: groupId,
    p_week_of: weekOf || null,
  });

  if (error) {
    console.error('Error getting meme results:', error);
    return null;
  }

  return data as MemeResults | null;
}
