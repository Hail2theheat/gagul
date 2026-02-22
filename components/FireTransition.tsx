// components/FireTransition.tsx
// REDESIGNED: Crackling pixel fire that starts at campfire and rises to consume the screen
// Pixelated blocks, floating embers, organic growth pattern
import React, { useEffect, useMemo } from "react";
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

import { CampfireColors } from "../constants/theme";

const FIRE_RED = CampfireColors.FIRE_RED;
const FIRE_ORANGE = CampfireColors.FIRE_ORANGE;
const FIRE_YELLOW = CampfireColors.FIRE_YELLOW;
const FIRE_CORE = CampfireColors.FIRE_CORE;
const EMBER_COLOR = CampfireColors.EMBER;

// Pixel block size (4-6px for finer detail, 16-24 bit aesthetic)
const PIXEL_SIZE = 5;

interface FireTransitionProps {
  /** Whether to start the fire transition */
  active: boolean;
  /** Called when the screen is fully engulfed (opacity 1) */
  onComplete: () => void;
  /** Duration of the engulf animation in ms (default 1400) */
  duration?: number;
}

/** Single pixel fire block */
function FirePixel({
  x,
  y,
  color,
  delay,
  active,
  crackleDelay,
}: {
  x: number;
  y: number;
  color: string;
  delay: number;
  active: boolean;
  crackleDelay: number;
}) {
  const opacity = useSharedValue(0);
  const crackle = useSharedValue(1);

  useEffect(() => {
    if (!active) return;

    // Fade in faster
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 100, easing: Easing.out(Easing.quad) })
    );

    // Crackling effect (appear/disappear quickly)
    crackle.value = withDelay(
      delay + crackleDelay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 80 + Math.random() * 100 }),
          withTiming(0.6, { duration: 60 + Math.random() * 80 }),
          withTiming(1, { duration: 90 + Math.random() * 110 }),
          withTiming(0.75, { duration: 70 + Math.random() * 90 })
        ),
        -1,
        true
      )
    );
  }, [active]);

  const style = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: x,
    bottom: y,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: color,
    opacity: opacity.value * crackle.value,
  }));

  return <Animated.View style={style} />;
}

/** Floating ember with glow */
function FloatingEmber({
  active,
  delay,
  startX,
  startY,
}: {
  active: boolean;
  delay: number;
  startX: number;
  startY: number;
}) {
  const y = useSharedValue(0);
  const x = useSharedValue(0);
  const opacity = useSharedValue(0);
  const flicker = useSharedValue(0);
  const size = 3 + Math.random() * 5;

  useEffect(() => {
    if (!active) return;

    const drift = (Math.random() - 0.5) * 80;
    const riseAmount = H * 0.5 + Math.random() * H * 0.3;

    y.value = withDelay(
      delay,
      withTiming(riseAmount, {
        duration: 1800 + Math.random() * 1200,
        easing: Easing.out(Easing.quad),
      })
    );
    x.value = withDelay(
      delay,
      withTiming(drift, {
        duration: 2000 + Math.random() * 1000,
        easing: Easing.inOut(Easing.sin),
      })
    );
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(1, { duration: 800 }),
        withTiming(0, { duration: 1000 + Math.random() * 800 })
      )
    );
    flicker.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 200 + Math.random() * 150 }),
          withTiming(0.5, { duration: 180 + Math.random() * 120 })
        ),
        -1,
        true
      )
    );
  }, [active]);

  const style = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: startX,
    bottom: startY,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: EMBER_COLOR,
    opacity: opacity.value * flicker.value,
    shadowColor: FIRE_ORANGE,
    shadowOpacity: flicker.value * 0.8,
    shadowRadius: size * 2,
    transform: [{ translateY: -y.value }, { translateX: x.value }],
  }));

  return <Animated.View style={style} />;
}

export function FireTransition({
  active,
  onComplete,
  duration = 800,
}: FireTransitionProps) {
  // Generate pixel fire pattern (jagged, organic shapes)
  const firePixels = useMemo(() => {
    const pixels: Array<{
      x: number;
      y: number;
      color: string;
      delay: number;
      crackleDelay: number;
    }> = [];

    const centerX = W / 2;
    const cols = Math.ceil(W / PIXEL_SIZE) + 2;
    const rows = Math.ceil(H / PIXEL_SIZE / 2); // Only half the rows for speed

    // Build from bottom up, starting concentrated at center (campfire)
    for (let row = 0; row < rows; row++) {
      const rowProgress = row / rows; // 0 at bottom, 1 at top
      const baseDelay = rowProgress * duration * 0.2; // Even faster: 0.3 → 0.2

      // Width spreads as we go up
      const spreadFactor = Math.pow(rowProgress, 0.4); // Slow spread at first, then wider
      const maxSpread = cols / 2;
      const spread = Math.ceil(2 + maxSpread * spreadFactor);

      for (let col = -spread; col <= spread; col++) {
        const x = centerX + col * PIXEL_SIZE - PIXEL_SIZE / 2;
        const y = row * PIXEL_SIZE * 2; // Double spacing since we halved rows

        // Skip even more pixels for speed
        const skipChance = rowProgress * 0.55 + Math.random() * 0.40;
        if (Math.random() < skipChance) continue;

        // Distance from center column (for color variation)
        const distFromCenter = Math.abs(col) / spread;

        // Choose color based on position (center = hotter)
        let color: string;
        const randColor = Math.random();
        if (distFromCenter < 0.3 && rowProgress < 0.5) {
          // Core: white-hot
          color = randColor > 0.6 ? FIRE_CORE : FIRE_YELLOW;
        } else if (distFromCenter < 0.6) {
          // Mid: yellow-orange
          color = randColor > 0.5 ? FIRE_YELLOW : FIRE_ORANGE;
        } else {
          // Edges: orange-red
          color = randColor > 0.5 ? FIRE_ORANGE : FIRE_RED;
        }

        // Much shorter delays for speed
        const distDelay = distFromCenter * 40 * rowProgress; // Reduced from 200 to 40
        const jitter = Math.random() * 30; // Reduced from 120 to 30

        pixels.push({
          x,
          y,
          color,
          delay: baseDelay + distDelay + jitter,
          crackleDelay: Math.random() * 200, // Reduced from 500 to 200
        });
      }
    }

    return pixels;
  }, [duration]);

  // Generate embers (lots of them)
  const embers = useMemo(() => {
    const result: Array<{ startX: number; startY: number; delay: number }> = [];
    const emberCount = 50;

    for (let i = 0; i < emberCount; i++) {
      result.push({
        startX: W * 0.3 + Math.random() * W * 0.4, // Concentrated at center
        startY: Math.random() * 40, // Near bottom
        delay: i * 40 + Math.random() * 300,
      });
    }

    return result;
  }, []);

  // Overall screen-fill overlay (final fade to solid)
  const fill = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      console.log('[FIRE] FireTransition not active, skipping');
      return;
    }

    const startTime = Date.now();
    console.log(`[FIRE] FireTransition starting at ${startTime}, duration: ${duration}ms`);
    fill.value = withDelay(
      duration * 0.2, // Delay: 100ms
      withTiming(
        1,
        {
          duration: duration * 0.4, // Animation: 200ms
          easing: Easing.in(Easing.quad),
        },
        (finished) => {
          const elapsed = Date.now() - startTime;
          console.log(`[FIRE] FireTransition animation finished after ${elapsed}ms:`, finished);
          if (finished) {
            runOnJS(onComplete)();
          }
        }
      )
    );
  }, [active, duration, onComplete]);

  const overlayStyle = useAnimatedStyle(() => ({
    ...StyleSheet.absoluteFillObject,
    backgroundColor: FIRE_ORANGE,
    opacity: fill.value,
    zIndex: 1000, // Always on top of fire pixels
  }));

  if (!active) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Simple fade overlay - NO fire pixels for speed */}
      <Animated.View style={overlayStyle} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999, // Higher than all splash elements
    elevation: 999, // Android elevation
  },
});
