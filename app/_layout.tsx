import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Alert, View, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import * as SplashScreen from 'expo-splash-screen';
import { onlineManager } from '@tanstack/react-query';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import 'react-native-reanimated';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { PixelifySans_700Bold } from '@expo-google-fonts/pixelify-sans';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, asyncStoragePersister, shouldDehydrateQuery } from '@/lib/queryClient';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { registerPushToken } from '@/lib/services/pushService';
import { checkStreakBonus } from '@/lib/services/pointsService';
import { PointsPopup } from '@/components/PointsPopup';
import { OfflineBanner } from '@/components/OfflineBanner';
import { AnimatedSplash } from '@/components/AnimatedSplash';
import { FireTransition } from '@/components/FireTransition';

// Keep native splash visible while we load fonts
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Ping-based online detection that works without native modules (OTA-safe).
// On app foreground, try to reach Supabase; if it works we're online.
onlineManager.setOnline(true); // assume online at startup

function checkOnline() {
  fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/`, {
    method: 'HEAD',
    headers: { apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '' },
  })
    .then(() => onlineManager.setOnline(true))
    .catch(() => onlineManager.setOnline(false));
}

AppState.addEventListener('change', (status: AppStateStatus) => {
  if (status === 'active') checkOnline();
});
checkOnline();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Splash states: 'splash' → 'fire' → 'done'
  const [splashPhase, setSplashPhase] = useState<'splash' | 'fire' | 'done'>('splash');

  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    PressStart2P_400Regular,
    PixelifySans_700Bold,
    'Retro': require('../assets/fonts/retro.ttf'),
    'Bitova': require('../assets/fonts/bitova.ttf'),
  });

  // Hide the native splash once our custom fonts are loaded
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // When animated splash completes its intro, start fire transition
  const handleSplashComplete = useCallback(() => {
    setSplashPhase('fire');
  }, []);

  // When fire transition fills the screen, dismiss splash
  const handleFireComplete = useCallback(() => {
    setSplashPhase('done');
  }, []);

  // Check for OTA updates on launch
  useEffect(() => {
    const checkForUpdates = async () => {
      if (__DEV__) return; // Skip in development

      try {
        console.log('Checking for updates...');
        const update = await Updates.checkForUpdateAsync();
        console.log('Update check result:', update);
        if (update.isAvailable) {
          console.log('Update available, fetching...');
          await Updates.fetchUpdateAsync();
          console.log('Update fetched, reloading...');
          Alert.alert('Update Available', 'A new update has been downloaded. The app will now restart.', [
            { text: 'OK', onPress: () => Updates.reloadAsync() }
          ]);
        }
      } catch (e) {
        // Update check failed, continue with current version
        console.log('Update check failed:', e);
      }
    };

    checkForUpdates();
  }, []);

  useEffect(() => {
    // Check auth state and profile on mount
    const checkAuthAndProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData.session?.user) {
        setIsLoggedIn(true);
        // User is logged in, check if they have a profile with username
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', sessionData.session.user.id)
          .single();

        // If no profile or no username, redirect to character creation
        if (!profile?.username) {
          // Wait for navigation to be ready
          if (navigationState?.key) {
            router.replace('/create-character');
          }
        }

        // Register push token
        await registerPushToken();

        // Check for streak bonus (1 point/week if 7+ streak)
        await checkStreakBonus();
      } else {
        setIsLoggedIn(false);
        // Redirect to login if not logged in
        if (navigationState?.key) {
          router.replace('/login');
        }
      }

      setAuthChecked(true);
    };

    checkAuthAndProfile();

    // Listen for auth changes
    const { data: authSub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setIsLoggedIn(true);
        // Check if new user needs to create profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single();

        if (!profile?.username && navigationState?.key) {
          router.replace('/create-character');
        }
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        if (navigationState?.key) {
          router.replace('/login');
        }
      }
    });

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listen for notification responses (user taps)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // TODO: Handle navigation based on notification data
    });

    // Setup Android notification channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1D4ED8',
      });
    }

    return () => {
      authSub.subscription.unsubscribe();
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [navigationState?.key]);

  // Show nothing until fonts are ready (native splash is still visible)
  if (!fontsLoaded) return null;

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister, maxAge: 1000 * 60 * 60 * 24, dehydrateOptions: { shouldDehydrateQuery } }}
    >
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen
              name="login"
              options={{
                headerShown: false,
                gestureEnabled: false,
                animation: 'fade',
              }}
            />
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
                title: 'Home',
                animation: 'fade',
              }}
            />
            <Stack.Screen
              name="create-character"
              options={{
                headerShown: false,
                presentation: 'fullScreenModal',
                gestureEnabled: false,
                animationTypeForReplace: 'pop',
              }}
            />
            <Stack.Screen
              name="group/[id]"
              options={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="light" />
          {/* Offline banner - slides in when no connection */}
          <OfflineBanner />
          {/* Points popup overlay - shows +X animation when points awarded */}
          <PointsPopup />

          {/* Animated splash overlay */}
          {splashPhase !== 'done' && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }}>
              <AnimatedSplash onAnimationComplete={handleSplashComplete} />
              <FireTransition
                active={splashPhase === 'fire'}
                onComplete={handleFireComplete}
              />
            </View>
          )}
        </View>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
