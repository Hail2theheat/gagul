/**
 * DriftingClouds - Slow-moving clouds for atmospheric depth
 * DESIGN.md §15.3: Cloud drift animation
 *
 * Features:
 * - Multiple cloud layers at different speeds (parallax)
 * - Infinite loop animation
 * - Pixel-style cloud shapes
 * - Semi-transparent for subtle effect
 */

import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { CampfireColors } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CloudProps {
  /** Starting X position */
  startX: number;
  /** Y position from top */
  y: number;
  /** Drift duration in ms (slower = further away) */
  duration: number;
  /** Cloud size multiplier */
  scale: number;
  /** Opacity (0-1) */
  opacity: number;
  /** Initial delay before starting */
  delay?: number;
}

function Cloud({ startX, y, duration, scale, opacity, delay = 0 }: CloudProps) {
  const x = useSharedValue(startX);

  useEffect(() => {
    // Drift from left to right, then reset
    x.value = withRepeat(
      withTiming(SCREEN_WIDTH + 100, {
        duration,
        easing: Easing.linear,
      }),
      -1, // Infinite
      false
    );
  }, [duration]);

  const cloudStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  return (
    <Animated.View
      style={[
        cloudStyle,
        {
          position: 'absolute',
          top: y,
          left: -100,
        },
      ]}
    >
      {/* Pixel cloud shape - 3 overlapping circles */}
      <View style={{ transform: [{ scale }], opacity }}>
        {/* Left puff */}
        <View
          style={{
            width: 24,
            height: 16,
            backgroundColor: CampfireColors.CLOUD,
            borderRadius: 12,
            position: 'absolute',
            top: 4,
            left: 0,
          }}
        />
        {/* Center puff (tallest) */}
        <View
          style={{
            width: 28,
            height: 20,
            backgroundColor: CampfireColors.CLOUD,
            borderRadius: 14,
            position: 'absolute',
            top: 0,
            left: 16,
          }}
        />
        {/* Right puff */}
        <View
          style={{
            width: 26,
            height: 18,
            backgroundColor: CampfireColors.CLOUD,
            borderRadius: 13,
            position: 'absolute',
            top: 2,
            left: 34,
          }}
        />
      </View>
    </Animated.View>
  );
}

interface DriftingCloudsProps {
  /** Number of cloud layers */
  layers?: number;
}

export function DriftingClouds({ layers = 3 }: DriftingCloudsProps) {
  // Generate cloud configurations for each layer
  const clouds = [
    // Far layer (slow, small, faint)
    { startX: -80, y: 30, duration: 120000, scale: 0.6, opacity: 0.15, delay: 0 },
    { startX: SCREEN_WIDTH * 0.4, y: 55, duration: 130000, scale: 0.7, opacity: 0.12, delay: 5000 },
    { startX: SCREEN_WIDTH * 0.7, y: 42, duration: 125000, scale: 0.65, opacity: 0.14, delay: 12000 },

    // Mid layer (medium speed, medium size/opacity)
    { startX: -100, y: 70, duration: 90000, scale: 0.8, opacity: 0.18, delay: 8000 },
    { startX: SCREEN_WIDTH * 0.5, y: 85, duration: 95000, scale: 0.85, opacity: 0.16, delay: 15000 },

    // Near layer (faster, larger, more visible)
    { startX: -120, y: 100, duration: 70000, scale: 1.0, opacity: 0.22, delay: 3000 },
    { startX: SCREEN_WIDTH * 0.3, y: 115, duration: 75000, scale: 1.1, opacity: 0.20, delay: 20000 },
  ];

  return (
    <>
      {clouds.slice(0, layers * 2 + 1).map((cloud, i) => (
        <Cloud
          key={`cloud-${i}`}
          startX={cloud.startX}
          y={cloud.y}
          duration={cloud.duration}
          scale={cloud.scale}
          opacity={cloud.opacity}
          delay={cloud.delay}
        />
      ))}
    </>
  );
}

export default DriftingClouds;
