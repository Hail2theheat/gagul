// components/PixelArt.tsx
// Stardew Valley / Terraria inspired pixel art components
// More organic, hand-drawn style with proper shading

import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { CampfireColors } from "../constants/theme";

const C = CampfireColors;

// ===== BONFIRE =====
// Cozy campfire with flickering flames, glowing embers, and log details
interface BonfireProps {
  size?: number;
  showSmoke?: boolean;
  level?: number; // 1-5, affects fire intensity (default 2)
}

const LEVEL_SCALES = [0.8, 1.0, 1.2, 1.35, 1.5];

export function DetailedCampfire({ size = 80, showSmoke = true, level = 2 }: BonfireProps) {
  const clampedLevel = Math.max(1, Math.min(5, level));
  const levelScale = LEVEL_SCALES[clampedLevel - 1];
  const effectiveSize = size * levelScale;
  const scale = effectiveSize / 80; // Base size is 80
  const forceSmoke = clampedLevel >= 4;
  const showSmokeResolved = showSmoke || forceSmoke;

  // Animation values
  const flame1 = useSharedValue(0);
  const flame2 = useSharedValue(0);
  const flame3 = useSharedValue(0);
  const glow = useSharedValue(0.4);
  const ember1 = useSharedValue(0);
  const ember2 = useSharedValue(0);
  const ember3 = useSharedValue(0);
  const ember4 = useSharedValue(0);
  // Extra embers for level 3+
  const ember5 = useSharedValue(0);
  const ember6 = useSharedValue(0);
  const smoke1Val = useSharedValue(0);
  const smoke2Val = useSharedValue(0);

  useEffect(() => {
    // Flame flicker - different speeds for each flame
    flame1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0.7, { duration: 200 }),
        withTiming(1, { duration: 180 }),
        withTiming(0.5, { duration: 170 })
      ),
      -1, false
    );

    flame2.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 200 }),
        withTiming(1, { duration: 150 }),
        withTiming(0.6, { duration: 180 }),
        withTiming(0.9, { duration: 160 })
      ),
      -1, false
    );

    flame3.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 170 }),
        withTiming(0.5, { duration: 190 }),
        withTiming(1, { duration: 160 }),
        withTiming(0.7, { duration: 180 })
      ),
      -1, false
    );

    // Glow pulse
    glow.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1, true
    );

    // Rising embers (0->1 progress, looped)
    ember1.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.linear }), -1, false);
    ember2.value = withDelay(700, withRepeat(withTiming(1, { duration: 2500, easing: Easing.linear }), -1, false));
    ember3.value = withDelay(1400, withRepeat(withTiming(1, { duration: 1800, easing: Easing.linear }), -1, false));
    ember4.value = withDelay(400, withRepeat(withTiming(1, { duration: 2200, easing: Easing.linear }), -1, false));

    // Extra embers at level 3+
    if (clampedLevel >= 3) {
      ember5.value = withDelay(1000, withRepeat(withTiming(1, { duration: 1600, easing: Easing.linear }), -1, false));
      ember6.value = withDelay(1800, withRepeat(withTiming(1, { duration: 2100, easing: Easing.linear }), -1, false));
    }

    // Smoke
    if (showSmokeResolved) {
      smoke1Val.value = withRepeat(withTiming(1, { duration: 3500, easing: Easing.linear }), -1, false);
      smoke2Val.value = withDelay(1500, withRepeat(withTiming(1, { duration: 4000, easing: Easing.linear }), -1, false));
    }
  }, []);

  // Animated styles
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  const centerFlameStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: interpolate(flame1.value, [0.5, 1], [0.85, 1.1]) }],
  }));

  const leftFlameStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: interpolate(flame2.value, [0.5, 1], [0.8, 1.05]) },
      { rotate: "-15deg" },
    ],
  }));

  const rightFlameStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: interpolate(flame3.value, [0.5, 1], [0.75, 1]) },
      { rotate: "12deg" },
    ],
  }));

  // Ember styles
  const ember1Style = useAnimatedStyle(() => ({
    opacity: interpolate(ember1.value, [0, 0.2, 1], [0, 1, 0]),
    transform: [
      { translateY: interpolate(ember1.value, [0, 1], [0, -50 * scale]) },
      { translateX: interpolate(ember1.value, [0, 1], [0, 12]) },
    ],
  }));
  const ember2Style = useAnimatedStyle(() => ({
    opacity: interpolate(ember2.value, [0, 0.2, 1], [0, 1, 0]),
    transform: [
      { translateY: interpolate(ember2.value, [0, 1], [0, -50 * scale]) },
      { translateX: interpolate(ember2.value, [0, 1], [0, -10]) },
    ],
  }));
  const ember3Style = useAnimatedStyle(() => ({
    opacity: interpolate(ember3.value, [0, 0.2, 1], [0, 1, 0]),
    transform: [
      { translateY: interpolate(ember3.value, [0, 1], [0, -50 * scale]) },
      { translateX: interpolate(ember3.value, [0, 1], [0, 8]) },
    ],
  }));
  const ember4Style = useAnimatedStyle(() => ({
    opacity: interpolate(ember4.value, [0, 0.2, 1], [0, 1, 0]),
    transform: [
      { translateY: interpolate(ember4.value, [0, 1], [0, -50 * scale]) },
      { translateX: interpolate(ember4.value, [0, 1], [0, -6]) },
    ],
  }));

  // Extra ember styles (level 3+)
  const ember5Style = useAnimatedStyle(() => ({
    opacity: interpolate(ember5.value, [0, 0.2, 1], [0, 1, 0]),
    transform: [
      { translateY: interpolate(ember5.value, [0, 1], [0, -60 * scale]) },
      { translateX: interpolate(ember5.value, [0, 1], [0, 15]) },
    ],
  }));
  const ember6Style = useAnimatedStyle(() => ({
    opacity: interpolate(ember6.value, [0, 0.2, 1], [0, 1, 0]),
    transform: [
      { translateY: interpolate(ember6.value, [0, 1], [0, -55 * scale]) },
      { translateX: interpolate(ember6.value, [0, 1], [0, -14]) },
    ],
  }));

  // Smoke styles
  const smoke1Style = useAnimatedStyle(() => ({
    opacity: interpolate(smoke1Val.value, [0, 0.3, 0.7, 1], [0, 0.4, 0.2, 0]),
    transform: [
      { translateY: interpolate(smoke1Val.value, [0, 1], [20 * scale, -30 * scale]) },
      { translateX: interpolate(smoke1Val.value, [0, 0.5, 1], [0, 8 * scale, 5 * scale]) },
      { scale: interpolate(smoke1Val.value, [0, 1], [0.5, 1.5]) },
    ],
  }));
  const smoke2Style = useAnimatedStyle(() => ({
    opacity: interpolate(smoke2Val.value, [0, 0.3, 0.7, 1], [0, 0.3, 0.15, 0]),
    transform: [
      { translateY: interpolate(smoke2Val.value, [0, 1], [15 * scale, -35 * scale]) },
      { translateX: interpolate(smoke2Val.value, [0, 0.5, 1], [0, -6 * scale, -3 * scale]) },
      { scale: interpolate(smoke2Val.value, [0, 1], [0.5, 1.8]) },
    ],
  }));

  return (
    <View style={{ width: 80 * scale, height: 90 * scale, alignItems: "center" }}>
      {/* Ground glow */}
      <Animated.View style={[{
        position: "absolute",
        bottom: 8 * scale,
        left: 10 * scale,
        width: 60 * scale,
        height: 20 * scale,
        backgroundColor: C.FIRE_ORANGE,
        borderRadius: 30 * scale,
      }, glowStyle]} />

      {/* Smoke wisps */}
      {showSmokeResolved && (
        <>
          <Animated.View style={[{
            position: "absolute",
            left: 35 * scale,
            top: 10 * scale,
            width: 8 * scale,
            height: 8 * scale,
            backgroundColor: C.SMOKE_LIGHT,
            borderRadius: 4 * scale,
          }, smoke1Style]} />
          <Animated.View style={[{
            position: "absolute",
            left: 40 * scale,
            top: 15 * scale,
            width: 6 * scale,
            height: 6 * scale,
            backgroundColor: C.SMOKE_DARK,
            borderRadius: 3 * scale,
          }, smoke2Style]} />
        </>
      )}

      {/* Rising embers */}
      <Animated.View style={[{
        position: "absolute", left: 28 * scale, bottom: 45 * scale,
        width: 3 * scale, height: 3 * scale, backgroundColor: C.FIRE_YELLOW, borderRadius: 1.5 * scale,
      }, ember1Style]} />
      <Animated.View style={[{
        position: "absolute", left: 48 * scale, bottom: 48 * scale,
        width: 2.5 * scale, height: 2.5 * scale, backgroundColor: C.EMBER, borderRadius: 1.25 * scale,
      }, ember2Style]} />
      <Animated.View style={[{
        position: "absolute", left: 38 * scale, bottom: 42 * scale,
        width: 2 * scale, height: 2 * scale, backgroundColor: C.FIRE_CORE, borderRadius: 1 * scale,
      }, ember3Style]} />
      <Animated.View style={[{
        position: "absolute", left: 42 * scale, bottom: 50 * scale,
        width: 2 * scale, height: 2 * scale, backgroundColor: C.FIRE_YELLOW, borderRadius: 1 * scale,
      }, ember4Style]} />

      {/* Extra embers for level 3+ */}
      {clampedLevel >= 3 && (
        <>
          <Animated.View style={[{
            position: "absolute", left: 22 * scale, bottom: 46 * scale,
            width: 2.5 * scale, height: 2.5 * scale, backgroundColor: C.EMBER, borderRadius: 1.25 * scale,
          }, ember5Style]} />
          <Animated.View style={[{
            position: "absolute", left: 52 * scale, bottom: 44 * scale,
            width: 2 * scale, height: 2 * scale, backgroundColor: C.FIRE_YELLOW, borderRadius: 1 * scale,
          }, ember6Style]} />
        </>
      )}

      {/* Main flames - layered from red tips to white core */}
      {/* Center flame (tallest) */}
      <Animated.View style={[{
        position: "absolute",
        bottom: 22 * scale,
        left: 28 * scale,
        width: 24 * scale,
        height: 50 * scale,
      }, centerFlameStyle]}>
        <View style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "100%",
          backgroundColor: C.FIRE_RED,
          borderTopLeftRadius: 12 * scale, borderTopRightRadius: 12 * scale,
          borderBottomLeftRadius: 6 * scale, borderBottomRightRadius: 6 * scale,
        }} />
        <View style={{
          position: "absolute", bottom: 2 * scale, left: 3 * scale, right: 3 * scale, height: "85%",
          backgroundColor: C.FIRE_ORANGE,
          borderTopLeftRadius: 9 * scale, borderTopRightRadius: 9 * scale,
          borderBottomLeftRadius: 4 * scale, borderBottomRightRadius: 4 * scale,
        }} />
        <View style={{
          position: "absolute", bottom: 4 * scale, left: 5 * scale, right: 5 * scale, height: "65%",
          backgroundColor: C.FIRE_YELLOW,
          borderTopLeftRadius: 7 * scale, borderTopRightRadius: 7 * scale,
          borderBottomLeftRadius: 3 * scale, borderBottomRightRadius: 3 * scale,
        }} />
        <View style={{
          position: "absolute", bottom: 6 * scale, left: 8 * scale, right: 8 * scale, height: "40%",
          backgroundColor: C.FIRE_CORE,
          borderTopLeftRadius: 4 * scale, borderTopRightRadius: 4 * scale,
          borderBottomLeftRadius: 2 * scale, borderBottomRightRadius: 2 * scale,
        }} />
      </Animated.View>

      {/* Left flame */}
      <Animated.View style={[{
        position: "absolute",
        bottom: 22 * scale,
        left: 16 * scale,
        width: 16 * scale,
        height: 35 * scale,
      }, leftFlameStyle]}>
        <View style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "100%",
          backgroundColor: C.FIRE_DEEP_RED,
          borderTopLeftRadius: 8 * scale, borderTopRightRadius: 8 * scale,
          borderBottomLeftRadius: 4 * scale, borderBottomRightRadius: 4 * scale,
        }} />
        <View style={{
          position: "absolute", bottom: 2 * scale, left: 2 * scale, right: 2 * scale, height: "80%",
          backgroundColor: C.FIRE_MID_RED,
          borderTopLeftRadius: 6 * scale, borderTopRightRadius: 6 * scale,
          borderBottomLeftRadius: 3 * scale, borderBottomRightRadius: 3 * scale,
        }} />
        <View style={{
          position: "absolute", bottom: 4 * scale, left: 4 * scale, right: 4 * scale, height: "55%",
          backgroundColor: C.EMBER,
          borderTopLeftRadius: 4 * scale, borderTopRightRadius: 4 * scale,
        }} />
      </Animated.View>

      {/* Right flame */}
      <Animated.View style={[{
        position: "absolute",
        bottom: 22 * scale,
        right: 16 * scale,
        width: 16 * scale,
        height: 32 * scale,
      }, rightFlameStyle]}>
        <View style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "100%",
          backgroundColor: C.FIRE_DARK_RED,
          borderTopLeftRadius: 8 * scale, borderTopRightRadius: 8 * scale,
          borderBottomLeftRadius: 4 * scale, borderBottomRightRadius: 4 * scale,
        }} />
        <View style={{
          position: "absolute", bottom: 2 * scale, left: 2 * scale, right: 2 * scale, height: "75%",
          backgroundColor: C.FIRE_RED,
          borderTopLeftRadius: 6 * scale, borderTopRightRadius: 6 * scale,
          borderBottomLeftRadius: 3 * scale, borderBottomRightRadius: 3 * scale,
        }} />
        <View style={{
          position: "absolute", bottom: 4 * scale, left: 4 * scale, right: 4 * scale, height: "50%",
          backgroundColor: C.FIRE_ORANGE,
          borderTopLeftRadius: 4 * scale, borderTopRightRadius: 4 * scale,
        }} />
      </Animated.View>

      {/* Stone ring base - circular arrangement */}
      {/* Back stones */}
      <View style={{
        position: "absolute", bottom: 10 * scale, left: 8 * scale,
        width: 14 * scale, height: 12 * scale, backgroundColor: C.STONE_DARK, borderRadius: 6 * scale,
      }}>
        <View style={{
          position: "absolute", top: 2 * scale, left: 3 * scale,
          width: 5 * scale, height: 3 * scale, backgroundColor: C.STONE_LIGHT, borderRadius: 2 * scale,
        }} />
      </View>
      <View style={{
        position: "absolute", bottom: 12 * scale, left: 20 * scale,
        width: 12 * scale, height: 10 * scale, backgroundColor: C.STONE_DARKEST, borderRadius: 5 * scale,
      }} />
      <View style={{
        position: "absolute", bottom: 12 * scale, right: 20 * scale,
        width: 12 * scale, height: 10 * scale, backgroundColor: C.STONE_DARKEST, borderRadius: 5 * scale,
      }} />
      <View style={{
        position: "absolute", bottom: 10 * scale, right: 8 * scale,
        width: 14 * scale, height: 12 * scale, backgroundColor: C.STONE_DARK, borderRadius: 6 * scale,
      }}>
        <View style={{
          position: "absolute", top: 2 * scale, right: 3 * scale,
          width: 5 * scale, height: 3 * scale, backgroundColor: C.STONE_LIGHT, borderRadius: 2 * scale,
        }} />
      </View>

      {/* Front stones */}
      <View style={{
        position: "absolute", bottom: 2 * scale, left: 4 * scale,
        width: 13 * scale, height: 11 * scale, backgroundColor: C.STONE_MID, borderRadius: 5 * scale,
      }}>
        <View style={{
          position: "absolute", top: 2 * scale, left: 2 * scale,
          width: 4 * scale, height: 3 * scale, backgroundColor: "#8A8A92", borderRadius: 2 * scale,
        }} />
      </View>
      <View style={{
        position: "absolute", bottom: 0, left: 15 * scale,
        width: 11 * scale, height: 9 * scale, backgroundColor: C.STONE_DARK, borderRadius: 4 * scale,
      }} />
      <View style={{
        position: "absolute", bottom: 0, left: "50%", marginLeft: -6 * scale,
        width: 12 * scale, height: 8 * scale, backgroundColor: C.STONE_MID, borderRadius: 4 * scale,
      }}>
        <View style={{
          position: "absolute", top: 1 * scale, left: 3 * scale,
          width: 4 * scale, height: 2 * scale, backgroundColor: "#8A8A92", borderRadius: 1 * scale,
        }} />
      </View>
      <View style={{
        position: "absolute", bottom: 0, right: 15 * scale,
        width: 11 * scale, height: 9 * scale, backgroundColor: C.STONE_DARK, borderRadius: 4 * scale,
      }} />
      <View style={{
        position: "absolute", bottom: 2 * scale, right: 4 * scale,
        width: 13 * scale, height: 11 * scale, backgroundColor: C.STONE_MID, borderRadius: 5 * scale,
      }}>
        <View style={{
          position: "absolute", top: 2 * scale, right: 2 * scale,
          width: 4 * scale, height: 3 * scale, backgroundColor: "#8A8A92", borderRadius: 2 * scale,
        }} />
      </View>

      {/* Crossed logs */}
      <View style={{
        position: "absolute", bottom: 10 * scale, left: 10 * scale,
        width: 60 * scale, height: 10 * scale, backgroundColor: C.LOG_MID,
        borderRadius: 5 * scale, transform: [{ rotate: "-15deg" }],
      }}>
        <View style={{
          position: "absolute", top: 2 * scale, left: 8 * scale,
          width: 18 * scale, height: 2 * scale, backgroundColor: C.LOG_LIGHT, borderRadius: 1 * scale,
        }} />
        <View style={{
          position: "absolute", top: 3 * scale, right: 12 * scale,
          width: 10 * scale, height: 4 * scale, backgroundColor: "#2A1810", borderRadius: 2 * scale,
        }} />
      </View>
      <View style={{
        position: "absolute", bottom: 10 * scale, left: 10 * scale,
        width: 60 * scale, height: 10 * scale, backgroundColor: C.LOG_DARK,
        borderRadius: 5 * scale, transform: [{ rotate: "15deg" }],
      }}>
        <View style={{
          position: "absolute", top: 2 * scale, right: 10 * scale,
          width: 15 * scale, height: 2 * scale, backgroundColor: C.LOG_LIGHT, borderRadius: 1 * scale,
        }} />
        <View style={{
          position: "absolute", top: 4 * scale, left: 15 * scale,
          width: 8 * scale, height: 3 * scale, backgroundColor: "#1A0F08", borderRadius: 2 * scale,
        }} />
      </View>
    </View>
  );
}

// ===== PINE TREE =====
// Layered evergreen with depth and character
interface PineTreeProps {
  height?: number;
  shade?: number; // 0-3 for depth (0 = farthest/darkest)
  snowCapped?: boolean;
}

export function DetailedPineTree({ height = 100, shade = 2, snowCapped = false }: PineTreeProps) {
  const scale = height / 100;

  // 16-24 bit color palettes - 4 shades for depth (0=darkest/far, 3=brightest/near)
  const palettes = [
    { base: "#0A2808", mid: "#0D3510", light: "#113F18" },  // Shade 0 - Farthest (darkest)
    { base: "#0D3510", mid: "#134518", light: "#185520" },  // Shade 1 - Far
    { base: "#134518", mid: "#1A5522", light: "#20652A" },  // Shade 2 - Near
    { base: "#1A5522", mid: "#20652A", light: "#287532" },  // Shade 3 - Nearest (brightest)
  ];

  const colors = palettes[Math.min(shade, 3)];
  const trunkColor = shade >= 2 ? "#3A2010" : "#2A1808";

  // Pixel block helper (hard edges, no borderRadius)
  const Block = ({ w, h, color, x = 0, y = 0 }: { w: number; h: number; color: string; x?: number; y?: number }) => (
    <View style={{
      position: "absolute",
      left: x * scale,
      top: y * scale,
      width: w * scale,
      height: h * scale,
      backgroundColor: color,
    }} />
  );

  return (
    <View style={{ width: 32 * scale, height: 100 * scale, alignItems: "center", position: "relative" }}>
      {/* Pixel tree - triangular shape built from stacked pixel rows */}

      {/* Top tier (tip) - 2px wide */}
      <Block w={2} h={4} color={colors.light} x={15} y={0} />

      {/* Upper section - growing width */}
      <Block w={6} h={4} color={colors.mid} x={13} y={4} />
      <Block w={2} h={4} color={colors.light} x={11} y={4} />  {/* Left highlight */}
      <Block w={2} h={4} color={colors.base} x={19} y={4} />   {/* Right shadow */}

      <Block w={10} h={4} color={colors.mid} x={11} y={8} />
      <Block w={2} h={4} color={colors.light} x={9} y={8} />
      <Block w={2} h={4} color={colors.base} x={21} y={8} />

      {/* Middle tier */}
      <Block w={14} h={6} color={colors.mid} x={9} y={12} />
      <Block w={4} h={6} color={colors.light} x={7} y={12} />   {/* Left branch highlight */}
      <Block w={4} h={6} color={colors.base} x={21} y={12} />   {/* Right branch shadow */}

      <Block w={18} h={6} color={colors.mid} x={7} y={18} />
      <Block w={4} h={4} color={colors.light} x={5} y={20} />
      <Block w={4} h={4} color={colors.base} x={23} y={20} />

      {/* Lower tier - widest section */}
      <Block w={22} h={8} color={colors.mid} x={5} y={24} />
      <Block w={4} h={6} color={colors.light} x={3} y={26} />   {/* Left branches */}
      <Block w={4} h={6} color={colors.base} x={25} y={26} />   {/* Right branches */}

      <Block w={24} h={8} color={colors.mid} x={4} y={32} />
      <Block w={4} h={6} color={colors.light} x={2} y={34} />
      <Block w={4} h={6} color={colors.base} x={26} y={34} />

      {/* Bottom foliage */}
      <Block w={26} h={10} color={colors.mid} x={3} y={40} />
      <Block w={4} h={8} color={colors.light} x={1} y={42} />
      <Block w={4} h={8} color={colors.base} x={27} y={42} />

      {/* Trunk - pixel blocks, no rounded edges */}
      <Block w={6} h={36} color={trunkColor} x={13} y={50} />
      <Block w={2} h={36} color="#4A2818" x={11} y={50} />      {/* Left edge highlight */}
      <Block w={2} h={36} color="#2A1808" x={19} y={50} />      {/* Right edge shadow */}

      {/* Trunk texture - vertical grain lines (2px wide pixel blocks) */}
      <Block w={2} h={28} color="#301810" x={13} y={52} />
      <Block w={2} h={20} color="#301810" x={17} y={58} />

      {/* Tree base shadow */}
      <Block w={10} h={4} color="rgba(0,0,0,0.3)" x={11} y={86} />
      <Block w={14} h={2} color="rgba(0,0,0,0.2)" x={9} y={90} />
    </View>
  );
}

// ===== GRASS TUFT =====
interface GrassProps {
  size?: number;
  variant?: number;
}

export function DetailedGrass({ size = 40, variant = 0 }: GrassProps) {
  const scale = size / 40;

  const colors = {
    light: "#5DD55D",
    mid: "#3DB83D",
    dark: "#228B22",
    shadow: "#1A6B1A",
  };

  const blades = [
    [
      { x: 4, h: 18, color: colors.dark, width: 3 },
      { x: 10, h: 22, color: colors.mid, width: 3 },
      { x: 16, h: 15, color: colors.shadow, width: 2 },
      { x: 22, h: 20, color: colors.light, width: 3 },
      { x: 28, h: 16, color: colors.mid, width: 2 },
      { x: 33, h: 12, color: colors.dark, width: 2 },
    ],
    [
      { x: 6, h: 14, color: colors.mid, width: 3 },
      { x: 14, h: 24, color: colors.dark, width: 3 },
      { x: 22, h: 18, color: colors.light, width: 3 },
      { x: 30, h: 20, color: colors.shadow, width: 2 },
    ],
    [
      { x: 3, h: 16, color: colors.shadow, width: 2 },
      { x: 10, h: 22, color: colors.mid, width: 3 },
      { x: 18, h: 14, color: colors.light, width: 2 },
      { x: 24, h: 20, color: colors.dark, width: 3 },
      { x: 32, h: 18, color: colors.mid, width: 2 },
    ],
  ];

  const currentBlades = blades[variant % blades.length];

  return (
    <View style={{ width: 40 * scale, height: 25 * scale, alignItems: "center", justifyContent: "flex-end" }}>
      {currentBlades.map((blade, i) => (
        <View
          key={i}
          style={{
            position: "absolute", bottom: 0, left: blade.x * scale,
            width: blade.width * scale, height: blade.h * scale,
            backgroundColor: blade.color,
            borderTopLeftRadius: blade.width * scale * 0.5,
            borderTopRightRadius: blade.width * scale * 0.5,
            transform: [{ rotate: `${(i % 2 === 0 ? -1 : 1) * (3 + i * 2)}deg` }],
          }}
        />
      ))}
    </View>
  );
}

// ===== SMALL FIRE ICON =====
export function SmallFireIcon({ size = 24 }: { size?: number }) {
  const scale = size / 24;

  return (
    <View style={{ width: 28 * scale, height: 32 * scale, alignItems: "center", justifyContent: "flex-end" }}>
      {/* Stone ring */}
      <View style={{ position: "absolute", bottom: 0, left: 1 * scale, width: 5 * scale, height: 5 * scale, backgroundColor: C.STONE_MID, borderRadius: 2 * scale }} />
      <View style={{ position: "absolute", bottom: 3 * scale, left: 0, width: 4 * scale, height: 4 * scale, backgroundColor: C.STONE_DARK, borderRadius: 2 * scale }} />
      <View style={{ position: "absolute", bottom: 0, right: 1 * scale, width: 5 * scale, height: 5 * scale, backgroundColor: C.STONE_MID, borderRadius: 2 * scale }} />
      <View style={{ position: "absolute", bottom: 3 * scale, right: 0, width: 4 * scale, height: 4 * scale, backgroundColor: C.STONE_DARK, borderRadius: 2 * scale }} />
      <View style={{ position: "absolute", bottom: 0, left: "50%", marginLeft: -3 * scale, width: 6 * scale, height: 4 * scale, backgroundColor: C.STONE_LIGHT, borderRadius: 2 * scale }} />

      {/* Crossed logs */}
      <View style={{ position: "absolute", bottom: 4 * scale, left: 4 * scale, width: 20 * scale, height: 4 * scale, backgroundColor: C.LOG_MID, borderRadius: 2 * scale, transform: [{ rotate: "-25deg" }] }} />
      <View style={{ position: "absolute", bottom: 4 * scale, left: 4 * scale, width: 20 * scale, height: 4 * scale, backgroundColor: C.LOG_DARK, borderRadius: 2 * scale, transform: [{ rotate: "25deg" }] }} />

      {/* Flames */}
      <View style={{ position: "absolute", bottom: 7 * scale, left: "50%", marginLeft: -8 * scale, width: 16 * scale, height: 18 * scale, backgroundColor: C.FIRE_RED, borderTopLeftRadius: 8 * scale, borderTopRightRadius: 8 * scale, borderBottomLeftRadius: 4 * scale, borderBottomRightRadius: 4 * scale }} />
      <View style={{ position: "absolute", bottom: 8 * scale, left: "50%", marginLeft: -6 * scale, width: 12 * scale, height: 14 * scale, backgroundColor: C.FIRE_ORANGE, borderTopLeftRadius: 6 * scale, borderTopRightRadius: 6 * scale, borderBottomLeftRadius: 3 * scale, borderBottomRightRadius: 3 * scale }} />
      <View style={{ position: "absolute", bottom: 9 * scale, left: "50%", marginLeft: -4 * scale, width: 8 * scale, height: 10 * scale, backgroundColor: C.FIRE_YELLOW, borderTopLeftRadius: 4 * scale, borderTopRightRadius: 4 * scale, borderBottomLeftRadius: 2 * scale, borderBottomRightRadius: 2 * scale }} />
      <View style={{ position: "absolute", bottom: 10 * scale, left: "50%", marginLeft: -2 * scale, width: 4 * scale, height: 5 * scale, backgroundColor: C.FIRE_CORE, borderTopLeftRadius: 2 * scale, borderTopRightRadius: 2 * scale, borderBottomLeftRadius: 1 * scale, borderBottomRightRadius: 1 * scale }} />

      {/* Ember sparks */}
      <View style={{ position: "absolute", bottom: 22 * scale, left: 8 * scale, width: 2 * scale, height: 2 * scale, backgroundColor: C.FIRE_YELLOW, borderRadius: 1 * scale }} />
      <View style={{ position: "absolute", bottom: 25 * scale, right: 9 * scale, width: 2 * scale, height: 2 * scale, backgroundColor: C.EMBER, borderRadius: 1 * scale }} />
    </View>
  );
}

export default {
  DetailedCampfire,
  DetailedPineTree,
  DetailedGrass,
  SmallFireIcon,
};
