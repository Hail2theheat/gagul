// lib/hooks/useGroupStatus.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { recordPromptView, getMemberPromptStatuses } from '../services/promptService';
import { getMyQuiplash, getQuiplashMatchups } from '../services/quiplashService';
import { getMyTelephone } from '../services/telephoneService';
import type { GroupStatus } from '../types/prompts';
import type { QuiplashAssignment, QuiplashMatchup } from '../services/quiplashService';
import type { TelephoneAssignment } from '../services/telephoneService';

export type GroupInfo = {
  name: string | null;
  code: string | null;
  created_at: string | null;
  current_streak: number;
};

export type MemberWithAvatar = {
  user_id: string;
  avatar_config: any | null;
};

export type GroupStatusData = {
  status: GroupStatus | null;
  memberStatuses: Record<string, 'not_seen' | 'seen' | 'responded'>;
  quiplashAssignment: QuiplashAssignment | null;
  pendingQuiplashVotes: QuiplashMatchup[];
  telephoneAssignment: TelephoneAssignment | null;
};

export type GroupInfoData = {
  groupInfo: GroupInfo;
  userStreak: number;
  memberCount: number;
  allMembers: MemberWithAvatar[];
  myAvatar: any | null;
};

async function fetchGroupStatus(groupId: string): Promise<GroupStatusData> {
  const { data, error } = await supabase.rpc('get_group_status', { p_group_id: groupId });
  if (error) throw error;
  const groupStatus = data as GroupStatus;

  // Record prompt view
  if (groupStatus?.active_prompt_instance?.id) {
    await recordPromptView(groupStatus.active_prompt_instance.id);
  }

  // Fetch member statuses
  const statuses = await getMemberPromptStatuses(groupId);
  const statusMap: Record<string, 'not_seen' | 'seen' | 'responded'> = {};
  for (const s of statuses) {
    statusMap[s.user_id] = s.status;
  }

  // Load quiplash
  const quiplashAssignment = await getMyQuiplash(groupId);
  const matchups = await getQuiplashMatchups(groupId);
  const pendingQuiplashVotes = matchups.filter(m => m.can_vote && !m.has_voted && m.responses.length >= 2);

  // Load telephone
  const telephoneAssignment = await getMyTelephone(groupId);

  return {
    status: groupStatus,
    memberStatuses: statusMap,
    quiplashAssignment,
    pendingQuiplashVotes,
    telephoneAssignment,
  };
}

async function fetchGroupInfo(groupId: string): Promise<GroupInfoData> {
  // Group details
  const { data: groupData } = await supabase
    .from('groups')
    .select('name, code, created_at, current_streak')
    .eq('id', groupId)
    .single();

  const groupInfo: GroupInfo = {
    name: groupData?.name ?? null,
    code: groupData?.code ?? null,
    created_at: groupData?.created_at ?? null,
    current_streak: groupData?.current_streak ?? 0,
  };

  // User streak + avatar
  let userStreak = 0;
  let myAvatar: any = null;
  const { data: userData } = await supabase.auth.getUser();
  if (userData?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak, avatar_config')
      .eq('id', userData.user.id)
      .single();
    if (profile) {
      userStreak = profile.current_streak || 0;
      myAvatar = profile.avatar_config;
    }
  }

  // Members with avatars
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId);

  let memberCount = members?.length ?? 0;
  let allMembers: MemberWithAvatar[] = [];

  if (members && members.length > 0) {
    const userIds = members.map((m: any) => m.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, avatar_config')
      .in('id', userIds);

    allMembers = members.map((m: any) => ({
      user_id: m.user_id,
      avatar_config: profiles?.find((p: any) => p.id === m.user_id)?.avatar_config ?? null,
    }));
  } else {
    const { count } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);
    if (count !== null) memberCount = count;
  }

  return { groupInfo, userStreak, memberCount, allMembers, myAvatar };
}

export function useGroupStatus(groupId: string | undefined) {
  return useQuery({
    queryKey: ['groupStatus', groupId],
    queryFn: () => fetchGroupStatus(groupId!),
    enabled: !!groupId,
    staleTime: 1000 * 30, // 30 seconds - group status is volatile
    refetchInterval: 1000 * 60, // auto-refetch every minute
  });
}

export function useGroupInfo(groupId: string | undefined) {
  return useQuery({
    queryKey: ['groupInfo', groupId],
    queryFn: () => fetchGroupInfo(groupId!),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 5, // 5 minutes - group info is relatively stable
  });
}

export function useInvalidateGroupStatus() {
  const queryClient = useQueryClient();
  return (groupId: string) => {
    queryClient.invalidateQueries({ queryKey: ['groupStatus', groupId] });
  };
}
