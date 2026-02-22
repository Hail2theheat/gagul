/**
 * AnimatedPet - Adds behavior loops to companion pets
 * DESIGN.md §15.1: Pets have independent animation loops
 *
 * Behaviors by pet type:
 * - puppy: Tail wag (constant), occasional scratch
 * - kitten: Tail sway (constant), occasional stretch
 * - frog: Occasional hop
 * - owl: Occasional head tilt, wing settle
 * - fox: Tail swish (constant)
 * - baby_dragon: Occasional tiny flame puff
 * - phoenix: Wing shimmer (constant), flame particles
 */

import React, { useEffect, useState, useRef } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface AnimatedPetProps {
  petType: string;
  /** Base rendering size (affects animation scale) */
  size?: number;
  /** Children: the static pet pixel rendering */
  children: React.ReactNode;
}

export function AnimatedPet({ petType, size = 80, children }: AnimatedPetProps) {
  const [showBehavior, setShowBehavior] = useState(false);
  const behaviorTimer = useRef<NodeJS.Timeout | null>(null);

  // Continuous animations
  const tailWag = useSharedValue(0);
  const bodyBob = useSharedValue(0);
  const shimmer = useSharedValue(0);

  // Occasional behaviors
  const scratchOffset = useSharedValue(0);
  const hopY = useSharedValue(0);
  const stretchScale = useSharedValue(1);
  const headTilt = useSharedValue(0);

  // Setup continuous animations based on pet type
  useEffect(() => {
    switch (petType) {
      case 'puppy':
        // Constant tail wag
        tailWag.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 200, easing: Easing.inOut(Easing.quad) }),
            withTiming(-1, { duration: 200, easing: Easing.inOut(Easing.quad) })
          ),
          -1,
          true
        );
        break;

      case 'kitten':
        // Slow tail sway
        tailWag.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
            withTiming(-1, { duration: 800, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          true
        );
        break;

      case 'fox':
        // Tail swish (medium speed)
        tailWag.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 400, easing: Easing.inOut(Easing.quad) }),
            withTiming(-1, { duration: 400, easing: Easing.inOut(Easing.quad) })
          ),
          -1,
          true
        );
        break;

      case 'phoenix':
        // Wing shimmer
        shimmer.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) }),
            withTiming(0, { duration: 600, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          true
        );
        break;

      case 'frog':
      case 'owl':
      case 'baby_dragon':
        // Subtle idle bob
        bodyBob.value = withRepeat(
          withSequence(
            withTiming(-0.5, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
            withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          false
        );
        break;
    }
  }, [petType]);

  // Occasional behaviors (every 5-10 seconds)
  useEffect(() => {
    const triggerBehavior = () => {
      const delay = 5000 + Math.random() * 5000; // 5-10 seconds

      behaviorTimer.current = setTimeout(() => {
        setShowBehavior(true);

        switch (petType) {
          case 'puppy':
            // Scratch animation (2 seconds)
            scratchOffset.value = withSequence(
              withTiming(3, { duration: 150 }),
              withTiming(-3, { duration: 150 }),
              withTiming(3, { duration: 150 }),
              withTiming(-3, { duration: 150 }),
              withTiming(0, { duration: 150 })
            );
            setTimeout(() => setShowBehavior(false), 1000);
            break;

          case 'kitten':
            // Stretch animation (2 seconds)
            stretchScale.value = withSequence(
              withTiming(1.15, { duration: 800, easing: Easing.out(Easing.quad) }),
              withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) })
            );
            setTimeout(() => setShowBehavior(false), 2000);
            break;

          case 'frog':
            // Hop animation (0.5 seconds)
            hopY.value = withSequence(
              withTiming(-8, { duration: 200, easing: Easing.out(Easing.quad) }),
              withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) })
            );
            setTimeout(() => setShowBehavior(false), 500);
            break;

          case 'owl':
            // Head tilt animation (1.5 seconds)
            headTilt.value = withSequence(
              withTiming(-15, { duration: 300 }),
              withTiming(-15, { duration: 600 }),
              withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) })
            );
            setTimeout(() => setShowBehavior(false), 1500);
            break;

          case 'fox':
            // Quick alert pose (1 second)
            bodyBob.value = withSequence(
              withTiming(-2, { duration: 150 }),
              withTiming(-2, { duration: 700 }),
              withTiming(0, { duration: 150 })
            );
            setTimeout(() => setShowBehavior(false), 1000);
            break;

          case 'baby_dragon':
            // Tiny flame puff (just a brief glow - visual handled by parent)
            shimmer.value = withSequence(
              withTiming(1, { duration: 200 }),
              withTiming(0, { duration: 800 })
            );
            setTimeout(() => setShowBehavior(false), 1000);
            break;

          case 'phoenix':
            // Wing flap (1 second)
            stretchScale.value = withSequence(
              withTiming(1.1, { duration: 200 }),
              withTiming(0.95, { duration: 200 }),
              withTiming(1.05, { duration: 200 }),
              withTiming(1, { duration: 400 })
            );
            setTimeout(() => setShowBehavior(false), 1000);
            break;
        }

        // Schedule next behavior
        triggerBehavior();
      }, delay);
    };

    triggerBehavior();

    return () => {
      if (behaviorTimer.current) clearTimeout(behaviorTimer.current);
    };
  }, [petType]);

  // Animated styles based on pet type
  const tailWagStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${tailWag.value * 8}deg` }],
  }));

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bodyBob.value }],
  }));

  const hopStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hopY.value }],
  }));

  const scratchStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scratchOffset.value }],
  }));

  const stretchStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: stretchScale.value }],
  }));

  const headTiltStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${headTilt.value}deg` }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [1, 0.7]),
  }));

  // Combine animations based on pet type and current behavior
  const getCombinedStyle = () => {
    switch (petType) {
      case 'puppy':
        return [tailWagStyle, showBehavior ? scratchStyle : {}];
      case 'kitten':
        return [tailWagStyle, showBehavior ? stretchStyle : {}];
      case 'frog':
        return [bobStyle, hopStyle];
      case 'owl':
        return [bobStyle, showBehavior ? headTiltStyle : {}];
      case 'fox':
        return [tailWagStyle, bobStyle];
      case 'baby_dragon':
        return [bobStyle, shimmerStyle];
      case 'phoenix':
        return [shimmerStyle, showBehavior ? stretchStyle : {}];
      default:
        return [bobStyle];
    }
  };

  return (
    <Animated.View style={getCombinedStyle()}>
      {children}
    </Animated.View>
  );
}

export default AnimatedPet;
