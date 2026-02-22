/**
 * Caption service - handles photo caption game operations
 */

import { supabase } from '../supabase';
import type { CaptionVotingPrompt, CaptionResult } from '../types/prompts';

export async function getCaptionVotingData(
  groupId: string
): Promise<CaptionVotingPrompt[]> {
  const { data, error } = await supabase.rpc('get_caption_voting_data', {
    p_group_id: groupId,
  });
  if (error) {
    console.error('Error getting caption voting data:', error);
    return [];
  }
  return (data as CaptionVotingPrompt[]) || [];
}

export async function submitCaptionVote(
  groupPromptId: string,
  responseId: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('submit_caption_vote', {
    p_group_prompt_id: groupPromptId,
    p_response_id: responseId,
  });
  if (error) {
    console.error('Error submitting caption vote:', error);
    return { success: false, error: error.message };
  }
  if (data?.error) {
    return { success: false, error: data.error };
  }
  return { success: true };
}

export async function getCaptionResults(
  groupPromptId: string
): Promise<CaptionResult[]> {
  const { data, error } = await supabase.rpc('get_caption_results', {
    p_group_prompt_id: groupPromptId,
  });
  if (error) {
    console.error('Error getting caption results:', error);
    return [];
  }
  return (data as CaptionResult[]) || [];
}
