// components/FireNavigationProvider.tsx
// Context provider that wraps the app and exposes navigateWithFire().
// Any screen can call navigateWithFire(callback) to trigger:
//   1. Fire rises from bottom, engulfs screen
//   2. Callback (navigation) runs while screen is covered
//   3. Fire overlay fades out revealing the new screen
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  runOnJS,
  SharedValue,
} from "react-native-reanimated";

const { width: W, height: H } = Dimensions.get("window");

const FIRE_RED = "#CC2200";
const FIRE_ORANGE = "#FF6B35";
const FIRE_YELLOW = "#FFD93D";
const EMBER_COLOR = "#FF9F1C";

const FLAME_COUNT = 10;
const ENGULF_DURATION = 700; // faster for navigation (vs 1400 for splash)
const REVEAL_DURATION = 400;

// ─── Context ────────────────────────────────────────────
interface FireNavContextValue {
  /** Trigger fire transition, run action() when screen is covered, then reveal */
  navigateWithFire: (action: () => void) => void;
}

const FireNavContext = createContext<FireNavContextValue>({
  navigateWithFire: () => {},
});

export const useFireNavigation = () => useContext(FireNavContext);

// ─── Flame column (simplified/faster version for nav transitions) ───
function NavFlameColumn({
  index,
  rise,
}: {
  index: number;
  rise: SharedValue<number>;
}) {
  const columnWidth = W / FLAME_COUNT;
  const center = FLAME_COUNT / 2;
  const distFromCenter = Math.abs(index - center);
  const offset = distFromCenter * 0.06; // slight stagger
  const heightVar = 0.9 + (index % 3) * 0.08;

  const outerStyle = useAnimatedStyle(() => {
    const adjusted = Math.max(0, Math.min(1, (rise.value - offset) / (1 - offset)));
    const flameH = interpolate(adjusted, [0, 1], [0, H * 1.3 * heightVar]);
    return {
      position: "absolute" as const,
      bottom: 0,
      left: index * columnWidth - 3,
      width: columnWidth + 6,
      height: flameH,
      borderTopLeftRadius: columnWidth * 0.5,
      borderTopRightRadius: columnWidth * 0.5,
      backgroundColor: FIRE_RED,
      opacity: interpolate(adjusted, [0, 0.08, 0.25], [0, 0.7, 1]),
    };
  });

  const midStyle = useAnimatedStyle(() => {
    const adjusted = Math.max(0, Math.min(1, (rise.value - offset) / (1 - offset)));
    const flameH = interpolate(adjusted, [0, 1], [0, H * 1.2 * heightVar]);
    return {
      position: "absolute" as const,
      bottom: 0,
      left: index * columnWidth,
      width: columnWidth,
      height: flameH * 0.82,
      borderTopLeftRadius: columnWidth * 0.4,
      borderTopRightRadius: columnWidth * 0.4,
      backgroundColor: FIRE_ORANGE,
      opacity: interpolate(adjusted, [0, 0.12, 0.35], [0, 0.5, 1]),
    };
  });

  const innerStyle = useAnimatedStyle(() => {
    const adjusted = Math.max(0, Math.min(1, (rise.value - offset) / (1 - offset)));
    const flameH = interpolate(adjusted, [0, 1], [0, H * 1.1 * heightVar]);
    return {
      position: "absolute" as const,
      bottom: 0,
      left: index * columnWidth + 3,
      width: columnWidth - 6,
      height: flameH * 0.65,
      borderTopLeftRadius: columnWidth * 0.35,
      borderTopRightRadius: columnWidth * 0.35,
      backgroundColor: FIRE_YELLOW,
      opacity: interpolate(adjusted, [0, 0.18, 0.45], [0, 0.3, 1]),
    };
  });

  return (
    <>
      <Animated.View style={outerStyle} />
      <Animated.View style={midStyle} />
      <Animated.View style={innerStyle} />
    </>
  );
}

// ─── Provider ───────────────────────────────────────────
export function FireNavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);

  // 0→1 = fire rising, stays at 1 briefly, then overlay fades
  const rise = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);

  const doReveal = useCallback(() => {
    // Execute the navigation action while screen is covered
    if (pendingAction.current) {
      pendingAction.current();
      pendingAction.current = null;
    }

    // Small delay for the new screen to mount, then fade out
    overlayOpacity.value = withDelay(
      100,
      withTiming(0, { duration: REVEAL_DURATION, easing: Easing.out(Easing.quad) }, (finished) => {
        if (finished) {
          runOnJS(setVisible)(false);
        }
      })
    );
  }, []);

  const navigateWithFire = useCallback((action: () => void) => {
    if (visible) return; // already transitioning
    pendingAction.current = action;
    setVisible(true);

    // Reset values
    rise.value = 0;
    overlayOpacity.value = 0;

    // Fire rises
    rise.value = withTiming(1, {
      duration: ENGULF_DURATION,
      easing: Easing.in(Easing.cubic),
    });

    // Solid overlay fills slightly after flames start
    overlayOpacity.value = withDelay(
      ENGULF_DURATION * 0.5,
      withTiming(1, {
        duration: ENGULF_DURATION * 0.55,
        easing: Easing.in(Easing.quad),
      }, (finished) => {
        if (finished) {
          runOnJS(doReveal)();
        }
      })
    );
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    ...StyleSheet.absoluteFillObject,
    backgroundColor: FIRE_RED,
    opacity: overlayOpacity.value,
    zIndex: 101,
  }));

  const flames = Array.from({ length: FLAME_COUNT }, (_, i) => i);

  return (
    <FireNavContext.Provider value={{ navigateWithFire }}>
      {children}
      {visible && (
        <View style={styles.container} pointerEvents="none">
          {flames.map((i) => (
            <NavFlameColumn key={i} index={i} rise={rise} />
          ))}
          <Animated.View style={overlayStyle} />
        </View>
      )}
    </FireNavContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});
