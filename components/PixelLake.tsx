// components/PixelLake.tsx
// Pixel art lake with jumping fish and rare sea monster easter egg

import React, { useEffect, useState, useCallback } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";

// ===== PIXEL LAKE (just the water body, no creatures) =====
export function PixelLake() {
  const ripple1 = useSharedValue(0);
  const ripple2 = useSharedValue(0);
  const ripple3 = useSharedValue(0);

  useEffect(() => {
    ripple1.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    ripple2.value = withDelay(
      1000,
      withRepeat(
        withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      )
    );
    ripple3.value = withDelay(
      2000,
      withRepeat(
        withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      )
    );
  }, []);

  const rippleStyle1 = useAnimatedStyle(() => ({
    opacity: 0.3 + ripple1.value * 0.25,
    transform: [{ translateX: -3 + ripple1.value * 6 }],
  }));

  const rippleStyle2 = useAnimatedStyle(() => ({
    opacity: 0.2 + ripple2.value * 0.2,
    transform: [{ translateX: 2 - ripple2.value * 4 }],
  }));

  const rippleStyle3 = useAnimatedStyle(() => ({
    opacity: 0.25 + ripple3.value * 0.2,
    transform: [{ translateX: -2 + ripple3.value * 5 }],
  }));

  return (
    <View style={{ width: 120, height: 45, position: "relative" }}>
      {/* Lake body - dark blue oval */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: 120,
          height: 40,
          backgroundColor: "#0A2A4A",
          borderRadius: 60,
          overflow: "hidden",
        }}
      >
        {/* Edge highlight */}
        <View
          style={{
            position: "absolute",
            top: 1,
            left: 4,
            right: 4,
            height: 36,
            borderRadius: 56,
            borderWidth: 1,
            borderColor: "#0D3355",
            backgroundColor: "transparent",
          }}
        />

        {/* Ripple lines */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 10,
              left: 20,
              width: 35,
              height: 2,
              backgroundColor: "#1A4A7A",
              borderRadius: 1,
            },
            rippleStyle1,
          ]}
        />
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 18,
              left: 40,
              width: 45,
              height: 1.5,
              backgroundColor: "#1A4A7A",
              borderRadius: 1,
            },
            rippleStyle2,
          ]}
        />
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 26,
              left: 15,
              width: 30,
              height: 1.5,
              backgroundColor: "#1A4A7A",
              borderRadius: 1,
            },
            rippleStyle3,
          ]}
        />

        {/* Campfire warm reflection */}
        <View
          style={{
            position: "absolute",
            bottom: 2,
            right: 10,
            width: 40,
            height: 18,
            backgroundColor: "#FF6B35",
            borderRadius: 20,
            opacity: 0.06,
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: 5,
            right: 18,
            width: 24,
            height: 10,
            backgroundColor: "#FFD93D",
            borderRadius: 12,
            opacity: 0.04,
          }}
        />
      </View>
    </View>
  );
}

// ===== LAKE CREATURES (fish + monster, positioned independently) =====
export function LakeCreatures() {
  return (
    <View style={{ width: 140, height: 65 }}>
      <JumpingFish />
      <SeaMonster />
    </View>
  );
}

// ===== JUMPING FISH WITH WATER DROPLETS =====
function JumpingFish() {
  const fishY = useSharedValue(0);
  const fishX = useSharedValue(0);
  const fishRotate = useSharedValue(0);
  const fishOpacity = useSharedValue(0);

  // Entry splash droplets (when fish exits water)
  const entryOp = useSharedValue(0);
  const entry1Y = useSharedValue(0);
  const entry2Y = useSharedValue(0);
  const entry3Y = useSharedValue(0);
  const entry4Y = useSharedValue(0);

  // Landing splash droplets (when fish re-enters water)
  const landOp = useSharedValue(0);
  const land1Y = useSharedValue(0);
  const land2Y = useSharedValue(0);
  const land3Y = useSharedValue(0);

  const triggerJump = useCallback(() => {
    const startX = 25 + Math.random() * 70;
    const jumpDuration = 600 + Math.random() * 300;

    fishX.value = startX;
    fishRotate.value = 0;

    // --- Entry water droplets (fish exits) ---
    entryOp.value = withSequence(
      withTiming(0.9, { duration: 50 }),
      withDelay(380, withTiming(0, { duration: 150 }))
    );
    entry1Y.value = 0;
    entry1Y.value = withSequence(
      withTiming(-14, { duration: 200, easing: Easing.out(Easing.quad) }),
      withTiming(5, { duration: 250, easing: Easing.in(Easing.quad) })
    );
    entry2Y.value = 0;
    entry2Y.value = withSequence(
      withTiming(-20, { duration: 230, easing: Easing.out(Easing.quad) }),
      withTiming(5, { duration: 270, easing: Easing.in(Easing.quad) })
    );
    entry3Y.value = 0;
    entry3Y.value = withSequence(
      withTiming(-10, { duration: 170, easing: Easing.out(Easing.quad) }),
      withTiming(5, { duration: 210, easing: Easing.in(Easing.quad) })
    );
    entry4Y.value = 0;
    entry4Y.value = withSequence(
      withTiming(-17, { duration: 210, easing: Easing.out(Easing.quad) }),
      withTiming(5, { duration: 250, easing: Easing.in(Easing.quad) })
    );

    // --- Landing water droplets (fish re-enters) ---
    const landTime = jumpDuration + jumpDuration * 0.6;
    landOp.value = withDelay(
      landTime,
      withSequence(
        withTiming(0.85, { duration: 50 }),
        withDelay(320, withTiming(0, { duration: 150 }))
      )
    );
    land1Y.value = 0;
    land1Y.value = withDelay(
      landTime,
      withSequence(
        withTiming(-11, { duration: 180, easing: Easing.out(Easing.quad) }),
        withTiming(5, { duration: 220, easing: Easing.in(Easing.quad) })
      )
    );
    land2Y.value = 0;
    land2Y.value = withDelay(
      landTime,
      withSequence(
        withTiming(-16, { duration: 200, easing: Easing.out(Easing.quad) }),
        withTiming(5, { duration: 240, easing: Easing.in(Easing.quad) })
      )
    );
    land3Y.value = 0;
    land3Y.value = withDelay(
      landTime,
      withSequence(
        withTiming(-8, { duration: 160, easing: Easing.out(Easing.quad) }),
        withTiming(5, { duration: 200, easing: Easing.in(Easing.quad) })
      )
    );

    // --- Fish arc ---
    fishOpacity.value = withSequence(
      withTiming(1, { duration: 80 }),
      withDelay(jumpDuration * 1.6, withTiming(0, { duration: 80 }))
    );

    fishY.value = withSequence(
      withTiming(-35, {
        duration: jumpDuration,
        easing: Easing.out(Easing.quad),
      }),
      withTiming(0, {
        duration: jumpDuration * 0.8,
        easing: Easing.in(Easing.quad),
      })
    );

    fishRotate.value = withSequence(
      withTiming(-45, {
        duration: jumpDuration,
        easing: Easing.out(Easing.quad),
      }),
      withTiming(45, {
        duration: jumpDuration * 0.8,
        easing: Easing.in(Easing.quad),
      })
    );
  }, []);

  useEffect(() => {
    let currentTimer: ReturnType<typeof setTimeout> | null = null;
    let alive = true;

    const scheduleJump = (initialDelay?: number) => {
      const delay = initialDelay ?? (3000 + Math.random() * 5000);
      currentTimer = setTimeout(() => {
        if (!alive) return;
        triggerJump();
        scheduleJump();
      }, delay);
    };

    scheduleJump(2000 + Math.random() * 3000);

    return () => {
      alive = false;
      if (currentTimer) clearTimeout(currentTimer);
    };
  }, [triggerJump]);

  const fishStyle = useAnimatedStyle(() => ({
    opacity: fishOpacity.value,
    transform: [
      { translateX: fishX.value },
      { translateY: fishY.value },
      { rotate: `${fishRotate.value}deg` },
    ],
  }));

  // Entry droplet animated styles
  const entryDrop1Style = useAnimatedStyle(() => ({
    opacity: entryOp.value,
    transform: [{ translateX: fishX.value - 5 }, { translateY: entry1Y.value }],
  }));
  const entryDrop2Style = useAnimatedStyle(() => ({
    opacity: entryOp.value,
    transform: [{ translateX: fishX.value + 3 }, { translateY: entry2Y.value }],
  }));
  const entryDrop3Style = useAnimatedStyle(() => ({
    opacity: entryOp.value,
    transform: [{ translateX: fishX.value + 10 }, { translateY: entry3Y.value }],
  }));
  const entryDrop4Style = useAnimatedStyle(() => ({
    opacity: entryOp.value,
    transform: [{ translateX: fishX.value - 9 }, { translateY: entry4Y.value }],
  }));

  // Landing droplet animated styles
  const landDrop1Style = useAnimatedStyle(() => ({
    opacity: landOp.value,
    transform: [{ translateX: fishX.value - 6 }, { translateY: land1Y.value }],
  }));
  const landDrop2Style = useAnimatedStyle(() => ({
    opacity: landOp.value,
    transform: [{ translateX: fishX.value + 4 }, { translateY: land2Y.value }],
  }));
  const landDrop3Style = useAnimatedStyle(() => ({
    opacity: landOp.value,
    transform: [{ translateX: fishX.value + 11 }, { translateY: land3Y.value }],
  }));

  return (
    <>
      {/* Entry water droplets */}
      <Animated.View style={[{ position: "absolute", bottom: 8, left: 0 }, entryDrop1Style]}>
        <View style={{ width: 3, height: 3, backgroundColor: "#A0C8E8", borderRadius: 1.5 }} />
      </Animated.View>
      <Animated.View style={[{ position: "absolute", bottom: 8, left: 0 }, entryDrop2Style]}>
        <View style={{ width: 2.5, height: 2.5, backgroundColor: "#B0D4F0", borderRadius: 1.25 }} />
      </Animated.View>
      <Animated.View style={[{ position: "absolute", bottom: 8, left: 0 }, entryDrop3Style]}>
        <View style={{ width: 2, height: 2, backgroundColor: "#90B8D8", borderRadius: 1 }} />
      </Animated.View>
      <Animated.View style={[{ position: "absolute", bottom: 8, left: 0 }, entryDrop4Style]}>
        <View style={{ width: 2.5, height: 2.5, backgroundColor: "#A0C8E8", borderRadius: 1.25 }} />
      </Animated.View>

      {/* Landing water droplets */}
      <Animated.View style={[{ position: "absolute", bottom: 8, left: 0 }, landDrop1Style]}>
        <View style={{ width: 2.5, height: 2.5, backgroundColor: "#A0C8E8", borderRadius: 1.25 }} />
      </Animated.View>
      <Animated.View style={[{ position: "absolute", bottom: 8, left: 0 }, landDrop2Style]}>
        <View style={{ width: 3, height: 3, backgroundColor: "#B0D4F0", borderRadius: 1.5 }} />
      </Animated.View>
      <Animated.View style={[{ position: "absolute", bottom: 8, left: 0 }, landDrop3Style]}>
        <View style={{ width: 2, height: 2, backgroundColor: "#90B8D8", borderRadius: 1 }} />
      </Animated.View>

      {/* Fish body */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: 6,
            left: 0,
            width: 10,
            height: 6,
          },
          fishStyle,
        ]}
      >
        {/* Body */}
        <View
          style={{
            width: 8,
            height: 5,
            backgroundColor: "#8AADC4",
            borderRadius: 3,
          }}
        />
        {/* Tail fin */}
        <View
          style={{
            position: "absolute",
            right: -1,
            top: 0,
            width: 0,
            height: 0,
            borderTopWidth: 3,
            borderBottomWidth: 3,
            borderLeftWidth: 4,
            borderTopColor: "transparent",
            borderBottomColor: "transparent",
            borderLeftColor: "#7898B0",
          }}
        />
        {/* Eye */}
        <View
          style={{
            position: "absolute",
            left: 2,
            top: 1.5,
            width: 1.5,
            height: 1.5,
            backgroundColor: "#1A1A1A",
            borderRadius: 1,
          }}
        />
        {/* Belly highlight */}
        <View
          style={{
            position: "absolute",
            left: 2,
            bottom: 0.5,
            width: 4,
            height: 1.5,
            backgroundColor: "#C0D8E8",
            borderRadius: 1,
          }}
        />
      </Animated.View>
    </>
  );
}

// ===== SEA MONSTER (EASTER EGG) =====
// Rare pixel "Nessie" that slowly surfaces and submerges (~8% chance)
function SeaMonster() {
  const [shouldShow] = useState(() => Math.random() < 0.08);
  const monsterY = useSharedValue(20);
  const monsterOpacity = useSharedValue(0);

  useEffect(() => {
    if (!shouldShow) return;

    const delay = 5000 + Math.random() * 10000;

    const timer = setTimeout(() => {
      // Fade in and rise
      monsterOpacity.value = withTiming(1, { duration: 500 });
      monsterY.value = withSequence(
        // Rise
        withTiming(-18, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        // Hold
        withDelay(2000, withTiming(-18, { duration: 10 })),
        // Sink
        withTiming(20, { duration: 2000, easing: Easing.inOut(Easing.quad) })
      );

      // Fade out near end
      monsterOpacity.value = withSequence(
        withTiming(1, { duration: 500 }),
        withDelay(3500, withTiming(0, { duration: 1500 }))
      );
    }, delay);

    return () => clearTimeout(timer);
  }, [shouldShow]);

  const monsterStyle = useAnimatedStyle(() => ({
    opacity: monsterOpacity.value,
    transform: [{ translateY: monsterY.value }],
  }));

  if (!shouldShow) return null;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          bottom: 10,
          left: 20,
          width: 50,
          height: 20,
          flexDirection: "row",
          alignItems: "flex-end",
        },
        monsterStyle,
      ]}
    >
      {/* Head */}
      <View
        style={{
          width: 7,
          height: 10,
          backgroundColor: "#1A5050",
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          marginRight: 1,
        }}
      >
        {/* Eye */}
        <View
          style={{
            position: "absolute",
            top: 2,
            left: 2,
            width: 2.5,
            height: 2.5,
            backgroundColor: "#FFD93D",
            borderRadius: 1.5,
          }}
        />
      </View>

      {/* Hump 1 */}
      <View
        style={{
          width: 10,
          height: 8,
          backgroundColor: "#1A5050",
          borderTopLeftRadius: 5,
          borderTopRightRadius: 5,
          marginRight: 2,
        }}
      />

      {/* Hump 2 */}
      <View
        style={{
          width: 9,
          height: 7,
          backgroundColor: "#1A5050",
          borderTopLeftRadius: 5,
          borderTopRightRadius: 5,
          marginRight: 2,
        }}
      />

      {/* Hump 3 (smaller, trailing) */}
      <View
        style={{
          width: 7,
          height: 5,
          backgroundColor: "#1A5050",
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
        }}
      />
    </Animated.View>
  );
}

export default PixelLake;
