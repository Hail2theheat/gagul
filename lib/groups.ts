import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

/**
 * Fetches all groups the current user is a member of.
 * Fixes the "Missing ID" bug by flattening the joined Supabase response.
 */
export async function myGroups() {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    console.error("myGroups: No active session found");
    return [];
  }

  const { data, error } = await supabase
    .from('group_members')
    .select(`
      group_id,
      groups:groups (
        id,
        name,
        join_code,
        code,
        owner_id
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error("Error fetching myGroups:", error.message);
    return [];
  }

  // Flatten the response so the UI gets { id, name, ... } 
  // instead of { group_id, groups: { id, name } }
  return (data || [])
    .map((item: any) => item.groups)
    .filter((group) => group !== null);
}

/**
 * Creates a new group and automatically adds the creator as the first member.
 */
export async function createGroup(name: string) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) throw new Error("Must be logged in to create a group");

  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Insert group (satisfying both join_code and code columns)
  const { data: groupData, error: groupError } = await supabase
    .from('groups')
    .insert([
      { 
        name, 
        owner_id: userId, 
        join_code: joinCode, 
        code: joinCode 
      }
    ])
    .select()
    .single();

  if (groupError) throw groupError;

  // Add creator to group_members
  const { error: memberError } = await supabase
    .from('group_members')
    .insert([
      { group_id: groupData.id, user_id: userId }
    ]);

  if (memberError) throw memberError;

  return groupData;
}

/**
 * Joins an existing group using a join code.
 */
export async function joinGroup(code: string) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) throw new Error("Must be logged in to join a group");

  // Find the group by join_code or code
  const { data: groupData, error: findError } = await supabase
    .from('groups')
    .select('id')
    .or(`join_code.eq.${code},code.eq.${code}`)
    .single();

  if (findError || !groupData) throw new Error("Group not found");

  // Add user to group_members
  const { error: joinError } = await supabase
    .from('group_members')
    .insert([
      { group_id: groupData.id, user_id: userId }
    ]);

  // If error code is 23505, they are already a member (Postgres unique constraint)
  if (joinError && joinError.code !== '23505') throw joinError;

  return groupData;
}

/**
 * Local storage helpers for UI state
 */
export async function setActiveGroupId(id: string) {
  await AsyncStorage.setItem('active_group_id', id);
}

export async function getActiveGroupId() {
  return await AsyncStorage.getItem('active_group_id');
}