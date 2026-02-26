/**
 * Photo Completion Game service - handles the 2-phase photo completion game
 * Phase 1: Users submit cutoff photos
 * Phase 2: Users complete another user's cutoff photo
 */

import { supabase } from '../supabase';
import { uploadPhoto } from './promptService';
import type {
  PhotoCompletionState,
  PhotoCompletionResults,
} from '../types/photoCompletion';

/**
 * Get current photo completion game status for a group
 */
export async function getPhotoCompletionStatus(
  groupId: string
): Promise<PhotoCompletionState | null> {
  const { data, error } = await supabase.rpc('get_photo_completion_status', {
    p_group_id: groupId,
  });

  if (error) {
    console.error('Error getting photo completion status:', error);
    return null;
  }

  return data as PhotoCompletionState | null;
}

/**
 * Submit a cutoff photo (Phase 1)
 * The photo is submitted as a normal response on the cutoff_group_prompt_id,
 * then linked to the assignment
 */
export async function submitCutoffPhoto(
  groupId: string,
  groupPromptId: string,
  photoUri: string
): Promise<{ success: boolean; error?: string }> {
  // Upload photo
  const uploadResult = await uploadPhoto(groupId, groupPromptId, photoUri);
  if (uploadResult.error || !uploadResult.url) {
    return { success: false, error: uploadResult.error || 'Failed to upload photo' };
  }

  // Submit response on the cutoff group_prompt
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: response, error: respError } = await supabase
    .from('responses')
    .insert({
      group_prompt_id: groupPromptId,
      user_id: user.id,
      media_url: uploadResult.url,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (respError) {
    return { success: false, error: respError.message };
  }

  // Link the response to the assignment
  const { error: linkError } = await supabase
    .from('photo_completion_assignments')
    .update({ original_response_id: response.id })
    .eq('original_user_id', user.id)
    .is('original_response_id', null);

  if (linkError) {
    console.error('Error linking cutoff response:', linkError);
  }

  return { success: true };
}

/**
 * Submit a completion photo (Phase 2)
 */
export async function submitCompletionPhoto(
  groupId: string,
  groupPromptId: string,
  photoUri: string
): Promise<{ success: boolean; error?: string }> {
  // Upload photo
  const uploadResult = await uploadPhoto(groupId, groupPromptId, photoUri);
  if (uploadResult.error || !uploadResult.url) {
    return { success: false, error: uploadResult.error || 'Failed to upload photo' };
  }

  // Submit response on the completion group_prompt
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: response, error: respError } = await supabase
    .from('responses')
    .insert({
      group_prompt_id: groupPromptId,
      user_id: user.id,
      media_url: uploadResult.url,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (respError) {
    return { success: false, error: respError.message };
  }

  // Link the response to the assignment
  const { error: linkError } = await supabase
    .from('photo_completion_assignments')
    .update({ completion_response_id: response.id })
    .eq('completer_user_id', user.id)
    .is('completion_response_id', null);

  if (linkError) {
    console.error('Error linking completion response:', linkError);
  }

  return { success: true };
}

/**
 * Get photo completion results for fireside
 */
export async function getPhotoCompletionResults(
  groupId: string,
  weekOf?: string
): Promise<PhotoCompletionResults | null> {
  const { data, error } = await supabase.rpc('get_photo_completion_results', {
    p_group_id: groupId,
    p_week_of: weekOf || null,
  });

  if (error) {
    console.error('Error getting photo completion results:', error);
    return null;
  }

  return data as PhotoCompletionResults | null;
}
