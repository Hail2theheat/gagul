// components/FireStreakBadge.tsx
// Animated fire streak badge that scales with streak level.
// Uses same animation patterns as CampfireSimple (flicker, sway, embers, glow).

import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { CampfireColors } from "../constants/theme";

const C = CampfireColors;

interface FireStreakBadgeProps {
  streak: number;
}

// Streak tiers:
// 0: just logs, no fire
// 1: 1-5, 2: 6-10, 3: 11-15, 4: 16-20, 5: 21-25, 6: 26-30, 7: 30+
function getTier(streak: number): number {
  if (streak <= 0) return 0;
  if (streak <= 5) return 1;
  if (streak <= 10) return 2;
  if (streak <= 15) return 3;
  if (streak <= 20) return 4;
  if (streak <= 25) return 5;
  if (streak <= 30) return 6;
  return 7;
}

// Tier-based dimensions
function getFlameConfig(tier: number) {
  // Heights and widths scale per tier
  const configs = [
    // tier 0: no flames
    { layers: 0, outerW: 0, outerH: 0, midW: 0, midH: 0, innerW: 0, innerH: 0, coreW: 0, coreH: 0, embers: 0, glow: false },
    // tier 1: tiny single flame
    { layers: 1, outerW: 10, outerH: 14, midW: 0, midH: 0, innerW: 6, innerH: 8, coreW: 0, coreH: 0, embers: 0, glow: false },
    // tier 2: small fire (2 layers)
    { layers: 2, outerW: 14, outerH: 18, midW: 10, midH: 14, innerW: 6, innerH: 8, coreW: 0, coreH: 0, embers: 0, glow: false },
    // tier 3: medium (3 layers), 1 ember
    { layers: 3, outerW: 16, outerH: 22, midW: 12, midH: 16, innerW: 8, innerH: 10, coreW: 4, coreH: 6, embers: 1, glow: false },
    // tier 4: larger, 1 ember, glow
    { layers: 3, outerW: 18, outerH: 26, midW: 14, midH: 20, innerW: 10, innerH: 14, coreW: 6, coreH: 8, embers: 1, glow: true },
    // tier 5: tall, 2 embers, glow
    { layers: 3, outerW: 22, outerH: 30, midW: 16, midH: 22, innerW: 12, innerH: 16, coreW: 6, coreH: 10, embers: 2, glow: true },
    // tier 6: large, 2 embers, stronger glow
    { layers: 3, outerW: 24, outerH: 34, midW: 18, midH: 26, innerW: 14, innerH: 18, coreW: 8, coreH: 12, embers: 2, glow: true },
    // tier 7: blazing max, 3 embers, bright glow
    { layers: 3, outerW: 28, outerH: 38, midW: 20, midH: 28, innerW: 14, innerH: 20, coreW: 8, coreH: 14, embers: 3, glow: true },
  ];
  return configs[tier];
}

export function FireStreakBadge({ streak }: FireStreakBadgeProps) {
  const tier = getTier(streak);
  const config = getFlameConfig(tier);

  // Container sizing
  const containerWidth = 36;
  const logHeight = 8;
  const flameHeight = tier === 0 ? 0 : config.outerH;
  const containerHeight = tier === 0 ? 24 : Math.max(24, logHeight + flameHeight + 8);

  // Flame flicker animations (matching CampfireSimple exactly)
  const flame1 = useSharedValue(1);
  const flame2 = useSharedValue(1);
  const flame3 = useSharedValue(1);

  // Sway animations
  const sway1 = useSharedValue(0);
  const sway2 = useSharedValue(0);

  // Glow pulse
  const glowOpacity = useSharedValue(0.2);

  // Ember animations
  const ember1Y = useSharedValue(0);
  const ember1Opacity = useSharedValue(0);
  const ember2Y = useSharedValue(0);
  const ember2Opacity = useSharedValue(0);
  const ember3Y = useSharedValue(0);
  const ember3Opacity = useSharedValue(0);

  useEffect(() => {
    if (tier === 0) return;

    // Flame flicker - same easing/pattern as CampfireSimple
    flame1.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 320, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.9, { duration: 380, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    if (config.layers >= 2) {
      flame2.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 280, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.95, { duration: 320, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    }

    if (config.layers >= 3) {
      flame3.value = withRepeat(
        withSequence(
          withTiming(1.25, { duration: 240, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.85, { duration: 260, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    }

    // Sway - subtle translateX oscillation
    sway1.value = withRepeat(
      withSequence(
        withTiming(tier >= 5 ? 2 : 1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(tier >= 5 ? -2 : -1, { duration: 700, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    sway2.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(tier >= 5 ? -1.5 : -1, { duration: 600, easing: Easing.inOut(Easing.sin) }),
          withTiming(tier >= 5 ? 1.5 : 1, { duration: 800, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    // Glow pulse (tier 4+)
    if (config.glow) {
      const glowMax = tier >= 7 ? 0.5 : tier >= 6 ? 0.4 : 0.3;
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(glowMax, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.15, { duration: 1200, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    }

    // Embers
    if (config.embers >= 1) {
      ember1Y.value = withDelay(
        0,
        withRepeat(
          withSequence(
            withTiming(-25, { duration: 2500, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 0 })
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
            withTiming(0, { duration: 0 })
          ),
          -1,
          false
        )
      );
    }

    if (config.embers >= 2) {
      ember2Y.value = withDelay(
        800,
        withRepeat(
          withSequence(
            withTiming(-30, { duration: 3000, easing: Easing.out(Easing.quad) }),
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
    }

    if (config.embers >= 3) {
      ember3Y.value = withDelay(
        1600,
        withRepeat(
          withSequence(
            withTiming(-35, { duration: 2700, easing: Easing.out(Easing.quad) }),
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
    }
  }, [tier]);

  // Animated styles - separate scaleY and translateX to avoid TS transform union issues
  const flame1ScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: flame1.value }],
  }));

  const flame1SwayStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sway1.value }],
  }));

  const flame2ScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: flame2.value }],
  }));

  const flame2SwayStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sway2.value }],
  }));

  const flame3ScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: flame3.value }],
  }));

  const flame3SwayStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sway1.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

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

  // Font size scales with digit count
  const fontSize = streak >= 100 ? 9 : streak >= 10 ? 11 : 13;

  return (
    <View style={{ width: containerWidth, height: containerHeight, alignItems: "center", justifyContent: "flex-end" }}>
      {/* Glow (tier 4+) */}
      {config.glow && (
        <Animated.View
          style={[
            {
              position: "absolute",
              width: config.outerW + 12,
              height: config.outerH + 4,
              borderRadius: (config.outerW + 12) / 2,
              backgroundColor: C.FIRE_ORANGE,
              bottom: logHeight - 2,
            },
            glowStyle,
          ]}
        />
      )}

      {/* Crossed logs (always shown) */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 4,
          width: 16,
          height: 4,
          backgroundColor: C.LOG_DARK,
          borderRadius: 2,
          transform: [{ rotate: "-15deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          right: 4,
          width: 16,
          height: 4,
          backgroundColor: C.LOG_MID,
          borderRadius: 2,
          transform: [{ rotate: "15deg" }],
        }}
      />

      {/* Tier 0: just logs with "0" */}
      {tier === 0 && (
        <Text
          style={{
            position: "absolute",
            bottom: 2,
            color: C.MUTED,
            fontWeight: "900",
            fontSize: 11,
            textAlign: "center",
          }}
        >
          {streak}
        </Text>
      )}

      {/* Flames (tier 1+) */}
      {tier >= 1 && (
        <>
          {/* Outer flame (red) - main shape */}
          <Animated.View
            style={[
              {
                position: "absolute",
                bottom: logHeight - 2,
                alignSelf: "center",
              },
              flame1SwayStyle,
            ]}
          >
            <Animated.View style={flame1ScaleStyle}>
              <View
                style={{
                  width: config.outerW,
                  height: config.outerH,
                  backgroundColor: C.FIRE_RED,
                  borderTopLeftRadius: config.outerW / 2,
                  borderTopRightRadius: config.outerW / 2,
                  borderBottomLeftRadius: config.outerW / 3,
                  borderBottomRightRadius: config.outerW / 3,
                }}
              />
            </Animated.View>
          </Animated.View>

          {/* Mid flame (orange) - tier 2+ */}
          {config.layers >= 2 && (
            <Animated.View
              style={[
                {
                  position: "absolute",
                  bottom: logHeight - 2,
                  alignSelf: "center",
                },
                flame2SwayStyle,
              ]}
            >
              <Animated.View style={flame2ScaleStyle}>
                <View
                  style={{
                    width: config.midW,
                    height: config.midH,
                    backgroundColor: C.FIRE_ORANGE,
                    borderTopLeftRadius: config.midW / 2,
                    borderTopRightRadius: config.midW / 2,
                    borderBottomLeftRadius: config.midW / 3,
                    borderBottomRightRadius: config.midW / 3,
                  }}
                />
              </Animated.View>
            </Animated.View>
          )}

          {/* Inner flame (yellow) */}
          <Animated.View
            style={[
              {
                position: "absolute",
                bottom: logHeight - 1,
                alignSelf: "center",
              },
              config.layers >= 3 ? flame3SwayStyle : flame1SwayStyle,
            ]}
          >
            <Animated.View style={config.layers >= 3 ? flame3ScaleStyle : flame1ScaleStyle}>
              <View
                style={{
                  width: config.innerW,
                  height: config.innerH,
                  backgroundColor: C.FIRE_YELLOW,
                  borderTopLeftRadius: config.innerW / 2,
                  borderTopRightRadius: config.innerW / 2,
                  borderBottomLeftRadius: config.innerW / 3,
                  borderBottomRightRadius: config.innerW / 3,
                }}
              />
            </Animated.View>
          </Animated.View>

          {/* Core (white-hot center) - tier 3+ */}
          {config.coreH > 0 && (
            <View
              style={{
                position: "absolute",
                bottom: logHeight,
                alignSelf: "center",
                width: config.coreW,
                height: config.coreH,
                backgroundColor: C.FIRE_CORE,
                borderTopLeftRadius: config.coreW / 2,
                borderTopRightRadius: config.coreW / 2,
                borderBottomLeftRadius: config.coreW / 3,
                borderBottomRightRadius: config.coreW / 3,
              }}
            />
          )}

          {/* Embers */}
          {config.embers >= 1 && (
            <Animated.View
              style={[
                ember1Style,
                {
                  position: "absolute",
                  bottom: logHeight + config.outerH * 0.5,
                  left: 6,
                  width: 3,
                  height: 3,
                  backgroundColor: C.EMBER,
                  borderRadius: 1.5,
                },
              ]}
            />
          )}
          {config.embers >= 2 && (
            <Animated.View
              style={[
                ember2Style,
                {
                  position: "absolute",
                  bottom: logHeight + config.outerH * 0.6,
                  right: 7,
                  width: 2,
                  height: 2,
                  backgroundColor: C.FIRE_YELLOW,
                  borderRadius: 1,
                },
              ]}
            />
          )}
          {config.embers >= 3 && (
            <Animated.View
              style={[
                ember3Style,
                {
                  position: "absolute",
                  bottom: logHeight + config.outerH * 0.4,
                  left: containerWidth / 2 + 2,
                  width: 2,
                  height: 2,
                  backgroundColor: C.EMBER,
                  borderRadius: 1,
                },
              ]}
            />
          )}

          {/* Streak number overlay on fire */}
          <Text
            style={{
              position: "absolute",
              bottom: logHeight + config.outerH * 0.15,
              alignSelf: "center",
              color: "#2A0800",
              fontWeight: "900",
              fontSize,
              textAlign: "center",
              textShadowColor: "rgba(255, 200, 100, 0.8)",
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 2,
            }}
          >
            {streak}
          </Text>
        </>
      )}
    </View>
  );
}

export default FireStreakBadge;
