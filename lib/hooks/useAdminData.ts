// lib/hooks/useAdminData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWeekSchedule,
  getPromptResponses,
  getGroupMemberCount,
  deactivateGroupPrompt,
  type AdminGroupPrompt,
  type AdminResponse,
} from '../services/adminService';

export function useWeekSchedule(groupId: string | undefined, weekOf: string) {
  return useQuery<AdminGroupPrompt[]>({
    queryKey: ['adminSchedule', groupId, weekOf],
    queryFn: () => getWeekSchedule(groupId!, weekOf),
    enabled: !!groupId,
    staleTime: 1000 * 60,
  });
}

export function usePromptResponses(groupPromptId: string | undefined, promptType?: string) {
  return useQuery<AdminResponse[]>({
    queryKey: ['adminResponses', groupPromptId],
    queryFn: () => getPromptResponses(groupPromptId!, promptType),
    enabled: !!groupPromptId,
  });
}

export function useGroupMemberCount(groupId: string | undefined) {
  return useQuery<number>({
    queryKey: ['adminMemberCount', groupId],
    queryFn: () => getGroupMemberCount(groupId!),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDeactivatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupPromptId: string) => deactivateGroupPrompt(groupPromptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSchedule'] });
    },
  });
}
