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
    <View style={{ alignItems: "center", width: 80, height: 60 }}>
      {/* Glow */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: 100,
            height: 60,
            borderRadius: 50,
            backgroundColor: FIRE_ORANGE,
            bottom: 5,
            left: -10,
          },
          glowStyle,
        ]}
      />
      {/* Rocks */}
      <View style={{ position: "absolute", bottom: 0, left: 5, width: 8, height: 5, backgroundColor: ROCK, borderRadius: 2 }} />
      <View style={{ position: "absolute", bottom: 0, left: 65, width: 10, height: 6, backgroundColor: ROCK_L, borderRadius: 3 }} />
      <View style={{ position: "absolute", bottom: 0, left: 0, width: 7, height: 4, backgroundColor: ROCK_L, borderRadius: 2 }} />
      <View style={{ position: "absolute", bottom: 0, left: 70, width: 8, height: 5, backgroundColor: ROCK, borderRadius: 2 }} />
      {/* Logs */}
      <View
        style={{
          position: "absolute",
          bottom: 2,
          left: 12,
          width: 28,
          height: 5,
          backgroundColor: LOG_DARK,
          borderRadius: 2,
          transform: [{ rotate: "-15deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 2,
          left: 40,
          width: 28,
          height: 5,
          backgroundColor: LOG_LIGHT,
          borderRadius: 2,
          transform: [{ rotate: "15deg" }],
        }}
      />
      {/* Flames */}
      <Animated.View style={[{ position: "absolute", bottom: 6, alignItems: "center" }, flame1Style]}>
        {/* Outer flame */}
        <View style={{ width: 20, height: 28, backgroundColor: FIRE_RED, borderRadius: 10, marginBottom: -6 }} />
        {/* Mid flame */}
        <View style={{ position: "absolute", bottom: 0, width: 16, height: 24, backgroundColor: FIRE_ORANGE, borderRadius: 8 }} />
        {/* Inner flame */}
        <View style={{ position: "absolute", bottom: 2, width: 10, height: 18, backgroundColor: FIRE_YELLOW, borderRadius: 5 }} />
        {/* Core */}
        <View style={{ position: "absolute", bottom: 4, width: 6, height: 12, backgroundColor: FIRE_CORE, borderRadius: 3 }} />
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
  const translateY = useSharedValue(60);
  const opacity = useSharedValue(0);
  const wiggle = useSharedValue(0);

  useEffect(() => {
    // Rise up
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 1200, easing: Easing.out(Easing.cubic) })
    );
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) })
    );
    // Gentle wiggle after settling
    wiggle.value = withDelay(
      delay + 1200,
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
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { rotate: `${wiggle.value}deg` },
    ],
  }));

  // Each letter is rendered as styled text with "twig" effect:
  // brown body with leaf-green accents and bark texture shadow
  return (
    <Animated.View style={[{ marginHorizontal: 2 }, style]}>
      <Animated.Text
        style={{
          fontFamily: "Retro",
          fontSize: 48,
          color: "#8B5E3C", // bark brown
          textShadowColor: "#4A2810",
          textShadowOffset: { width: 2, height: 2 },
          textShadowRadius: 0,
        }}
      >
        {char}
      </Animated.Text>
      {/* Green leaf highlight overlay (top portion) */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 20,
          overflow: "hidden",
        }}
        pointerEvents="none"
      >
        <Animated.Text
          style={{
            fontFamily: "Retro",
            fontSize: 48,
            color: "#5A8C3C",
            textShadowColor: "transparent",
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
  const baseDelay = 2000; // starts after the scene loads

  useEffect(() => {
    // Signal completion after all letters have risen + brief pause
    const total = baseDelay + letters.length * 150 + 1200 + 1500;
    const t = setTimeout(() => onComplete(), total);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
      {letters.map((char, i) => (
        <TwigLetter key={i} char={char} index={i} delay={baseDelay + i * 150} />
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
  // Scene fade-in
  const sceneOpacity = useSharedValue(0);

  useEffect(() => {
    sceneOpacity.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) });
  }, []);

  const sceneStyle = useAnimatedStyle(() => ({
    opacity: sceneOpacity.value,
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

  // Forest trees along the ground edge
  const trees = React.useMemo(() => [
    { x: -15, height: 55, shade: 0 },
    { x: 15, height: 40, shade: 1 },
    { x: 40, height: 65, shade: 0 },
    { x: 70, height: 45, shade: 1 },
    { x: W - 90, height: 50, shade: 0 },
    { x: W - 60, height: 60, shade: 1 },
    { x: W - 35, height: 42, shade: 0 },
    { x: W - 10, height: 55, shade: 1 },
    // Bigger foreground trees
    { x: -20, height: 90, shade: 2 },
    { x: 30, height: 100, shade: 3 },
    { x: W - 70, height: 95, shade: 2 },
    { x: W - 25, height: 85, shade: 3 },
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

      {/* ── Ground + Campfire + Creatures ── */}
      <View style={[styles.zone, { height: groundHeight, backgroundColor: GROUND }]}>
        {/* Grass edge */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: "#254A22",
          }}
        />
        <View
          style={{
            position: "absolute",
            top: 4,
            left: 0,
            right: 0,
            height: 2,
            backgroundColor: "#1F3D1C",
          }}
        />

        {/* Trees along the shoreline */}
        <View style={{ position: "absolute", top: -60, left: 0, right: 0, height: 120 }}>
          {trees.map((t, i) => (
            <SplashTree key={i} x={t.x} height={t.height} shade={t.shade} />
          ))}
        </View>

        {/* Campfire (centered) */}
        <View style={{ position: "absolute", top: 20, left: W / 2 - 40 }}>
          <SplashCampfire />
        </View>

        {/* Woodland creatures */}
        <PixelFox x={W / 2 - 70} bottom={groundHeight - 50} />
        <PixelBunny x={W / 2 + 55} bottom={groundHeight - 44} />
        <PixelBunny x={W / 2 + 75} bottom={groundHeight - 46} flip />
        <PixelOwl x={W / 2 - 50} bottom={groundHeight - 28} />
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
