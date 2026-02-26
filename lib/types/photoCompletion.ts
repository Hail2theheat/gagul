/**
 * Types for the Photo Completion game
 */

export interface PhotoCompletionState {
  id: string;
  group_id: string;
  week_of: string;
  phase: 'submit_cutoff' | 'submit_completion' | 'complete';
  cutoff_group_prompt_id: string | null;
  completion_group_prompt_id: string | null;
  has_submitted: boolean;
  assigned_photo_url: string | null;
  assigned_username: string | null;
}

export interface PhotoCompletionPair {
  assignment_id: string;
  original_user_id: string;
  original_username: string;
  original_avatar: Record<string, unknown> | null;
  completer_user_id: string;
  completer_username: string;
  completer_avatar: Record<string, unknown> | null;
  original_photo_url: string | null;
  completion_photo_url: string | null;
  merged_photo_url: string | null;
}

export interface PhotoCompletionResults {
  game_id: string;
  phase: string;
  pairs: PhotoCompletionPair[];
}
