/**
 * Firework - Celebratory firework explosion animation
 * DESIGN.md §15.2: 100th Fireside celebration
 *
 * Features:
 * - Launch: Rocket shoots up from bottom
 * - Burst: Explodes into 20-30 particles radiating outward
 * - Trail: Sparkle trail during launch
 * - Colors: Random vibrant colors per firework
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

interface FireworkProps {
  /** Starting X position (0-1, percentage of screen width) */
  startX: number;
  /** Launch delay in ms */
  delay?: number;
  /** Color of firework particles */
  color?: string;
  /** Callback when firework completes */
  onComplete?: () => void;
}

// Vibrant firework colors
const FIREWORK_COLORS = [
  '#FF6B9D', // Hot pink
  '#FFD700', // Gold
  '#00D9FF', // Cyan
  '#7B68EE', // Purple
  '#FF4500', // Orange-red
  '#00FF7F', // Spring green
  '#FF1493', // Deep pink
  '#00CED1', // Turquoise
];

export function Firework({
  startX,
  delay = 0,
  color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
  onComplete,
}: FireworkProps) {
  // Launch rocket
  const rocketY = useSharedValue(0);
  const rocketOpacity = useSharedValue(0);

  // Burst particles (20 particles)
  const particles = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2;
    const distance = 60 + Math.random() * 40; // 60-100px burst radius

    return {
      x: useSharedValue(0),
      y: useSharedValue(0),
      opacity: useSharedValue(0),
      targetX: Math.cos(angle) * distance,
      targetY: Math.sin(angle) * distance,
    };
  });

  useEffect(() => {
    // Phase 1: Rocket launch (0.8s)
    rocketOpacity.value = withDelay(delay, withTiming(1, { duration: 100 }));

    rocketY.value = withDelay(
      delay,
      withTiming(-200, { duration: 800, easing: Easing.out(Easing.quad) }, (finished) => {
        if (finished) {
          // Phase 2: Hide rocket
          runOnJS(() => {
            rocketOpacity.value = 0;
          })();

          // Phase 3: Burst particles (0.6s explosion + 1s fade)
          particles.forEach((particle, i) => {
            const particleDelay = i * 10; // Slight stagger (200ms total)

            particle.opacity.value = withDelay(
              particleDelay,
              withSequence(
                withTiming(1, { duration: 100 }),
                withTiming(0.8, { duration: 500 }),
                withTiming(0, { duration: 1000 })
              )
            );

            particle.x.value = withDelay(
              particleDelay,
              withTiming(particle.targetX, {
                duration: 600,
                easing: Easing.out(Easing.quad),
              })
            );

            particle.y.value = withDelay(
              particleDelay,
              withSequence(
                withTiming(particle.targetY, {
                  duration: 600,
                  easing: Easing.out(Easing.quad),
                }),
                withTiming(particle.targetY + 30, {
                  duration: 1000,
                  easing: Easing.in(Easing.quad), // Gravity fall
                })
              ),
              (finished) => {
                // Call onComplete after last particle finishes
                if (finished && i === particles.length - 1 && onComplete) {
                  runOnJS(onComplete)();
                }
              }
            );
          });
        }
      })
    );
  }, [delay]);

  const rocketStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: rocketY.value }],
    opacity: rocketOpacity.value,
  }));

  return (
    <View style={{ position: 'absolute', left: `${startX * 100}%`, bottom: 0 }}>
      {/* Launch rocket */}
      <Animated.View style={rocketStyle}>
        <View
          style={{
            width: 4,
            height: 12,
            backgroundColor: color,
            borderRadius: 2,
            shadowColor: color,
            shadowOpacity: 1,
            shadowRadius: 8,
          }}
        />
        {/* Trail sparkle */}
        <View
          style={{
            position: 'absolute',
            top: 12,
            left: 0,
            width: 4,
            height: 6,
            backgroundColor: color,
            opacity: 0.6,
            borderRadius: 2,
          }}
        />
      </Animated.View>

      {/* Burst particles */}
      {particles.map((particle, i) => {
        const particleStyle = useAnimatedStyle(() => ({
          transform: [
            { translateX: particle.x.value },
            { translateY: particle.y.value - 200 }, // Offset for rocket launch height
          ],
          opacity: particle.opacity.value,
        }));

        return (
          <Animated.View
            key={i}
            style={[
              particleStyle,
              {
                position: 'absolute',
                width: 5,
                height: 5,
                backgroundColor: color,
                borderRadius: 2.5,
                shadowColor: color,
                shadowOpacity: 0.8,
                shadowRadius: 6,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export default Firework;
