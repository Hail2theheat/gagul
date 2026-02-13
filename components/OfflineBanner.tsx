// components/OfflineBanner.tsx
import React, { useSyncExternalStore } from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useIsRestoring } from '@tanstack/react-query';
import { onlineManager } from '@tanstack/react-query';
import { CampfireColors, Typography } from '../constants/theme';

function useIsOnline() {
  return useSyncExternalStore(
    (callback) => onlineManager.subscribe(callback),
    () => onlineManager.isOnline(),
  );
}

export function OfflineBanner() {
  const isRestoring = useIsRestoring();
  const isOnline = useIsOnline();
  const show = !isOnline || isRestoring;

  const translateY = useSharedValue(show ? 0 : -50);
  translateY.value = withTiming(show ? 0 : -50, { duration: 300 });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: isRestoring ? CampfireColors.FIRE_ORANGE : CampfireColors.WARNING,
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
        {isRestoring ? 'Loading cached data...' : 'No internet - showing cached data'}
      </Text>
    </Animated.View>
  );
}
