/**
 * AnimatedPowerAura - Dragon Ball Z-style power-up flame aura
 * Wraps the entire character with pulsing energy waves, rising flame wisps,
 * and flickering ki sparks. Full Super Saiyan energy.
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  SharedValue,
  interpolateColor,
} from 'react-native-reanimated';

interface AnimatedPowerAuraProps {
  size: number;
  gridWidth: number;
  gridHeight: number;
}

// Still exported as AnimatedStaffFlame for backward compat with index.tsx import
export function AnimatedStaffFlame({ size, gridWidth, gridHeight }: AnimatedPowerAuraProps) {
  const charW = size;
  const charH = size * (gridHeight / gridWidth);

  // === OUTER AURA PULSE (whole-body glow that breathes) ===
  const auraPulse = useSharedValue(0);
  const auraScale = useSharedValue(1);

  // === FLAME WISPS (4 wisps rising along body edges) ===
  const wisp1Y = useSharedValue(0);
  const wisp1Op = useSharedValue(0.8);
  const wisp2Y = useSharedValue(0);
  const wisp2Op = useSharedValue(0.7);
  const wisp3Y = useSharedValue(0);
  const wisp3Op = useSharedValue(0.6);
  const wisp4Y = useSharedValue(0);
  const wisp4Op = useSharedValue(0.7);

  // === KI SPARKS (tiny bright dots that shoot upward) ===
  const spark1Y = useSharedValue(0);
  const spark1Op = useSharedValue(1);
  const spark2Y = useSharedValue(0);
  const spark2Op = useSharedValue(1);
  const spark3Y = useSharedValue(0);
  const spark3Op = useSharedValue(1);

  // === INNER GLOW (body-hugging energy) ===
  const innerGlow = useSharedValue(0.3);

  useEffect(() => {
    // Outer aura breathing
    auraPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    );
    auraScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.95, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    );

    // Inner glow throb
    innerGlow.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.2, { duration: 600, easing: Easing.inOut(Easing.quad) }),
      ), -1, true,
    );

    // Flame wisps — each rises from bottom to top, fading out
    const startWisp = (yVal: SharedValue<number>, opVal: SharedValue<number>, delay: number, dur: number) => {
      yVal.value = withDelay(delay, withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(-charH * 0.7, { duration: dur, easing: Easing.out(Easing.quad) }),
        ), -1, false,
      ));
      opVal.value = withDelay(delay, withRepeat(
        withSequence(
          withTiming(0.8, { duration: 0 }),
          withTiming(0, { duration: dur, easing: Easing.in(Easing.quad) }),
        ), -1, false,
      ));
    };
    startWisp(wisp1Y, wisp1Op, 0, 1200);
    startWisp(wisp2Y, wisp2Op, 300, 1400);
    startWisp(wisp3Y, wisp3Op, 600, 1100);
    startWisp(wisp4Y, wisp4Op, 900, 1300);

    // Ki sparks — fast, small, shoot up from random positions
    const startSpark = (yVal: SharedValue<number>, opVal: SharedValue<number>, delay: number) => {
      yVal.value = withDelay(delay, withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(-charH * 0.9, { duration: 700, easing: Easing.out(Easing.cubic) }),
        ), -1, false,
      ));
      opVal.value = withDelay(delay, withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(0, { duration: 700, easing: Easing.in(Easing.quad) }),
        ), -1, false,
      ));
    };
    startSpark(spark1Y, spark1Op, 0);
    startSpark(spark2Y, spark2Op, 400);
    startSpark(spark3Y, spark3Op, 800);
  }, [charH]);

  // === ANIMATED STYLES ===
  const outerAuraStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + auraPulse.value * 0.2,
    transform: [{ scale: auraScale.value }],
  }));

  const innerGlowStyle = useAnimatedStyle(() => ({
    opacity: innerGlow.value,
  }));

  const makeWispStyle = (yVal: SharedValue<number>, opVal: SharedValue<number>) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => ({
      opacity: opVal.value,
      transform: [{ translateY: yVal.value }],
    }));

  const wisp1Style = makeWispStyle(wisp1Y, wisp1Op);
  const wisp2Style = makeWispStyle(wisp2Y, wisp2Op);
  const wisp3Style = makeWispStyle(wisp3Y, wisp3Op);
  const wisp4Style = makeWispStyle(wisp4Y, wisp4Op);

  const makeSparkStyle = (yVal: SharedValue<number>, opVal: SharedValue<number>) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => ({
      opacity: opVal.value,
      transform: [{ translateY: yVal.value }],
    }));

  const spark1Style = makeSparkStyle(spark1Y, spark1Op);
  const spark2Style = makeSparkStyle(spark2Y, spark2Op);
  const spark3Style = makeSparkStyle(spark3Y, spark3Op);

  // Sizing
  const auraW = charW * 1.6;
  const auraH = charH * 1.3;
  const offsetX = (charW - auraW) / 2;
  const offsetY = (charH - auraH) / 2 - charH * 0.05;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: charW,
        height: charH,
      }}
      pointerEvents="none"
    >
      {/* === OUTER AURA (large pulsing energy field) === */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: offsetX,
            top: offsetY,
            width: auraW,
            height: auraH,
            borderRadius: auraW / 2,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: 'rgba(255, 180, 50, 0.35)',
          },
          outerAuraStyle,
        ]}
      />

      {/* === MIDDLE AURA (tighter energy ring) === */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: offsetX + auraW * 0.1,
            top: offsetY + auraH * 0.05,
            width: auraW * 0.8,
            height: auraH * 0.9,
            borderRadius: auraW * 0.4,
            backgroundColor: 'rgba(255, 160, 30, 0.08)',
            borderWidth: 1.5,
            borderColor: 'rgba(255, 200, 60, 0.3)',
          },
          outerAuraStyle,
        ]}
      />

      {/* === INNER GLOW (body-hugging) === */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: charW * 0.15,
            top: charH * 0.08,
            width: charW * 0.7,
            height: charH * 0.85,
            borderRadius: charW * 0.35,
            backgroundColor: 'rgba(255, 200, 50, 0.15)',
          },
          innerGlowStyle,
        ]}
      />

      {/* === FLAME WISPS (rising energy tongues along sides) === */}
      {/* Left wisps */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: charW * 0.05,
            bottom: charH * 0.15,
            width: charW * 0.15,
            height: charH * 0.25,
            borderRadius: charW * 0.08,
            backgroundColor: 'rgba(255, 140, 30, 0.5)',
          },
          wisp1Style,
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: charW * 0.12,
            bottom: charH * 0.1,
            width: charW * 0.1,
            height: charH * 0.2,
            borderRadius: charW * 0.05,
            backgroundColor: 'rgba(255, 200, 50, 0.4)',
          },
          wisp2Style,
        ]}
      />
      {/* Right wisps */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            right: charW * 0.05,
            bottom: charH * 0.15,
            width: charW * 0.15,
            height: charH * 0.25,
            borderRadius: charW * 0.08,
            backgroundColor: 'rgba(255, 140, 30, 0.5)',
          },
          wisp3Style,
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            right: charW * 0.12,
            bottom: charH * 0.1,
            width: charW * 0.1,
            height: charH * 0.2,
            borderRadius: charW * 0.05,
            backgroundColor: 'rgba(255, 200, 50, 0.4)',
          },
          wisp4Style,
        ]}
      />

      {/* === TOP FLAME (rising above head) === */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: charW * 0.3,
            top: charH * 0.02,
            width: charW * 0.4,
            height: charH * 0.2,
            borderRadius: charW * 0.2,
            backgroundColor: 'rgba(255, 220, 80, 0.35)',
          },
          wisp1Style,
        ]}
      />

      {/* === KI SPARKS (bright fast dots) === */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: charW * 0.2,
            bottom: charH * 0.3,
            width: 3,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: '#FFEC8B',
          },
          spark1Style,
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            right: charW * 0.25,
            bottom: charH * 0.2,
            width: 2.5,
            height: 2.5,
            borderRadius: 1.25,
            backgroundColor: '#FFD700',
          },
          spark2Style,
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: charW * 0.45,
            bottom: charH * 0.25,
            width: 2,
            height: 2,
            borderRadius: 1,
            backgroundColor: '#FFFFFF',
          },
          spark3Style,
        ]}
      />
    </View>
  );
}
