/**
 * GhostCamper - Rare translucent character easter egg
 * DESIGN.md §15.2: Ghost campers that occasionally appear in forest
 *
 * Features:
 * - 5% chance to spawn per screen load
 * - Translucent pixel character (30% opacity)
 * - Slow drift across screen (15-25 seconds)
 * - Gentle fade in/out
 * - Random vertical position in forest zone
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { PixelCharacter, CharacterConfig } from '../PixelCharacter';

interface GhostCamperProps {
  /** Screen width for positioning */
  screenWidth: number;
  /** Starting Y position (top offset) */
  startY: number;
  /** Character configuration */
  config: CharacterConfig;
  /** Delay before appearing (ms) */
  delay?: number;
  /** Callback when ghost finishes drifting */
  onComplete?: () => void;
}

export function GhostCamper({
  screenWidth,
  startY,
  config,
  delay = 0,
  onComplete,
}: GhostCamperProps) {
  const x = useSharedValue(-60); // Start off-screen left
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Drift duration: 15-25 seconds for a slow, eerie movement
    const driftDuration = 15000 + Math.random() * 10000;

    // Phase 1: Fade in (2s)
    opacity.value = withDelay(
      delay,
      withTiming(0.3, { duration: 2000, easing: Easing.out(Easing.quad) })
    );

    // Phase 2: Drift across screen
    x.value = withDelay(
      delay,
      withTiming(
        screenWidth + 60, // End off-screen right
        { duration: driftDuration, easing: Easing.linear },
        (finished) => {
          if (finished) {
            // Phase 3: Fade out (2s)
            opacity.value = withTiming(0, { duration: 2000 }, (finished) => {
              if (finished && onComplete) {
                runOnJS(onComplete)();
              }
            });
          }
        }
      )
    );
  }, [delay, screenWidth]);

  const ghostStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        ghostStyle,
        {
          position: 'absolute',
          top: startY,
          left: 0,
        },
      ]}
    >
      <PixelCharacter config={config} size={40} />
    </Animated.View>
  );
}

export default GhostCamper;
