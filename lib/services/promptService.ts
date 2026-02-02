/**
 * Prompt service - handles all prompt-related operations
 */

import { supabase } from '../supabase';
import type {
  GroupStatus,
  ResponseSubmission,
  ValidationResult,
  PromptType,
  MultipleChoiceResults,
  VoterInfo,
  MajorityGuessingResults,
} from '../types/prompts';
import { validateResponse } from '../types/prompts';

/**
 * Fetch the current group status including active prompt
 */
export async function getGroupStatus(groupId: string): Promise<GroupStatus | null> {
  const { data, error } = await supabase.rpc('get_group_status', {
    p_group_id: groupId,
  });

  if (error) {
    console.error('Error fetching group status:', error);
    return null;
  }

  return data as GroupStatus;
}

/**
 * Submit a response to a prompt
 */
export async function submitResponse(
  submission: ResponseSubmission
): Promise<{ success: boolean; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { groupPromptId, content, mediaUrl, selectedOption } = submission;

  const { error } = await supabase.from('responses').insert({
    user_id: userData.user.id,
    group_prompt_id: groupPromptId,
    content: content || null,
    media_url: mediaUrl || null,
    selected_option: selectedOption || null,
    submitted_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Error submitting response:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Upload a photo to Supabase Storage
 */
export async function uploadPhoto(
  groupId: string,
  groupPromptId: string,
  photoUri: string
): Promise<{ url: string | null; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { url: null, error: 'Not authenticated' };
  }

  try {
    // Fetch the photo as a blob
    const response = await fetch(photoUri);
    const blob = await response.blob();

    // Determine content type from blob or default to jpeg
    const contentType = blob.type || 'image/jpeg';
    const ext = contentType.split('/')[1] || 'jpg';
    const fileName = `${groupId}/${groupPromptId}/${userData.user.id}_${Date.now()}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, blob, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { url: null, error: uploadError.message };
    }

    // Store just the file path - we'll generate signed URLs on demand when displaying
    return { url: fileName };
  } catch (err) {
    console.error('Photo upload failed:', err);
    return { url: null, error: 'Failed to upload photo' };
  }
}

/**
 * Submit a rating for a prompt (thumbs up/down)
 */
export async function submitRating(
  promptId: string,
  rating: boolean
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc('submit_prompt_rating', {
    p_prompt_id: promptId,
    p_rating: rating,
  });

  if (error) {
    console.error('Error submitting rating:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Calculate time remaining until expiration
 */
export function getTimeRemaining(expiresAt: string): {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  expired: boolean;
} {
  const now = new Date().getTime();
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - now;

  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, expired: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds, totalSeconds, expired: false };
}

/**
 * Check if a prompt has expired
 */
export function isPromptExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now();
}

/**
 * Format time remaining as a string
 */
export function formatTimeRemaining(expiresAt: string): string {
  const { hours, minutes, seconds, expired } = getTimeRemaining(expiresAt);

  if (expired) {
    return 'Expired';
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Validate response before submission
 */
export function validateSubmission(
  type: PromptType,
  content?: string,
  mediaUrl?: string,
  selectedOption?: string
): ValidationResult {
  return validateResponse(type, content, mediaUrl, selectedOption);
}

/**
 * Submit response with validation
 */
export async function submitResponseWithValidation(
  type: PromptType,
  submission: ResponseSubmission
): Promise<{ success: boolean; error?: string }> {
  // Validate first
  const validation = validateResponse(
    type,
    submission.content,
    submission.mediaUrl,
    submission.selectedOption
  );

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Submit
  return submitResponse(submission);
}

/**
 * Get aggregated results for a multiple choice or quiz prompt
 * Returns vote counts, percentages, and majority winner
 */
export async function getMultipleChoiceResults(
  groupPromptId: string
): Promise<MultipleChoiceResults | null> {
  const { data, error } = await supabase.rpc('get_multiple_choice_results', {
    p_group_prompt_id: groupPromptId,
  });

  if (error) {
    console.error('Error getting MC results:', error);
    return null;
  }

  return data as MultipleChoiceResults;
}

/**
 * Get individual voters for a multiple choice prompt
 * Shows who voted for what option
 */
export async function getMultipleChoiceVoters(
  groupPromptId: string
): Promise<VoterInfo[]> {
  const { data, error } = await supabase.rpc('get_multiple_choice_voters', {
    p_group_prompt_id: groupPromptId,
  });

  if (error) {
    console.error('Error getting voters:', error);
    return [];
  }

  return (data as VoterInfo[]) || [];
}

/**
 * Get results for majority guessing game
 * Shows who guessed the majority correctly
 */
export async function getMajorityGuessingResults(
  groupPromptId: string
): Promise<MajorityGuessingResults | null> {
  const { data, error } = await supabase.rpc('get_majority_guessing_results', {
    p_group_prompt_id: groupPromptId,
  });

  if (error) {
    console.error('Error getting majority results:', error);
    return null;
  }

  return data as MajorityGuessingResults;
}

/**
 * Submit a response with a majority guess
 * Used for "guess what the majority will answer" prompts
 */
export async function submitResponseWithMajorityGuess(
  submission: ResponseSubmission & { guessedMajority: string }
): Promise<{ success: boolean; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { groupPromptId, content, mediaUrl, selectedOption, guessedMajority } = submission;

  const { error } = await supabase.from('responses').insert({
    user_id: userData.user.id,
    group_prompt_id: groupPromptId,
    content: content || null,
    media_url: mediaUrl || null,
    selected_option: selectedOption || null,
    guessed_majority: guessedMajority,
    submitted_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Error submitting response:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
