// components/campfire/CampfireSimple.tsx
// Lightweight, scalable campfire for backgrounds, splash screens, and modals.
// Uses CampfireColors from theme and react-native-reanimated for consistency.
// DESIGN.md §15.2: Campfire cooking easter egg on cold app launch

import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { CampfireColors } from "../../constants/theme";
import { incrementSmoreCount, getSmoreCount, isSmoreCountMilestone, getSmoreCountMilestone } from "../../lib/services/smoreCounter";

const C = CampfireColors;

interface CampfireSimpleProps {
  /** Base width of the campfire (default 110) */
  size?: number;
  /** Show the ambient glow behind the fire (default true) */
  showGlow?: boolean;
  /** DESIGN.md §15.2: Show cooking easter egg (random food for 8s on cold start) */
  showCooking?: boolean;
}

// DESIGN.md §15.2: Random cooking items (marshmallow is special - counted!)
const COOKING_ITEMS = ['🍖', '🌭', '🐟', '🍥']; // 🍥 = marshmallow/s'more
const SMORE_ITEM = '🍥'; // The special marshmallow that gets counted

export function CampfireSimple({ size = 110, showGlow = true, showCooking = false }: CampfireSimpleProps) {
  const scale = size / 110; // Base design is 110px wide

  // DESIGN.md §15.1: 3 independent flame layers (left, center, right)
  const flameLeft = useSharedValue(1);
  const flameCenter = useSharedValue(1);
  const flameRight = useSharedValue(1);
  const glow = useSharedValue(0.3);

  // DESIGN.md §15.1: Ember particles drift upward
  const ember1Y = useSharedValue(0);
  const ember1Opacity = useSharedValue(0);
  const ember2Y = useSharedValue(0);
  const ember2Opacity = useSharedValue(0);
  const ember3Y = useSharedValue(0);
  const ember3Opacity = useSharedValue(0);

  // DESIGN.md §15.1: Smoke curl particles
  const smoke1Y = useSharedValue(0);
  const smoke1X = useSharedValue(0);
  const smoke1Opacity = useSharedValue(0);
  const smoke2Y = useSharedValue(0);
  const smoke2X = useSharedValue(0);
  const smoke2Opacity = useSharedValue(0);

  // DESIGN.md §15.2: Cooking easter egg state
  const [cookingItem, setCookingItem] = useState<string | null>(null);
  const [showCookingItem, setShowCookingItem] = useState(false);
  const [smoreCount, setSmoreCount] = useState<number>(0);
  const [showMilestone, setShowMilestone] = useState<string | null>(null);
  const cookingRotation = useSharedValue(0);

  // Load s'more count on mount
  useEffect(() => {
    getSmoreCount().then(setSmoreCount);
  }, []);

  // DESIGN.md §15.2: Cooking easter egg - show random item for 8 seconds
  useEffect(() => {
    if (showCooking) {
      const randomItem = COOKING_ITEMS[Math.floor(Math.random() * COOKING_ITEMS.length)];
      setCookingItem(randomItem);
      setShowCookingItem(true);

      // DESIGN.md §15.2: S'more Counter - track marshmallows!
      if (randomItem === SMORE_ITEM) {
        incrementSmoreCount().then((newCount) => {
          setSmoreCount(newCount);

          // Show milestone celebration if applicable
          if (isSmoreCountMilestone(newCount)) {
            const milestone = getSmoreCountMilestone(newCount);
            if (milestone) {
              setShowMilestone(milestone);
              setTimeout(() => setShowMilestone(null), 4000); // Show for 4 seconds
            }
          }
        });
      }

      // Rotate the cooking item slowly
      cookingRotation.value = withRepeat(
        withTiming(360, { duration: 4000, easing: Easing.linear }),
        2, // 2 full rotations over 8 seconds
        false
      );

      // Hide after 8 seconds
      const timer = setTimeout(() => {
        setShowCookingItem(false);
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [showCooking]);

  useEffect(() => {
    // DESIGN.md §15.1: 3 independent flame layers with different timings
    // Left flame - slower, slightly offset
    flameLeft.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 320, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.9, { duration: 380, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // Center flame - medium speed, tallest
    flameCenter.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 280, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.95, { duration: 320, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // Right flame - fastest, most erratic
    flameRight.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 240, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.85, { duration: 260, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // Ambient glow pulse
    glow.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // DESIGN.md §15.1: Ember particles - drift up and fade out, then reset
    // Ember 1 (left side, faster)
    ember1Y.value = withDelay(
      0,
      withRepeat(
        withSequence(
          withTiming(-40, { duration: 2500, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 }) // Reset
        ),
        -1,
        false
      )
    );
    ember1Opacity.value = withDelay(
      0,
      withRepeat(
        withSequence(
          withTiming(0.9, { duration: 300 }),
          withTiming(0.7, { duration: 1200 }),
          withTiming(0, { duration: 1000 }),
          withTiming(0, { duration: 0 }) // Reset
        ),
        -1,
        false
      )
    );

    // Ember 2 (center, slower)
    ember2Y.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(-35, { duration: 3000, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );
    ember2Opacity.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 300 }),
          withTiming(0.6, { duration: 1500 }),
          withTiming(0, { duration: 1200 }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );

    // Ember 3 (right side, medium)
    ember3Y.value = withDelay(
      1600,
      withRepeat(
        withSequence(
          withTiming(-38, { duration: 2700, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );
    ember3Opacity.value = withDelay(
      1600,
      withRepeat(
        withSequence(
          withTiming(0.85, { duration: 300 }),
          withTiming(0.65, { duration: 1300 }),
          withTiming(0, { duration: 1100 }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );

    // DESIGN.md §15.1: Smoke particles - drift up and sideways
    // Smoke 1 (left curl)
    smoke1Y.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(-50, { duration: 4000, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );
    smoke1X.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 4000, easing: Easing.inOut(Easing.sine) }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );
    smoke1Opacity.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(0.25, { duration: 800 }),
          withTiming(0.15, { duration: 2000 }),
          withTiming(0, { duration: 1200 }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );

    // Smoke 2 (right curl)
    smoke2Y.value = withDelay(
      2400,
      withRepeat(
        withSequence(
          withTiming(-45, { duration: 3800, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );
    smoke2X.value = withDelay(
      2400,
      withRepeat(
        withSequence(
          withTiming(10, { duration: 3800, easing: Easing.inOut(Easing.sine) }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );
    smoke2Opacity.value = withDelay(
      2400,
      withRepeat(
        withSequence(
          withTiming(0.2, { duration: 800 }),
          withTiming(0.12, { duration: 2000 }),
          withTiming(0, { duration: 1000 }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );
  }, []);

  // DESIGN.md §15.1: Individual flame layer styles
  const flameLeftStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: flameLeft.value }],
  }));

  const flameCenterStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: flameCenter.value }],
  }));

  const flameRightStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: flameRight.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  // DESIGN.md §15.1: Ember particle styles
  const ember1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: ember1Y.value }],
    opacity: ember1Opacity.value,
  }));

  const ember2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: ember2Y.value }],
    opacity: ember2Opacity.value,
  }));

  const ember3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: ember3Y.value }],
    opacity: ember3Opacity.value,
  }));

  // DESIGN.md §15.1: Smoke particle styles
  const smoke1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: smoke1Y.value }, { translateX: smoke1X.value }],
    opacity: smoke1Opacity.value,
  }));

  const smoke2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: smoke2Y.value }, { translateX: smoke2X.value }],
    opacity: smoke2Opacity.value,
  }));

  const cookingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${cookingRotation.value}deg` }],
  }));

  const s = (v: number) => v * scale;

  return (
    <View style={{ alignItems: "center", width: s(110), height: s(80) }}>
      {/* Ambient glow */}
      {showGlow && (
        <Animated.View
          style={[
            {
              position: "absolute",
              width: s(140),
              height: s(80),
              borderRadius: s(70),
              backgroundColor: C.FIRE_ORANGE,
              bottom: s(5),
              left: s(-15),
            },
            glowStyle,
          ]}
        />
      )}

      {/* Stone ring */}
      <View style={{ position: "absolute", bottom: 0, left: s(6), width: s(11), height: s(7), backgroundColor: C.STONE_DARKEST, borderRadius: s(3) }} />
      <View style={{ position: "absolute", bottom: 0, left: s(18), width: s(9), height: s(6), backgroundColor: C.STONE_DARK, borderRadius: s(3) }} />
      <View style={{ position: "absolute", bottom: 0, left: s(82), width: s(12), height: s(7), backgroundColor: C.STONE_DARK, borderRadius: s(4) }} />
      <View style={{ position: "absolute", bottom: 0, left: s(95), width: s(10), height: s(6), backgroundColor: C.STONE_DARKEST, borderRadius: s(3) }} />
      <View style={{ position: "absolute", bottom: 0, left: 0, width: s(9), height: s(5), backgroundColor: C.STONE_DARK, borderRadius: s(3) }} />
      <View style={{ position: "absolute", bottom: 0, left: s(100), width: s(9), height: s(5), backgroundColor: C.STONE_DARKEST, borderRadius: s(3) }} />

      {/* Crossed logs */}
      <View
        style={{
          position: "absolute",
          bottom: s(3),
          left: s(15),
          width: s(38),
          height: s(7),
          backgroundColor: C.LOG_DARK,
          borderRadius: s(3),
          transform: [{ rotate: "-15deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: s(3),
          left: s(55),
          width: s(38),
          height: s(7),
          backgroundColor: C.LOG_MID,
          borderRadius: s(3),
          transform: [{ rotate: "15deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: s(6),
          left: s(38),
          width: s(32),
          height: s(5),
          backgroundColor: C.LOG_CROSS,
          borderRadius: s(2),
          transform: [{ rotate: "5deg" }],
        }}
      />

      {/* DESIGN.md §15.1: 3 independent flame layers */}

      {/* Left flame */}
      <Animated.View style={[{ position: "absolute", bottom: s(8), left: s(22) }, flameLeftStyle]}>
        <View style={{ width: s(20), height: s(32), backgroundColor: C.FIRE_RED, borderRadius: s(10) }} />
        <View style={{ position: "absolute", bottom: 0, width: s(16), height: s(26), backgroundColor: C.FIRE_ORANGE, borderRadius: s(8) }} />
        <View style={{ position: "absolute", bottom: s(2), width: s(10), height: s(18), backgroundColor: C.FIRE_YELLOW, borderRadius: s(5) }} />
      </Animated.View>

      {/* Center flame (tallest) */}
      <Animated.View style={[{ position: "absolute", bottom: s(8), left: s(40) }, flameCenterStyle]}>
        <View style={{ width: s(24), height: s(42), backgroundColor: C.FIRE_RED, borderRadius: s(12) }} />
        <View style={{ position: "absolute", bottom: 0, width: s(20), height: s(36), backgroundColor: C.FIRE_ORANGE, borderRadius: s(10) }} />
        <View style={{ position: "absolute", bottom: s(3), width: s(14), height: s(28), backgroundColor: C.FIRE_YELLOW, borderRadius: s(7) }} />
        <View style={{ position: "absolute", bottom: s(6), width: s(8), height: s(18), backgroundColor: C.FIRE_CORE, borderRadius: s(4) }} />
      </Animated.View>

      {/* Right flame */}
      <Animated.View style={[{ position: "absolute", bottom: s(8), right: s(28) }, flameRightStyle]}>
        <View style={{ width: s(22), height: s(36), backgroundColor: C.FIRE_RED, borderRadius: s(11) }} />
        <View style={{ position: "absolute", bottom: 0, width: s(18), height: s(30), backgroundColor: C.FIRE_ORANGE, borderRadius: s(9) }} />
        <View style={{ position: "absolute", bottom: s(2), width: s(12), height: s(22), backgroundColor: C.FIRE_YELLOW, borderRadius: s(6) }} />
      </Animated.View>

      {/* DESIGN.md §15.1: Ember particles drifting upward */}
      <Animated.View style={[ember1Style, { position: "absolute", bottom: s(30), left: s(28), width: s(3), height: s(3), backgroundColor: C.EMBER, borderRadius: s(1.5), shadowColor: C.FIRE_ORANGE, shadowOpacity: 0.8, shadowRadius: s(4) }]} />
      <Animated.View style={[ember2Style, { position: "absolute", bottom: s(32), left: s(52), width: s(2), height: s(2), backgroundColor: C.FIRE_YELLOW, borderRadius: s(1), shadowColor: C.FIRE_YELLOW, shadowOpacity: 0.9, shadowRadius: s(3) }]} />
      <Animated.View style={[ember3Style, { position: "absolute", bottom: s(28), right: s(32), width: s(3), height: s(3), backgroundColor: C.EMBER, borderRadius: s(1.5), shadowColor: C.FIRE_RED, shadowOpacity: 0.7, shadowRadius: s(4) }]} />

      {/* DESIGN.md §15.1: Smoke curl particles */}
      <Animated.View style={[smoke1Style, { position: "absolute", bottom: s(45), left: s(35), width: s(8), height: s(8), backgroundColor: C.SMOKE, borderRadius: s(4) }]} />
      <Animated.View style={[smoke2Style, { position: "absolute", bottom: s(42), right: s(35), width: s(10), height: s(10), backgroundColor: C.SMOKE, borderRadius: s(5) }]} />

      {/* DESIGN.md §15.2: S'more Counter Badge (subtle, bottom-right) */}
      {smoreCount > 0 && (
        <View
          style={{
            position: "absolute",
            bottom: s(-15),
            right: s(-10),
            backgroundColor: C.CARD_SOLID,
            borderRadius: s(12),
            borderWidth: 1,
            borderColor: C.BORDER,
            paddingHorizontal: s(8),
            paddingVertical: s(4),
            flexDirection: "row",
            alignItems: "center",
            gap: s(4),
            shadowColor: C.FIRE_ORANGE,
            shadowOpacity: 0.3,
            shadowRadius: s(8),
          }}
        >
          <Text style={{ fontSize: s(12) }}>🍥</Text>
          <Text style={{ color: C.TEXT_CREAM, fontSize: s(11), fontWeight: "600" }}>
            {smoreCount}
          </Text>
        </View>
      )}

      {/* DESIGN.md §15.2: Milestone Celebration */}
      {showMilestone && (
        <Animated.View
          entering={FadeIn.duration(600)}
          exiting={FadeOut.duration(800)}
          style={{
            position: "absolute",
            bottom: s(90),
            left: s(-20),
            right: s(-20),
            backgroundColor: C.CARD_SOLID + 'F0',
            borderRadius: s(16),
            borderWidth: 2,
            borderColor: C.WARNING,
            paddingVertical: s(12),
            paddingHorizontal: s(16),
            alignItems: "center",
            shadowColor: C.FIRE_YELLOW,
            shadowOpacity: 0.6,
            shadowRadius: s(20),
          }}
        >
          <Text style={{ color: C.WARNING, fontSize: s(16), fontWeight: "800", textAlign: "center" }}>
            {showMilestone}
          </Text>
        </Animated.View>
      )}

      {/* DESIGN.md §15.2: Cooking item easter egg */}
      {showCookingItem && cookingItem && (
        <Animated.View
          entering={FadeIn.duration(800)}
          exiting={FadeOut.duration(1000)}
          style={{
            position: "absolute",
            top: s(-20),
            left: s(55),
            alignItems: "center",
          }}
        >
          {/* Roasting stick */}
          <View
            style={{
              position: "absolute",
              top: s(18),
              left: s(-25),
              width: s(50),
              height: s(2),
              backgroundColor: C.LOG_DARK,
              transform: [{ rotate: "-45deg" }],
            }}
          />
          {/* Food item (rotating) */}
          <Animated.View style={cookingStyle}>
            <Text style={{ fontSize: s(24) }}>{cookingItem}</Text>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

export default CampfireSimple;
