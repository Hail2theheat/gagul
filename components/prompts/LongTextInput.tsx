/**
 * LongTextInput - text area with 40-200 word limit
 * DESIGN.md §10: Warm campfire storytelling input
 */

import React from 'react';
import { View, TextInput, StyleSheet, Keyboard } from 'react-native';
import { WordCounter } from './WordCounter';
import { WORD_LIMITS } from '../../lib/types/prompts';
import { CampfireColors, Radii, Typography } from '../../constants/theme';

// Theme colors (DESIGN.md §5)
const COLORS = {
  bg: CampfireColors.BG,
  border: CampfireColors.BORDER,
  text: CampfireColors.TEXT,
  placeholder: CampfireColors.PLACEHOLDER, // #6B8EC2
};

interface LongTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function LongTextInput({
  value,
  onChangeText,
  placeholder = 'Spin your story around the fire...',  // DESIGN.md §16: campfire metaphor
  disabled = false,
}: LongTextInputProps) {
  const { min, max, good, excellent } = WORD_LIMITS.long_text;

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, disabled && styles.disabled]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholder}
        multiline
        numberOfLines={6}
        maxLength={2000}
        editable={!disabled}
        textAlignVertical="top"
        inputAccessoryViewID="groupInputAccessory"
      />
      <WordCounter text={value} min={min} max={max} good={good} excellent={excellent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  // DESIGN.md §10: Input with Radii.input (14), Typography.body
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: Radii.input, // 14 (not 12)
    padding: 16,
    color: COLORS.text,
    fontFamily: Typography.body.fontFamily, // 'Paaxel'
    fontSize: Typography.body.fontSize, // 16
    minHeight: 180,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default LongTextInput;
