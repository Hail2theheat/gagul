/**
 * Scheduling Service - for managing daily prompt scheduling
 */

import { supabase } from '../supabase';

/**
 * Schedule today's prompt for a specific group
 */
export async function scheduleGroupPrompt(groupId: string) {
  const { data, error } = await supabase.rpc('schedule_daily_prompt', {
    p_group_id: groupId,
  });

  if (error) {
    console.error('Failed to schedule prompt:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Schedule today's prompts for ALL groups
 */
export async function scheduleAllGroups() {
  const { data, error } = await supabase.rpc('schedule_all_groups');

  if (error) {
    console.error('Failed to schedule all groups:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Get current schedule state for a group
 */
export async function getScheduleState(groupId: string) {
  const { data, error } = await supabase
    .from('group_schedule_state')
    .select('*')
    .eq('group_id', groupId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Add multiple prompts from an array
 * Useful for importing from CSV
 */
export async function addPrompts(prompts: {
  type: 'short_text' | 'long_text' | 'photo' | 'multiple_choice' | 'quiplash';
  content: string;
  title: string;
  category: 'text' | 'text_silly' | 'multiple_choice' | 'photo' | 'quiplash';
  options?: string[]; // For multiple_choice
  is_most_likely?: boolean;
}[]) {
  const { data, error } = await supabase
    .from('prompts')
    .insert(prompts.map(p => ({
      ...p,
      is_active: true,
      options: p.options ? JSON.stringify(p.options) : null,
    })))
    .select();

  if (error) {
    console.error('Failed to add prompts:', error);
    return { success: false, error: error.message };
  }

  return { success: true, count: data?.length || 0 };
}

/**
 * Get all prompts grouped by category
 */
export async function getPromptsByCategory() {
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .order('times_used', { ascending: true });

  if (error) {
    console.error('Failed to get prompts:', error);
    return null;
  }

  // Group by category
  const grouped: Record<string, typeof data> = {};
  for (const prompt of data || []) {
    const cat = prompt.category || 'uncategorized';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(prompt);
  }

  return grouped;
}

/**
 * Delete a prompt by ID
 */
export async function deletePrompt(promptId: string) {
  const { error } = await supabase
    .from('prompts')
    .delete()
    .eq('id', promptId);

  if (error) {
    console.error('Failed to delete prompt:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Update a prompt
 */
export async function updatePrompt(promptId: string, updates: {
  content?: string;
  title?: string;
  category?: string;
  options?: string[];
  is_most_likely?: boolean;
  is_active?: boolean;
}) {
  const { error } = await supabase
    .from('prompts')
    .update({
      ...updates,
      options: updates.options ? JSON.stringify(updates.options) : undefined,
    })
    .eq('id', promptId);

  if (error) {
    console.error('Failed to update prompt:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
