/**
 * QuiplashVotingCard - Mid-week quiplash voting component
 * Shows matchups and allows users to vote
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
  FadeIn,
  FadeInRight,
  FadeOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { SPRING_SNAPPY } from '../../constants/animations';
import { CampfireColors } from '../../constants/theme';
import {
  getQuiplashMatchups,
  submitQuiplashVote,
  QuiplashMatchup,
} from '../../lib/services/quiplashService';

const COLORS = {
  bg: CampfireColors.BG,
  card: CampfireColors.CARD_SOLID,
  border: CampfireColors.BORDER,
  text: CampfireColors.TEXT,
  muted: CampfireColors.MUTED,
  accent: CampfireColors.BTN_PRIMARY,
  purple: '#8B5CF6',
  green: CampfireColors.SUCCESS,
  gold: '#FFD700',
};

interface QuiplashVotingCardProps {
  groupId: string;
  onVoted?: () => void;
}

export function QuiplashVotingCard({ groupId, onVoted }: QuiplashVotingCardProps) {
  const [loading, setLoading] = useState(true);
  const [matchups, setMatchups] = useState<QuiplashMatchup[]>([]);
  const [currentMatchupIndex, setCurrentMatchupIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  // All hooks must be called before any early returns
  const translateX = useSharedValue(0);
  const cardRotate = useSharedValue(0);
  const optionAScale = useSharedValue(1);
  const optionBScale = useSharedValue(1);

  const swipeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${cardRotate.value}deg` },
    ],
  }));
  const optionAStyle = useAnimatedStyle(() => ({ transform: [{ scale: optionAScale.value }] }));
  const optionBStyle = useAnimatedStyle(() => ({ transform: [{ scale: optionBScale.value }] }));

  useEffect(() => {
    loadMatchups();
  }, [groupId]);

  const loadMatchups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getQuiplashMatchups(groupId);
      // Filter to only show matchups user can vote on and hasn't voted on
      const votable = data.filter(m => m.can_vote && !m.has_voted && m.responses.length >= 2);
      setMatchups(votable);
    } catch (e: any) {
      setError(e?.message || 'Failed to load matchups');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (responseId: string) => {
    const matchup = matchups[currentMatchupIndex];
    if (!matchup || submittingRef.current) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const result = await submitQuiplashVote(matchup.matchup_id, responseId);
      if (result.success) {
        // Move to next matchup or finish
        if (currentMatchupIndex < matchups.length - 1) {
          setCurrentMatchupIndex(currentMatchupIndex + 1);
        } else {
          // All done
          setMatchups([]);
          onVoted?.();
        }
      } else {
        setError(result.error || 'Failed to vote');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to vote');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color={COLORS.purple} />
        <Text style={styles.loadingText}>Loading matchups...</Text>
      </View>
    );
  }

  if (matchups.length === 0) {
    return null; // No voting needed
  }

  const currentMatchup = matchups[currentMatchupIndex];

  const swipeToVote = (index: number) => {
    if (submittingRef.current || !currentMatchup?.responses[index]) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleVote(currentMatchup.responses[index].response_id);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onUpdate((e) => {
      translateX.value = e.translationX;
      cardRotate.value = e.translationX / 20; // Subtle tilt
    })
    .onEnd((e) => {
      const THRESHOLD = 120;
      if (e.translationX < -THRESHOLD) {
        // Swipe left = vote B (second option)
        translateX.value = withTiming(-400, { duration: 200 });
        runOnJS(swipeToVote)(1);
      } else if (e.translationX > THRESHOLD) {
        // Swipe right = vote A (first option)
        translateX.value = withTiming(400, { duration: 200 });
        runOnJS(swipeToVote)(0);
      } else {
        // Spring back
        translateX.value = withSpring(0, SPRING_SNAPPY);
        cardRotate.value = withSpring(0, SPRING_SNAPPY);
      }
    });

  return (
    <View style={styles.card}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>⚔️ QUIPLASH VOTE</Text>
        </View>
        <Text style={styles.progress}>
          {currentMatchupIndex + 1} / {matchups.length}
        </Text>
      </Animated.View>

      {/* Prompt */}
      <Animated.Text key={`prompt-${currentMatchupIndex}`} entering={FadeInRight.duration(300)} style={styles.promptText}>
        {currentMatchup.prompt_content}
      </Animated.Text>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Responses to vote on */}
      <GestureHandlerRootView>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.responsesContainer, swipeStyle]} key={`matchup-${currentMatchupIndex}`}>
            <Text style={styles.votePrompt}>Which answer is better? (tap or swipe)</Text>

            {currentMatchup.responses.map((response, index) => {
              const animStyle = index === 0 ? optionAStyle : optionBStyle;
              const scaleVal = index === 0 ? optionAScale : optionBScale;
              return (
                <Animated.View key={response.response_id} style={animStyle} entering={FadeInRight.delay(index * 100).duration(250)}>
                  <Pressable
                    style={[styles.responseOption, submitting && styles.responseDisabled]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleVote(response.response_id);
                    }}
                    onPressIn={() => { scaleVal.value = withSpring(0.97, SPRING_SNAPPY); }}
                    onPressOut={() => { scaleVal.value = withSpring(1, SPRING_SNAPPY); }}
                    disabled={submitting}
                    accessibilityRole="button"
                    accessibilityLabel={`Vote for answer ${index === 0 ? 'A' : 'B'}`}
                  >
                    <Text style={styles.responseLabel}>
                      {index === 0 ? 'A' : 'B'}
                    </Text>
                    <Text style={styles.responseText}>
                      "{response.content}"
                    </Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>

      {submitting && (
        <View style={styles.submittingOverlay}>
          <ActivityIndicator size="small" color={COLORS.text} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.purple,
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: COLORS.purple + '30',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: COLORS.purple,
    fontSize: 12,
    fontWeight: '700',
  },
  progress: {
    color: COLORS.muted,
    fontSize: 12,
  },
  promptText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingText: {
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 8,
  },
  errorText: {
    color: CampfireColors.DANGER,
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
  },
  responsesContainer: {
    gap: 12,
  },
  votePrompt: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  responseOption: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: COLORS.purple + '50',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  responseDisabled: {
    opacity: 0.5,
  },
  responseLabel: {
    color: COLORS.purple,
    fontSize: 18,
    fontWeight: '900',
    width: 24,
  },
  responseText: {
    color: COLORS.text,
    fontSize: 16,
    flex: 1,
    fontStyle: 'italic',
  },
  submittingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
