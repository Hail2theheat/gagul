import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { Durations } from '../../constants/animations';

interface PixelStarProps {
  x: number;
  y: number;
  size: number;
  delay: number;
  color?: string;
}

export function PixelStar({ x, y, size, delay, color = '#FFF' }: PixelStarProps) {
  const opacity = useSharedValue(0.15);
  const scale = useSharedValue(1);

  useEffect(() => {
    const dur = Durations.STAR_TWINKLE_MIN + Math.random() * (Durations.STAR_TWINKLE_MAX - Durations.STAR_TWINKLE_MIN);

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.9, { duration: dur }),
          withTiming(0.15, { duration: dur * 1.2 }),
        ),
        -1,
      ),
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: dur }),
          withTiming(1, { duration: dur }),
        ),
        -1,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // Cross-shaped star for larger sizes
  if (size >= 3) {
    return (
      <Animated.View style={[{ position: 'absolute', left: x, top: y }, animStyle]}>
        <View style={{ width: size, height: size, backgroundColor: color, position: 'absolute' }} />
        <View style={{ width: size * 0.5, height: size * 0.5, backgroundColor: color, position: 'absolute', top: -size * 0.4, left: size * 0.25 }} />
        <View style={{ width: size * 0.5, height: size * 0.5, backgroundColor: color, position: 'absolute', bottom: -size * 0.4, left: size * 0.25 }} />
        <View style={{ width: size * 0.5, height: size * 0.5, backgroundColor: color, position: 'absolute', left: -size * 0.4, top: size * 0.25 }} />
        <View style={{ width: size * 0.5, height: size * 0.5, backgroundColor: color, position: 'absolute', right: -size * 0.4, top: size * 0.25 }} />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: size / 2,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: size * 2,
        },
        animStyle,
      ]}
    />
  );
}
