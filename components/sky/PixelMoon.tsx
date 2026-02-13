import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { CampfireColors } from '../../constants/theme';
import { Durations } from '../../constants/animations';

interface PixelMoonProps {
  /** Background color behind the moon shadow (for crescent effect) */
  bgColor?: string;
}

export function PixelMoon({ bgColor = '#080E1C' }: PixelMoonProps) {
  const glow = useSharedValue(0.5);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: Durations.MOON_PULSE }),
        withTiming(0.5, { duration: Durations.MOON_PULSE }),
      ),
      -1,
    );
  }, []);

  const hazeStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: -24,
    right: -24,
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: CampfireColors.MOON_GLOW,
    opacity: interpolate(glow.value, [0.5, 0.7], [0.06, 0.12]),
  }));

  return (
    <View style={{ position: 'absolute', top: 50, right: 35 }}>
      {/* Outer haze */}
      <Animated.View style={hazeStyle} />
      {/* Main moon body */}
      <View
        style={{
          width: 60,
          height: 60,
          backgroundColor: CampfireColors.MOON,
          borderRadius: 30,
          overflow: 'hidden',
          shadowColor: CampfireColors.MOON,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 25,
        }}
      >
        {/* Shadow circle creates crescent */}
        <View
          style={{
            position: 'absolute',
            top: -10,
            right: -16,
            width: 56,
            height: 56,
            backgroundColor: bgColor,
            borderRadius: 28,
          }}
        />
        {/* Surface craters */}
        <View style={{ position: 'absolute', top: 14, left: 6, width: 6, height: 6, backgroundColor: '#EEE8AA', borderRadius: 3, opacity: 0.4 }} />
        <View style={{ position: 'absolute', top: 30, left: 12, width: 4, height: 4, backgroundColor: '#EEE8AA', borderRadius: 2, opacity: 0.3 }} />
        <View style={{ position: 'absolute', top: 42, left: 5, width: 5, height: 5, backgroundColor: '#EEE8AA', borderRadius: 2.5, opacity: 0.2 }} />
        <View style={{ position: 'absolute', top: 22, left: 3, width: 3, height: 3, backgroundColor: '#FFF5CD', borderRadius: 1.5, opacity: 0.5 }} />
      </View>
    </View>
  );
}
