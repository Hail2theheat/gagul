/**
 * MultipleChoice - radio button selection for multiple choice prompts
 * Supports both regular options and "Most Likely To..." with friend avatars
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { SPRING_SNAPPY } from '../../constants/animations';
import { CampfireColors } from '../../constants/theme';
import { PixelCharacter, CharacterConfig, DEFAULT_CHARACTER } from '../PixelCharacter';
import type { GroupMember } from '../../lib/types/prompts';

// Theme colors
const COLORS = {
  bg: CampfireColors.BG,
  bgSelected: CampfireColors.BTN_PRIMARY + '20',
  border: CampfireColors.BORDER,
  borderSelected: CampfireColors.BTN_PRIMARY,
  text: CampfireColors.TEXT,
  muted: CampfireColors.MUTED,
};

// Animated option with press scale feedback
function AnimatedOption({ children, onPress, disabled, style }: {
  children: React.ReactNode;
  onPress: () => void;
  disabled: boolean;
  style: any[];
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animStyle}>
      <Pressable
        style={style}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => { scale.value = withSpring(0.97, SPRING_SNAPPY); }}
        onPressOut={() => { scale.value = withSpring(1, SPRING_SNAPPY); }}
        disabled={disabled}
        accessibilityRole="radio"
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

interface MultipleChoiceProps {
  options: string[];
  value: string | null;
  onChange: (option: string) => void;
  disabled?: boolean;
  // For "Most Likely To..." prompts
  isMostLikely?: boolean;
  groupMembers?: GroupMember[];
}

export function MultipleChoice({
  options,
  value,
  onChange,
  disabled = false,
  isMostLikely = false,
  groupMembers = [],
}: MultipleChoiceProps) {
  // For "Most Likely To..." prompts, use group members as options
  if (isMostLikely && groupMembers.length > 0) {
    return (
      <View style={styles.container}>
        {groupMembers.map((member) => {
          const isSelected = value === member.user_id;
          return (
            <AnimatedOption
              key={member.user_id}
              style={[
                styles.option,
                styles.optionWithAvatar,
                isSelected && styles.optionSelected,
                disabled && styles.disabled,
              ]}
              onPress={() => onChange(member.user_id)}
              disabled={disabled}
            >
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                <PixelCharacter
                  config={(member.avatar_config as unknown as CharacterConfig) || DEFAULT_CHARACTER}
                  size={32}
                />
              </View>

              {/* Username */}
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {member.username || 'Unknown'}
              </Text>

              {/* Checkmark */}
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
            </AnimatedOption>
          );
        })}
      </View>
    );
  }

  // Regular multiple choice
  return (
    <View style={styles.container}>
      {options.map((option, index) => {
        const isSelected = value === option;
        return (
          <AnimatedOption
            key={`${option}-${index}`}
            style={[
              styles.option,
              isSelected && styles.optionSelected,
              disabled && styles.disabled,
            ]}
            onPress={() => onChange(option)}
            disabled={disabled}
          >
            <View style={[styles.radio, isSelected && styles.radioSelected]}>
              {isSelected && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
              {option}
            </Text>
          </AnimatedOption>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  optionWithAvatar: {
    padding: 12,
  },
  optionSelected: {
    backgroundColor: COLORS.bgSelected,
    borderColor: COLORS.borderSelected,
  },
  disabled: {
    opacity: 0.5,
  },
  avatarContainer: {
    width: 40,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: COLORS.borderSelected,
    borderColor: COLORS.borderSelected,
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

export default MultipleChoice;
