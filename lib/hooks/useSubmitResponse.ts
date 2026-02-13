// lib/hooks/useSubmitResponse.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitResponseWithValidation } from '../services/promptService';
import { submitQuiplashVote } from '../services/quiplashService';
import { submitTelephoneStep } from '../services/telephoneService';
import type { ResponseSubmission, PromptType } from '../types/prompts';

export function useSubmitResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, submission }: { type: PromptType; submission: ResponseSubmission }) =>
      submitResponseWithValidation(type, submission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupStatus'] });
    },
  });
}

export function useSubmitQuiplashVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchupId, responseId }: { matchupId: string; responseId: string }) =>
      submitQuiplashVote(matchupId, responseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupStatus'] });
    },
  });
}

export function useSubmitTelephoneStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stepId, content, drawingUrl }: { stepId: string; content?: string; drawingUrl?: string }) =>
      submitTelephoneStep(stepId, content, drawingUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupStatus'] });
    },
  });
}
