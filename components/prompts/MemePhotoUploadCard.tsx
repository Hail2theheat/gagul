/**
 * MemePhotoUploadCard - Day 1: Designated uploader uploads photo + writes caption
 */

import React, { useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { CampfireColors } from '../../constants/theme';
import { WordCounter } from './WordCounter';
import { WORD_LIMITS } from '../../lib/types/prompts';
import { submitMemePhoto } from '../../lib/services/memeGameService';
import { POINTS, emitPointsAwarded } from '../../lib/services/pointsService';

const COLORS = {
  bg: CampfireColors.BG,
  card: CampfireColors.CARD_SOLID,
  border: CampfireColors.BORDER,
  text: CampfireColors.TEXT,
  muted: CampfireColors.MUTED,
  accent: '#06B6D4',
};

interface MemePhotoUploadCardProps {
  groupId: string;
  onSubmitted?: () => void;
}

export function MemePhotoUploadCard({ groupId, onSubmitted }: MemePhotoUploadCardProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { min, max } = WORD_LIMITS.meme_caption;

  const wordCount = caption.trim() ? caption.trim().split(/\s+/).length : 0;
  const canSubmit = photoUri && wordCount >= min && wordCount <= max && !submitting;

  const pickImage = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return;
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
      }

      setLoading(true);
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: true,
          });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Image picker error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || !photoUri) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await submitMemePhoto(groupId, photoUri, caption.trim());
      if (result.success) {
        setSubmitted(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        emitPointsAwarded(POINTS.RESPONSE, 'response');
        onSubmitted?.();
      } else {
        setError(result.error || 'Failed to submit');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to submit');
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
          <Text style={styles.successText}>Photo uploaded!</Text>
          <Text style={styles.successHint}>
            Tomorrow your group will write captions for it
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
        <Text style={styles.title}>You're the meme maker this week!</Text>
        <Text style={styles.subtitle}>
          Upload a photo and write your caption. Tomorrow everyone else will
          add theirs.
        </Text>

        {/* Photo picker */}
        {photoUri ? (
          <Pressable onPress={() => setPhotoUri(null)} style={styles.photoPreview}>
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
            <View style={styles.photoOverlay}>
              <Ionicons name="close-circle" size={28} color="#fff" />
            </View>
          </Pressable>
        ) : (
          <View style={styles.pickerRow}>
            <Pressable
              style={styles.pickerButton}
              onPress={() => pickImage(true)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.accent} />
              ) : (
                <>
                  <Ionicons name="camera" size={28} color={COLORS.accent} />
                  <Text style={styles.pickerText}>Camera</Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={styles.pickerButton}
              onPress={() => pickImage(false)}
              disabled={loading}
            >
              <Ionicons name="images" size={28} color={COLORS.accent} />
              <Text style={styles.pickerText}>Gallery</Text>
            </Pressable>
          </View>
        )}

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
            <Text style={styles.submitText}>Upload & Submit</Text>
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
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pickerButton: {
    flex: 1,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderColor: COLORS.accent + '40',
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  pickerText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
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
