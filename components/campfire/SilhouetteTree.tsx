// components/campfire/SilhouetteTree.tsx
// Shared silhouette pine tree for backgrounds, splash screens, and fireside scenes.
// Replaces SplashTree (AnimatedSplash, FiresideIntro) and PixelTree (lowdown).
// DESIGN.md §15.1: Trees sway gently in the wind

import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface SilhouetteTreeProps {
  x: number;
  height: number;
  /** Shade level (higher = brighter green) */
  shade: number;
  /** Enable sway animation (default true) */
  animate?: boolean;
}

export function SilhouetteTree({ x, height, shade, animate = true }: SilhouetteTreeProps) {
  const g = 12 + shade * 8;
  const color = `rgb(${g - 2}, ${g + 10}, ${g - 4})`;
  const trunkW = Math.max(3, height * 0.06);
  const trunkColor = `rgb(${30 + shade * 5}, ${20 + shade * 3}, ${15 + shade * 2})`;

  // DESIGN.md §15.1: Gentle sway animation
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (!animate) return;

    // Taller trees sway more (±1-2.5 degrees based on height)
    const swayAmount = Math.min(2.5, 0.8 + (height / 80));

    // Duration based on height (taller = slightly slower)
    const duration = 3000 + (height / 100) * 1000;

    // Random initial direction
    const startDirection = Math.random() > 0.5 ? 1 : -1;

    rotation.value = withRepeat(
      withSequence(
        withTiming(startDirection * swayAmount, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(-startDirection * swayAmount, {
          duration,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(startDirection * swayAmount, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1,
      false
    );
  }, [height, animate]);

  const swayStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const TreeContent = (
    <View style={{ position: "relative", alignItems: "center" }}>
      {/* Trunk */}
      <View
        style={{
          width: trunkW,
          height: height * 0.15,
          backgroundColor: trunkColor,
        }}
      />
      {/* Bottom tier */}
      <View
        style={{
          position: "absolute",
          bottom: height * 0.1,
          width: 0,
          height: 0,
          borderLeftWidth: height * 0.3,
          borderRightWidth: height * 0.3,
          borderBottomWidth: height * 0.35,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: color,
        }}
      />
      {/* Middle tier */}
      <View
        style={{
          position: "absolute",
          bottom: height * 0.28,
          width: 0,
          height: 0,
          borderLeftWidth: height * 0.24,
          borderRightWidth: height * 0.24,
          borderBottomWidth: height * 0.3,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: color,
        }}
      />
      {/* Top tier */}
      <View
        style={{
          position: "absolute",
          bottom: height * 0.45,
          width: 0,
          height: 0,
          borderLeftWidth: height * 0.18,
          borderRightWidth: height * 0.18,
          borderBottomWidth: height * 0.28,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: color,
        }}
      />
    </View>
  );

  return (
    <View style={{ position: "absolute", bottom: 0, left: x }}>
      {animate ? (
        <Animated.View style={swayStyle}>
          {TreeContent}
        </Animated.View>
      ) : (
        TreeContent
      )}
    </View>
  );
}

export default SilhouetteTree;
