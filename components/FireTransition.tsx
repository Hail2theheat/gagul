// components/FireTransition.tsx
// Reusable fire-engulfing transition overlay.
// Flames grow from the bottom and consume the screen, then a callback fires.
import React, { useEffect } from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  runOnJS,
} from "react-native-reanimated";

const { width: W, height: H } = Dimensions.get("window");

const FIRE_RED = "#CC2200";
const FIRE_ORANGE = "#FF6B35";
const FIRE_YELLOW = "#FFD93D";
const FIRE_CORE = "#FFFACD";
const EMBER_COLOR = "#FF9F1C";

// Number of flame columns across the screen
const FLAME_COUNT = 12;

interface FireTransitionProps {
  /** Whether to start the fire transition */
  active: boolean;
  /** Called when the screen is fully engulfed (opacity 1) */
  onComplete: () => void;
  /** Duration of the engulf animation in ms (default 1400) */
  duration?: number;
}

/** Single flame tongue that rises from the bottom */
function FlameColumn({
  index,
  active,
  totalDuration,
}: {
  index: number;
  active: boolean;
  totalDuration: number;
}) {
  const rise = useSharedValue(0);
  const flicker = useSharedValue(0);

  const columnWidth = W / FLAME_COUNT;
  // Stagger from center outward
  const center = FLAME_COUNT / 2;
  const distFromCenter = Math.abs(index - center);
  const stagger = distFromCenter * 40; // center flames lead
  // Random height variation
  const heightVariation = 0.85 + Math.random() * 0.3;

  useEffect(() => {
    if (!active) return;

    rise.value = withDelay(
      stagger,
      withTiming(1, {
        duration: totalDuration - stagger,
        easing: Easing.in(Easing.cubic),
      })
    );

    flicker.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 100 + Math.random() * 150 }),
        withTiming(0, { duration: 100 + Math.random() * 150 })
      ),
      -1,
      true
    );
  }, [active]);

  const outerStyle = useAnimatedStyle(() => {
    const flameH = interpolate(rise.value, [0, 1], [0, H * 1.3 * heightVariation]);
    return {
      position: "absolute" as const,
      bottom: 0,
      left: index * columnWidth - 4,
      width: columnWidth + 8,
      height: flameH,
      borderTopLeftRadius: columnWidth * 0.6,
      borderTopRightRadius: columnWidth * 0.6,
      backgroundColor: FIRE_RED,
      opacity: interpolate(rise.value, [0, 0.05, 0.2], [0, 0.7, 1]),
    };
  });

  const midStyle = useAnimatedStyle(() => {
    const flameH = interpolate(rise.value, [0, 1], [0, H * 1.2 * heightVariation]);
    return {
      position: "absolute" as const,
      bottom: 0,
      left: index * columnWidth - 1,
      width: columnWidth + 2,
      height: flameH * 0.85,
      borderTopLeftRadius: columnWidth * 0.5,
      borderTopRightRadius: columnWidth * 0.5,
      backgroundColor: FIRE_ORANGE,
      opacity: interpolate(rise.value, [0, 0.1, 0.3], [0, 0.5, 1]),
    };
  });

  const innerStyle = useAnimatedStyle(() => {
    const flameH = interpolate(rise.value, [0, 1], [0, H * 1.1 * heightVariation]);
    const flickerScale = interpolate(flicker.value, [0, 1], [0.92, 1.08]);
    return {
      position: "absolute" as const,
      bottom: 0,
      left: index * columnWidth + 2,
      width: columnWidth - 4,
      height: flameH * 0.7,
      borderTopLeftRadius: columnWidth * 0.4,
      borderTopRightRadius: columnWidth * 0.4,
      backgroundColor: FIRE_YELLOW,
      opacity: interpolate(rise.value, [0, 0.15, 0.4], [0, 0.3, 1]),
      transform: [{ scaleX: flickerScale }],
    };
  });

  return (
    <>
      <Animated.View style={outerStyle} />
      <Animated.View style={midStyle} />
      <Animated.View style={innerStyle} />
    </>
  );
}

/** Rising ember particle */
function Ember({ active, delay }: { active: boolean; delay: number }) {
  const y = useSharedValue(0);
  const x = useSharedValue(0);
  const opacity = useSharedValue(0);
  const startX = Math.random() * W;
  const size = 2 + Math.random() * 4;

  useEffect(() => {
    if (!active) return;

    y.value = withDelay(
      delay,
      withTiming(-H * 0.4, { duration: 2000 + Math.random() * 1000 })
    );
    x.value = withDelay(
      delay,
      withTiming((Math.random() - 0.5) * 60, { duration: 2000 })
    );
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 1700 + Math.random() * 1000 })
      )
    );
  }, [active]);

  const style = useAnimatedStyle(() => ({
    position: "absolute" as const,
    bottom: 0,
    left: startX,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: EMBER_COLOR,
    opacity: opacity.value,
    transform: [{ translateY: y.value }, { translateX: x.value }],
  }));

  return <Animated.View style={style} />;
}

export function FireTransition({
  active,
  onComplete,
  duration = 1400,
}: FireTransitionProps) {
  // Overall screen-fill overlay
  const fill = useSharedValue(0);

  useEffect(() => {
    if (!active) return;

    fill.value = withDelay(
      duration * 0.6,
      withTiming(1, {
        duration: duration * 0.5,
        easing: Easing.in(Easing.quad),
      }, (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      })
    );
  }, [active]);

  const overlayStyle = useAnimatedStyle(() => ({
    ...StyleSheet.absoluteFillObject,
    backgroundColor: FIRE_RED,
    opacity: fill.value,
    zIndex: fill.value > 0 ? 100 : -1,
  }));

  if (!active) return null;

  const flames = Array.from({ length: FLAME_COUNT }, (_, i) => i);
  const embers = Array.from({ length: 15 }, (_, i) => i);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Flame columns */}
      {flames.map((i) => (
        <FlameColumn
          key={i}
          index={i}
          active={active}
          totalDuration={duration}
        />
      ))}

      {/* Embers */}
      {embers.map((i) => (
        <Ember key={`e-${i}`} active={active} delay={200 + i * 60} />
      ))}

      {/* Solid fill overlay */}
      <Animated.View style={overlayStyle} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});
