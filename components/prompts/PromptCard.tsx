/**
 * PromptCard - main wrapper that displays prompt and routes to correct input type
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { SPRING_SNAPPY } from '../../constants/animations';
import { CampfireColors, Radii } from '../../constants/theme';
import type { GroupPrompt, PromptType } from '../../lib/types/prompts';
import { validateResponse } from '../../lib/types/prompts';
import {
  submitResponse,
  submitResponseWithMajorityGuess,
  uploadPhoto,
  isPromptExpired,
} from '../../lib/services/promptService';
import { supabase } from '../../lib/supabase';
import { POINTS, emitPointsAwarded } from '../../lib/services/pointsService';
import { CountdownTimer } from './CountdownTimer';
import { ShortTextInput } from './ShortTextInput';
import { LongTextInput } from './LongTextInput';
import { PhotoPicker } from './PhotoPicker';
import { MultipleChoice } from './MultipleChoice';
import { QuizQuestion } from './QuizQuestion';
import { QuiplashInput } from './QuiplashInput';
import { PhotoCaptionInput } from './PhotoCaptionInput';
import { PromptRating } from './PromptRating';
import { MajorityGuess } from './MajorityGuess';

// "What is cool?" easter egg - Thugz Tribunal prompt group_prompt_id
const TRIBUNAL_GROUP_PROMPT_ID = 'f0101e2b-4263-4842-b60d-de107bffee05';
// "Photo Advice Tips" easter egg - Wirthlin Artsy Photo group_prompt_id
const ARTSY_PHOTO_GROUP_PROMPT_ID = '87225fb7-47cc-49c3-ac7b-8609e59b3ac9';

// Theme colors (DESIGN.md §5)
const COLORS = {
  bg: CampfireColors.BG,
  card: CampfireColors.CARD, // rgba(22, 28, 48, 0.88) - NOT BG
  border: CampfireColors.BORDER,
  text: CampfireColors.TEXT,
  muted: CampfireColors.MUTED,
  btn: CampfireColors.BTN_PRIMARY,
  btnText: CampfireColors.TEXT,
  success: CampfireColors.SUCCESS,
  error: CampfireColors.DANGER,
};

interface PromptCardProps {
  groupPrompt: GroupPrompt;
  groupId: string;
  hasResponded: boolean;
  hasRated: boolean;
  userRating?: boolean | null;
  onSubmitted?: () => void;
  onExpired?: () => void;
  onRated?: (rating: number) => void;
}

export function PromptCard({
  groupPrompt,
  groupId,
  hasResponded: initialHasResponded,
  hasRated,
  userRating,
  onSubmitted,
  onExpired,
  onRated,
}: PromptCardProps) {
  const prompt = groupPrompt.prompts;
  const promptType = (prompt?.type || 'short_text') as PromptType;

  // State
  const [textValue, setTextValue] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [majorityGuess, setMajorityGuess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasResponded, setHasResponded] = useState(initialHasResponded);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(() => isPromptExpired(groupPrompt.expires_at));

  // Check if this is a majority guess prompt
  const isMajorityGuess = prompt?.is_majority_guess === true;

  // Check if this is a Tribunal (AI-judged) prompt
  const isTribunal = (prompt?.payload as any)?.is_tribunal === true;

  // Submit button press feedback
  const submitScale = useSharedValue(1);
  const submitAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: submitScale.value }],
  }));

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

      // Determine content - use photoCaption for photo prompts, textValue otherwise
      const contentToSubmit = promptType === 'photo' ? (photoCaption || undefined) : (textValue || undefined);

      // Submit response - use majority guess function if applicable
      let result;
      if (isMajorityGuess && majorityGuess) {
        result = await submitResponseWithMajorityGuess({
          groupPromptId: groupPrompt.id,
          content: contentToSubmit,
          mediaUrl,
          selectedOption: selectedOption ?? undefined,
          guessedMajority: majorityGuess,
        });
      } else {
        result = await submitResponse({
          groupPromptId: groupPrompt.id,
          content: contentToSubmit,
          mediaUrl,
          selectedOption: selectedOption ?? undefined,
        });
      }

      if (result.success) {
        setHasResponded(true);
        onSubmitted?.();

        // Emit points popups
        const isPhoto = promptType === 'photo' || !!mediaUrl;
        emitPointsAwarded(POINTS.RESPONSE, 'response');
        if (isPhoto) {
          setTimeout(() => emitPointsAwarded(POINTS.PHOTO_BONUS, 'photo_bonus'), 400);
        }

        // Check if first responder
        const { count } = await supabase
          .from('responses')
          .select('id', { count: 'exact', head: true })
          .eq('group_prompt_id', groupPrompt.id);
        if (count === 1) {
          setTimeout(() => emitPointsAwarded(POINTS.FIRST_RESPONDER, 'first_responder'), 800);
        }
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
            caption={photoCaption}
            onCaptionChange={setPhotoCaption}
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

                    // Emit points popups
                    emitPointsAwarded(POINTS.RESPONSE, 'response');

                    // Check if first responder
                    const { count } = await supabase
                      .from('responses')
                      .select('id', { count: 'exact', head: true })
                      .eq('group_prompt_id', groupPrompt.id);
                    if (count === 1) {
                      setTimeout(() => emitPointsAwarded(POINTS.FIRST_RESPONDER, 'first_responder'), 800);
                    }
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

      case 'photo_caption':
        return (
          <PhotoCaptionInput
            value={textValue}
            onChangeText={setTextValue}
            photoUrl={prompt.media_url || ''}
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
    <Animated.View entering={FadeInDown.springify().damping(14)} style={styles.card}>
      {/* Timer - at the top, compact */}
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

      {/* Tribunal AI judge stamp */}
      {isTribunal && (
        <Text style={styles.tribunalCaption}>
          AI-Judged
        </Text>
      )}

      {/* "What is cool?" easter egg button for Tribunal prompt */}
      {groupPrompt.id === TRIBUNAL_GROUP_PROMPT_ID && !hasResponded && !expired && (
        <Animated.View entering={FadeIn}>
          <Pressable
            style={styles.coolButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({
                pathname: '/what-is-cool',
                params: { groupId, groupPromptId: groupPrompt.id },
              });
            }}
          >
            <Text style={styles.coolButtonText}>What is cool?</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* "Photo Advice Tips" button for Wirthlin Artsy Photo prompt */}
      {groupPrompt.id === ARTSY_PHOTO_GROUP_PROMPT_ID && !hasResponded && !expired && (
        <Animated.View entering={FadeIn}>
          <Pressable
            style={styles.coolButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({
                pathname: '/photo-tips',
                params: { groupId, groupPromptId: groupPrompt.id },
              });
            }}
          >
            <Text style={styles.coolButtonText}>Photo advice tips</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Expired state - DESIGN.md §16: cozy error messages */}
      {expired && !hasResponded && (
        <View style={styles.expiredBox}>
          <Text style={styles.expiredText}>The embers have cooled on this one</Text>
        </View>
      )}

      {/* Submitted state - DESIGN.md §16: warm campfire tone */}
      {hasResponded && (
        <Animated.View entering={FadeInDown.springify().damping(14)} style={styles.submittedBox}>
          <Text style={styles.submittedText}>🔥 Fire stoked!</Text>
          <Text style={styles.submittedHint}>
            Gather 'round the Fireside on Sunday to see everyone's answers
          </Text>
        </Animated.View>
      )}

      {/* Input */}
      {renderInput()}

      {/* Error */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Submit button - not shown for MajorityGuess which has its own */}
      {!hasResponded && !expired && !isMajorityGuess && (
        <Animated.View style={submitAnimStyle}>
          <Pressable
            style={[
              styles.submitButton,
              !canSubmit && styles.submitButtonDisabled,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleSubmit();
            }}
            onPressIn={() => { submitScale.value = withSpring(0.96, SPRING_SNAPPY); }}
            onPressOut={() => { submitScale.value = withSpring(1, SPRING_SNAPPY); }}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Submit Response"
          >
            {submitting ? (
              <ActivityIndicator size="small" color={COLORS.btnText} />
            ) : (
              <Text style={styles.submitButtonText}>Stoke the Fire</Text>
            )}
          </Pressable>
        </Animated.View>
      )}

      {/* Rating - only show after response submitted */}
      {hasResponded && (
        <PromptRating
          promptId={prompt.id}
          hasRated={hasRated}
          initialRating={userRating}
          onRated={onRated}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // DESIGN.md §10: Card with warm wooden frame aesthetic
  card: {
    backgroundColor: COLORS.card, // rgba(22, 28, 48, 0.88)
    borderRadius: Radii.card, // 18
    borderWidth: 1,
    borderColor: COLORS.border, // #2a3f5f
    padding: 20,
    gap: 8,
  },
  promptTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontFamily: 'Paaxel',
    lineHeight: 30,
    textAlign: 'center',
  },
  tribunalCaption: {
    color: CampfireColors.FIRE_YELLOW,
    fontSize: 11,
    fontFamily: 'Paaxel',
    textAlign: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: CampfireColors.FIRE_YELLOW + '60',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    overflow: 'hidden',
    letterSpacing: 1,
    textTransform: 'uppercase',
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
  coolButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CampfireColors.MUTED + '40',
    backgroundColor: CampfireColors.BG + '60',
    marginTop: 4,
  },
  coolButtonText: {
    color: CampfireColors.MUTED,
    fontSize: 13,
    fontFamily: 'Paaxel',
    fontStyle: 'italic',
  },
});

export default PromptCard;
