/**
 * Reusable Button component
 * DESIGN.md §10: Primary CTA with spring physics, haptic feedback, and warm tactile feel
 */

import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CampfireColors, Typography } from '../../constants/theme';
import { SPRING_SNAPPY } from '../../constants/animations';

const COLORS = {
  bg: CampfireColors.BTN_PRIMARY,
  text: CampfireColors.TEXT,
  border: CampfireColors.BORDER,
};

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'solid' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'solid',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const isSolid = variant === 'solid';
  const isDisabled = disabled || loading;

  // Spring physics animation (DESIGN.md §10)
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!isDisabled) {
      scale.value = withSpring(0.96, SPRING_SNAPPY);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handlePressOut = () => {
    if (!isDisabled) {
      scale.value = withSpring(1, SPRING_SNAPPY);
    }
  };

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.button,
          isSolid ? styles.solid : styles.outline,
          isDisabled && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.text} />
        ) : (
          <Text style={styles.text}>{title}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    // DESIGN.md §10: padding 14v × 16h, borderRadius 14
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solid: {
    backgroundColor: COLORS.bg, // #FF6B35
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: COLORS.border, // #2a3f5f
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    // DESIGN.md §10: Typography.button (fontSize 16, letterSpacing 0.5, Paaxel, weight 800)
    ...Typography.button,
    color: COLORS.text, // #FFF5E4
    textAlign: 'center',
    fontWeight: '800',
  },
});

export default Button;
