import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Alert, View, ActivityIndicator, Text, Pressable } from 'react-native';
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
import { CampfireColors } from '@/constants/theme';

// Keep native splash visible while we load fonts
SplashScreen.preventAutoHideAsync();

// Global error handler — log unhandled JS errors to Supabase
// ErrorUtils is a React Native global, not an import
try {
  const _ErrorUtils = (global as any).ErrorUtils;
  if (_ErrorUtils) {
    const originalHandler = _ErrorUtils.getGlobalHandler();
    _ErrorUtils.setGlobalHandler(async (error: any, isFatal?: boolean) => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          await supabase.from('crash_logs').insert({
            user_id: data.user.id,
            screen: 'global',
            error_message: String(error?.message || error).substring(0, 500),
            error_stack: String(error?.stack || '').substring(0, 2000),
            metadata: { isFatal },
          });
        }
      } catch {}
      // Call the original handler so the default red screen / crash behavior still works
      if (originalHandler) originalHandler(error, isFatal);
    });
  }
} catch {
  // Silently fail — don't crash the app while setting up error logging
}

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

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to Supabase crash_logs (fire-and-forget)
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        supabase.from('crash_logs').insert({
          user_id: data.user.id,
          screen: 'root_error_boundary',
          error_message: String(error.message).substring(0, 500),
          error_stack: String(info.componentStack || error.stack || '').substring(0, 2000),
          metadata: { isFatal: false },
        }).then(() => {});
      }
    }).catch(() => {});
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: CampfireColors.BG, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ color: CampfireColors.TEXT_CREAM, fontSize: 22, fontWeight: '700', marginBottom: 12 }}>
            Something went wrong
          </Text>
          <Text style={{ color: CampfireColors.MUTED, fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Pressable
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{ backgroundColor: CampfireColors.BTN_PRIMARY, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
          >
            <Text style={{ color: CampfireColors.TEXT_CREAM, fontSize: 16, fontWeight: '600' }}>Try Again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  // Splash phases: 'splash' -> 'fire' -> 'done'
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
    'Paaxel': require('../assets/fonts/paaxel.otf'),
  });

  // Hide the native splash once our custom fonts are loaded
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Navigate once navigation is ready and a route is pending
  useEffect(() => {
    if (pendingRoute && navigationState?.key) {
      router.replace(pendingRoute as any);
      setPendingRoute(null);
    }
  }, [pendingRoute, navigationState?.key]);

  // When splash animation finishes, go straight to main screen
  const handleSplashComplete = useCallback(() => {
    console.log(`[LAYOUT] Splash complete at ${Date.now()}, setting phase to done`);
    setSplashPhase('done');
  }, []);

  // When fire transition finishes, remove overlay
  const handleFireComplete = useCallback(() => {
    console.log(`[LAYOUT] Fire complete at ${Date.now()}, setting phase to done`);
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
          setPendingRoute('/create-character');
        }

        // Register push token
        await registerPushToken();

        // Check for streak bonus (1 point/week if 7+ streak)
        await checkStreakBonus();
      } else {
        setIsLoggedIn(false);
        setPendingRoute('/login');
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

        if (!profile?.username) {
          setPendingRoute('/create-character');
        }
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setPendingRoute('/login');
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
        lightColor: CampfireColors.BTN_PRIMARY,
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
  }, []);

  // Show nothing until fonts are ready (native splash is still visible)
  if (!fontsLoaded) return null;

  return (
    <RootErrorBoundary>
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
                  animation: 'fade',
                }}
              />
              <Stack.Screen
                name="admin"
                options={{
                  headerShown: false,
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="judge-test"
                options={{
                  headerShown: false,
                  animation: 'fade',
                }}
              />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="light" />
            <OfflineBanner />
            <PointsPopup />

            {/* Animated splash overlay — only on cold start */}
            {splashPhase !== 'done' && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}>
                <AnimatedSplash onAnimationComplete={handleSplashComplete} />
              </View>
            )}
          </View>
      </ThemeProvider>
    </PersistQueryClientProvider>
    </RootErrorBoundary>
  );
}
