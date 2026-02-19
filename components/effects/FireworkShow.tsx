/**
 * FireworkShow - Multiple fireworks display
 * DESIGN.md §15.2: 100th Fireside celebration
 *
 * Displays 8-12 fireworks in sequence with staggered timing
 * Used for major milestone celebrations (100, 250, 500 Firesides)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Firework } from './Firework';
import { CampfireColors } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FireworkShowProps {
  /** Number of fireworks to display (default 10) */
  count?: number;
  /** Celebration message to show */
  message?: string;
  /** Callback when show completes */
  onComplete?: () => void;
}

export function FireworkShow({
  count = 10,
  message = '🎆 100 FIRESIDES! 🎆',
  onComplete,
}: FireworkShowProps) {
  const [completedCount, setCompletedCount] = useState(0);
  const [showMessage, setShowMessage] = useState(true);

  // Generate firework positions and delays
  const fireworks = Array.from({ length: count }, (_, i) => ({
    id: i,
    startX: 0.15 + Math.random() * 0.7, // 15-85% of screen width
    delay: i * 800 + Math.random() * 400, // Staggered 800-1200ms apart
  }));

  // Track completion
  const handleFireworkComplete = () => {
    setCompletedCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= count && onComplete) {
        setTimeout(onComplete, 1000); // Wait 1s after last firework
      }
      return newCount;
    });
  };

  // Hide message after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMessage(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        pointerEvents: 'none', // Allow touches to pass through
      }}
    >
      {/* Celebration message */}
      {showMessage && (
        <Animated.View
          entering={FadeIn.delay(500).duration(800)}
          exiting={FadeOut.duration(800)}
          style={{
            position: 'absolute',
            top: 100,
            left: 20,
            right: 20,
            alignItems: 'center',
            zIndex: 1001,
          }}
        >
          <View
            style={{
              backgroundColor: CampfireColors.CARD_SOLID + 'F5',
              borderRadius: 20,
              borderWidth: 3,
              borderColor: CampfireColors.WARNING,
              paddingVertical: 20,
              paddingHorizontal: 24,
              shadowColor: CampfireColors.FIRE_YELLOW,
              shadowOpacity: 0.8,
              shadowRadius: 30,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <Text
              style={{
                color: CampfireColors.WARNING,
                fontSize: 24,
                fontWeight: '900',
                textAlign: 'center',
                letterSpacing: 1,
              }}
            >
              {message}
            </Text>
            <Text
              style={{
                color: CampfireColors.TEXT_WARM,
                fontSize: 14,
                fontWeight: '600',
                textAlign: 'center',
                marginTop: 8,
              }}
            >
              Welcome to the Century Club! 🏆
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Fireworks */}
      {fireworks.map((fw) => (
        <Firework
          key={fw.id}
          startX={fw.startX}
          delay={fw.delay}
          onComplete={handleFireworkComplete}
        />
      ))}
    </View>
  );
}

export default FireworkShow;
