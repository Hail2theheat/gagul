/**
 * BirthdayFire - Special rainbow fire for birthdays
 * DESIGN.md §15.2: Birthday easter egg - colorful flames + confetti particles
 *
 * Wraps CampfireSimple with extra birthday effects:
 * - Rainbow flame colors (cycles through spectrum)
 * - Confetti particles floating up
 * - Sparkles around fire
 * - "Happy Birthday" message above
 */

import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolateColor,
  FadeIn,
} from 'react-native-reanimated';
import { CampfireSimple } from './CampfireSimple';
import { CampfireColors } from '../../constants/theme';

interface BirthdayFireProps {
  /** Base size of campfire */
  size?: number;
  /** Show glow behind fire */
  showGlow?: boolean;
  /** User's age (optional, shown in message) */
  age?: number | null;
}

// Confetti colors
const CONFETTI_COLORS = [
  '#FF6B9D',  // Pink
  '#C44569',  // Red
  '#FFA502',  // Orange
  '#FFD700',  // Gold
  '#26C281',  // Green
  '#3498DB',  // Blue
  '#9B59B6',  // Purple
];

function ConfettiParticle({ delay, color, startX }: { delay: number; color: string; startX: number }) {
  const y = useSharedValue(0);
  const x = useSharedValue(0);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-80, { duration: 3000, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );

    x.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming((Math.random() - 0.5) * 40, { duration: 3000, easing: Easing.inOut(Easing.sine) }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );

    rotation.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration: 3000, easing: Easing.linear }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.9, { duration: 1600 }),
          withTiming(0, { duration: 1000 }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );
  }, [delay]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animStyle,
        {
          position: 'absolute',
          bottom: 30,
          left: startX,
          width: 6,
          height: 6,
          backgroundColor: color,
          borderRadius: 1,
        },
      ]}
    />
  );
}

function Sparkle({ delay, x, y }: { delay: number; x: number; y: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 600 })
        ),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 600 })
        ),
        -1,
        false
      )
    );
  }, [delay]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animStyle,
        {
          position: 'absolute',
          left: x,
          top: y,
          width: 8,
          height: 8,
        },
      ]}
    >
      <Text style={{ fontSize: 8 }}>✨</Text>
    </Animated.View>
  );
}

export function BirthdayFire({ size = 110, showGlow = true, age = null }: BirthdayFireProps) {
  // Rainbow glow animation
  const rainbowProgress = useSharedValue(0);

  useEffect(() => {
    rainbowProgress.value = withRepeat(
      withTiming(1, { duration: 5000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const rainbowStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      rainbowProgress.value,
      [0, 0.16, 0.33, 0.5, 0.66, 0.83, 1],
      [
        '#FF6B9D', // Pink
        '#FFA502', // Orange
        '#FFD700', // Gold
        '#26C281', // Green
        '#3498DB', // Blue
        '#9B59B6', // Purple
        '#FF6B9D', // Back to pink
      ]
    );

    return {
      shadowColor: color,
      shadowOpacity: 0.6,
      shadowRadius: 30,
    };
  });

  const scale = size / 110;

  return (
    <View style={{ alignItems: 'center', width: size, position: 'relative' }}>
      {/* Birthday message */}
      <Animated.View
        entering={FadeIn.delay(500).duration(800)}
        style={{
          position: 'absolute',
          top: -60 * scale,
          backgroundColor: CampfireColors.CARD_SOLID + 'F0',
          borderRadius: 16 * scale,
          borderWidth: 2,
          borderColor: CampfireColors.WARNING,
          paddingVertical: 8 * scale,
          paddingHorizontal: 12 * scale,
          zIndex: 10,
        }}
      >
        <Text
          style={{
            color: CampfireColors.WARNING,
            fontSize: 14 * scale,
            fontWeight: '800',
            textAlign: 'center',
          }}
        >
          🎂 Happy Birthday{age ? ` (${age})` : ''}! 🎉
        </Text>
      </Animated.View>

      {/* Rainbow glow aura */}
      <Animated.View
        style={[
          rainbowStyle,
          {
            position: 'absolute',
            width: 140 * scale,
            height: 140 * scale,
            borderRadius: 70 * scale,
            backgroundColor: CampfireColors.FIRE_ORANGE,
            bottom: 5 * scale,
            opacity: 0.4,
          },
        ]}
      />

      {/* Regular campfire */}
      <CampfireSimple size={size} showGlow={showGlow} />

      {/* Confetti particles (12 total, staggered) */}
      {Array.from({ length: 12 }).map((_, i) => (
        <ConfettiParticle
          key={i}
          delay={i * 250}
          color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
          startX={20 * scale + (i % 4) * 20 * scale}
        />
      ))}

      {/* Sparkles around fire */}
      <Sparkle delay={0} x={10 * scale} y={40 * scale} />
      <Sparkle delay={300} x={90 * scale} y={35 * scale} />
      <Sparkle delay={600} x={50 * scale} y={20 * scale} />
      <Sparkle delay={900} x={25 * scale} y={50 * scale} />
      <Sparkle delay={1200} x={75 * scale} y={45 * scale} />
      <Sparkle delay={1500} x={45 * scale} y={10 * scale} />
    </View>
  );
}

export default BirthdayFire;
