/**
 * PromptCard - main wrapper that displays prompt and routes to correct input type
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { GroupPrompt, PromptType } from '../../lib/types/prompts';
import { validateResponse, getPromptTypeLabel } from '../../lib/types/prompts';
import {
  submitResponse,
  submitResponseWithMajorityGuess,
  uploadPhoto,
  isPromptExpired,
} from '../../lib/services/promptService';
import { CountdownTimer } from './CountdownTimer';
import { ShortTextInput } from './ShortTextInput';
import { LongTextInput } from './LongTextInput';
import { PhotoPicker } from './PhotoPicker';
import { MultipleChoice } from './MultipleChoice';
import { QuizQuestion } from './QuizQuestion';
import { QuiplashInput } from './QuiplashInput';
import { PromptRating } from './PromptRating';
import { MajorityGuess } from './MajorityGuess';

// Theme colors
const COLORS = {
  bg: '#070B14',
  card: '#0D1426',
  border: '#27406B',
  text: '#E6F0FF',
  muted: '#9EC5FF',
  btn: '#1E4ED8',
  btnText: '#E6F0FF',
  success: '#4ADE80',
  error: '#FF4444',
};

interface PromptCardProps {
  groupPrompt: GroupPrompt;
  groupId: string;
  hasResponded: boolean;
  hasRated: boolean;
  userRating?: boolean | null;
  onSubmitted?: () => void;
  onExpired?: () => void;
}

export function PromptCard({
  groupPrompt,
  groupId,
  hasResponded: initialHasResponded,
  hasRated,
  userRating,
  onSubmitted,
  onExpired,
}: PromptCardProps) {
  const prompt = groupPrompt.prompts;
  const promptType = (prompt?.type || 'short_text') as PromptType;

  // State
  const [textValue, setTextValue] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [majorityGuess, setMajorityGuess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasResponded, setHasResponded] = useState(initialHasResponded);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(() => isPromptExpired(groupPrompt.expires_at));

  // Check if this is a majority guess prompt
  const isMajorityGuess = prompt?.is_majority_guess === true;

  // Validation
  const validation = validateResponse(promptType, textValue, photoUri ?? undefined, selectedOption ?? undefined);
  // For majority guess, we also need a guess to be selected
  const majorityGuessValid = !isMajorityGuess || (isMajorityGuess && majorityGuess !== null);
  const canSubmit = validation.valid && majorityGuessValid && !submitting && !expired;

  // Handle submission
  const handleSubmit = async () => {
    if (!canSubmit || !prompt) return;

    setError(null);
    setSubmitting(true);

    try {
      let mediaUrl: string | undefined;

      // Upload photo if needed
      if (photoUri && (promptType === 'photo' || promptType === 'short_text' || promptType === 'long_text')) {
        const uploadResult = await uploadPhoto(groupId, groupPrompt.id, photoUri);
        if (uploadResult.error) {
          setError(uploadResult.error);
          setSubmitting(false);
          return;
        }
        mediaUrl = uploadResult.url ?? undefined;
      }

      // Submit response - use majority guess function if applicable
      let result;
      if (isMajorityGuess && majorityGuess) {
        result = await submitResponseWithMajorityGuess({
          groupPromptId: groupPrompt.id,
          content: textValue || undefined,
          mediaUrl,
          selectedOption: selectedOption ?? undefined,
          guessedMajority: majorityGuess,
        });
      } else {
        result = await submitResponse({
          groupPromptId: groupPrompt.id,
          content: textValue || undefined,
          mediaUrl,
          selectedOption: selectedOption ?? undefined,
        });
      }

      if (result.success) {
        setHasResponded(true);
        onSubmitted?.();
      } else {
        setError(result.error || 'Failed to submit');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExpire = () => {
    setExpired(true);
    onExpired?.();
  };

  if (!prompt) {
    return (
      <View style={styles.card}>
        <Text style={styles.errorText}>Prompt data unavailable</Text>
      </View>
    );
  }

  // Render input based on prompt type
  const renderInput = () => {
    if (hasResponded || expired) return null;

    switch (promptType) {
      case 'short_text':
        return (
          <ShortTextInput
            value={textValue}
            onChangeText={setTextValue}
            disabled={submitting}
          />
        );

      case 'long_text':
        return (
          <LongTextInput
            value={textValue}
            onChangeText={setTextValue}
            disabled={submitting}
          />
        );

      case 'photo':
        return (
          <PhotoPicker
            value={photoUri}
            onChange={setPhotoUri}
            disabled={submitting}
          />
        );

      case 'multiple_choice':
        // Majority Guess prompts use a two-step component with auto-submit
        if (isMajorityGuess) {
          return (
            <MajorityGuess
              options={prompt.options || []}
              disabled={submitting}
              onSubmit={async (answer, guess) => {
                // Set state and immediately submit
                setSelectedOption(answer);
                setMajorityGuess(guess);
                setSubmitting(true);
                setError(null);

                try {
                  const result = await submitResponseWithMajorityGuess({
                    groupPromptId: groupPrompt.id,
                    selectedOption: answer,
                    guessedMajority: guess,
                  });

                  if (result.success) {
                    setHasResponded(true);
                    onSubmitted?.();
                  } else {
                    setError(result.error || 'Failed to submit');
                  }
                } catch (err) {
                  setError('An error occurred');
                } finally {
                  setSubmitting(false);
                }
              }}
            />
          );
        }
        // Regular multiple choice or Most Likely To
        return (
          <MultipleChoice
            options={prompt.options || []}
            value={selectedOption}
            onChange={setSelectedOption}
            disabled={submitting}
            isMostLikely={prompt.is_most_likely}
            groupMembers={groupPrompt.group_members}
          />
        );

      case 'quiz':
        return (
          <QuizQuestion
            options={prompt.options || []}
            value={selectedOption}
            onChange={setSelectedOption}
            disabled={submitting}
          />
        );

      case 'quiplash':
        return (
          <QuiplashInput
            value={textValue}
            onChangeText={setTextValue}
            disabled={submitting}
          />
        );

      default:
        return (
          <ShortTextInput
            value={textValue}
            onChangeText={setTextValue}
            disabled={submitting}
          />
        );
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{getPromptTypeLabel(promptType)}</Text>
        </View>
        {prompt.category && (
          <Text style={styles.category}>{prompt.category}</Text>
        )}
      </View>

      {/* Timer */}
      {!hasResponded && !expired && (
        <CountdownTimer
          expiresAt={groupPrompt.expires_at}
          onExpire={handleExpire}
        />
      )}

      {/* Prompt content */}
      <Text style={styles.promptTitle}>
        {prompt.content || prompt.title}
      </Text>

      {/* Expired state */}
      {expired && !hasResponded && (
        <View style={styles.expiredBox}>
          <Text style={styles.expiredText}>This prompt has expired</Text>
        </View>
      )}

      {/* Submitted state */}
      {hasResponded && (
        <View style={styles.submittedBox}>
          <Text style={styles.submittedText}>✓ Response submitted!</Text>
          <Text style={styles.submittedHint}>
            Check back during the Lowdown to see everyone's answers
          </Text>
        </View>
      )}

      {/* Input */}
      {renderInput()}

      {/* Error */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Submit button - not shown for MajorityGuess which has its own */}
      {!hasResponded && !expired && !isMajorityGuess && (
        <TouchableOpacity
          style={[
            styles.submitButton,
            !canSubmit && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={COLORS.btnText} />
          ) : (
            <Text style={styles.submitButtonText}>Submit Response</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Rating - only show after response submitted */}
      {hasResponded && (
        <PromptRating
          promptId={prompt.id}
          hasRated={hasRated}
          initialRating={userRating}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeBadge: {
    backgroundColor: COLORS.btn + '30',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeText: {
    color: COLORS.btn,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  category: {
    color: COLORS.muted,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  promptTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  expiredBox: {
    backgroundColor: COLORS.error + '15',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  expiredText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '500',
  },
  submittedBox: {
    backgroundColor: COLORS.success + '15',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  submittedText: {
    color: COLORS.success,
    fontSize: 18,
    fontWeight: '600',
  },
  submittedHint: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: COLORS.btn,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.btn + '50',
  },
  submitButtonText: {
    color: COLORS.btnText,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PromptCard;
