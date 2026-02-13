/**
 * PointsPopup - Animated "+X" popup when points are awarded
 * Shows a floating number that pops in and fades up and away
 * Uses Reanimated for UI-thread performance
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { onPointsAwarded, PointEventType } from '../lib/services/pointsService';
import { SPRING_BOUNCY } from '../constants/animations';

interface PointAnimation {
  id: number;
  points: number;
  eventType: PointEventType;
}

// Get color based on point value
function getPointColor(points: number): string {
  if (points >= 10) return '#FFD700'; // Gold for big bonuses
  if (points >= 5) return '#4ADE80';  // Green for medium
  return '#FFD93D';                    // Yellow for small
}

// Get label based on event type
function getEventLabel(eventType: PointEventType): string {
  switch (eventType) {
    case 'response': return 'Response!';
    case 'photo_bonus': return 'Photo bonus!';
    case 'comment': return 'Comment!';
    case 'like_received': return 'Liked!';
    case 'rating': return 'Rated!';
    case 'quiplash_win': return 'Quiplash win!';
    case 'fireside': return 'Fireside!';
    case 'perfect_week': return 'Perfect week!';
    case 'streak_bonus': return 'Streak bonus!';
    case 'first_responder': return 'A wizard is never late, nor is he early';
    default: return '';
  }
}

// Single floating point animation using Reanimated
function FloatingPoints({ points, eventType, onComplete }: {
  points: number;
  eventType: PointEventType;
  onComplete: () => void;
}) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    // Pop in
    scale.value = withSpring(1.2, SPRING_BOUNCY, () => {
      // Settle
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    });
    opacity.value = withTiming(1, { duration: 150 });

    // After hold, float up and fade out
    translateY.value = withDelay(800, withTiming(-100, {
      duration: 800,
      easing: Easing.out(Easing.quad),
    }));
    opacity.value = withDelay(800, withTiming(0, {
      duration: 800,
      easing: Easing.in(Easing.quad),
    }, () => {
      runOnJS(onComplete)();
    }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const color = getPointColor(points);
  const label = getEventLabel(eventType);

  return (
    <Animated.View style={[styles.floatingContainer, animStyle]}>
      {/* Glow effect */}
      <View style={[styles.glow, { backgroundColor: color + '30' }]} />

      {/* Points number */}
      <Text style={[styles.pointsText, { color }]}>
        +{points}
      </Text>

      {/* Event label */}
      <Text style={styles.labelText}>
        {label}
      </Text>
    </Animated.View>
  );
}

// Main component that listens for point events
export function PointsPopup() {
  const [animations, setAnimations] = useState<PointAnimation[]>([]);
  const idCounter = useRef(0);

  useEffect(() => {
    // Subscribe to point events
    const unsubscribe = onPointsAwarded((points, eventType) => {
      const id = idCounter.current++;
      setAnimations(prev => [...prev, { id, points, eventType }]);
    });

    return unsubscribe;
  }, []);

  const handleComplete = (id: number) => {
    setAnimations(prev => prev.filter(a => a.id !== id));
  };

  if (animations.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {animations.map((anim, index) => (
        <View
          key={anim.id}
          style={[
            styles.animationWrapper,
            { top: 150 + (index * 60) }
          ]}
        >
          <FloatingPoints
            points={anim.points}
            eventType={anim.eventType}
            onComplete={() => handleComplete(anim.id)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  animationWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  floatingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  glow: {
    position: 'absolute',
    width: 120,
    height: 60,
    borderRadius: 30,
  },
  pointsText: {
    fontSize: 42,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF8DC',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default PointsPopup;
