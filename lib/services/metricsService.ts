/**
 * Metrics Service - tracks user interactions for analytics
 * Used to determine "best" prompts and responses for Wrapped
 */

import { supabase } from '../supabase';

export type EventType = 'view' | 'view_end' | 'reaction' | 'comment' | 'tap' | 'share';

export interface ResponseStats {
  view_count: number;
  total_view_time_ms: number;
  avg_view_time_ms: number;
  reaction_count: number;
  comment_count: number;
}

/**
 * Track an interaction event
 */
export async function trackInteraction(
  eventType: EventType,
  options?: {
    responseId?: string;
    groupPromptId?: string;
    durationMs?: number;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    await supabase.rpc('track_interaction', {
      p_event_type: eventType,
      p_response_id: options?.responseId || null,
      p_group_prompt_id: options?.groupPromptId || null,
      p_duration_ms: options?.durationMs || null,
      p_metadata: options?.metadata || null,
    });
  } catch (error) {
    // Silently fail - metrics shouldn't break the app
    console.debug('Metrics tracking error:', error);
  }
}

/**
 * Track when user starts viewing a response
 */
export function trackViewStart(responseId: string): number {
  trackInteraction('view', { responseId });
  return Date.now();
}

/**
 * Track when user stops viewing a response
 */
export function trackViewEnd(responseId: string, startTime: number): void {
  const durationMs = Date.now() - startTime;
  trackInteraction('view_end', { responseId, durationMs });
}

/**
 * Get stats for a response
 */
export async function getResponseStats(responseId: string): Promise<ResponseStats | null> {
  const { data, error } = await supabase.rpc('get_response_stats', {
    p_response_id: responseId,
  });

  if (error) {
    console.error('Error getting response stats:', error);
    return null;
  }

  return data as ResponseStats;
}

/**
 * Create a view tracker that automatically tracks start and end
 */
export function createViewTracker(responseId: string) {
  let startTime: number | null = null;

  return {
    start: () => {
      startTime = trackViewStart(responseId);
    },
    end: () => {
      if (startTime) {
        trackViewEnd(responseId, startTime);
        startTime = null;
      }
    },
  };
}

/**
 * Hook-friendly view tracking
 * Returns functions to start and stop tracking
 */
export function useViewTracking(responseId: string | null) {
  let startTime: number | null = null;

  const startTracking = () => {
    if (responseId && !startTime) {
      startTime = trackViewStart(responseId);
    }
  };

  const stopTracking = () => {
    if (responseId && startTime) {
      trackViewEnd(responseId, startTime);
      startTime = null;
    }
  };

  return { startTracking, stopTracking };
}
