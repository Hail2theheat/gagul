/**
 * HolidayDecor - Subtle holiday-themed decorations
 * DESIGN.md §15.3: Holiday touches (subtle, not overwhelming)
 *
 * Adds small seasonal decorations based on current holiday:
 * - Christmas: Subtle snow, distant lights
 * - Halloween: Orange glow, occasional bat
 * - Valentine's: Pink accent sparkles
 * - St. Patrick's: Green accent glow
 * - New Year's: Gold sparkles
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
} from 'react-native-reanimated';
import { getHoliday, getHolidayAccent } from '../../lib/services/seasonalService';

interface SnowflakeProps {
  x: number;
  delay: number;
  duration: number;
}

function Snowflake({ x, delay, duration }: SnowflakeProps) {
  const y = useSharedValue(-10);
  const opacity = useSharedValue(0);
  const drift = useSharedValue(0);

  useEffect(() => {
    // Fall from top to bottom with drift
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(600, { duration, easing: Easing.linear }),
          withTiming(600, { duration: 0 })
        ),
        -1,
        false
      )
    );

    // Fade in/out
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: duration * 0.1 }),
          withTiming(0.6, { duration: duration * 0.7 }),
          withTiming(0, { duration: duration * 0.2 })
        ),
        -1,
        false
      )
    );

    // Gentle side-to-side drift
    drift.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(15, { duration: duration * 0.5, easing: Easing.inOut(Easing.sine) }),
          withTiming(-15, { duration: duration * 0.5, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      )
    );
  }, [delay, duration]);

  const snowStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: y.value },
      { translateX: drift.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        snowStyle,
        {
          position: 'absolute',
          left: x,
          top: 0,
          width: 3,
          height: 3,
          backgroundColor: '#FFF',
          borderRadius: 1.5,
        },
      ]}
    />
  );
}

function HolidaySparkle({ x, y, color, delay }: { x: number; y: number; color: string; delay: number }) {
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
          withTiming(0.8, { duration: 400 }),
          withTiming(0, { duration: 600 })
        ),
        -1,
        false
      )
    );
  }, [delay]);

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        sparkleStyle,
        {
          position: 'absolute',
          left: x,
          top: y,
          width: 6,
          height: 6,
        },
      ]}
    >
      {/* Star shape */}
      <View style={{ width: 6, height: 1.5, backgroundColor: color, position: 'absolute', top: 2.25, borderRadius: 0.75 }} />
      <View style={{ width: 1.5, height: 6, backgroundColor: color, position: 'absolute', left: 2.25, borderRadius: 0.75 }} />
    </Animated.View>
  );
}

interface HolidayDecorProps {
  /** Screen width for positioning */
  screenWidth: number;
  /** Screen height for positioning */
  screenHeight: number;
}

export function HolidayDecor({ screenWidth, screenHeight }: HolidayDecorProps) {
  const holiday = getHoliday();
  const accentColor = getHolidayAccent();

  if (!holiday || !accentColor) {
    return null; // No holiday decorations
  }

  return (
    <>
      {/* Christmas: Gentle snowfall */}
      {holiday === 'Christmas' && (
        <>
          {Array.from({ length: 12 }).map((_, i) => (
            <Snowflake
              key={`snow-${i}`}
              x={20 + (i * screenWidth) / 12}
              delay={i * 800}
              duration={8000 + Math.random() * 4000}
            />
          ))}
        </>
      )}

      {/* New Year's: Gold sparkles */}
      {(holiday === 'New Year\'s Eve' || holiday === 'New Year\'s Day') && (
        <>
          <HolidaySparkle x={screenWidth * 0.2} y={80} color="#FFD700" delay={0} />
          <HolidaySparkle x={screenWidth * 0.5} y={120} color="#FFD700" delay={600} />
          <HolidaySparkle x={screenWidth * 0.8} y={100} color="#FFD700" delay={1200} />
          <HolidaySparkle x={screenWidth * 0.35} y={60} color="#FFA500" delay={300} />
          <HolidaySparkle x={screenWidth * 0.7} y={140} color="#FFA500" delay={900} />
        </>
      )}

      {/* Valentine's: Pink sparkles */}
      {holiday === 'Valentine\'s Day' && (
        <>
          <HolidaySparkle x={screenWidth * 0.3} y={90} color="#FF6B9D" delay={0} />
          <HolidaySparkle x={screenWidth * 0.6} y={110} color="#FFB3D9" delay={800} />
          <HolidaySparkle x={screenWidth * 0.85} y={70} color="#FF6B9D" delay={400} />
        </>
      )}

      {/* St. Patrick's: Green sparkles */}
      {holiday === 'St. Patrick\'s Day' && (
        <>
          <HolidaySparkle x={screenWidth * 0.25} y={100} color="#4ADE80" delay={0} />
          <HolidaySparkle x={screenWidth * 0.55} y={130} color="#22C55E" delay={700} />
          <HolidaySparkle x={screenWidth * 0.75} y={85} color="#4ADE80" delay={350} />
        </>
      )}

      {/* Halloween: Orange glow accent (subtle, just accent glow) */}
      {holiday === 'Halloween' && (
        <View
          style={{
            position: 'absolute',
            top: screenHeight * 0.3,
            left: screenWidth * 0.1,
            width: screenWidth * 0.8,
            height: 80,
            backgroundColor: 'rgba(255, 107, 53, 0.08)',
            borderRadius: 40,
          }}
        />
      )}

      {/* Independence Day: Blue sparkles */}
      {holiday === 'Independence Day' && (
        <>
          <HolidaySparkle x={screenWidth * 0.2} y={95} color="#4A90E2" delay={0} />
          <HolidaySparkle x={screenWidth * 0.5} y={115} color="#3B82F6" delay={600} />
          <HolidaySparkle x={screenWidth * 0.8} y={75} color="#60A5FA" delay={300} />
        </>
      )}
    </>
  );
}

export default HolidayDecor;
