/**
 * QuizQuestion - multiple choice for quiz prompts (same as MultipleChoice but with quiz styling)
 * Answer reveal happens during Fireside
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Theme colors - quiz uses a distinctive green accent
const COLORS = {
  bg: '#0D1426',
  bgSelected: '#10B98120',
  border: '#27406B',
  borderSelected: '#10B981',
  text: '#E6F0FF',
  muted: '#9EC5FF',
  accent: '#10B981',
};

interface QuizQuestionProps {
  options: string[];
  value: string | null;
  onChange: (option: string) => void;
  disabled?: boolean;
}

export function QuizQuestion({
  options,
  value,
  onChange,
  disabled = false,
}: QuizQuestionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Ionicons name="help-circle" size={16} color={COLORS.accent} />
        <Text style={styles.badgeText}>Quiz</Text>
      </View>
      <Text style={styles.hint}>
        The correct answer will be revealed during the Lowdown
      </Text>

      <View style={styles.options}>
        {options.map((option, index) => {
          const isSelected = value === option;
          const letter = String.fromCharCode(65 + index); // A, B, C, D...

          return (
            <TouchableOpacity
              key={`${option}-${index}`}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
                disabled && styles.disabled,
              ]}
              onPress={() => !disabled && onChange(option)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <View style={[styles.letterBadge, isSelected && styles.letterBadgeSelected]}>
                <Text style={[styles.letter, isSelected && styles.letterSelected]}>
                  {letter}
                </Text>
              </View>
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {option}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color={COLORS.accent} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98120',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 6,
  },
  badgeText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  hint: {
    color: COLORS.muted,
    fontSize: 13,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  optionSelected: {
    backgroundColor: COLORS.bgSelected,
    borderColor: COLORS.borderSelected,
  },
  disabled: {
    opacity: 0.5,
  },
  letterBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterBadgeSelected: {
    backgroundColor: COLORS.accent,
  },
  letter: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  letterSelected: {
    color: '#fff',
  },
  optionText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
});

export default QuizQuestion;
