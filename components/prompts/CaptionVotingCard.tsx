/**
 * CaptionVotingCard - Vote on meme captions (Day 3 of What do you Meme)
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CampfireColors } from '../../constants/theme';
import {
  getMemeVotingData,
  submitMemeVote,
} from '../../lib/services/memeGameService';
import { getSignedImageUrl } from '../../lib/services/firesideService';
import { supabase } from '../../lib/supabase';
import type { MemeVotingData } from '../../lib/types/prompts';
import { POINTS, emitPointsAwarded } from '../../lib/services/pointsService';

const COLORS = {
  bg: CampfireColors.BG,
  card: CampfireColors.CARD_SOLID,
  border: CampfireColors.BORDER,
  text: CampfireColors.TEXT,
  muted: CampfireColors.MUTED,
  accent: '#06B6D4', // Cyan
  green: CampfireColors.SUCCESS,
};

interface CaptionVotingCardProps {
  groupId: string;
  onVoted?: () => void;
  onDismiss?: () => void;
}

export function CaptionVotingCard({ groupId, onVoted, onDismiss }: CaptionVotingCardProps) {
  const [loading, setLoading] = useState(true);
  const [votingData, setVotingData] = useState<MemeVotingData | null>(null);
  const [signedPhotoUrl, setSignedPhotoUrl] = useState<string | null>(null);
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUserId(data.user.id);
    });
  }, [groupId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMemeVotingData(groupId);
      if (data && !data.has_voted && data.responses.length >= 2) {
        setVotingData(data);
        // Get signed URL for the photo
        if (data.photo_url) {
          const signed = await getSignedImageUrl(data.photo_url);
          setSignedPhotoUrl(signed || data.photo_url);
        }
      } else {
        setVotingData(null);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!votingData || !selectedResponseId) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await submitMemeVote(votingData.caption_group_prompt_id, selectedResponseId);
      if (result.success) {
        emitPointsAwarded(POINTS.FIRESIDE, 'fireside');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setVotingData(null);
        onVoted?.();
      } else {
        setError(result.error || 'Failed to vote');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to vote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading captions...</Text>
      </View>
    );
  }

  if (!votingData) return null;

  // Filter out own captions so you can't vote for yourself
  const displayCaptions = currentUserId
    ? votingData.responses.filter(r => r.user_id !== currentUserId)
    : votingData.responses;

  return (
    <View style={styles.card}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🎭 MEME VOTE</Text>
        </View>
        <Pressable
          onPress={() => { setVotingData(null); onDismiss?.(); }}
          hitSlop={8}
          style={styles.dismissButton}
        >
          <Text style={styles.dismissText}>✕</Text>
        </Pressable>
      </Animated.View>

      {/* Photo */}
      {signedPhotoUrl && (
        <Image
          source={{ uri: signedPhotoUrl }}
          style={styles.photo}
          resizeMode="cover"
        />
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Captions to vote on */}
      <Text style={styles.votePrompt}>Pick your favorite:</Text>

      <ScrollView style={styles.captionsList} nestedScrollEnabled>
        {displayCaptions.map((response, index) => {
          const isSelected = selectedResponseId === response.response_id;
          return (
            <Animated.View key={response.response_id} entering={FadeInRight.delay(index * 80).duration(200)}>
              <Pressable
                style={[styles.captionOption, isSelected && styles.captionSelected]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedResponseId(response.response_id);
                }}
                disabled={submitting}
              >
                <Text style={styles.captionLabel}>{String.fromCharCode(65 + index)}</Text>
                <Text style={[styles.captionText, isSelected && styles.captionTextSelected]}>
                  "{response.content}"
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Submit button */}
      <Pressable
        style={[styles.submitButton, !selectedResponseId && styles.submitDisabled]}
        onPress={handleVote}
        disabled={!selectedResponseId || submitting}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitText}>Submit Vote</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.accent,
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
    backgroundColor: COLORS.accent + '30',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  photo: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#1a1a2e',
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
  votePrompt: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  captionsList: {
    maxHeight: 400,
  },
  captionOption: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderColor: COLORS.accent + '40',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  captionSelected: {
    borderColor: COLORS.accent,
    borderWidth: 2,
    backgroundColor: 'rgba(6, 182, 212, 0.18)',
  },
  captionLabel: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '900',
    width: 22,
  },
  captionText: {
    color: COLORS.text,
    fontSize: 15,
    flex: 1,
    fontStyle: 'italic',
  },
  captionTextSelected: {
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  submitDisabled: {
    opacity: 0.4,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '700',
  },
});
