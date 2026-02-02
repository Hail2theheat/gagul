/**
 * Unified types for the prompts system
 */

// The 6 prompt types supported
export type PromptType =
  | 'short_text'
  | 'long_text'
  | 'photo'
  | 'multiple_choice'
  | 'quiz'
  | 'quiplash';

// Word limits for text prompts
export const WORD_LIMITS = {
  short_text: { min: 1, max: 50 },
  long_text: { min: 40, max: 200 },
  quiplash: { min: 1, max: 50 },
} as const;

// Group member info for "Most Likely To..." prompts
export interface GroupMember {
  user_id: string;
  username: string;
  avatar_config: Record<string, unknown> | null;
}

// Main prompt record from database
export interface Prompt {
  id: string;
  type: PromptType;
  content: string;
  title: string;
  category?: string;
  options?: string[]; // For multiple_choice and quiz
  correct_answer?: string; // For quiz
  is_nsfw: boolean;
  is_user_generated: boolean;
  is_most_likely?: boolean; // Uses group members as options
  is_majority_guess?: boolean; // Users guess what majority will answer
  created_by?: string;
  thumbs_up: number;
  thumbs_down: number;
  times_used: number;
  is_active: boolean;
  payload?: Record<string, unknown>; // Legacy field
  created_at?: string;
}

// Group prompt instance (scheduled prompt for a group)
export interface GroupPrompt {
  id: string;
  group_id: string;
  prompt_id: string;
  scheduled_for: string;
  expires_at: string;
  week_of: string;
  is_active: boolean;
  created_at?: string;
  prompts?: Prompt; // Joined prompt data
  group_members?: GroupMember[]; // For "Most Likely To..." prompts
}

// User response to a prompt
export interface Response {
  id: string;
  user_id: string;
  group_prompt_id: string;
  content?: string;
  media_url?: string;
  selected_option?: string;
  submitted_at: string;
  created_at?: string;
}

// Response submission payload
export interface ResponseSubmission {
  groupPromptId: string;
  content?: string;
  mediaUrl?: string;
  selectedOption?: string;
}

// Prompt rating (thumbs up/down)
export interface PromptRating {
  id: string;
  prompt_id: string;
  user_id: string;
  rating: boolean; // true = thumbs up, false = thumbs down
  created_at?: string;
}

// Group status returned by get_group_status RPC
export interface GroupStatus {
  group_id: string;
  active_prompt_instance: GroupPrompt | null;
  active_expires_at: string | null;
  has_responded: boolean;
  has_rated: boolean;
  user_rating: boolean | null;
}

// Push token for notifications
export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform?: string;
  created_at?: string;
}

// Multiple choice result for a single option
export interface MultipleChoiceOptionResult {
  option: string;
  count: number;
  percentage: number;
  is_correct?: boolean; // For quiz type
  // For "Most Likely To" prompts
  user_id?: string;
  username?: string;
  avatar_config?: Record<string, unknown> | null;
}

// Full multiple choice results from RPC
export interface MultipleChoiceResults {
  group_prompt_id: string;
  prompt_type: PromptType;
  is_most_likely: boolean;
  total_responses: number;
  results: MultipleChoiceOptionResult[];
  majority_option: string | null;
  majority_count: number | null;
  correct_answer?: string; // For quiz type
}

// Individual voter info
export interface VoterInfo {
  user_id: string;
  username: string;
  avatar_config?: Record<string, unknown> | null;
  selected_option: string;
  submitted_at: string;
}

// Majority guessing game results
export interface MajorityGuessingResult {
  user_id: string;
  username: string;
  avatar_config?: Record<string, unknown> | null;
  guessed: string;
  actual_majority: string;
  was_correct: boolean;
}

export interface MajorityGuessingResults {
  group_prompt_id: string;
  majority_answer: string | null;
  guesses: MajorityGuessingResult[];
  correct_guessers: number;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Count words in a string
 */
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Validate a response based on prompt type
 */
export function validateResponse(
  type: PromptType,
  content?: string,
  mediaUrl?: string,
  selectedOption?: string
): ValidationResult {
  switch (type) {
    case 'short_text': {
      if (!content?.trim()) {
        return { valid: false, error: 'Please enter a response' };
      }
      const words = countWords(content);
      const { min, max } = WORD_LIMITS.short_text;
      if (words < min) {
        return { valid: false, error: `Please enter at least ${min} word` };
      }
      if (words > max) {
        return { valid: false, error: `Please keep it under ${max} words (currently ${words})` };
      }
      return { valid: true };
    }

    case 'long_text': {
      if (!content?.trim()) {
        return { valid: false, error: 'Please enter a response' };
      }
      const words = countWords(content);
      const { min, max } = WORD_LIMITS.long_text;
      if (words < min) {
        return { valid: false, error: `Please write at least ${min} words (currently ${words})` };
      }
      if (words > max) {
        return { valid: false, error: `Please keep it under ${max} words (currently ${words})` };
      }
      return { valid: true };
    }

    case 'photo': {
      if (!mediaUrl) {
        return { valid: false, error: 'Please select a photo' };
      }
      return { valid: true };
    }

    case 'multiple_choice':
    case 'quiz': {
      if (!selectedOption) {
        return { valid: false, error: 'Please select an option' };
      }
      return { valid: true };
    }

    case 'quiplash': {
      if (!content?.trim()) {
        return { valid: false, error: 'Please enter your answer' };
      }
      const words = countWords(content);
      const { min, max } = WORD_LIMITS.quiplash;
      if (words < min) {
        return { valid: false, error: `Please enter at least ${min} word` };
      }
      if (words > max) {
        return { valid: false, error: `Please keep it under ${max} words (currently ${words})` };
      }
      return { valid: true };
    }

    default:
      return { valid: false, error: 'Unknown prompt type' };
  }
}

/**
 * Get display name for prompt type
 */
export function getPromptTypeLabel(type: PromptType): string {
  const labels: Record<PromptType, string> = {
    short_text: 'Quick Response',
    long_text: 'Thoughtful Response',
    photo: 'Photo',
    multiple_choice: 'Multiple Choice',
    quiz: 'Quiz',
    quiplash: 'Quiplash',
  };
  return labels[type] || type;
}
