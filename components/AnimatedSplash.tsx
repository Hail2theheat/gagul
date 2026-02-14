// components/AnimatedSplash.tsx
// Full-screen animated splash: night sky, mountains, lake reflection,
// campfire with woodland creatures, shooting stars, and "STOKIE" rising text.
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
  interpolateColor,
} from "react-native-reanimated";
import { CampfireColors } from "../constants/theme";

const { width: W, height: H } = Dimensions.get("window");

// ──────────────────────────────────────────
// Color palette
// ──────────────────────────────────────────
const SKY_TOP = "#040810";
const SKY_MID = "#0A1428";
const SKY_LOW = "#101E38";
const MTN_FAR = "#0C1420";
const MTN_MID = "#0E1824";
const MTN_NEAR = "#0A1218";
const LAKE_TOP = "#0A1828";
const LAKE_MID = "#081420";
const LAKE_BOT = "#060E18";
const GROUND = "#152515";
const FIRE_ORANGE = "#FF6B35";
const FIRE_YELLOW = "#FFD93D";
const FIRE_RED = "#CC2200";
const FIRE_CORE = "#FFFACD";
const LOG_DARK = "#4A3020";
const LOG_LIGHT = "#5C3D2E";
const ROCK = "#4A4A52";
const ROCK_L = "#5A5A62";
const TEXT_COLOR = "#FFF8DC";

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

/** Mountain silhouette triangle */
function Mountain({
  x,
  w,
  h,
  color,
  bottom = 0,
}: {
  x: number;
  w: number;
  h: number;
  color: string;
  bottom?: number;
}) {
  return (
    <View
      style={{
        position: "absolute",
        left: x - w / 2,
        bottom,
        width: 0,
        height: 0,
        borderLeftWidth: w / 2,
        borderRightWidth: w / 2,
        borderBottomWidth: h,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: color,
      }}
    />
  );
}

/** Reflected (flipped) mountain for lake */
function MountainReflection({
  x,
  w,
  h,
  color,
  top,
}: {
  x: number;
  w: number;
  h: number;
  color: string;
  top: number;
}) {
  return (
    <View
      style={{
        position: "absolute",
        left: x - w / 2,
        top,
        width: 0,
        height: 0,
        borderLeftWidth: w / 2,
        borderRightWidth: w / 2,
        borderTopWidth: h,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderTopColor: color,
        opacity: 0.25,
      }}
    />
  );
}

/** Single twinkling star */
function Star({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 + Math.random() * 1000, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.3, { duration: 1500 + Math.random() * 1000, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: x,
    top: y,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: "#FFF",
    opacity: opacity.value,
  }));

  return <Animated.View style={style} />;
}

/** Animated shooting star */
function SplashShootingStar({ delay }: { delay: number }) {
  const progress = useSharedValue(0);
  const startX = 40 + Math.random() * (W * 0.5);
  const startY = 20 + Math.random() * 80;

  useEffect(() => {
    const fire = () => {
      progress.value = 0;
      progress.value = withTiming(1, { duration: 800 });
    };
    const t = setTimeout(fire, delay);
    const interval = setInterval(fire, 6000 + Math.random() * 8000);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, []);

  const headStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: startX + interpolate(progress.value, [0, 1], [0, 160]),
    top: startY + interpolate(progress.value, [0, 1], [0, 100]),
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFF0",
    opacity: interpolate(progress.value, [0, 0.1, 0.7, 1], [0, 1, 1, 0]),
    shadowColor: "#FFF",
    shadowOpacity: 1,
    shadowRadius: 8,
  }));

  const trailStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: startX + interpolate(progress.value, [0, 1], [0, 160]) - 60,
    top: startY + interpolate(progress.value, [0, 1], [0, 100]) - 1,
    width: 60,
    height: 2,
    opacity: interpolate(progress.value, [0, 0.15, 0.6, 1], [0, 0.6, 0.3, 0]),
    transform: [{ rotate: "33deg" }],
    backgroundColor: "rgba(255,255,240,0.4)",
    borderRadius: 1,
  }));

  return (
    <>
      <Animated.View style={trailStyle} />
      <Animated.View style={headStyle} />
    </>
  );
}

// ──────────────────────────────────────────
// Woodland creatures (tiny pixel art)
// ──────────────────────────────────────────

/** Tiny pixel owl sitting on a log */
function PixelOwl({ x, bottom }: { x: number; bottom: number }) {
  return (
    <View style={{ position: "absolute", left: x, bottom, width: 14, height: 16 }}>
      {/* Body */}
      <View style={{ position: "absolute", bottom: 0, left: 2, width: 10, height: 10, backgroundColor: "#8B6914", borderRadius: 3 }} />
      {/* Head */}
      <View style={{ position: "absolute", bottom: 8, left: 1, width: 12, height: 9, backgroundColor: "#A07818", borderRadius: 4 }} />
      {/* Ears */}
      <View style={{ position: "absolute", bottom: 14, left: 1, width: 3, height: 3, backgroundColor: "#8B6914", borderTopLeftRadius: 2 }} />
      <View style={{ position: "absolute", bottom: 14, left: 10, width: 3, height: 3, backgroundColor: "#8B6914", borderTopRightRadius: 2 }} />
      {/* Eyes */}
      <View style={{ position: "absolute", bottom: 11, left: 3, width: 3, height: 3, backgroundColor: "#FFD93D", borderRadius: 1.5 }} />
      <View style={{ position: "absolute", bottom: 11, left: 8, width: 3, height: 3, backgroundColor: "#FFD93D", borderRadius: 1.5 }} />
      {/* Pupils */}
      <View style={{ position: "absolute", bottom: 12, left: 4, width: 1.5, height: 1.5, backgroundColor: "#000", borderRadius: 1 }} />
      <View style={{ position: "absolute", bottom: 12, left: 9, width: 1.5, height: 1.5, backgroundColor: "#000", borderRadius: 1 }} />
      {/* Beak */}
      <View style={{ position: "absolute", bottom: 9, left: 5.5, width: 3, height: 2, backgroundColor: "#E0A020", borderRadius: 1 }} />
    </View>
  );
}

/** Tiny pixel bunny */
function PixelBunny({ x, bottom, flip }: { x: number; bottom: number; flip?: boolean }) {
  return (
    <View style={{ position: "absolute", left: x, bottom, width: 12, height: 14, transform: [{ scaleX: flip ? -1 : 1 }] }}>
      {/* Body */}
      <View style={{ position: "absolute", bottom: 0, left: 1, width: 10, height: 8, backgroundColor: "#D4C4B0", borderRadius: 4 }} />
      {/* Head */}
      <View style={{ position: "absolute", bottom: 5, left: 0, width: 8, height: 7, backgroundColor: "#E0D4C4", borderRadius: 4 }} />
      {/* Ear */}
      <View style={{ position: "absolute", bottom: 10, left: 1, width: 2.5, height: 5, backgroundColor: "#E0D4C4", borderRadius: 1.5 }} />
      <View style={{ position: "absolute", bottom: 10, left: 4.5, width: 2.5, height: 5, backgroundColor: "#E0D4C4", borderRadius: 1.5 }} />
      {/* Inner ear */}
      <View style={{ position: "absolute", bottom: 11, left: 1.5, width: 1.5, height: 3, backgroundColor: "#FFB0B0", borderRadius: 1 }} />
      <View style={{ position: "absolute", bottom: 11, left: 5, width: 1.5, height: 3, backgroundColor: "#FFB0B0", borderRadius: 1 }} />
      {/* Eye */}
      <View style={{ position: "absolute", bottom: 8, left: 2, width: 2, height: 2, backgroundColor: "#222", borderRadius: 1 }} />
      {/* Nose */}
      <View style={{ position: "absolute", bottom: 6.5, left: 0.5, width: 1.5, height: 1.5, backgroundColor: "#FFB0B0", borderRadius: 1 }} />
      {/* Tail */}
      <View style={{ position: "absolute", bottom: 3, left: 9, width: 3, height: 3, backgroundColor: "#FFF", borderRadius: 1.5 }} />
    </View>
  );
}

/** Tiny pixel fox */
function PixelFox({ x, bottom }: { x: number; bottom: number }) {
  return (
    <View style={{ position: "absolute", left: x, bottom, width: 18, height: 12 }}>
      {/* Body */}
      <View style={{ position: "absolute", bottom: 0, left: 4, width: 12, height: 7, backgroundColor: "#D4600A", borderRadius: 3 }} />
      {/* Head */}
      <View style={{ position: "absolute", bottom: 3, left: 0, width: 8, height: 7, backgroundColor: "#E87020", borderRadius: 3 }} />
      {/* Ears */}
      <View style={{ position: "absolute", bottom: 9, left: 0, width: 3, height: 4, backgroundColor: "#E87020", borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
      <View style={{ position: "absolute", bottom: 9, left: 5, width: 3, height: 4, backgroundColor: "#E87020", borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
      {/* Inner ears */}
      <View style={{ position: "absolute", bottom: 10, left: 0.5, width: 2, height: 2, backgroundColor: "#FFB060", borderRadius: 1 }} />
      <View style={{ position: "absolute", bottom: 10, left: 5.5, width: 2, height: 2, backgroundColor: "#FFB060", borderRadius: 1 }} />
      {/* Snout */}
      <View style={{ position: "absolute", bottom: 3, left: 0, width: 4, height: 4, backgroundColor: "#FFF0E0", borderRadius: 2 }} />
      {/* Nose */}
      <View style={{ position: "absolute", bottom: 5.5, left: 0.5, width: 2, height: 1.5, backgroundColor: "#222", borderRadius: 1 }} />
      {/* Eyes */}
      <View style={{ position: "absolute", bottom: 7, left: 2, width: 2, height: 2, backgroundColor: "#222", borderRadius: 1 }} />
      {/* Tail */}
      <View style={{ position: "absolute", bottom: 3, left: 14, width: 4, height: 5, backgroundColor: "#D4600A", borderRadius: 2.5 }} />
      <View style={{ position: "absolute", bottom: 3, left: 16, width: 2, height: 3, backgroundColor: "#FFF0E0", borderRadius: 1.5 }} />
      {/* Legs */}
      <View style={{ position: "absolute", bottom: -1, left: 5, width: 2, height: 3, backgroundColor: "#222" }} />
      <View style={{ position: "absolute", bottom: -1, left: 13, width: 2, height: 3, backgroundColor: "#222" }} />
    </View>
  );
}

// ──────────────────────────────────────────
// Campfire scene at the bottom
// ──────────────────────────────────────────

function SplashCampfire() {
  const flame1 = useSharedValue(1);
  const flame2 = useSharedValue(0.9);
  const glow = useSharedValue(0.3);

  useEffect(() => {
    flame1.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 300, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.95, { duration: 350, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
    flame2.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 250, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.85, { duration: 280, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, []);

  const flame1Style = useAnimatedStyle(() => ({
    transform: [{ scaleY: flame1.value }, { scaleX: flame2.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <View style={{ alignItems: "center", width: 110, height: 80 }}>
      {/* Glow */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: 140,
            height: 80,
            borderRadius: 70,
            backgroundColor: FIRE_ORANGE,
            bottom: 5,
            left: -15,
          },
          glowStyle,
        ]}
      />
      {/* Fire ring rocks */}
      <View style={{ position: "absolute", bottom: 0, left: 6, width: 11, height: 7, backgroundColor: ROCK, borderRadius: 3 }} />
      <View style={{ position: "absolute", bottom: 0, left: 18, width: 9, height: 6, backgroundColor: ROCK_L, borderRadius: 3 }} />
      <View style={{ position: "absolute", bottom: 0, left: 82, width: 12, height: 7, backgroundColor: ROCK_L, borderRadius: 4 }} />
      <View style={{ position: "absolute", bottom: 0, left: 95, width: 10, height: 6, backgroundColor: ROCK, borderRadius: 3 }} />
      <View style={{ position: "absolute", bottom: 0, left: 0, width: 9, height: 5, backgroundColor: ROCK_L, borderRadius: 3 }} />
      <View style={{ position: "absolute", bottom: 0, left: 100, width: 9, height: 5, backgroundColor: ROCK, borderRadius: 3 }} />
      {/* Logs */}
      <View
        style={{
          position: "absolute",
          bottom: 3,
          left: 15,
          width: 38,
          height: 7,
          backgroundColor: LOG_DARK,
          borderRadius: 3,
          transform: [{ rotate: "-15deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 3,
          left: 55,
          width: 38,
          height: 7,
          backgroundColor: LOG_LIGHT,
          borderRadius: 3,
          transform: [{ rotate: "15deg" }],
        }}
      />
      {/* Small cross log */}
      <View
        style={{
          position: "absolute",
          bottom: 6,
          left: 38,
          width: 32,
          height: 5,
          backgroundColor: "#4E3422",
          borderRadius: 2,
          transform: [{ rotate: "5deg" }],
        }}
      />
      {/* Flames (bigger) */}
      <Animated.View style={[{ position: "absolute", bottom: 8, alignItems: "center" }, flame1Style]}>
        {/* Outer flame */}
        <View style={{ width: 30, height: 42, backgroundColor: FIRE_RED, borderRadius: 15, marginBottom: -8 }} />
        {/* Mid flame */}
        <View style={{ position: "absolute", bottom: 0, width: 24, height: 36, backgroundColor: FIRE_ORANGE, borderRadius: 12 }} />
        {/* Inner flame */}
        <View style={{ position: "absolute", bottom: 3, width: 16, height: 28, backgroundColor: FIRE_YELLOW, borderRadius: 8 }} />
        {/* Core */}
        <View style={{ position: "absolute", bottom: 6, width: 10, height: 18, backgroundColor: FIRE_CORE, borderRadius: 5 }} />
      </Animated.View>
    </View>
  );
}

// ──────────────────────────────────────────
// "STOKIE" branch/twig style text
// ──────────────────────────────────────────

function TwigLetter({
  char,
  index,
  delay,
}: {
  char: string;
  index: number;
  delay: number;
}) {
  const wiggle = useSharedValue(0);

  useEffect(() => {
    // Gentle wiggle only
    wiggle.value = withDelay(
      delay + 200,
      withRepeat(
        withSequence(
          withTiming(2, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
          withTiming(-2, { duration: 2000, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: 1,
    transform: [
      { rotate: `${wiggle.value}deg` },
    ],
  }));

  // Amber fire gradient: red (bottom) → orange → yellow → white (tips)
  // with faint fire glow behind each letter
  const fontSize = 52;
  const letterHeight = fontSize * 1.15; // approximate rendered height

  return (
    <Animated.View style={[{ marginHorizontal: 2 }, style]}>
      {/* Outer fire glow - faint warm halo */}
      <View
        style={{
          position: "absolute",
          top: -20,
          left: -18,
          right: -18,
          bottom: -12,
          backgroundColor: "#FF6B35",
          borderRadius: 28,
          opacity: 0.1,
        }}
        pointerEvents="none"
      />
      {/* Middle glow layer */}
      <View
        style={{
          position: "absolute",
          top: -12,
          left: -12,
          right: -12,
          bottom: -8,
          backgroundColor: "#FF8C00",
          borderRadius: 20,
          opacity: 0.18,
        }}
        pointerEvents="none"
      />
      {/* Inner glow - brighter, closer */}
      <View
        style={{
          position: "absolute",
          top: -6,
          left: -6,
          right: -6,
          bottom: -4,
          backgroundColor: "#FFD93D",
          borderRadius: 14,
          opacity: 0.12,
        }}
        pointerEvents="none"
      />

      {/* Layer 1 (base): Deep red - visible at the bottom */}
      <Animated.Text
        style={{
          fontFamily: "Paaxel",
          fontSize,
          color: "#CC2200",
          textShadowColor: "#4A0800",
          textShadowOffset: { width: 2, height: 3 },
          textShadowRadius: 2,
        }}
      >
        {char}
      </Animated.Text>

      {/* Layer 2: Orange - covers top ~78% */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: letterHeight * 0.78,
          overflow: "hidden",
        }}
        pointerEvents="none"
      >
        <Animated.Text
          style={{
            fontFamily: "Paaxel",
            fontSize,
            color: "#FF6B35",
            textShadowColor: "transparent",
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 0,
          }}
        >
          {char}
        </Animated.Text>
      </View>

      {/* Layer 3: Yellow - covers top ~48% */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: letterHeight * 0.48,
          overflow: "hidden",
        }}
        pointerEvents="none"
      >
        <Animated.Text
          style={{
            fontFamily: "Paaxel",
            fontSize,
            color: "#FFD93D",
            textShadowColor: "transparent",
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 0,
          }}
        >
          {char}
        </Animated.Text>
      </View>

      {/* Layer 4: White/cream tips - covers top ~18% */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: letterHeight * 0.18,
          overflow: "hidden",
        }}
        pointerEvents="none"
      >
        <Animated.Text
          style={{
            fontFamily: "Paaxel",
            fontSize,
            color: "#FFFEF0",
            textShadowColor: "rgba(255, 250, 220, 0.6)",
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 6,
          }}
        >
          {char}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

function StokieTitle({ onComplete }: { onComplete: () => void }) {
  const letters = "STOKIE".split("");

  useEffect(() => {
    // Show for 1.5 seconds then signal done
    const t = setTimeout(() => onComplete(), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
      {letters.map((char, i) => (
        <TwigLetter key={i} char={char} index={i} delay={0} />
      ))}
    </View>
  );
}

// ──────────────────────────────────────────
// Pine tree silhouettes for forest edge
// ──────────────────────────────────────────

function SplashTree({ x, height, shade }: { x: number; height: number; shade: number }) {
  const g = 12 + shade * 8;
  const color = `rgb(${g - 2}, ${g + 10}, ${g - 4})`;
  const trunkW = Math.max(3, height * 0.06);
  return (
    <View style={{ position: "absolute", bottom: 0, left: x, alignItems: "center" }}>
      {/* Trunk */}
      <View
        style={{
          width: trunkW,
          height: height * 0.15,
          backgroundColor: `rgb(${30 + shade * 5}, ${20 + shade * 3}, ${15 + shade * 2})`,
        }}
      />
      {/* Canopy tiers */}
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
}

// ──────────────────────────────────────────
// Main splash component
// ──────────────────────────────────────────

interface AnimatedSplashProps {
  /** Called when the intro animation is complete and fire transition should begin */
  onAnimationComplete: () => void;
}

export function AnimatedSplash({ onAnimationComplete }: AnimatedSplashProps) {
  // Scene visible immediately
  const sceneStyle = useAnimatedStyle(() => ({
    opacity: 1,
  }));

  // Layout zones
  const skyHeight = H * 0.42;
  const lakeTop = skyHeight;
  const lakeHeight = H * 0.22;
  const groundTop = lakeTop + lakeHeight;
  const groundHeight = H - groundTop;

  // Mountain definitions
  const mountains = [
    { x: W * 0.15, w: W * 0.5, h: 140, color: MTN_FAR },
    { x: W * 0.6, w: W * 0.55, h: 170, color: MTN_FAR },
    { x: W * 0.35, w: W * 0.45, h: 120, color: MTN_MID },
    { x: W * 0.85, w: W * 0.4, h: 130, color: MTN_MID },
    { x: W * 0.2, w: W * 0.35, h: 90, color: MTN_NEAR },
    { x: W * 0.7, w: W * 0.38, h: 100, color: MTN_NEAR },
  ];

  // Star field
  const stars = React.useMemo(() => {
    const result: { x: number; y: number; size: number; delay: number }[] = [];
    const seed = 7;
    let s = seed;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
    for (let i = 0; i < 60; i++) {
      result.push({
        x: rand() * (W - 10) + 5,
        y: rand() * (skyHeight - 20) + 10,
        size: 1 + rand() * 3,
        delay: rand() * 3000,
      });
    }
    return result;
  }, []);

  // Forest trees — rendered IN FRONT of the lake
  // Back row (smaller, lighter shade, peek above lake)
  const backTrees = React.useMemo(() => [
    { x: -15, height: 55, shade: 0 },
    { x: 18, height: 45, shade: 0 },
    { x: 50, height: 60, shade: 1 },
    { x: 80, height: 48, shade: 0 },
    { x: 110, height: 52, shade: 1 },
    { x: W - 120, height: 50, shade: 0 },
    { x: W - 90, height: 55, shade: 1 },
    { x: W - 60, height: 48, shade: 0 },
    { x: W - 30, height: 58, shade: 1 },
    { x: W - 5, height: 45, shade: 0 },
  ], []);
  // Front row (taller, darker shade, overlap the lake more)
  const frontTrees = React.useMemo(() => [
    { x: -25, height: 100, shade: 2 },
    { x: 5, height: 85, shade: 3 },
    { x: 35, height: 110, shade: 2 },
    { x: 65, height: 78, shade: 3 },
    { x: 95, height: 92, shade: 2 },
    { x: W - 110, height: 88, shade: 3 },
    { x: W - 80, height: 105, shade: 2 },
    { x: W - 50, height: 95, shade: 3 },
    { x: W - 20, height: 90, shade: 2 },
    { x: W + 5, height: 80, shade: 3 },
  ], []);
  // Ground trees — fill the grass on both sides, leaving a clearing for the campfire
  const groundTrees = React.useMemo(() => [
    // Left side cluster
    { x: -20, height: 72, shade: 3 },
    { x: -5, height: 58, shade: 4 },
    { x: 12, height: 80, shade: 3 },
    { x: 28, height: 65, shade: 5 },
    { x: 42, height: 74, shade: 4 },
    { x: 55, height: 60, shade: 3 },
    { x: 68, height: 68, shade: 5 },
    { x: 80, height: 55, shade: 4 },
    // Right side cluster
    { x: W - 95, height: 58, shade: 4 },
    { x: W - 80, height: 72, shade: 3 },
    { x: W - 65, height: 64, shade: 5 },
    { x: W - 50, height: 78, shade: 4 },
    { x: W - 38, height: 60, shade: 3 },
    { x: W - 24, height: 70, shade: 5 },
    { x: W - 10, height: 66, shade: 4 },
    { x: W + 5, height: 56, shade: 3 },
  ], []);

  return (
    <Animated.View style={[styles.container, sceneStyle]}>
      {/* ── Sky ── */}
      <View style={[styles.zone, { height: skyHeight }]}>
        {/* Gradient bands */}
        <View style={{ flex: 1, backgroundColor: SKY_TOP }} />
        <View style={{ flex: 1, backgroundColor: SKY_MID }} />
        <View style={{ flex: 1, backgroundColor: SKY_LOW }} />

        {/* Stars */}
        {stars.map((s, i) => (
          <Star key={i} x={s.x} y={s.y} size={s.size} delay={s.delay} />
        ))}

        {/* Shooting stars */}
        <SplashShootingStar delay={1500} />
        <SplashShootingStar delay={4500} />
        <SplashShootingStar delay={8000} />

        {/* Moon (crescent) */}
        <View style={{ position: "absolute", top: 40, right: W * 0.15 }}>
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: "#FFF8DC",
              shadowColor: "#FFFACD",
              shadowOpacity: 0.8,
              shadowRadius: 20,
            }}
          />
          {/* Dark bite for crescent */}
          <View
            style={{
              position: "absolute",
              top: -3,
              left: 6,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: SKY_TOP,
            }}
          />
        </View>

        {/* Mountains at bottom of sky */}
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 180 }}>
          {mountains.map((m, i) => (
            <Mountain key={i} x={m.x} w={m.w} h={m.h} color={m.color} />
          ))}
        </View>
      </View>

      {/* ── Lake (reflection zone) ── */}
      <View style={[styles.zone, { height: lakeHeight }]}>
        {/* Water gradient */}
        <View style={{ flex: 1, backgroundColor: LAKE_TOP }} />
        <View style={{ flex: 1, backgroundColor: LAKE_MID }} />
        <View style={{ flex: 1, backgroundColor: LAKE_BOT }} />

        {/* Reflected mountains (flipped, faded) */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 120 }}>
          {mountains.map((m, i) => (
            <MountainReflection
              key={i}
              x={m.x}
              w={m.w}
              h={m.h * 0.6}
              color={m.color}
              top={0}
            />
          ))}
        </View>

        {/* Water ripple lines */}
        {[0.2, 0.4, 0.6, 0.8].map((pct, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              top: lakeHeight * pct,
              left: W * (0.1 + i * 0.05),
              width: W * (0.3 + i * 0.1),
              height: 1,
              backgroundColor: "rgba(150, 180, 220, 0.08)",
            }}
          />
        ))}
      </View>

      {/* ── Trees rendered IN FRONT of the lake ── */}
      {/* Back row of trees — on top of lake zone */}
      <View style={{ position: "absolute", top: lakeTop + lakeHeight - 55, left: 0, right: 0, height: 120, zIndex: 2 }} pointerEvents="none">
        {backTrees.map((t, i) => (
          <SplashTree key={`bt${i}`} x={t.x} height={t.height} shade={t.shade} />
        ))}
      </View>
      {/* Front row of trees — taller, darker, more overlap */}
      <View style={{ position: "absolute", top: lakeTop + lakeHeight - 80, left: 0, right: 0, height: 160, zIndex: 3 }} pointerEvents="none">
        {frontTrees.map((t, i) => (
          <SplashTree key={`ft${i}`} x={t.x} height={t.height} shade={t.shade} />
        ))}
      </View>

      {/* ── Ground trees covering the grass on both sides ── */}
      <View style={{ position: "absolute", top: groundTop - 30, left: 0, right: 0, height: groundHeight + 30, zIndex: 5 }} pointerEvents="none">
        {groundTrees.map((t, i) => (
          <SplashTree key={`grt${i}`} x={t.x} height={t.height} shade={t.shade} />
        ))}
      </View>

      {/* ── Ground + Campfire + Creatures ── */}
      <View style={[styles.zone, { height: groundHeight, backgroundColor: GROUND }]}>
        {/* Grass edge — layered for texture */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, backgroundColor: "#2E5828" }} />
        <View style={{ position: "absolute", top: 5, left: 0, right: 0, height: 3, backgroundColor: "#254A22" }} />
        <View style={{ position: "absolute", top: 8, left: 0, right: 0, height: 2, backgroundColor: "#1F3D1C" }} />
        {/* Grass tufts for texture */}
        {[12, 35, 58, 85, 115, 145, 175, 210, 245, 280, 315, 350].map((gx, i) => (
          <View key={`gt${i}`} style={{
            position: "absolute", top: -2 - (i % 3) * 2, left: gx % W,
            width: 4 + (i % 2) * 2, height: 6 + (i % 3) * 3,
            backgroundColor: i % 2 === 0 ? "#2E5828" : "#3A6832",
            borderTopLeftRadius: 2, borderTopRightRadius: 2,
          }} />
        ))}
        {/* Dirt patches */}
        <View style={{ position: "absolute", top: 14, left: W * 0.2, width: 25, height: 6, backgroundColor: "#2A1F10", borderRadius: 3, opacity: 0.3 }} />
        <View style={{ position: "absolute", top: 18, left: W * 0.6, width: 20, height: 5, backgroundColor: "#2A1F10", borderRadius: 3, opacity: 0.25 }} />
        <View style={{ position: "absolute", top: 22, left: W * 0.4, width: 30, height: 4, backgroundColor: "#2A1F10", borderRadius: 2, opacity: 0.2 }} />

        {/* Rocks scattered on the ground */}
        <View style={{ position: "absolute", top: 12, left: W * 0.12, width: 10, height: 6, backgroundColor: "#4A4A52", borderRadius: 3 }} />
        <View style={{ position: "absolute", top: 14, left: W * 0.12 + 3, width: 6, height: 3, backgroundColor: "#5A5A62", borderRadius: 2 }} />
        <View style={{ position: "absolute", top: 16, left: W * 0.78, width: 12, height: 7, backgroundColor: "#3E3E46", borderRadius: 4 }} />
        <View style={{ position: "absolute", top: 17, left: W * 0.78 + 2, width: 8, height: 4, backgroundColor: "#4E4E56", borderRadius: 3 }} />
        <View style={{ position: "absolute", top: 10, left: W * 0.35, width: 7, height: 5, backgroundColor: "#444450", borderRadius: 3 }} />
        <View style={{ position: "absolute", top: 20, left: W * 0.55, width: 8, height: 5, backgroundColor: "#3A3A42", borderRadius: 3 }} />
        <View style={{ position: "absolute", top: 24, left: W * 0.9, width: 9, height: 6, backgroundColor: "#4A4A52", borderRadius: 3 }} />

        {/* Stumps around the campfire */}
        {/* Left stump */}
        <View style={{ position: "absolute", top: 36, left: W / 2 - 72 }}>
          <View style={{ width: 18, height: 7, backgroundColor: "#D4A040", borderRadius: 9, zIndex: 2 }} />
          <View style={{ width: 16, height: 12, backgroundColor: "#5C3820", borderBottomLeftRadius: 4, borderBottomRightRadius: 4, marginTop: -1, marginLeft: 1 }} />
        </View>
        {/* Right stump */}
        <View style={{ position: "absolute", top: 34, left: W / 2 + 58 }}>
          <View style={{ width: 16, height: 6, backgroundColor: "#D4A040", borderRadius: 8, zIndex: 2 }} />
          <View style={{ width: 14, height: 10, backgroundColor: "#5C3820", borderBottomLeftRadius: 3, borderBottomRightRadius: 3, marginTop: -1, marginLeft: 1 }} />
        </View>
        {/* Small front stump */}
        <View style={{ position: "absolute", top: 52, left: W / 2 - 20 }}>
          <View style={{ width: 14, height: 5, backgroundColor: "#C89838", borderRadius: 7, zIndex: 2 }} />
          <View style={{ width: 12, height: 8, backgroundColor: "#4A2810", borderBottomLeftRadius: 3, borderBottomRightRadius: 3, marginTop: -1, marginLeft: 1 }} />
        </View>

        {/* Campfire (centered, bigger) */}
        <View style={{ position: "absolute", top: 8, left: W / 2 - 55 }}>
          <SplashCampfire />
        </View>

        {/* Woodland creatures */}
        <PixelFox x={W / 2 - 80} bottom={groundHeight - 50} />
        <PixelBunny x={W / 2 + 65} bottom={groundHeight - 44} />
        <PixelBunny x={W / 2 + 85} bottom={groundHeight - 46} flip />
        <PixelOwl x={W / 2 - 60} bottom={groundHeight - 28} />
      </View>

      {/* ── STOKIE Title overlay ── */}
      <View style={styles.titleContainer}>
        <StokieTitle onComplete={onAnimationComplete} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SKY_TOP,
  },
  zone: {
    width: W,
    overflow: "hidden",
    position: "relative",
  },
  titleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: H * 0.38,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
});
