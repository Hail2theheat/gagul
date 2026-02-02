/**
 * ShortTextInput - text input with 1-50 word limit
 */

import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { WordCounter } from './WordCounter';
import { WORD_LIMITS } from '../../lib/types/prompts';

// Theme colors
const COLORS = {
  bg: '#0D1426',
  border: '#27406B',
  text: '#E6F0FF',
  placeholder: '#6B8EC2',
};

interface ShortTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ShortTextInput({
  value,
  onChangeText,
  placeholder = 'Your quick response...',
  disabled = false,
}: ShortTextInputProps) {
  const { min, max } = WORD_LIMITS.short_text;

  return (
    <View style={styles.container}>
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
      />
      <WordCounter text={value} min={min} max={max} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    color: COLORS.text,
    fontSize: 16,
    minHeight: 80,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default ShortTextInput;
