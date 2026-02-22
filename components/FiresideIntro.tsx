// components/FiresideIntro.tsx
// Full-screen intro animation for the fireside: night scene with mountains,
// lake, campfire, and group member avatars walking from trees to sit around the fire.

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
  SharedValue,
} from "react-native-reanimated";
import { PixelCharacter, CharacterConfig, DEFAULT_CHARACTER } from "./PixelCharacter";
import { PixelTitle } from "./PixelTitle";
import { AnimatedLogo } from "./AnimatedLogo";
import { DetailedPineTree } from "./PixelArt";
import { SwayingTree } from "./sky/SwayingTree";
import { CampfireColors } from "../constants/theme";

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
// Scene sub-components (from AnimatedSplash)
// ──────────────────────────────────────────

function Mountain({
  x, w, h, color, bottom = 0,
}: { x: number; w: number; h: number; color: string; bottom?: number }) {
  return (
    <View
      style={{
        position: "absolute", left: x - w / 2, bottom,
        width: 0, height: 0,
        borderLeftWidth: w / 2, borderRightWidth: w / 2, borderBottomWidth: h,
        borderLeftColor: "transparent", borderRightColor: "transparent",
        borderBottomColor: color,
      }}
    />
  );
}

function MountainReflection({
  x, w, h, color, top,
}: { x: number; w: number; h: number; color: string; top: number }) {
  return (
    <View
      style={{
        position: "absolute", left: x - w / 2, top,
        width: 0, height: 0,
        borderLeftWidth: w / 2, borderRightWidth: w / 2, borderTopWidth: h,
        borderLeftColor: "transparent", borderRightColor: "transparent",
        borderTopColor: color, opacity: 0.25,
      }}
    />
  );
}

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
        -1, true
      )
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    position: "absolute" as const, left: x, top: y,
    width: size, height: size, borderRadius: size / 2,
    backgroundColor: "#FFF", opacity: opacity.value,
  }));
  return <Animated.View style={style} />;
}

function SplashShootingStar({ delay }: { delay: number }) {
  const progress = useSharedValue(0);
  const startX = 40 + Math.random() * (W * 0.5);
  const startY = 20 + Math.random() * 80;
  useEffect(() => {
    const fire = () => { progress.value = 0; progress.value = withTiming(1, { duration: 800 }); };
    const t = setTimeout(fire, delay);
    const interval = setInterval(fire, 6000 + Math.random() * 8000);
    return () => { clearTimeout(t); clearInterval(interval); };
  }, []);
  const headStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: startX + interpolate(progress.value, [0, 1], [0, 160]),
    top: startY + interpolate(progress.value, [0, 1], [0, 100]),
    width: 4, height: 4, borderRadius: 2, backgroundColor: "#FFFFF0",
    opacity: interpolate(progress.value, [0, 0.1, 0.7, 1], [0, 1, 1, 0]),
    shadowColor: "#FFF", shadowOpacity: 1, shadowRadius: 8,
  }));
  const trailStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: startX + interpolate(progress.value, [0, 1], [0, 160]) - 60,
    top: startY + interpolate(progress.value, [0, 1], [0, 100]) - 1,
    width: 60, height: 2,
    opacity: interpolate(progress.value, [0, 0.15, 0.6, 1], [0, 0.6, 0.3, 0]),
    transform: [{ rotate: "33deg" }],
    backgroundColor: "rgba(255,255,240,0.4)", borderRadius: 1,
  }));
  return (
    <>
      <Animated.View style={trailStyle} />
      <Animated.View style={headStyle} />
    </>
  );
}

// SplashTree replaced by shared SilhouetteTree component

// SplashCampfire replaced by shared CampfireSimple component

// ──────────────────────────────────────────
// Pixel bear peeking from behind a tree
// ──────────────────────────────────────────
function PeekingBear({ x, bottom }: { x: number; bottom: number }) {
  const peekX = useSharedValue(-10);
  useEffect(() => {
    // Shy peek: slide out, pause, slide back, repeat
    peekX.value = withDelay(
      2000,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 800, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 1800 }), // hold
          withTiming(-10, { duration: 600, easing: Easing.in(Easing.quad) }),
          withTiming(-10, { duration: 2000 }), // hide
        ),
        -1, false
      )
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    position: "absolute" as const, left: x, bottom,
    transform: [{ translateX: peekX.value }],
  }));
  return (
    <Animated.View style={style}>
      <View style={{ width: 18, height: 20 }}>
        {/* Body */}
        <View style={{ position: "absolute", bottom: 0, left: 2, width: 14, height: 10, backgroundColor: "#5C3A1E", borderRadius: 4 }} />
        {/* Head */}
        <View style={{ position: "absolute", bottom: 7, left: 0, width: 14, height: 12, backgroundColor: "#6B4226", borderRadius: 6 }} />
        {/* Ears */}
        <View style={{ position: "absolute", bottom: 16, left: 0, width: 5, height: 5, backgroundColor: "#6B4226", borderRadius: 3 }} />
        <View style={{ position: "absolute", bottom: 16, left: 9, width: 5, height: 5, backgroundColor: "#6B4226", borderRadius: 3 }} />
        {/* Inner ears */}
        <View style={{ position: "absolute", bottom: 17, left: 1.5, width: 2, height: 2, backgroundColor: "#A0704A", borderRadius: 1 }} />
        <View style={{ position: "absolute", bottom: 17, left: 10.5, width: 2, height: 2, backgroundColor: "#A0704A", borderRadius: 1 }} />
        {/* Snout */}
        <View style={{ position: "absolute", bottom: 8, left: 3, width: 8, height: 5, backgroundColor: "#8B6240", borderRadius: 3 }} />
        {/* Nose */}
        <View style={{ position: "absolute", bottom: 11, left: 5.5, width: 3, height: 2, backgroundColor: "#222", borderRadius: 1.5 }} />
        {/* Eyes */}
        <View style={{ position: "absolute", bottom: 13, left: 3, width: 2.5, height: 2.5, backgroundColor: "#111", borderRadius: 1.5 }} />
        <View style={{ position: "absolute", bottom: 13, left: 9, width: 2.5, height: 2.5, backgroundColor: "#111", borderRadius: 1.5 }} />
        {/* Eye shine */}
        <View style={{ position: "absolute", bottom: 14, left: 3.5, width: 1, height: 1, backgroundColor: "#FFF", borderRadius: 0.5 }} />
        <View style={{ position: "absolute", bottom: 14, left: 9.5, width: 1, height: 1, backgroundColor: "#FFF", borderRadius: 0.5 }} />
      </View>
    </Animated.View>
  );
}

// ──────────────────────────────────────────
// Jumping fish in the lake
// ──────────────────────────────────────────
function JumpingFish({ x, baseY, delay, eaten }: { x: number; baseY: number; delay: number; eaten?: boolean }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    const jump = () => {
      progress.value = 0;
      progress.value = withTiming(1, { duration: eaten ? 1000 : 800, easing: Easing.linear });
    };
    const t = setTimeout(jump, delay);
    // Non-eaten fish repeat; eaten fish plays once
    const interval = eaten ? undefined : setInterval(jump, 4000 + Math.random() * 3000);
    return () => { clearTimeout(t); if (interval) clearInterval(interval); };
  }, []);

  const fishStyle = useAnimatedStyle(() => {
    const arcHeight = 35;
    const yOffset = -Math.sin(progress.value * Math.PI) * arcHeight;
    const rotation = interpolate(progress.value, [0, 0.5, 1], [30, 0, -30]);
    const xDrift = interpolate(progress.value, [0, 1], [0, 12]);
    return {
      position: "absolute" as const,
      left: x + xDrift,
      top: baseY + yOffset,
      opacity: eaten
        ? interpolate(progress.value, [0, 0.1, 0.55, 0.6, 1], [0, 1, 1, 0, 0])
        : interpolate(progress.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  return (
    <Animated.View style={fishStyle}>
      <View style={{ width: 12, height: 7 }}>
        {/* Body */}
        <View style={{ position: "absolute", left: 0, top: 1, width: 9, height: 5, backgroundColor: "#7AB8D4", borderRadius: 3 }} />
        {/* Tail */}
        <View style={{ position: "absolute", left: 8, top: 0, width: 0, height: 0,
          borderLeftWidth: 4, borderTopWidth: 3.5, borderBottomWidth: 3.5,
          borderLeftColor: "#6AA8C4", borderTopColor: "transparent", borderBottomColor: "transparent",
        }} />
        {/* Eye */}
        <View style={{ position: "absolute", left: 1.5, top: 2, width: 2, height: 2, backgroundColor: "#111", borderRadius: 1 }} />
        {/* Belly highlight */}
        <View style={{ position: "absolute", left: 1, top: 3.5, width: 6, height: 2, backgroundColor: "#C0E0F0", borderRadius: 1 }} />
      </View>
    </Animated.View>
  );
}

// ──────────────────────────────────────────
// Fire ember / spark that rises from campfire
// ──────────────────────────────────────────
function FireEmber({ x, delay, speed }: { x: number; delay: number; speed: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    const fire = () => { progress.value = 0; progress.value = withTiming(1, { duration: speed, easing: Easing.out(Easing.quad) }); };
    const t = setTimeout(fire, delay);
    const interval = setInterval(fire, speed + 500 + Math.random() * 2000);
    return () => { clearTimeout(t); clearInterval(interval); };
  }, []);
  const drift = (Math.random() - 0.5) * 40;
  const size = 2 + Math.random() * 3;
  const style = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: x + interpolate(progress.value, [0, 1], [0, drift]),
    top: interpolate(progress.value, [0, 1], [0, -80 - Math.random() * 40]),
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: interpolate(progress.value, [0, 0.5, 1], [0, 1, 1]) > 0.5 ? "#FF6B35" : "#FFD700",
    opacity: interpolate(progress.value, [0, 0.1, 0.6, 1], [0, 1, 0.6, 0]),
  }));
  return <Animated.View style={style} />;
}

// ──────────────────────────────────────────
// S'more on a stick (held by sitting avatars)
// ──────────────────────────────────────────
function Smore({ visible }: { visible: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    opacity: visible.value,
  }));
  return (
    <Animated.View style={[{ position: "absolute", top: 8, right: -10 }, style]}>
      <View style={{ alignItems: "center" }}>
        {/* Marshmallow */}
        <View style={{ width: 6, height: 6, backgroundColor: "#FFF5E0", borderRadius: 2, borderWidth: 0.5, borderColor: "#E0D0B0" }} />
        {/* Chocolate */}
        <View style={{ width: 6, height: 3, backgroundColor: "#5C3420", borderRadius: 1, marginTop: -0.5 }} />
        {/* Graham cracker */}
        <View style={{ width: 7, height: 2.5, backgroundColor: "#D4A050", borderRadius: 0.5, marginTop: -0.5 }} />
        {/* Stick */}
        <View style={{ width: 1.5, height: 12, backgroundColor: "#8B7355", marginTop: -0.5 }} />
      </View>
    </Animated.View>
  );
}

// ──────────────────────────────────────────
// Log stump for avatars to sit on
// ──────────────────────────────────────────
function Stump({ x, y }: { x: number; y: number }) {
  return (
    <View style={{ position: "absolute", left: x, top: y, zIndex: 0 }}>
      <View style={{ width: 18, height: 7, backgroundColor: "#D4A040", borderRadius: 9 }} />
      <View style={{ width: 16, height: 12, backgroundColor: "#5C3820", borderBottomLeftRadius: 4, borderBottomRightRadius: 4, marginTop: -1, marginLeft: 1 }} />
    </View>
  );
}

// ──────────────────────────────────────────
// Walking avatar with animation
// ──────────────────────────────────────────
interface AvatarMember {
  user_id: string;
  username: string;
  avatar_config: any;
}

function WalkingAvatar({
  member,
  startX,
  endX,
  y,
  delay,
  walkDuration,
}: {
  member: AvatarMember;
  startX: number;
  endX: number;
  y: number;
  delay: number;
  walkDuration: number;
}) {
  const posX = useSharedValue(startX);
  const opacity = useSharedValue(0);
  const isSitting = useSharedValue(0);
  // Bounce for walking animation
  const bounce = useSharedValue(0);

  useEffect(() => {
    // Fade in at tree edge
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));

    // Walking bounce animation
    bounce.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-2, { duration: 200, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 200, easing: Easing.inOut(Easing.quad) })
        ),
        Math.ceil(walkDuration / 400),
        false
      )
    );

    // Walk to destination
    posX.value = withDelay(
      delay,
      withTiming(endX, { duration: walkDuration, easing: Easing.inOut(Easing.quad) })
    );

    // Switch to sitting after walk completes
    isSitting.value = withDelay(delay + walkDuration, withTiming(1, { duration: 1 }));
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: posX.value,
    top: y,
    zIndex: 1,
    opacity: opacity.value,
    transform: [
      { translateY: isSitting.value < 0.5 ? bounce.value : 0 },
      // Flip avatar if coming from the right
      { scaleX: startX > endX ? -1 : 1 },
    ],
  }));

  const config = (member.avatar_config as CharacterConfig) || DEFAULT_CHARACTER;
  const idleConfig = { ...config, pose: "idle" };
  const sittingConfig = { ...config, pose: "sitting" };

  const idleStyle = useAnimatedStyle(() => ({
    opacity: isSitting.value < 0.5 ? 1 : 0,
  }));

  const sittingStyle = useAnimatedStyle(() => ({
    opacity: isSitting.value < 0.5 ? 0 : 1,
    position: "absolute" as const,
    top: 0,
    left: 0,
  }));

  return (
    <Animated.View style={containerStyle}>
      <Animated.View style={idleStyle}>
        <PixelCharacter config={idleConfig} size={35} />
      </Animated.View>
      <Animated.View style={sittingStyle}>
        <PixelCharacter config={sittingConfig} size={35} />
        <Smore visible={isSitting} />
      </Animated.View>
    </Animated.View>
  );
}

// ──────────────────────────────────────────
// Main FiresideIntro component
// ──────────────────────────────────────────
interface FiresideIntroProps {
  members: AvatarMember[];
  promptCount: number;
  onComplete: () => void;
}

export function FiresideIntro({ members, promptCount, onComplete }: FiresideIntroProps) {
  // Scene fade in
  const sceneFade = useSharedValue(0);
  // Title fade in
  const titleFade = useSharedValue(0);
  // Subtitle fade in
  const subtitleFade = useSharedValue(0);
  // Scene fade out
  const sceneOut = useSharedValue(1);

  // Layout zones
  const skyHeight = H * 0.42;
  const lakeTop = skyHeight;
  const lakeHeight = H * 0.22;
  const groundTop = lakeTop + lakeHeight;
  const groundHeight = H - groundTop;

  // Total animation duration
  const TOTAL_DURATION = 5500;

  useEffect(() => {
    // 0.0s - Scene fades in
    sceneFade.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) });

    // 0.8s - Title fades in
    titleFade.value = withDelay(800, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));

    // 1.0s - Subtitle fades in
    subtitleFade.value = withDelay(1000, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));

    // 5.0s - Scene fades out
    sceneOut.value = withDelay(5000, withTiming(0, { duration: 500, easing: Easing.in(Easing.quad) }));

    // 5.5s - Call onComplete
    const timer = setTimeout(() => {
      onComplete();
    }, TOTAL_DURATION);

    return () => clearTimeout(timer);
  }, []);

  const sceneStyle = useAnimatedStyle(() => ({
    opacity: sceneFade.value * sceneOut.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleFade.value,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleFade.value,
  }));

  // Mountain definitions
  const mountains = useMemo(() => [
    { x: W * 0.15, w: W * 0.5, h: 140, color: MTN_FAR },
    { x: W * 0.6, w: W * 0.55, h: 170, color: MTN_FAR },
    { x: W * 0.35, w: W * 0.45, h: 120, color: MTN_MID },
    { x: W * 0.85, w: W * 0.4, h: 130, color: MTN_MID },
    { x: W * 0.2, w: W * 0.35, h: 90, color: MTN_NEAR },
    { x: W * 0.7, w: W * 0.38, h: 100, color: MTN_NEAR },
  ], []);

  // Star field
  const stars = useMemo(() => {
    const result: { x: number; y: number; size: number; delay: number }[] = [];
    let s = 13; // Different seed from splash
    const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
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

  // Trees - back row
  const backTrees = useMemo(() => [
    { x: -15, height: 55, shade: 0 }, { x: 18, height: 45, shade: 0 },
    { x: 50, height: 60, shade: 1 }, { x: 80, height: 48, shade: 0 },
    { x: 110, height: 52, shade: 1 },
    { x: W - 120, height: 50, shade: 0 }, { x: W - 90, height: 55, shade: 1 },
    { x: W - 60, height: 48, shade: 0 }, { x: W - 30, height: 58, shade: 1 },
    { x: W - 5, height: 45, shade: 0 },
  ], []);

  // Trees - front row
  const frontTrees = useMemo(() => [
    { x: -25, height: 100, shade: 2 }, { x: 5, height: 85, shade: 3 },
    { x: 35, height: 110, shade: 2 }, { x: 65, height: 78, shade: 3 },
    { x: 95, height: 92, shade: 2 },
    { x: W - 110, height: 88, shade: 3 }, { x: W - 80, height: 105, shade: 2 },
    { x: W - 50, height: 95, shade: 3 }, { x: W - 20, height: 90, shade: 2 },
    { x: W + 5, height: 80, shade: 3 },
  ], []);

  // Ground trees (dense forest on sides, clearing in center)
  const groundTrees = useMemo(() => [
    // Far left — off-screen overlap
    { x: -40, height: 68, shade: 3 }, { x: -30, height: 75, shade: 3 },
    { x: -18, height: 62, shade: 4 }, { x: -8, height: 80, shade: 3 },
    // Left side — packed tight
    { x: 4, height: 68, shade: 5 }, { x: 14, height: 82, shade: 3 },
    { x: 22, height: 58, shade: 4 }, { x: 30, height: 76, shade: 5 },
    { x: 38, height: 65, shade: 3 }, { x: 46, height: 72, shade: 4 },
    { x: 54, height: 60, shade: 5 }, { x: 62, height: 78, shade: 3 },
    { x: 70, height: 55, shade: 4 }, { x: 78, height: 68, shade: 5 },
    { x: 86, height: 62, shade: 3 }, { x: 94, height: 74, shade: 4 },
    // Left edge of clearing
    { x: 102, height: 56, shade: 5 }, { x: 110, height: 64, shade: 4 },
    { x: 118, height: 50, shade: 5 },
    // Right edge of clearing
    { x: W - 132, height: 52, shade: 5 },
    { x: W - 125, height: 60, shade: 4 }, { x: W - 117, height: 68, shade: 5 },
    // Right side — packed tight
    { x: W - 108, height: 74, shade: 3 }, { x: W - 100, height: 58, shade: 4 },
    { x: W - 92, height: 70, shade: 5 }, { x: W - 84, height: 80, shade: 3 },
    { x: W - 76, height: 62, shade: 4 }, { x: W - 68, height: 72, shade: 5 },
    { x: W - 60, height: 56, shade: 3 }, { x: W - 52, height: 78, shade: 4 },
    { x: W - 44, height: 64, shade: 5 }, { x: W - 36, height: 70, shade: 3 },
    { x: W - 28, height: 58, shade: 4 }, { x: W - 20, height: 76, shade: 5 },
    { x: W - 12, height: 66, shade: 3 }, { x: W - 4, height: 72, shade: 4 },
    // Far right — off-screen overlap
    { x: W + 4, height: 60, shade: 3 }, { x: W + 12, height: 55, shade: 5 },
    { x: W + 20, height: 65, shade: 4 },
  ], []);

  // Extra foreground bottom trees (rendered in front of everything at the very bottom edges)
  const bottomTrees = useMemo(() => [
    // Left cluster
    { x: -20, height: 90, shade: 6 }, { x: 0, height: 72, shade: 7 },
    { x: 18, height: 95, shade: 6 }, { x: 36, height: 78, shade: 7 },
    { x: 52, height: 85, shade: 6 }, { x: 68, height: 70, shade: 7 },
    { x: 82, height: 88, shade: 6 },
    // Right cluster
    { x: W - 95, height: 86, shade: 6 }, { x: W - 78, height: 72, shade: 7 },
    { x: W - 62, height: 92, shade: 6 }, { x: W - 46, height: 76, shade: 7 },
    { x: W - 30, height: 88, shade: 6 }, { x: W - 14, height: 74, shade: 7 },
    { x: W + 2, height: 82, shade: 6 },
  ], []);

  // Avatar positioning around campfire
  const displayMembers = members.slice(0, 8);
  const campfireCenterX = W / 2 - 55; // matches campfire left position
  const campfireY = 8; // matches campfire top position in ground zone

  // Semicircle positions around the fire (in ground zone coordinates)
  const avatarPositions = useMemo(() => {
    const count = displayMembers.length;
    if (count === 0) return [];

    const positions: { endX: number; y: number; startX: number; fromLeft: boolean }[] = [];
    const fireCenter = W / 2;
    const radius = 105; // semicircle radius from fire center

    for (let i = 0; i < count; i++) {
      // Distribute along a semicircle below the fire (angles from ~150deg to ~30deg)
      const angle = Math.PI * (0.15 + (0.7 * i) / Math.max(count - 1, 1));
      const endX = fireCenter + Math.cos(angle) * radius - 17; // center avatar (35px / 2)
      const y = campfireY + 55 + Math.sin(angle) * 35; // below fire

      // Alternate sides: even indices from left, odd from right
      const fromLeft = i % 2 === 0;
      const startX = fromLeft ? -40 : W + 10;

      positions.push({ endX, y, startX, fromLeft });
    }
    return positions;
  }, [displayMembers.length]);

  // Stump positions (placed at avatar sitting destinations)
  const stumpPositions = useMemo(() => {
    return avatarPositions.map(pos => ({
      x: pos.endX - 1,
      y: pos.y + 25, // stump sits below the avatar
    }));
  }, [avatarPositions]);

  return (
    <Animated.View style={[styles.container, sceneStyle]}>
      {/* ── Sky ── */}
      <View style={[styles.zone, { height: skyHeight }]}>
        <View style={{ flex: 1, backgroundColor: SKY_TOP }} />
        <View style={{ flex: 1, backgroundColor: SKY_MID }} />
        <View style={{ flex: 1, backgroundColor: SKY_LOW }} />

        {/* Stars */}
        {stars.map((s, i) => (
          <Star key={i} x={s.x} y={s.y} size={s.size} delay={s.delay} />
        ))}

        {/* Shooting stars */}
        <SplashShootingStar delay={800} />
        <SplashShootingStar delay={2200} />
        <SplashShootingStar delay={3800} />
        <SplashShootingStar delay={5500} />
        <SplashShootingStar delay={7200} />
        <SplashShootingStar delay={9000} />

        {/* Full moon (not crescent) */}
        <View style={{ position: "absolute", top: 40, right: W * 0.15 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: CampfireColors.MOON,
              shadowColor: CampfireColors.MOON_GLOW,
              shadowOpacity: 0.8,
              shadowRadius: 25,
            }}
          />
        </View>

        {/* Mountains */}
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 180 }}>
          {mountains.map((m, i) => (
            <Mountain key={i} x={m.x} w={m.w} h={m.h} color={m.color} />
          ))}
        </View>
      </View>

      {/* ── Lake ── */}
      <View style={[styles.zone, { height: lakeHeight }]}>
        <View style={{ flex: 1, backgroundColor: LAKE_TOP }} />
        <View style={{ flex: 1, backgroundColor: LAKE_MID }} />
        <View style={{ flex: 1, backgroundColor: LAKE_BOT }} />

        {/* Reflected mountains */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 120 }}>
          {mountains.map((m, i) => (
            <MountainReflection key={i} x={m.x} w={m.w} h={m.h * 0.6} color={m.color} top={0} />
          ))}
        </View>

        {/* Water ripples */}
        {[0.2, 0.4, 0.6, 0.8].map((pct, i) => (
          <View
            key={i}
            style={{
              position: "absolute", top: lakeHeight * pct,
              left: W * (0.1 + i * 0.05), width: W * (0.3 + i * 0.1),
              height: 1, backgroundColor: "rgba(150, 180, 220, 0.08)",
            }}
          />
        ))}

        {/* Moon reflection */}
        <View style={{
          position: "absolute",
          top: lakeHeight * 0.1,
          right: W * 0.15 - 4,
          width: 36,
          height: 50,
          alignItems: "center",
          opacity: 0.2,
        }}>
          <View style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: CampfireColors.MOON,
          }} />
          {/* Rippled reflection streaks */}
          <View style={{ width: 20, height: 2, backgroundColor: CampfireColors.MOON, opacity: 0.4, marginTop: 4, borderRadius: 1 }} />
          <View style={{ width: 14, height: 1.5, backgroundColor: CampfireColors.MOON, opacity: 0.3, marginTop: 3, borderRadius: 1 }} />
          <View style={{ width: 10, height: 1, backgroundColor: CampfireColors.MOON, opacity: 0.2, marginTop: 3, borderRadius: 1 }} />
        </View>

        {/* Jumping fish */}
        <JumpingFish x={W * 0.12} baseY={lakeHeight * 0.3} delay={600} />
        <JumpingFish x={W * 0.25} baseY={lakeHeight * 0.45} delay={1400} />
        <JumpingFish x={W * 0.42} baseY={lakeHeight * 0.35} delay={2800} />
        <JumpingFish x={W * 0.58} baseY={lakeHeight * 0.5} delay={1800} />
        <JumpingFish x={W * 0.72} baseY={lakeHeight * 0.4} delay={3200} />
        <JumpingFish x={W * 0.85} baseY={lakeHeight * 0.55} delay={800} />
      </View>

      {/* ── Trees: back row ── */}
      <View style={{ position: "absolute", top: lakeTop + lakeHeight - 55, left: 0, right: 0, height: 120, zIndex: 2 }} pointerEvents="none">
        {backTrees.map((t, i) => (
          <View key={`bt${i}`} style={{ position: "absolute", bottom: 0, left: t.x }}>
            <SwayingTree height={t.height} shade={Math.min(t.shade, 3)} stagger={i * 0.09}>
              <DetailedPineTree height={t.height} shade={Math.min(t.shade, 3)} />
            </SwayingTree>
          </View>
        ))}
      </View>

      {/* ── Trees: front row ── */}
      <View style={{ position: "absolute", top: lakeTop + lakeHeight - 80, left: 0, right: 0, height: 160, zIndex: 3 }} pointerEvents="none">
        {frontTrees.map((t, i) => (
          <View key={`ft${i}`} style={{ position: "absolute", bottom: 0, left: t.x }}>
            <SwayingTree height={t.height} shade={Math.min(t.shade, 3)} stagger={i * 0.08}>
              <DetailedPineTree height={t.height} shade={Math.min(t.shade, 3)} />
            </SwayingTree>
          </View>
        ))}
      </View>

      {/* ── Ground trees (DetailedPineTree like main screen) ── */}
      <View style={{ position: "absolute", top: groundTop - 30, left: 0, right: 0, height: groundHeight + 30, zIndex: 5 }} pointerEvents="none">
        {groundTrees.map((t, i) => (
          <View key={`grt${i}`} style={{ position: "absolute", bottom: 0, left: t.x }}>
            <SwayingTree height={t.height} shade={Math.min(t.shade, 3)} stagger={i * 0.07}>
              <DetailedPineTree height={t.height} shade={Math.min(t.shade, 3)} />
            </SwayingTree>
          </View>
        ))}
      </View>

      {/* ── Extra foreground bottom trees (DetailedPineTree, in front of clearing) ── */}
      <View style={{ position: "absolute", top: groundTop - 10, left: 0, right: 0, height: groundHeight + 10, zIndex: 7 }} pointerEvents="none">
        {bottomTrees.map((t, i) => (
          <View key={`btt${i}`} style={{ position: "absolute", bottom: 0, left: t.x }}>
            <SwayingTree height={t.height} shade={Math.min(t.shade, 3)} stagger={i * 0.05}>
              <DetailedPineTree height={t.height} shade={Math.min(t.shade, 3)} />
            </SwayingTree>
          </View>
        ))}
        {/* Bear peeking from behind a left-side tree */}
        <PeekingBear x={95} bottom={45} />
      </View>

      {/* ── Ground + Campfire + Avatars ── */}
      <View style={[styles.zone, { height: groundHeight, backgroundColor: GROUND }]}>
        {/* Grass edge */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, backgroundColor: "#2E5828" }} />
        <View style={{ position: "absolute", top: 5, left: 0, right: 0, height: 3, backgroundColor: "#254A22" }} />
        <View style={{ position: "absolute", top: 8, left: 0, right: 0, height: 2, backgroundColor: "#1F3D1C" }} />

        {/* Grass tufts */}
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

        {/* Rocks */}
        <View style={{ position: "absolute", top: 12, left: W * 0.12, width: 10, height: 6, backgroundColor: "#4A4A52", borderRadius: 3 }} />
        <View style={{ position: "absolute", top: 16, left: W * 0.78, width: 12, height: 7, backgroundColor: "#3E3E46", borderRadius: 4 }} />

        {/* Stumps at avatar destinations */}
        {stumpPositions.map((sp, i) => (
          <Stump key={`stump${i}`} x={sp.x} y={sp.y} />
        ))}

        {/* Campfire */}
        <View style={{ position: "absolute", top: campfireY, left: campfireCenterX }}>
          <AnimatedLogo size={110} />
        </View>

        {/* Extra sparks and embers rising from the fire */}
        <View style={{ position: "absolute", top: campfireY - 10, left: campfireCenterX + 30, width: 50, height: 100 }} pointerEvents="none">
          <FireEmber x={5} delay={200} speed={1800} />
          <FireEmber x={15} delay={600} speed={2200} />
          <FireEmber x={25} delay={1000} speed={1600} />
          <FireEmber x={35} delay={1400} speed={2000} />
          <FireEmber x={10} delay={1800} speed={2400} />
          <FireEmber x={30} delay={400} speed={1900} />
          <FireEmber x={20} delay={2200} speed={1700} />
          <FireEmber x={40} delay={800} speed={2100} />
          <FireEmber x={0} delay={1600} speed={2300} />
          <FireEmber x={45} delay={1200} speed={1500} />
        </View>

        {/* Walking avatars */}
        {displayMembers.map((member, i) => {
          const pos = avatarPositions[i];
          if (!pos) return null;
          return (
            <WalkingAvatar
              key={member.user_id}
              member={member}
              startX={pos.startX}
              endX={pos.endX}
              y={pos.y}
              delay={1500 + i * 250} // staggered start at 1.5s
              walkDuration={2000}
            />
          );
        })}
      </View>

      {/* ── Title overlay ── */}
      <View style={styles.titleContainer}>
        <Animated.View style={titleStyle}>
          <PixelTitle fontSize={30}>Weekly Fireside</PixelTitle>
        </Animated.View>
        <Animated.View style={[{ marginTop: 12 }, subtitleStyle]}>
          <Animated.Text style={styles.subtitleText}>
            {promptCount} moments to relive
          </Animated.Text>
        </Animated.View>
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
    top: H * 0.35,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  subtitleText: {
    fontSize: 16,
    color: CampfireColors.MUTED,
    fontWeight: "500",
  },
});

export default FiresideIntro;
