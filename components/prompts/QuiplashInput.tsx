/**
 * QuiplashInput - text input for anonymous quiplash responses
 */

import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { WordCounter } from './WordCounter';
import { WORD_LIMITS } from '../../lib/types/prompts';

// Theme colors
const COLORS = {
  bg: '#0D1426',
  border: '#27406B',
  text: '#E6F0FF',
  placeholder: '#6B8EC2',
  accent: '#8B5CF6', // Purple for quiplash
  muted: '#9EC5FF',
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
    backgroundColor: '#8B5CF620',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  hint: {
    color: COLORS.muted,
    fontSize: 13,
    marginBottom: 12,
    fontStyle: 'italic',
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
  disabled: {
    opacity: 0.5,
  },
});

export default QuiplashInput;
