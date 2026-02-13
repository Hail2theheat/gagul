// lib/hooks/useMyGroups.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { supabase } from '../supabase';
import { createGroup as createGroupDb, joinGroupByCode } from '../db';

export type GroupRow = {
  id: string;
  name: string | null;
  code?: string;
  created_at?: string;
  current_streak?: number;
};

async function fetchMyGroups(): Promise<GroupRow[]> {
  const { data: userData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  const uid = userData.user?.id;
  if (!uid) throw new Error('Auth session missing!');

  const { data: mem, error: mErr } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });

  if (mErr) throw mErr;

  const ids = (mem ?? []).map((r: any) => r.group_id).filter(Boolean);
  if (ids.length === 0) return [];

  const { data: gs, error: gErr } = await supabase
    .from('groups')
    .select('id,name,created_at,current_streak')
    .in('id', ids)
    .order('created_at', { ascending: false });

  if (gErr) throw gErr;
  return (gs ?? []) as GroupRow[];
}

export function useMyGroups() {
  return useQuery({
    queryKey: ['myGroups'],
    queryFn: fetchMyGroups,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createGroupDb(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGroups'] });
    },
    onError: (e: any) => {
      Alert.alert('Create failed', e?.message ?? String(e));
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => joinGroupByCode(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGroups'] });
    },
    onError: (e: any) => {
      Alert.alert('Join failed', e?.message ?? String(e));
    },
  });
}
