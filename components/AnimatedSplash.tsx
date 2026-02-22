// components/AnimatedSplash.tsx
// Full-screen animated splash: night sky, mountains, lake reflection,
// campfire with woodland creatures, shooting stars, and "STOKIE" rising text.
// REDESIGNED: Enhanced visual hierarchy, glowing effects, intentional details
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
import { AnimatedLogo } from "./AnimatedLogo";
import { SilhouetteTree } from "./campfire/SilhouetteTree";

const { width: W, height: H } = Dimensions.get("window");

// ──────────────────────────────────────────
// Color palette (from theme)
// ──────────────────────────────────────────
const SKY_TOP = CampfireColors.SKY_TOP;
const SKY_MID = CampfireColors.SKY_MID;
const SKY_LOW = CampfireColors.SKY_LOW;
const MTN_FAR = CampfireColors.MTN_FAR;
const MTN_MID = CampfireColors.MTN_MID;
const MTN_NEAR = CampfireColors.MTN_NEAR;
const LAKE_TOP = CampfireColors.LAKE_TOP;
const LAKE_MID = CampfireColors.LAKE_MID;
const LAKE_BOT = CampfireColors.LAKE_BOT;
const GROUND = CampfireColors.GROUND_DEEP;

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

/** Single twinkling star with glow */
function Star({ x, y, size, delay, color }: { x: number; y: number; size: number; delay: number; color?: string }) {
  const opacity = useSharedValue(0.3);
  const glow = useSharedValue(0);

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
    // Glow pulses independently for variety
    glow.value = withDelay(
      delay + 500,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000 + Math.random() * 1500, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.4, { duration: 2000 + Math.random() * 1500, easing: Easing.inOut(Easing.quad) })
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
    backgroundColor: color || CampfireColors.STAR_WHITE,
    opacity: opacity.value,
    shadowColor: color || "#FFF",
    shadowOpacity: glow.value * 0.8,
    shadowRadius: size * 3,
  }));

  return <Animated.View style={style} />;
}

/** Animated shooting star with enhanced glow */
function SplashShootingStar({ delay }: { delay: number }) {
  const progress = useSharedValue(0);
  const startX = 40 + Math.random() * (W * 0.5);
  const startY = 20 + Math.random() * 80;

  useEffect(() => {
    const fire = () => {
      progress.value = 0;
      progress.value = withTiming(1, { duration: 1800, easing: Easing.out(Easing.cubic) }); // Slower: 900ms → 1800ms
    };
    const t = setTimeout(fire, delay);
    const interval = setInterval(fire, 7000 + Math.random() * 9000);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, []);

  const headStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: startX + interpolate(progress.value, [0, 1], [0, 180]),
    top: startY + interpolate(progress.value, [0, 1], [0, 110]),
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: CampfireColors.FIRE_CORE,
    opacity: interpolate(progress.value, [0, 0.08, 0.65, 1], [0, 1, 1, 0]),
    shadowColor: CampfireColors.FIRE_YELLOW,
    shadowOpacity: interpolate(progress.value, [0, 0.15, 0.7, 1], [0, 1, 0.8, 0]),
    shadowRadius: 12,
  }));

  const trailStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: startX + interpolate(progress.value, [0, 1], [0, 180]) - 70,
    top: startY + interpolate(progress.value, [0, 1], [0, 110]) - 1.5,
    width: 70,
    height: 3,
    opacity: interpolate(progress.value, [0, 0.12, 0.55, 1], [0, 0.7, 0.35, 0]),
    transform: [{ rotate: "31deg" }],
    backgroundColor: "rgba(255, 250, 220, 0.5)",
    borderRadius: 1.5,
    shadowColor: CampfireColors.STAR_WARM,
    shadowOpacity: 0.6,
    shadowRadius: 8,
  }));

  return (
    <>
      <Animated.View style={trailStyle} />
      <Animated.View style={headStyle} />
    </>
  );
}

// ──────────────────────────────────────────
// Fireflies with glowing trails
// ──────────────────────────────────────────

/** Single firefly drifting with trail */
function Firefly({ delay, startX, startY }: { delay: number; startX: number; startY: number }) {
  const progress = useSharedValue(0);
  const glow = useSharedValue(0.3);

  useEffect(() => {
    // Drift path
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 4000 + Math.random() * 3000, easing: Easing.inOut(Easing.sin) }),
        -1,
        false
      )
    );
    // Glow pulse
    glow.value = withDelay(
      delay + 200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.3, { duration: 1800, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );
  }, []);

  const fireflyStyle = useAnimatedStyle(() => {
    // Sinusoidal drift pattern
    const x = startX + interpolate(progress.value, [0, 0.5, 1], [0, 30, -10]);
    const y = startY + interpolate(progress.value, [0, 0.5, 1], [0, -40, -80]);
    const sway = Math.sin(progress.value * Math.PI * 4) * 15;

    return {
      position: "absolute" as const,
      left: x + sway,
      top: y,
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: CampfireColors.FIREFLY,
      opacity: interpolate(progress.value, [0, 0.1, 0.85, 1], [0, 1, 1, 0]),
      shadowColor: CampfireColors.FIREFLY_GLOW,
      shadowOpacity: glow.value,
      shadowRadius: interpolate(glow.value, [0.3, 1], [6, 14]),
    };
  });

  return <Animated.View style={fireflyStyle} />;
}

// ──────────────────────────────────────────
// Animals removed for cleaner, more focused design
// ──────────────────────────────────────────

// ──────────────────────────────────────────
// Rising embers from campfire
// ──────────────────────────────────────────

/** Single ember floating up from fire */
function RisingEmber({ delay, startX }: { delay: number; startX: number }) {
  const progress = useSharedValue(0);
  const flicker = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 3500 + Math.random() * 1500, easing: Easing.out(Easing.quad) }),
        -1,
        false
      )
    );
    flicker.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.4, { duration: 400 }),
          withTiming(0.9, { duration: 250 })
        ),
        -1,
        true
      )
    );
  }, []);

  const emberStyle = useAnimatedStyle(() => {
    const drift = Math.sin(progress.value * Math.PI * 3) * 12;
    return {
      position: "absolute" as const,
      left: startX + drift,
      bottom: interpolate(progress.value, [0, 1], [0, 120]),
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: CampfireColors.EMBER,
      opacity: interpolate(progress.value, [0, 0.1, 0.7, 1], [0, flicker.value, flicker.value * 0.6, 0]),
      shadowColor: CampfireColors.FIRE_ORANGE,
      shadowOpacity: flicker.value * 0.9,
      shadowRadius: 8,
    };
  });

  return <Animated.View style={emberStyle} />;
}

// ──────────────────────────────────────────
// Pulsing moon with enhanced glow
// ──────────────────────────────────────────

function PulsingMoon({ top, right }: { top: number; right: number }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const moonGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(pulse.value, [0, 1], [0.6, 0.9]),
    shadowRadius: interpolate(pulse.value, [0, 1], [18, 28]),
  }));

  return (
    <View style={{ position: "absolute", top, right }}>
      <Animated.View
        style={[
          {
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: CampfireColors.MOON,
            shadowColor: CampfireColors.MOON_GLOW,
          },
          moonGlowStyle,
        ]}
      />
      {/* Dark bite for crescent */}
      <View
        style={{
          position: "absolute",
          top: -3,
          left: 7,
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: CampfireColors.SKY_TOP,
        }}
      />
    </View>
  );
}

// ──────────────────────────────────────────
// Campfire scene at the bottom
// ──────────────────────────────────────────

// SplashCampfire replaced by shared CampfireSimple component

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
  const flicker = useSharedValue(0);

  useEffect(() => {
    // Gentle wiggle
    wiggle.value = withDelay(
      delay + 200,
      withRepeat(
        withSequence(
          withTiming(1.5, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
          withTiming(-1.5, { duration: 2000, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );
    // Subtle flicker for fire effect
    flicker.value = withDelay(
      delay + index * 100,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600 + Math.random() * 400 }),
          withTiming(0.85, { duration: 500 + Math.random() * 300 }),
          withTiming(1, { duration: 700 + Math.random() * 400 })
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

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flicker.value, [0.85, 1], [0.15, 0.25]),
  }));

  // Amber fire gradient: red (bottom) → orange → yellow → white (tips)
  // with animated fire glow behind each letter
  const fontSize = 56;
  const letterHeight = fontSize * 1.15; // approximate rendered height

  return (
    <Animated.View style={[{ marginHorizontal: 2 }, style]}>
      {/* Outer fire glow - faint warm halo (animated) */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: -24,
            left: -20,
            right: -20,
            bottom: -14,
            backgroundColor: CampfireColors.FIRE_ORANGE,
            borderRadius: 32,
          },
          glowStyle,
        ]}
        pointerEvents="none"
      />
      {/* Middle glow layer (animated) */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: -14,
            left: -14,
            right: -14,
            bottom: -10,
            backgroundColor: CampfireColors.FIRE_YELLOW,
            borderRadius: 24,
            opacity: interpolate(flicker.value, [0.85, 1], [0.2, 0.3]),
          },
        ]}
        pointerEvents="none"
      />
      {/* Inner glow - brighter, closer (animated) */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: -8,
            left: -8,
            right: -8,
            bottom: -6,
            backgroundColor: CampfireColors.FIRE_CORE,
            borderRadius: 18,
            opacity: interpolate(flicker.value, [0.85, 1], [0.12, 0.18]),
          },
        ]}
        pointerEvents="none"
      />

      {/* Layer 1 (base): Deep red - visible at the bottom */}
      <Animated.Text
        style={{
          fontFamily: "Paaxel",
          fontSize,
          color: CampfireColors.FIRE_RED,
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
            color: CampfireColors.FIRE_ORANGE,
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
    const startTime = Date.now();
    console.log(`[SPLASH] StokieTitle mounted at ${startTime}, will complete in 1600ms`);
    // Show for 1.6 seconds then signal done
    const t = setTimeout(() => {
      const elapsed = Date.now() - startTime;
      console.log(`[SPLASH] StokieTitle timeout fired after ${elapsed}ms, calling onComplete`);
      onComplete();
    }, 1600);
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

// SplashTree replaced by shared SilhouetteTree component

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

  // Star field with varied colors
  const stars = React.useMemo(() => {
    const result: { x: number; y: number; size: number; delay: number; color: string }[] = [];
    const seed = 7;
    let s = seed;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
    const starColors = [
      CampfireColors.STAR_WHITE,
      CampfireColors.STAR_WARM,
      CampfireColors.STAR_LAVENDER,
      CampfireColors.MOON,
    ];
    for (let i = 0; i < 75; i++) {
      result.push({
        x: rand() * (W - 10) + 5,
        y: rand() * (skyHeight - 20) + 10,
        size: 1.5 + rand() * 3.5,
        delay: rand() * 3500,
        color: starColors[Math.floor(rand() * starColors.length)],
      });
    }
    return result;
  }, []);

  // Fireflies
  const fireflies = React.useMemo(() => {
    const result: { startX: number; startY: number; delay: number }[] = [];
    const seed = 42;
    let s = seed;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
    for (let i = 0; i < 12; i++) {
      result.push({
        startX: rand() * W,
        startY: lakeTop + rand() * 60,
        delay: rand() * 4000,
      });
    }
    return result;
  }, []);

  // Rising embers
  const embers = React.useMemo(() => {
    const result: { startX: number; delay: number }[] = [];
    const centerX = W / 2;
    for (let i = 0; i < 8; i++) {
      result.push({
        startX: centerX - 30 + Math.random() * 60,
        delay: i * 600 + Math.random() * 1000,
      });
    }
    return result;
  }, []);

  // Forest trees — rendered IN FRONT of the lake (DENSE FOREST)
  // Back row (smaller, lighter shade, peek above lake)
  const backTrees = React.useMemo(() => {
    const trees: { x: number; height: number; shade: number }[] = [];
    let s = 123;
    const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

    // Dense back row - every 10-15px
    for (let x = -30; x < W + 30; x += 10 + rand() * 8) {
      trees.push({
        x,
        height: 40 + rand() * 25,
        shade: Math.floor(rand() * 2) // shades 0-1
      });
    }
    return trees;
  }, []);

  // Front row (taller, darker shade, overlap the lake more)
  const frontTrees = React.useMemo(() => {
    const trees: { x: number; height: number; shade: number }[] = [];
    let s = 456;
    const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

    // Dense front row - every 12-20px
    for (let x = -35; x < W + 35; x += 12 + rand() * 10) {
      trees.push({
        x,
        height: 70 + rand() * 50,
        shade: 2 + Math.floor(rand() * 2) // shades 2-3
      });
    }
    return trees;
  }, []);
  // Middle trees - fill the gap between lake treeline and ground
  const middleTrees = React.useMemo(() => {
    const trees: { x: number; height: number; shade: number }[] = [];
    let s = 789;
    const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

    // Dense middle layer - covers entire width
    for (let x = -40; x < W + 40; x += 8 + rand() * 6) {
      trees.push({
        x,
        height: 60 + rand() * 40,
        shade: 2 + Math.floor(rand() * 2) // shades 2-3
      });
    }
    return trees;
  }, []);

  // Ground trees — VERY DENSE forest, smaller clearing for campfire
  // Back layer
  const groundTreesBack = React.useMemo(() => {
    const trees: { x: number; height: number; shade: number }[] = [];
    let s = 42;
    const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    // Left side - very dense
    for (let x = -35; x < W / 2 - 45; x += 6 + rand() * 4) {
      trees.push({ x, height: 50 + rand() * 35, shade: 3 + Math.floor(rand() * 3) });
    }
    // Right side - very dense
    for (let x = W / 2 + 45; x < W + 25; x += 6 + rand() * 4) {
      trees.push({ x, height: 50 + rand() * 35, shade: 3 + Math.floor(rand() * 3) });
    }
    return trees;
  }, []);

  // Front layer - even denser
  const groundTreesFront = React.useMemo(() => {
    const trees: { x: number; height: number; shade: number }[] = [];
    let s = 99;
    const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    // Left side
    for (let x = -30; x < W / 2 - 40; x += 5 + rand() * 3) {
      trees.push({ x, height: 45 + rand() * 32, shade: 3 + Math.floor(rand() * 3) });
    }
    // Right side
    for (let x = W / 2 + 40; x < W + 20; x += 5 + rand() * 3) {
      trees.push({ x, height: 45 + rand() * 32, shade: 3 + Math.floor(rand() * 3) });
    }
    return trees;
  }, []);

  return (
    <Animated.View style={[styles.container, sceneStyle]}>
      {/* ── Sky ── */}
      <View style={[styles.zone, { height: skyHeight }]}>
        {/* Gradient bands */}
        <View style={{ flex: 1, backgroundColor: SKY_TOP }} />
        <View style={{ flex: 1, backgroundColor: SKY_MID }} />
        <View style={{ flex: 1, backgroundColor: SKY_LOW }} />

        {/* Stars with varied colors and glow */}
        {stars.map((s, i) => (
          <Star key={i} x={s.x} y={s.y} size={s.size} delay={s.delay} color={s.color} />
        ))}

        {/* Shooting stars */}
        {/* More shooting stars with timing within 1.5s window */}
        <SplashShootingStar delay={200} />
        <SplashShootingStar delay={450} />
        <SplashShootingStar delay={700} />
        <SplashShootingStar delay={950} />
        <SplashShootingStar delay={1200} />
        <SplashShootingStar delay={350} />
        <SplashShootingStar delay={850} />

        {/* Pulsing moon (crescent) */}
        <PulsingMoon top={40} right={W * 0.15} />

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

        {/* Water ripple lines - more visible */}
        {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((pct, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              top: lakeHeight * pct,
              left: W * (0.05 + i * 0.03),
              width: W * (0.4 + i * 0.08),
              height: 1,
              backgroundColor: "rgba(150, 180, 220, 0.15)",
            }}
          />
        ))}
      </View>

      {/* ── Trees rendered IN FRONT of the lake ── */}
      {/* Back row of trees — on top of lake zone */}
      <View style={{ position: "absolute", top: lakeTop + lakeHeight - 55, left: 0, right: 0, height: 120, zIndex: 2 }} pointerEvents="none">
        {backTrees.map((t, i) => (
          <SilhouetteTree key={`bt${i}`} x={t.x} height={t.height} shade={t.shade} />
        ))}
      </View>
      {/* Front row of trees — taller, darker, more overlap */}
      <View style={{ position: "absolute", top: lakeTop + lakeHeight - 80, left: 0, right: 0, height: 160, zIndex: 3 }} pointerEvents="none">
        {frontTrees.map((t, i) => (
          <SilhouetteTree key={`ft${i}`} x={t.x} height={t.height} shade={t.shade} />
        ))}
      </View>
      {/* Middle trees — fill gap between lake and ground */}
      <View style={{ position: "absolute", top: lakeTop + lakeHeight - 20, left: 0, right: 0, height: 120, zIndex: 4 }} pointerEvents="none">
        {middleTrees.map((t, i) => (
          <SilhouetteTree key={`mt${i}`} x={t.x} height={t.height} shade={t.shade} />
        ))}
      </View>

      {/* ── Ground trees (back layer — behind creatures) ── */}
      <View style={{ position: "absolute", top: groundTop - 30, left: 0, right: 0, height: groundHeight + 30, zIndex: 5 }} pointerEvents="none">
        {groundTreesBack.map((t, i) => (
          <SilhouetteTree key={`grb${i}`} x={t.x} height={t.height} shade={t.shade} />
        ))}
      </View>

      {/* ── Animals removed - cleaner focus on fire & nature ── */}

      {/* ── Ground trees (front layer — in front of creatures) ── */}
      <View style={{ position: "absolute", top: groundTop - 30, left: 0, right: 0, height: groundHeight + 30, zIndex: 7 }} pointerEvents="none">
        {groundTreesFront.map((t, i) => (
          <SilhouetteTree key={`grf${i}`} x={t.x} height={t.height} shade={t.shade} />
        ))}
      </View>

      {/* ── Fireflies drifting ── */}
      <View style={{ position: "absolute", top: lakeTop, left: 0, right: 0, height: lakeHeight + 100, zIndex: 8 }} pointerEvents="none">
        {fireflies.map((f, i) => (
          <Firefly key={`ff${i}`} delay={f.delay} startX={f.startX} startY={f.startY} />
        ))}
      </View>

      {/* ── Ground ── */}
      <View style={[styles.zone, { height: groundHeight, backgroundColor: "#0F1A0D" }]}>
        {/* Dark forest floor */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: "#1A2818" }} />
      </View>

      {/* ── Campfire + embers (above trees) ── */}
      <View style={{ position: "absolute", top: groundTop, left: 0, right: 0, height: groundHeight, zIndex: 9 }} pointerEvents="none">
        {/* Ambient ground glow from fire */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: W / 2 - 100,
            width: 200,
            height: 60,
            backgroundColor: CampfireColors.FIRE_ORANGE,
            opacity: 0.08,
            borderRadius: 100,
          }}
        />

        {/* Campfire (centered) with enhanced glow */}
        <View style={{ position: "absolute", top: 8, left: W / 2 - 60 }}>
          <AnimatedLogo size={120} />
        </View>

        {/* Rising embers from campfire */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          {embers.map((e, i) => (
            <RisingEmber key={`em${i}`} delay={e.delay} startX={e.startX} />
          ))}
        </View>
      </View>

      {/* ── Subtle vignette to focus attention on center ── */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
        }}
        pointerEvents="none"
      >
        {/* Top vignette */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: H * 0.15,
            backgroundColor: "#000",
            opacity: 0.12,
          }}
        />
        {/* Bottom vignette */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: H * 0.08,
            backgroundColor: "#000",
            opacity: 0.15,
          }}
        />
        {/* Side vignettes */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: W * 0.08,
            bottom: 0,
            backgroundColor: "#000",
            opacity: 0.1,
          }}
        />
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: W * 0.08,
            bottom: 0,
            backgroundColor: "#000",
            opacity: 0.1,
          }}
        />
      </View>

      {/* ── STOKIE Title overlay (enhanced z-index) ── */}
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
    zIndex: 11,
  },
});
