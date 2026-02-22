/**
 * PhotoCaptionInput - Shows a photo and text input for writing a caption
 */

import React, { useState } from 'react';
import { View, TextInput, Text, Image, StyleSheet, ActivityIndicator, Keyboard } from 'react-native';
import { WordCounter } from './WordCounter';
import { WORD_LIMITS } from '../../lib/types/prompts';
import { CampfireColors, Radii, Typography } from '../../constants/theme';

// DESIGN.md §19: Never hardcode hex values
const COLORS = {
  bg: CampfireColors.BG,
  border: CampfireColors.BORDER,
  text: CampfireColors.TEXT,
  placeholder: CampfireColors.PLACEHOLDER, // DESIGN.md §5.2 - Input placeholders
  accent: CampfireColors.ACCENT_CYAN, // DESIGN.md §5.8 - Cyan for photo/caption modes
  muted: CampfireColors.MUTED,
};

interface PhotoCaptionInputProps {
  value: string;
  onChangeText: (text: string) => void;
  photoUrl: string;
  placeholder?: string;
  disabled?: boolean;
}

export function PhotoCaptionInput({
  value,
  onChangeText,
  photoUrl,
  placeholder = 'Your caption...',
  disabled = false,
}: PhotoCaptionInputProps) {
  const { min, max } = WORD_LIMITS.photo_caption;
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>📸 Photo Caption</Text>
      </View>

      {/* Photo */}
      <View style={styles.imageContainer}>
        {imageLoading && !imageError && (
          <View style={styles.imagePlaceholder}>
            <ActivityIndicator size="small" color={COLORS.accent} />
          </View>
        )}
        {imageError ? (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageErrorText}>Photo unavailable</Text>
          </View>
        ) : (
          <Image
            source={{ uri: photoUrl }}
            style={styles.image}
            resizeMode="cover"
            onLoad={() => setImageLoading(false)}
            onError={() => { setImageLoading(false); setImageError(true); }}
          />
        )}
      </View>

      <Text style={styles.hint}>
        Write a funny caption! Voting starts after the prompt expires.
      </Text>
      <TextInput
        style={[styles.input, disabled && styles.disabled]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholder}
        multiline
        numberOfLines={2}
        maxLength={500}
        editable={!disabled}
        textAlignVertical="top"
        inputAccessoryViewID="groupInputAccessory"
      />
      <WordCounter text={value} min={min} max={max} showProgress={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  badge: {
    // DESIGN.md §19: Never hardcode hex values - use design tokens
    backgroundColor: CampfireColors.ACCENT_CYAN + '20', // 20 = ~12% opacity
    borderRadius: Radii.sm, // DESIGN.md §7 - Use Radii tokens for border radius
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: {
    color: COLORS.accent,
    fontSize: Typography.caption.fontSize, // DESIGN.md §6 - Use Typography scale
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: Radii.md, // DESIGN.md §7 - Use Radii tokens
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: CampfireColors.CARD_SOLID, // DESIGN.md §5.2 - Use CARD_SOLID for opaque surfaces
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CampfireColors.CARD_SOLID, // DESIGN.md §5.2 - Consistent card backgrounds
  },
  imageErrorText: {
    color: COLORS.muted,
    fontSize: Typography.caption.fontSize, // DESIGN.md §6 - Use Typography scale
  },
  hint: {
    color: COLORS.muted,
    fontSize: Typography.caption.fontSize, // DESIGN.md §6 - Use Typography scale
    marginBottom: 12,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: Radii.md, // DESIGN.md §7 - Use Radii tokens
    padding: 16,
    color: COLORS.text,
    fontSize: Typography.body.fontSize, // DESIGN.md §6 - Use Typography scale
    minHeight: 80,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default PhotoCaptionInput;
