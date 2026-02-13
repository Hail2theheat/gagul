// Mock Expo 54 runtime globals
if (typeof globalThis.__ExpoImportMetaRegistry === 'undefined') {
  Object.defineProperty(globalThis, '__ExpoImportMetaRegistry', {
    value: { url: 'file:///mock' },
    writable: true,
    configurable: true,
  });
}
// Polyfill structuredClone if missing (Node <17)
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useFocusEffect: jest.fn(),
  Link: 'Link',
  Stack: {
    Screen: 'Stack.Screen',
  },
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiSet: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' },
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'mock-token' })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
  getStringAsync: jest.fn(() => Promise.resolve('')),
}));

// Mock expo-font
jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  isLoaded: jest.fn(() => true),
}));

// Mock @expo-google-fonts/nunito
jest.mock('@expo-google-fonts/nunito', () => ({
  useFonts: () => [true, null],
  Nunito_400Regular: 'Nunito_400Regular',
  Nunito_600SemiBold: 'Nunito_600SemiBold',
  Nunito_700Bold: 'Nunito_700Bold',
  Nunito_800ExtraBold: 'Nunito_800ExtraBold',
  Nunito_900Black: 'Nunito_900Black',
}));

// Mock expo-splash-screen
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

// Mock react-native-reanimated (inline mock - don't import from reanimated/mock to avoid worklets)
jest.mock('react-native-reanimated', () => {
  const { View, Text } = require('react-native');
  const noop = () => {};
  const noopStyle = () => ({});
  const enteringExiting = () => ({
    duration: () => enteringExiting(),
    delay: () => enteringExiting(),
    springify: () => enteringExiting(),
    damping: () => enteringExiting(),
  });
  return {
    __esModule: true,
    default: {
      createAnimatedComponent: (Component) => Component,
      View,
      Text,
      call: noop,
    },
    useSharedValue: (init) => ({ value: init }),
    useAnimatedStyle: () => ({}),
    useDerivedValue: (fn) => ({ value: fn() }),
    useAnimatedScrollHandler: () => noop,
    withSpring: (val) => val,
    withTiming: (val) => val,
    withDelay: (_, val) => val,
    withSequence: (...args) => args[args.length - 1],
    withRepeat: (val) => val,
    runOnJS: (fn) => fn,
    runOnUI: (fn) => fn,
    Easing: {
      linear: noop,
      ease: noop,
      quad: noop,
      in: () => noop,
      out: () => noop,
      inOut: () => noop,
    },
    FadeIn: enteringExiting(),
    FadeOut: enteringExiting(),
    FadeInDown: enteringExiting(),
    FadeInRight: enteringExiting(),
    FadeOutLeft: enteringExiting(),
    SlideInDown: enteringExiting(),
    SlideInLeft: enteringExiting(),
    SlideInRight: enteringExiting(),
    SlideInUp: enteringExiting(),
    SlideOutDown: enteringExiting(),
    createAnimatedComponent: (Component) => Component,
  };
});

// Mock react-native-worklets
jest.mock('react-native-worklets', () => ({
  __esModule: true,
  default: {},
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    GestureHandlerRootView: View,
    GestureDetector: View,
    Gesture: {
      Pan: () => ({
        activeOffsetX: () => ({ onUpdate: () => ({ onEnd: () => ({}) }) }),
        onUpdate: () => ({ onEnd: () => ({}) }),
        onEnd: () => ({}),
      }),
      Tap: () => ({
        onBegin: () => ({ onEnd: () => ({}) }),
      }),
    },
    Directions: {},
  };
});

// Silence console warnings during tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.('Animated')) return;
  originalWarn.apply(console, args);
};
