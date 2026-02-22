/**
 * MemeCaptionCard - Day 2: Non-uploaders write a caption for the uploaded photo
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CampfireColors } from '../../constants/theme';
import { WordCounter } from './WordCounter';
import { WORD_LIMITS } from '../../lib/types/prompts';
import { supabase } from '../../lib/supabase';
import { getSignedImageUrl } from '../../lib/services/firesideService';
import { POINTS, emitPointsAwarded } from '../../lib/services/pointsService';

const COLORS = {
  bg: CampfireColors.BG,
  card: CampfireColors.CARD_SOLID,
  border: CampfireColors.BORDER,
  text: CampfireColors.TEXT,
  muted: CampfireColors.MUTED,
  accent: '#06B6D4',
};

interface MemeCaptionCardProps {
  groupId: string;
  photoUrl: string;
  captionGroupPromptId: string;
  uploaderUsername?: string | null;
  onSubmitted?: () => void;
}

export function MemeCaptionCard({
  groupId,
  photoUrl,
  captionGroupPromptId,
  uploaderUsername,
  onSubmitted,
}: MemeCaptionCardProps) {
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const { min, max } = WORD_LIMITS.meme_caption;

  const wordCount = caption.trim() ? caption.trim().split(/\s+/).length : 0;
  const canSubmit = wordCount >= min && wordCount <= max && !submitting;

  useEffect(() => {
    if (photoUrl) {
      getSignedImageUrl(photoUrl).then(url => {
        setSignedUrl(url || photoUrl);
      });
    }
  }, [photoUrl]);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    try {
      const { data, error: submitError } = await supabase
        .from('responses')
        .insert({
          group_prompt_id: captionGroupPromptId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          content: caption.trim(),
        })
        .select()
        .single();

      if (submitError) throw submitError;

      setSubmitted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      emitPointsAwarded(POINTS.RESPONSE, 'response');
      onSubmitted?.();
    } catch (e: any) {
      setError(e?.message || 'Failed to submit caption');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🎭 WHAT DO YOU MEME</Text>
        </View>
        <Animated.View entering={FadeIn.duration(300)} style={styles.successBox}>
          <Text style={styles.successText}>Caption submitted!</Text>
          <Text style={styles.successHint}>
            Voting starts tomorrow — may the funniest caption win
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Animated.View entering={FadeIn.duration(300)}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🎭 WHAT DO YOU MEME</Text>
        </View>

        {uploaderUsername && (
          <Text style={styles.subtitle}>
            {uploaderUsername}'s photo — write your funniest caption!
          </Text>
        )}

        {/* Photo */}
        <View style={styles.imageContainer}>
          {imageLoading && (
            <View style={styles.imagePlaceholder}>
              <ActivityIndicator size="small" color={COLORS.accent} />
            </View>
          )}
          {signedUrl && (
            <Image
              source={{ uri: signedUrl }}
              style={styles.image}
              resizeMode="cover"
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
          )}
        </View>

        {/* Caption input */}
        <TextInput
          style={styles.input}
          value={caption}
          onChangeText={setCaption}
          placeholder="Your caption..."
          placeholderTextColor="#6B8EC2"
          multiline
          numberOfLines={2}
          maxLength={500}
          editable={!submitting}
          textAlignVertical="top"
          inputAccessoryViewID="groupInputAccessory"
        />
        <WordCounter text={caption} min={min} max={max} showProgress={false} />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit Caption</Text>
          )}
        </Pressable>
      </Animated.View>
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
  badge: {
    backgroundColor: COLORS.accent + '30',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#1a1a2e',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    color: COLORS.text,
    fontSize: 16,
    minHeight: 80,
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
  errorText: {
    color: CampfireColors.DANGER,
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
  },
  successBox: {
    backgroundColor: CampfireColors.SUCCESS + '15',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  successText: {
    color: CampfireColors.SUCCESS,
    fontSize: 18,
    fontWeight: '600',
  },
  successHint: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
  },
});
