/**
 * CounterInput - tap-to-increment counter for "Rate the Cruise" style prompts
 * Stores count as string to match ShortTextInput API (value/onChangeText)
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SPRING_BOUNCY } from '../../constants/animations';
import { CampfireColors, Radii } from '../../constants/theme';

const MAX_COUNT = 9999;

interface CounterInputProps {
  value: string;
  onChangeText: (text: string) => void;
  disabled?: boolean;
}

export function CounterInput({ value, onChangeText, disabled = false }: CounterInputProps) {
  const count = value ? parseInt(value, 10) || 0 : 0;
  const atMax = count >= MAX_COUNT;

  const numberScale = useSharedValue(1);
  const numberAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numberScale.value }],
  }));

  const buttonScale = useSharedValue(1);
  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleTap = () => {
    if (disabled || atMax) return;

    const next = count + 1;
    onChangeText(String(next));

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    numberScale.value = withSpring(1.15, SPRING_BOUNCY);
    setTimeout(() => {
      numberScale.value = withSpring(1, SPRING_BOUNCY);
    }, 80);
  };

  return (
    <View style={styles.container}>
      <Animated.View style={numberAnimStyle}>
        <Text style={styles.number}>{count}</Text>
      </Animated.View>

      {atMax && <Text style={styles.maxLabel}>MAX!</Text>}

      <Animated.View style={buttonAnimStyle}>
        <Pressable
          style={[
            styles.button,
            (disabled || atMax) && styles.buttonDisabled,
          ]}
          onPress={handleTap}
          onPressIn={() => { buttonScale.value = withSpring(0.92, SPRING_BOUNCY); }}
          onPressOut={() => { buttonScale.value = withSpring(1, SPRING_BOUNCY); }}
          disabled={disabled || atMax}
          accessibilityRole="button"
          accessibilityLabel="Increment counter"
        >
          <Text style={[
            styles.buttonText,
            (disabled || atMax) && styles.buttonTextDisabled,
          ]}>+</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  number: {
    fontSize: 52,
    fontFamily: 'Paaxel',
    color: CampfireColors.TEXT,
    textShadowColor: 'rgba(255, 107, 53, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    textAlign: 'center',
  },
  maxLabel: {
    fontSize: 14,
    fontFamily: 'Paaxel',
    color: CampfireColors.FIRE_YELLOW,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: Radii.circle,
    backgroundColor: CampfireColors.BTN_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: CampfireColors.BTN_PRIMARY + '50',
  },
  buttonText: {
    fontSize: 36,
    fontFamily: 'Paaxel',
    color: CampfireColors.TEXT,
    lineHeight: 40,
  },
  buttonTextDisabled: {
    opacity: 0.5,
  },
});

export default CounterInput;
