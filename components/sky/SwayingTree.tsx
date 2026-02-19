/**
 * SwayingTree - Adds gentle wind sway to forest trees
 * DESIGN.md §15.1: Trees sway with staggered timing for organic forest feel
 *
 * Sway characteristics:
 * - Depth-based speed: Far trees (shade 0-1) slower, near trees (shade 2-3) faster
 * - Rotation: ±1-3 degrees based on height (taller = more sway)
 * - Staggered: Random initial offset prevents synchronized motion
 * - Sine wave: Smooth, natural back-and-forth
 */

import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface SwayingTreeProps {
  /** Tree height (affects sway amount - taller = more sway) */
  height: number;
  /** Depth shade (0=farthest, 3=nearest) - affects speed */
  shade: number;
  /** Random seed for stagger (0-1) */
  stagger?: number;
  /** Children: the static tree rendering */
  children: React.ReactNode;
}

export function SwayingTree({
  height,
  shade,
  stagger = Math.random(),
  children,
}: SwayingTreeProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    // DESIGN.md §15.1: Depth-based timing (far = slower, near = faster)
    // Shade 0 (farthest): 4-5s cycle
    // Shade 1 (far): 3.5-4.5s cycle
    // Shade 2 (near): 3-4s cycle
    // Shade 3 (nearest): 2.5-3.5s cycle
    const baseDuration = 4500 - shade * 600;
    const randomVariation = (Math.random() - 0.5) * 800; // ±400ms
    const duration = baseDuration + randomVariation;

    // DESIGN.md §15.1: Height-based sway amount (taller = more movement)
    // Small trees (50-80px): ±1-1.5°
    // Medium trees (80-120px): ±1.5-2.5°
    // Tall trees (120-160px): ±2-3°
    const swayAmount = Math.min(3, 1 + (height / 60));

    // Stagger initial phase to prevent synchronized swaying
    const initialDelay = stagger * 2000; // 0-2s initial offset

    // Start with random direction (some trees lean left first, others right)
    const startDirection = Math.random() > 0.5 ? 1 : -1;

    rotation.value = withRepeat(
      withSequence(
        withTiming(startDirection * swayAmount, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.sine),
        }),
        withTiming(-startDirection * swayAmount, {
          duration: duration,
          easing: Easing.inOut(Easing.sine),
        }),
        withTiming(startDirection * swayAmount, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.sine),
        })
      ),
      -1,
      false
    );
  }, [height, shade, stagger]);

  const swayStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
    ],
    transformOrigin: 'bottom center', // Pivot from base of tree
  }));

  return (
    <Animated.View style={swayStyle}>
      {children}
    </Animated.View>
  );
}

export default SwayingTree;
