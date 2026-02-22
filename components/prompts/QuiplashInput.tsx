/**
 * QuiplashInput - text input for anonymous quiplash responses
 */

import React from 'react';
import { View, TextInput, Text, StyleSheet, Keyboard } from 'react-native';
import { WordCounter } from './WordCounter';
import { WORD_LIMITS } from '../../lib/types/prompts';
import { CampfireColors, Radii, Typography } from '../../constants/theme';

// Theme colors (DESIGN.md §19: Never hardcode hex values)
const COLORS = {
  bg: CampfireColors.BG,
  border: CampfireColors.BORDER,
  text: CampfireColors.TEXT,
  placeholder: CampfireColors.PLACEHOLDER, // DESIGN.md §5.2 - Input placeholders
  accent: CampfireColors.ACCENT_PURPLE, // DESIGN.md §5.8 - Accent colors for special prompts
  muted: CampfireColors.MUTED,
};

interface QuiplashInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function QuiplashInput({
  value,
  onChangeText,
  placeholder = 'Your witty answer...',
  disabled = false,
}: QuiplashInputProps) {
  const { min, max } = WORD_LIMITS.quiplash;

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>🎭 Quiplash</Text>
      </View>
      <Text style={styles.hint}>
        Your answer will be shown anonymously during the Lowdown
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
    backgroundColor: CampfireColors.ACCENT_PURPLE + '20', // 20 = ~12% opacity
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

export default QuiplashInput;
