import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { CampfireColors } from '../../constants/theme';
import { Durations } from '../../constants/animations';

interface FireflyProps {
  x: number;
  y: number;
  delay: number;
}

export function Firefly({ x, y, delay }: FireflyProps) {
  const opacity = useSharedValue(0);
  const posX = useSharedValue(0);
  const posY = useSharedValue(0);

  useEffect(() => {
    const driftX = 8 + Math.random() * 12;
    const driftXBack = -(5 + Math.random() * 10);
    const driftY = -(6 + Math.random() * 10);
    const driftYBack = 4 + Math.random() * 6;
    const pauseDur = 800 + Math.random() * 2000;

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: Durations.FIREFLY_GLOW }),
          withTiming(0, { duration: Durations.FIREFLY_FADE }),
          withTiming(0, { duration: pauseDur }),
        ),
        -1,
      ),
    );

    posX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(driftX, { duration: 3000 }),
          withTiming(driftXBack, { duration: 3500 }),
        ),
        -1,
      ),
    );

    posY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(driftY, { duration: 2800 }),
          withTiming(driftYBack, { duration: 3200 }),
        ),
        -1,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: posX.value },
      { translateY: posY.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: CampfireColors.FIREFLY,
          shadowColor: CampfireColors.FIREFLY_GLOW,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 6,
        },
        animStyle,
      ]}
    />
  );
}
