// components/OfflineBanner.tsx
import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { onlineManager } from '@tanstack/react-query';
import { CampfireColors, Typography } from '../constants/theme';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(() => onlineManager.isOnline());

  useEffect(() => {
    const unsub = onlineManager.subscribe((event) => {
      setIsOnline(event.isOnline);
    });
    // Sync in case it changed between render and effect
    setIsOnline(onlineManager.isOnline());
    return unsub;
  }, []);

  const show = !isOnline;

  const translateY = useSharedValue(show ? 0 : -50);
  translateY.value = withTiming(show ? 0 : -50, { duration: 300 });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (isOnline) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: CampfireColors.WARNING,
          paddingTop: 50,
          paddingBottom: 8,
          paddingHorizontal: 16,
          zIndex: 1000,
          alignItems: 'center',
        },
        animStyle,
      ]}
    >
      <Text style={{ color: '#1a1a1a', ...Typography.caption, fontSize: 13 }}>
        No internet - showing cached data
      </Text>
    </Animated.View>
  );
}
