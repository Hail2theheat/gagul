/**
 * Telephone Game service - handles telephone game operations
 */

import { supabase } from '../supabase';

export interface TelephoneAssignment {
  has_assignment: boolean;
  step_id?: string;
  chain_id?: string;
  step_number?: number;
  step_type?: 'draw' | 'write';
  initial_prompt?: string; // For step 1 only
  previous_content?: string; // For write steps (previous drawing description)
  previous_drawing_url?: string; // For draw steps (previous drawing to interpret)
}

export interface TelephoneStep {
  step_number: number;
  step_type: 'draw' | 'write';
  user_id: string;
  username?: string;
  avatar_config?: any;
  content?: string;
  drawing_url?: string;
  submitted_at?: string;
}

export interface TelephoneChain {
  chain_id: string;
  initial_prompt: string;
  is_complete: boolean;
  steps: TelephoneStep[];
}

/**
 * Get user's current telephone assignment for a group
 */
export async function getMyTelephone(groupId: string): Promise<TelephoneAssignment | null> {
  const { data, error } = await supabase.rpc('get_my_telephone', {
    p_group_id: groupId,
  });

  if (error) {
    console.error('Error getting telephone assignment:', error);
    return null;
  }

  return data as TelephoneAssignment;
}

/**
 * Submit a telephone step (draw or write)
 */
export async function submitTelephoneStep(
  stepId: string,
  content?: string,
  drawingUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('submit_telephone_step', {
    p_step_id: stepId,
    p_content: content || null,
    p_drawing_url: drawingUrl || null,
  });

  if (error) {
    console.error('Error submitting telephone step:', error);
    return { success: false, error: error.message };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return { success: true };
}

/**
 * Get completed telephone chains for Fireside reveal
 */
export async function getTelephoneChains(
  groupId: string,
  weekOf?: string
): Promise<TelephoneChain[]> {
  const { data, error } = await supabase.rpc('get_telephone_chains', {
    p_group_id: groupId,
    p_week_of: weekOf || null,
  });

  if (error) {
    console.error('Error getting telephone chains:', error);
    return [];
  }

  return (data as TelephoneChain[]) || [];
}

/**
 * Setup telephone game for a group (admin function)
 */
export async function setupTelephoneGame(
  groupId: string,
  weekOf?: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('setup_telephone_game', {
    p_group_id: groupId,
    p_week_of: weekOf || null,
  });

  if (error) {
    console.error('Error setting up telephone game:', error);
    return { success: false, error: error.message };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return { success: true };
}
