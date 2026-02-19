/**
 * IdleCharacter - Wraps PixelCharacter with ambient idle animations
 * DESIGN.md §15.1: Characters gently bob (2-3px breathing motion)
 * DESIGN.md §15.2: Characters yawn, sit, and doze after periods of inactivity
 *
 * Idle State Progression:
 * - 0-60s: Normal idle with gentle bob
 * - 60s: Yawn animation (quick 2-second yawn, then return to idle)
 * - 120s: Sits down (switches to "sitting" pose)
 * - 300s: Dozes off (adds zzz particles, slower breathing)
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { PixelCharacter, CharacterConfig } from './index';
import { CampfireColors } from '../../constants/theme';

interface IdleCharacterProps {
  config: CharacterConfig;
  size?: number;
  showWeeklyCrown?: boolean;
  /** Optional: external activity tracker resets idle timer when changed */
  activityTick?: number;
}

type IdleState = 'idle' | 'yawning' | 'sitting' | 'dozing';

export function IdleCharacter({
  config,
  size = 80,
  showWeeklyCrown = false,
  activityTick = 0,
}: IdleCharacterProps) {
  // DESIGN.md §15.1: Gentle breathing bob (2-3px rise/fall)
  const bobY = useSharedValue(0);

  // DESIGN.md §15.2: Idle state progression
  const [idleState, setIdleState] = useState<IdleState>('idle');
  const [showYawn, setShowYawn] = useState(false);
  const [showZzz, setShowZzz] = useState(false);
  const lastActivityTime = useRef(Date.now());
  const checkInterval = useRef<NodeJS.Timeout | null>(null);

  // Reset idle state when activity is detected
  useEffect(() => {
    lastActivityTime.current = Date.now();
    if (idleState !== 'idle') {
      setIdleState('idle');
      setShowYawn(false);
      setShowZzz(false);
    }
  }, [activityTick]);

  // Check idle time every 5 seconds
  useEffect(() => {
    checkInterval.current = setInterval(() => {
      const idleSeconds = (Date.now() - lastActivityTime.current) / 1000;

      if (idleSeconds >= 300 && idleState !== 'dozing') {
        // 5 minutes: Doze off
        setIdleState('dozing');
        setShowZzz(true);
      } else if (idleSeconds >= 120 && idleState === 'idle') {
        // 2 minutes: Sit down
        setIdleState('sitting');
      } else if (idleSeconds >= 60 && idleState === 'idle' && !showYawn) {
        // 1 minute: Yawn (2-second animation, then return to idle)
        setShowYawn(true);
        setTimeout(() => {
          setShowYawn(false);
        }, 2000);
      }
    }, 5000);

    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, [idleState, showYawn]);

  // Bob animation - slower when dozing
  useEffect(() => {
    const duration = idleState === 'dozing'
      ? 4000 + Math.random() * 2000  // Slower breathing when dozing (4-6s)
      : 2000 + Math.random() * 2000; // Normal breathing (2-4s)

    bobY.value = withRepeat(
      withSequence(
        withTiming(-2.5, { duration, easing: Easing.inOut(Easing.sine) }),
        withTiming(0, { duration, easing: Easing.inOut(Easing.sine) }),
      ),
      -1,
      false
    );
  }, [idleState]);

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobY.value }],
  }));

  // Determine character pose based on idle state
  const characterConfig: CharacterConfig = {
    ...config,
    pose: (idleState === 'sitting' || idleState === 'dozing') ? 'sitting' : config.pose || 'idle',
  };

  return (
    <View style={{ position: 'relative' }}>
      {/* Yawn emoji overlay - DESIGN.md §15.2: yawn after 1 minute */}
      {showYawn && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={{
            position: 'absolute',
            top: -8,
            left: size * 0.6,
            zIndex: 10,
          }}
        >
          <Text style={{ fontSize: size * 0.25 }}>🥱</Text>
        </Animated.View>
      )}

      {/* Zzz particles - DESIGN.md §15.2: doze after 5 minutes */}
      {showZzz && (
        <>
          <ZzzParticle delay={0} size={size} offsetX={size * 0.7} offsetY={-size * 0.1} />
          <ZzzParticle delay={600} size={size} offsetX={size * 0.75} offsetY={-size * 0.25} />
          <ZzzParticle delay={1200} size={size} offsetX={size * 0.8} offsetY={-size * 0.4} />
        </>
      )}

      {/* Character with bob animation */}
      <Animated.View style={bobStyle}>
        <PixelCharacter
          config={characterConfig}
          size={size}
          showWeeklyCrown={showWeeklyCrown}
        />
      </Animated.View>
    </View>
  );
}

// Zzz particle that floats up and fades out
function ZzzParticle({ delay, size, offsetX, offsetY }: { delay: number; size: number; offsetX: number; offsetY: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Staggered infinite loop: fade in, float up, fade out, reset
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-20, { duration: 2000, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 }), // Reset position
        ),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 400 }),
          withTiming(0.8, { duration: 1200 }),
          withTiming(0, { duration: 400 }),
          withTiming(0, { duration: 0 }), // Reset opacity
        ),
        -1,
        false
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animStyle,
        {
          position: 'absolute',
          top: offsetY,
          left: offsetX,
          zIndex: 10,
        },
      ]}
    >
      <Text style={{ fontSize: size * 0.2, color: CampfireColors.TEXT_CREAM }}>z</Text>
    </Animated.View>
  );
}
