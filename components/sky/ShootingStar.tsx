import React, { useEffect, useCallback } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Durations } from '../../constants/animations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ShootingStarProps {
  delay: number;
}

export function ShootingStar({ delay }: ShootingStarProps) {
  const progress = useSharedValue(0);
  const visible = useSharedValue(0);

  const startY = 20 + Math.random() * 100;
  const startX = 30 + Math.random() * (SCREEN_WIDTH * 0.6);
  const length = 100 + Math.random() * 80;

  const triggerAnimation = useCallback(() => {
    visible.value = 1;
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: Durations.SHOOTING_STAR + Math.random() * 500,
    }, (finished) => {
      if (finished) {
        visible.value = 0;
        runOnJS(scheduleNext)();
      }
    });
  }, []);

  const scheduleNext = useCallback(() => {
    const nextDelay = 5000 + Math.random() * 10000;
    setTimeout(triggerAnimation, nextDelay);
  }, [triggerAnimation]);

  useEffect(() => {
    const timer = setTimeout(triggerAnimation, delay);
    return () => clearTimeout(timer);
  }, []);

  const trailStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    width: length,
    height: 2,
    opacity: visible.value * interpolate(
      progress.value,
      [0, 0.2, 0.6, 1],
      [0, 0.9, 0.5, 0],
    ),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, 140]) },
      { translateY: interpolate(progress.value, [0, 1], [0, 90]) },
      { rotate: '33deg' },
    ],
  }));

  const headStyle = useAnimatedStyle(() => ({
    width: 5,
    height: 5,
    backgroundColor: '#FFFFF0',
    borderRadius: 2.5,
    opacity: visible.value * interpolate(
      progress.value,
      [0, 0.1, 0.7, 1],
      [0, 1, 1, 0],
    ),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, 140 + length]) },
      { translateY: interpolate(progress.value, [0, 1], [0, 90 + length * 0.55]) },
    ],
    shadowColor: '#FFF8E0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  }));

  return (
    <View style={{ position: 'absolute', left: startX, top: startY }}>
      <Animated.View style={trailStyle}>
        <View style={{ position: 'absolute', right: 0, width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
        <View style={{ position: 'absolute', right: 0, width: '70%', height: 2, backgroundColor: 'rgba(255,240,200,0.35)' }} />
        <View style={{ position: 'absolute', right: 0, width: '40%', height: 2, backgroundColor: 'rgba(255,255,240,0.7)' }} />
        <View style={{ position: 'absolute', right: 0, width: '15%', height: 2, backgroundColor: '#FFFFF0' }} />
      </Animated.View>
      <Animated.View style={headStyle} />
    </View>
  );
}
