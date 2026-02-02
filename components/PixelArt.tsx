// components/PixelArt.tsx
// Stardew Valley / Terraria inspired pixel art components
// More organic, hand-drawn style with proper shading

import React, { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";

// ===== BONFIRE =====
// Cozy campfire with flickering flames, glowing embers, and log details
interface BonfireProps {
  size?: number;
  showSmoke?: boolean;
}

export function DetailedCampfire({ size = 80, showSmoke = true }: BonfireProps) {
  const scale = size / 80; // Base size is 80

  // Animation values
  const flame1 = useRef(new Animated.Value(0)).current;
  const flame2 = useRef(new Animated.Value(0)).current;
  const flame3 = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.4)).current;
  const ember1Y = useRef(new Animated.Value(0)).current;
  const ember2Y = useRef(new Animated.Value(0)).current;
  const ember3Y = useRef(new Animated.Value(0)).current;
  const ember4Y = useRef(new Animated.Value(0)).current;
  const ember1Opacity = useRef(new Animated.Value(0)).current;
  const ember2Opacity = useRef(new Animated.Value(0)).current;
  const ember3Opacity = useRef(new Animated.Value(0)).current;
  const ember4Opacity = useRef(new Animated.Value(0)).current;
  const smoke1 = useRef(new Animated.Value(0)).current;
  const smoke2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Flame flicker - different speeds for each flame
    Animated.loop(
      Animated.sequence([
        Animated.timing(flame1, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(flame1, { toValue: 0.7, duration: 200, useNativeDriver: true }),
        Animated.timing(flame1, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(flame1, { toValue: 0.5, duration: 170, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(flame2, { toValue: 0.8, duration: 200, useNativeDriver: true }),
        Animated.timing(flame2, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(flame2, { toValue: 0.6, duration: 180, useNativeDriver: true }),
        Animated.timing(flame2, { toValue: 0.9, duration: 160, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(flame3, { toValue: 0.9, duration: 170, useNativeDriver: true }),
        Animated.timing(flame3, { toValue: 0.5, duration: 190, useNativeDriver: true }),
        Animated.timing(flame3, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.timing(flame3, { toValue: 0.7, duration: 180, useNativeDriver: true }),
      ])
    ).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Rising embers
    const animateEmber = (y: Animated.Value, opacity: Animated.Value, duration: number, delay: number) => {
      setTimeout(() => {
        Animated.loop(
          Animated.parallel([
            Animated.timing(y, { toValue: -50 * scale, duration, useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(opacity, { toValue: 1, duration: duration * 0.2, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 0, duration: duration * 0.8, useNativeDriver: true }),
            ]),
          ])
        ).start();
      }, delay);
    };

    animateEmber(ember1Y, ember1Opacity, 2000, 0);
    animateEmber(ember2Y, ember2Opacity, 2500, 700);
    animateEmber(ember3Y, ember3Opacity, 1800, 1400);
    animateEmber(ember4Y, ember4Opacity, 2200, 400);

    // Smoke
    if (showSmoke) {
      Animated.loop(
        Animated.timing(smoke1, { toValue: 1, duration: 3500, useNativeDriver: true })
      ).start();
      setTimeout(() => {
        Animated.loop(
          Animated.timing(smoke2, { toValue: 1, duration: 4000, useNativeDriver: true })
        ).start();
      }, 1500);
    }
  }, []);

  return (
    <View style={{ width: 80 * scale, height: 90 * scale }}>
      {/* Ground glow */}
      <Animated.View style={{
        position: "absolute",
        bottom: 8 * scale,
        left: 10 * scale,
        width: 60 * scale,
        height: 20 * scale,
        backgroundColor: "#FF6B35",
        borderRadius: 30 * scale,
        opacity: glow,
      }} />

      {/* Smoke wisps */}
      {showSmoke && (
        <>
          <Animated.View style={{
            position: "absolute",
            left: 35 * scale,
            top: 10 * scale,
            width: 8 * scale,
            height: 8 * scale,
            backgroundColor: "#4A4A52",
            borderRadius: 4 * scale,
            opacity: smoke1.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0, 0.4, 0.2, 0] }),
            transform: [
              { translateY: smoke1.interpolate({ inputRange: [0, 1], outputRange: [20 * scale, -30 * scale] }) },
              { translateX: smoke1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 8 * scale, 5 * scale] }) },
              { scale: smoke1.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.5] }) },
            ],
          }} />
          <Animated.View style={{
            position: "absolute",
            left: 40 * scale,
            top: 15 * scale,
            width: 6 * scale,
            height: 6 * scale,
            backgroundColor: "#3A3A42",
            borderRadius: 3 * scale,
            opacity: smoke2.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0, 0.3, 0.15, 0] }),
            transform: [
              { translateY: smoke2.interpolate({ inputRange: [0, 1], outputRange: [15 * scale, -35 * scale] }) },
              { translateX: smoke2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -6 * scale, -3 * scale] }) },
              { scale: smoke2.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.8] }) },
            ],
          }} />
        </>
      )}

      {/* Rising embers - more of them! */}
      <Animated.View style={{
        position: "absolute",
        left: 28 * scale,
        bottom: 45 * scale,
        width: 3 * scale,
        height: 3 * scale,
        backgroundColor: "#FFD93D",
        borderRadius: 1.5 * scale,
        opacity: ember1Opacity,
        transform: [{ translateY: ember1Y }, { translateX: ember1Y.interpolate({ inputRange: [-50, 0], outputRange: [12, 0] }) }],
      }} />
      <Animated.View style={{
        position: "absolute",
        left: 48 * scale,
        bottom: 48 * scale,
        width: 2.5 * scale,
        height: 2.5 * scale,
        backgroundColor: "#FF9F1C",
        borderRadius: 1.25 * scale,
        opacity: ember2Opacity,
        transform: [{ translateY: ember2Y }, { translateX: ember2Y.interpolate({ inputRange: [-50, 0], outputRange: [-10, 0] }) }],
      }} />
      <Animated.View style={{
        position: "absolute",
        left: 38 * scale,
        bottom: 42 * scale,
        width: 2 * scale,
        height: 2 * scale,
        backgroundColor: "#FFFEF0",
        borderRadius: 1 * scale,
        opacity: ember3Opacity,
        transform: [{ translateY: ember3Y }, { translateX: ember3Y.interpolate({ inputRange: [-50, 0], outputRange: [8, 0] }) }],
      }} />
      <Animated.View style={{
        position: "absolute",
        left: 42 * scale,
        bottom: 50 * scale,
        width: 2 * scale,
        height: 2 * scale,
        backgroundColor: "#FFD93D",
        borderRadius: 1 * scale,
        opacity: ember4Opacity,
        transform: [{ translateY: ember4Y }, { translateX: ember4Y.interpolate({ inputRange: [-50, 0], outputRange: [-6, 0] }) }],
      }} />

      {/* Main flames - layered from red tips to white core */}
      {/* Center flame (tallest) */}
      <Animated.View style={{
        position: "absolute",
        bottom: 22 * scale,
        left: 28 * scale,
        width: 24 * scale,
        height: 50 * scale,
        transform: [{ scaleY: flame1.interpolate({ inputRange: [0.5, 1], outputRange: [0.85, 1.1] }) }],
      }}>
        {/* Outer red tips */}
        <View style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "100%",
          backgroundColor: "#CC2200",
          borderTopLeftRadius: 12 * scale,
          borderTopRightRadius: 12 * scale,
          borderBottomLeftRadius: 6 * scale,
          borderBottomRightRadius: 6 * scale,
        }} />
        {/* Orange layer */}
        <View style={{
          position: "absolute",
          bottom: 2 * scale,
          left: 3 * scale,
          right: 3 * scale,
          height: "85%",
          backgroundColor: "#FF6B35",
          borderTopLeftRadius: 9 * scale,
          borderTopRightRadius: 9 * scale,
          borderBottomLeftRadius: 4 * scale,
          borderBottomRightRadius: 4 * scale,
        }} />
        {/* Yellow layer */}
        <View style={{
          position: "absolute",
          bottom: 4 * scale,
          left: 5 * scale,
          right: 5 * scale,
          height: "65%",
          backgroundColor: "#FFD93D",
          borderTopLeftRadius: 7 * scale,
          borderTopRightRadius: 7 * scale,
          borderBottomLeftRadius: 3 * scale,
          borderBottomRightRadius: 3 * scale,
        }} />
        {/* Core white-hot */}
        <View style={{
          position: "absolute",
          bottom: 6 * scale,
          left: 8 * scale,
          right: 8 * scale,
          height: "40%",
          backgroundColor: "#FFFEF0",
          borderTopLeftRadius: 4 * scale,
          borderTopRightRadius: 4 * scale,
          borderBottomLeftRadius: 2 * scale,
          borderBottomRightRadius: 2 * scale,
        }} />
      </Animated.View>

      {/* Left flame */}
      <Animated.View style={{
        position: "absolute",
        bottom: 22 * scale,
        left: 16 * scale,
        width: 16 * scale,
        height: 35 * scale,
        transform: [
          { scaleY: flame2.interpolate({ inputRange: [0.5, 1], outputRange: [0.8, 1.05] }) },
          { rotate: "-15deg" },
        ],
      }}>
        <View style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "100%",
          backgroundColor: "#B81C00",
          borderTopLeftRadius: 8 * scale,
          borderTopRightRadius: 8 * scale,
          borderBottomLeftRadius: 4 * scale,
          borderBottomRightRadius: 4 * scale,
        }} />
        <View style={{
          position: "absolute",
          bottom: 2 * scale,
          left: 2 * scale,
          right: 2 * scale,
          height: "80%",
          backgroundColor: "#E63600",
          borderTopLeftRadius: 6 * scale,
          borderTopRightRadius: 6 * scale,
          borderBottomLeftRadius: 3 * scale,
          borderBottomRightRadius: 3 * scale,
        }} />
        <View style={{
          position: "absolute",
          bottom: 4 * scale,
          left: 4 * scale,
          right: 4 * scale,
          height: "55%",
          backgroundColor: "#FF9F1C",
          borderTopLeftRadius: 4 * scale,
          borderTopRightRadius: 4 * scale,
        }} />
      </Animated.View>

      {/* Right flame */}
      <Animated.View style={{
        position: "absolute",
        bottom: 22 * scale,
        right: 16 * scale,
        width: 16 * scale,
        height: 32 * scale,
        transform: [
          { scaleY: flame3.interpolate({ inputRange: [0.5, 1], outputRange: [0.75, 1] }) },
          { rotate: "12deg" },
        ],
      }}>
        <View style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "100%",
          backgroundColor: "#A31800",
          borderTopLeftRadius: 8 * scale,
          borderTopRightRadius: 8 * scale,
          borderBottomLeftRadius: 4 * scale,
          borderBottomRightRadius: 4 * scale,
        }} />
        <View style={{
          position: "absolute",
          bottom: 2 * scale,
          left: 2 * scale,
          right: 2 * scale,
          height: "75%",
          backgroundColor: "#CC2200",
          borderTopLeftRadius: 6 * scale,
          borderTopRightRadius: 6 * scale,
          borderBottomLeftRadius: 3 * scale,
          borderBottomRightRadius: 3 * scale,
        }} />
        <View style={{
          position: "absolute",
          bottom: 4 * scale,
          left: 4 * scale,
          right: 4 * scale,
          height: "50%",
          backgroundColor: "#FF6B35",
          borderTopLeftRadius: 4 * scale,
          borderTopRightRadius: 4 * scale,
        }} />
      </Animated.View>

      {/* Stone ring base - circular arrangement */}
      {/* Back stones */}
      <View style={{
        position: "absolute",
        bottom: 10 * scale,
        left: 8 * scale,
        width: 14 * scale,
        height: 12 * scale,
        backgroundColor: "#5A5A62",
        borderRadius: 6 * scale,
      }}>
        <View style={{
          position: "absolute",
          top: 2 * scale,
          left: 3 * scale,
          width: 5 * scale,
          height: 3 * scale,
          backgroundColor: "#7A7A82",
          borderRadius: 2 * scale,
        }} />
      </View>
      <View style={{
        position: "absolute",
        bottom: 12 * scale,
        left: 20 * scale,
        width: 12 * scale,
        height: 10 * scale,
        backgroundColor: "#4A4A52",
        borderRadius: 5 * scale,
      }} />
      <View style={{
        position: "absolute",
        bottom: 12 * scale,
        right: 20 * scale,
        width: 12 * scale,
        height: 10 * scale,
        backgroundColor: "#4A4A52",
        borderRadius: 5 * scale,
      }} />
      <View style={{
        position: "absolute",
        bottom: 10 * scale,
        right: 8 * scale,
        width: 14 * scale,
        height: 12 * scale,
        backgroundColor: "#5A5A62",
        borderRadius: 6 * scale,
      }}>
        <View style={{
          position: "absolute",
          top: 2 * scale,
          right: 3 * scale,
          width: 5 * scale,
          height: 3 * scale,
          backgroundColor: "#7A7A82",
          borderRadius: 2 * scale,
        }} />
      </View>

      {/* Front stones */}
      <View style={{
        position: "absolute",
        bottom: 2 * scale,
        left: 4 * scale,
        width: 13 * scale,
        height: 11 * scale,
        backgroundColor: "#6B6B73",
        borderRadius: 5 * scale,
      }}>
        <View style={{
          position: "absolute",
          top: 2 * scale,
          left: 2 * scale,
          width: 4 * scale,
          height: 3 * scale,
          backgroundColor: "#8A8A92",
          borderRadius: 2 * scale,
        }} />
      </View>
      <View style={{
        position: "absolute",
        bottom: 0,
        left: 15 * scale,
        width: 11 * scale,
        height: 9 * scale,
        backgroundColor: "#5A5A62",
        borderRadius: 4 * scale,
      }} />
      <View style={{
        position: "absolute",
        bottom: 0,
        left: "50%",
        marginLeft: -6 * scale,
        width: 12 * scale,
        height: 8 * scale,
        backgroundColor: "#6B6B73",
        borderRadius: 4 * scale,
      }}>
        <View style={{
          position: "absolute",
          top: 1 * scale,
          left: 3 * scale,
          width: 4 * scale,
          height: 2 * scale,
          backgroundColor: "#8A8A92",
          borderRadius: 1 * scale,
        }} />
      </View>
      <View style={{
        position: "absolute",
        bottom: 0,
        right: 15 * scale,
        width: 11 * scale,
        height: 9 * scale,
        backgroundColor: "#5A5A62",
        borderRadius: 4 * scale,
      }} />
      <View style={{
        position: "absolute",
        bottom: 2 * scale,
        right: 4 * scale,
        width: 13 * scale,
        height: 11 * scale,
        backgroundColor: "#6B6B73",
        borderRadius: 5 * scale,
      }}>
        <View style={{
          position: "absolute",
          top: 2 * scale,
          right: 2 * scale,
          width: 4 * scale,
          height: 3 * scale,
          backgroundColor: "#8A8A92",
          borderRadius: 2 * scale,
        }} />
      </View>

      {/* Crossed logs */}
      {/* Log going left to right */}
      <View style={{
        position: "absolute",
        bottom: 10 * scale,
        left: 10 * scale,
        width: 60 * scale,
        height: 10 * scale,
        backgroundColor: "#5C3D2E",
        borderRadius: 5 * scale,
        transform: [{ rotate: "-15deg" }],
      }}>
        <View style={{
          position: "absolute",
          top: 2 * scale,
          left: 8 * scale,
          width: 18 * scale,
          height: 2 * scale,
          backgroundColor: "#7B5B3A",
          borderRadius: 1 * scale,
        }} />
        <View style={{
          position: "absolute",
          top: 3 * scale,
          right: 12 * scale,
          width: 10 * scale,
          height: 4 * scale,
          backgroundColor: "#2A1810",
          borderRadius: 2 * scale,
        }} />
      </View>
      {/* Log going right to left */}
      <View style={{
        position: "absolute",
        bottom: 10 * scale,
        left: 10 * scale,
        width: 60 * scale,
        height: 10 * scale,
        backgroundColor: "#4A3020",
        borderRadius: 5 * scale,
        transform: [{ rotate: "15deg" }],
      }}>
        <View style={{
          position: "absolute",
          top: 2 * scale,
          right: 10 * scale,
          width: 15 * scale,
          height: 2 * scale,
          backgroundColor: "#6B5030",
          borderRadius: 1 * scale,
        }} />
        <View style={{
          position: "absolute",
          top: 4 * scale,
          left: 15 * scale,
          width: 8 * scale,
          height: 3 * scale,
          backgroundColor: "#1A0F08",
          borderRadius: 2 * scale,
        }} />
      </View>
    </View>
  );
}

// ===== PINE TREE =====
// Layered evergreen with depth and character
interface PineTreeProps {
  height?: number;
  shade?: number; // 0-3 for depth (0 = farthest/darkest)
  snowCapped?: boolean;
}

export function DetailedPineTree({ height = 100, shade = 2, snowCapped = false }: PineTreeProps) {
  const scale = height / 100;

  // Color palettes for different depths
  const palettes = [
    { dark: "#0D3D0D", mid: "#1A4D1A", light: "#2D5B2D" }, // Far (darkest)
    { dark: "#143D14", mid: "#1F5F1F", light: "#2D7B2D" }, // Mid-far
    { dark: "#1A4A1A", mid: "#257025", light: "#3D9B3D" }, // Mid
    { dark: "#1F5F1F", mid: "#2D8B2D", light: "#45B045" }, // Near (brightest)
  ];

  const colors = palettes[Math.min(shade, 3)];
  const trunkColor = { dark: "#2A1810", mid: "#4A3020", light: "#5C4030" };

  return (
    <View style={{ width: 60 * scale, height: 100 * scale, alignItems: "center" }}>
      {/* Snow cap */}
      {snowCapped && (
        <View style={{
          position: "absolute",
          top: 0,
          left: "50%",
          marginLeft: -8 * scale,
          width: 16 * scale,
          height: 10 * scale,
          backgroundColor: "#FFFFFF",
          borderRadius: 8 * scale,
          zIndex: 10,
        }} />
      )}

      {/* Top tier - smallest triangle */}
      <View style={{
        width: 0,
        height: 0,
        borderLeftWidth: 15 * scale,
        borderRightWidth: 15 * scale,
        borderBottomWidth: 25 * scale,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: colors.mid,
        marginBottom: -8 * scale,
      }}>
        {/* Highlight on left side */}
        <View style={{
          position: "absolute",
          left: -12 * scale,
          top: 8 * scale,
          width: 8 * scale,
          height: 12 * scale,
          backgroundColor: colors.light,
          borderTopLeftRadius: 4 * scale,
          borderBottomLeftRadius: 4 * scale,
        }} />
        {/* Shadow on right */}
        <View style={{
          position: "absolute",
          right: -12 * scale,
          top: 10 * scale,
          width: 6 * scale,
          height: 10 * scale,
          backgroundColor: colors.dark,
          borderTopRightRadius: 3 * scale,
          borderBottomRightRadius: 3 * scale,
        }} />
      </View>

      {/* Middle tier */}
      <View style={{
        width: 0,
        height: 0,
        borderLeftWidth: 22 * scale,
        borderRightWidth: 22 * scale,
        borderBottomWidth: 30 * scale,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: colors.mid,
        marginBottom: -10 * scale,
      }}>
        <View style={{
          position: "absolute",
          left: -18 * scale,
          top: 10 * scale,
          width: 12 * scale,
          height: 15 * scale,
          backgroundColor: colors.light,
          borderTopLeftRadius: 6 * scale,
          borderBottomLeftRadius: 6 * scale,
        }} />
        <View style={{
          position: "absolute",
          right: -18 * scale,
          top: 12 * scale,
          width: 10 * scale,
          height: 14 * scale,
          backgroundColor: colors.dark,
          borderTopRightRadius: 5 * scale,
          borderBottomRightRadius: 5 * scale,
        }} />
      </View>

      {/* Bottom tier - largest */}
      <View style={{
        width: 0,
        height: 0,
        borderLeftWidth: 30 * scale,
        borderRightWidth: 30 * scale,
        borderBottomWidth: 35 * scale,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: colors.mid,
      }}>
        <View style={{
          position: "absolute",
          left: -25 * scale,
          top: 12 * scale,
          width: 16 * scale,
          height: 18 * scale,
          backgroundColor: colors.light,
          borderTopLeftRadius: 8 * scale,
          borderBottomLeftRadius: 8 * scale,
        }} />
        <View style={{
          position: "absolute",
          right: -25 * scale,
          top: 15 * scale,
          width: 14 * scale,
          height: 16 * scale,
          backgroundColor: colors.dark,
          borderTopRightRadius: 7 * scale,
          borderBottomRightRadius: 7 * scale,
        }} />
      </View>

      {/* Trunk */}
      <View style={{
        width: 12 * scale,
        height: 18 * scale,
        backgroundColor: trunkColor.mid,
        borderBottomLeftRadius: 3 * scale,
        borderBottomRightRadius: 3 * scale,
        marginTop: -2 * scale,
      }}>
        {/* Trunk highlight */}
        <View style={{
          position: "absolute",
          left: 1 * scale,
          top: 2 * scale,
          width: 4 * scale,
          height: 12 * scale,
          backgroundColor: trunkColor.light,
          borderRadius: 2 * scale,
        }} />
        {/* Trunk shadow */}
        <View style={{
          position: "absolute",
          right: 1 * scale,
          top: 4 * scale,
          width: 3 * scale,
          height: 10 * scale,
          backgroundColor: trunkColor.dark,
          borderRadius: 1.5 * scale,
        }} />
      </View>
    </View>
  );
}

// ===== GRASS TUFT =====
interface GrassProps {
  size?: number;
  variant?: number;
}

export function DetailedGrass({ size = 40, variant = 0 }: GrassProps) {
  const scale = size / 40;

  const colors = {
    light: "#5DD55D",
    mid: "#3DB83D",
    dark: "#228B22",
    shadow: "#1A6B1A",
  };

  // Different blade configurations
  const blades = [
    // Variant 0
    [
      { x: 4, h: 18, color: colors.dark, width: 3 },
      { x: 10, h: 22, color: colors.mid, width: 3 },
      { x: 16, h: 15, color: colors.shadow, width: 2 },
      { x: 22, h: 20, color: colors.light, width: 3 },
      { x: 28, h: 16, color: colors.mid, width: 2 },
      { x: 33, h: 12, color: colors.dark, width: 2 },
    ],
    // Variant 1
    [
      { x: 6, h: 14, color: colors.mid, width: 3 },
      { x: 14, h: 24, color: colors.dark, width: 3 },
      { x: 22, h: 18, color: colors.light, width: 3 },
      { x: 30, h: 20, color: colors.shadow, width: 2 },
    ],
    // Variant 2
    [
      { x: 3, h: 16, color: colors.shadow, width: 2 },
      { x: 10, h: 22, color: colors.mid, width: 3 },
      { x: 18, h: 14, color: colors.light, width: 2 },
      { x: 24, h: 20, color: colors.dark, width: 3 },
      { x: 32, h: 18, color: colors.mid, width: 2 },
    ],
  ];

  const currentBlades = blades[variant % blades.length];

  return (
    <View style={{ width: 40 * scale, height: 25 * scale, alignItems: "center", justifyContent: "flex-end" }}>
      {currentBlades.map((blade, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            bottom: 0,
            left: blade.x * scale,
            width: blade.width * scale,
            height: blade.h * scale,
            backgroundColor: blade.color,
            borderTopLeftRadius: blade.width * scale * 0.5,
            borderTopRightRadius: blade.width * scale * 0.5,
            transform: [{ rotate: `${(i % 2 === 0 ? -1 : 1) * (3 + i * 2)}deg` }],
          }}
        />
      ))}
    </View>
  );
}

// ===== SMALL FIRE ICON =====
// Pixel art campfire with stone ring, crossed logs, and layered flames
export function SmallFireIcon({ size = 24 }: { size?: number }) {
  const scale = size / 24;

  return (
    <View style={{ width: 28 * scale, height: 32 * scale, alignItems: "center", justifyContent: "flex-end" }}>
      {/* Stone ring - circular arrangement */}
      {/* Left stones */}
      <View style={{
        position: "absolute",
        bottom: 0,
        left: 1 * scale,
        width: 5 * scale,
        height: 5 * scale,
        backgroundColor: "#6B6B73",
        borderRadius: 2 * scale,
      }} />
      <View style={{
        position: "absolute",
        bottom: 3 * scale,
        left: 0,
        width: 4 * scale,
        height: 4 * scale,
        backgroundColor: "#5A5A62",
        borderRadius: 2 * scale,
      }} />
      {/* Right stones */}
      <View style={{
        position: "absolute",
        bottom: 0,
        right: 1 * scale,
        width: 5 * scale,
        height: 5 * scale,
        backgroundColor: "#6B6B73",
        borderRadius: 2 * scale,
      }} />
      <View style={{
        position: "absolute",
        bottom: 3 * scale,
        right: 0,
        width: 4 * scale,
        height: 4 * scale,
        backgroundColor: "#5A5A62",
        borderRadius: 2 * scale,
      }} />
      {/* Front stone */}
      <View style={{
        position: "absolute",
        bottom: 0,
        left: "50%",
        marginLeft: -3 * scale,
        width: 6 * scale,
        height: 4 * scale,
        backgroundColor: "#7A7A82",
        borderRadius: 2 * scale,
      }} />

      {/* Crossed logs */}
      <View style={{
        position: "absolute",
        bottom: 4 * scale,
        left: 4 * scale,
        width: 20 * scale,
        height: 4 * scale,
        backgroundColor: "#5C3D2E",
        borderRadius: 2 * scale,
        transform: [{ rotate: "-25deg" }],
      }} />
      <View style={{
        position: "absolute",
        bottom: 4 * scale,
        left: 4 * scale,
        width: 20 * scale,
        height: 4 * scale,
        backgroundColor: "#4A3020",
        borderRadius: 2 * scale,
        transform: [{ rotate: "25deg" }],
      }} />

      {/* Flames - layered from red tips to white core */}
      {/* Outer red tips */}
      <View style={{
        position: "absolute",
        bottom: 7 * scale,
        left: "50%",
        marginLeft: -8 * scale,
        width: 16 * scale,
        height: 18 * scale,
        backgroundColor: "#CC2200",
        borderTopLeftRadius: 8 * scale,
        borderTopRightRadius: 8 * scale,
        borderBottomLeftRadius: 4 * scale,
        borderBottomRightRadius: 4 * scale,
      }} />
      {/* Orange layer */}
      <View style={{
        position: "absolute",
        bottom: 8 * scale,
        left: "50%",
        marginLeft: -6 * scale,
        width: 12 * scale,
        height: 14 * scale,
        backgroundColor: "#FF6B35",
        borderTopLeftRadius: 6 * scale,
        borderTopRightRadius: 6 * scale,
        borderBottomLeftRadius: 3 * scale,
        borderBottomRightRadius: 3 * scale,
      }} />
      {/* Yellow layer */}
      <View style={{
        position: "absolute",
        bottom: 9 * scale,
        left: "50%",
        marginLeft: -4 * scale,
        width: 8 * scale,
        height: 10 * scale,
        backgroundColor: "#FFD93D",
        borderTopLeftRadius: 4 * scale,
        borderTopRightRadius: 4 * scale,
        borderBottomLeftRadius: 2 * scale,
        borderBottomRightRadius: 2 * scale,
      }} />
      {/* White/bright core */}
      <View style={{
        position: "absolute",
        bottom: 10 * scale,
        left: "50%",
        marginLeft: -2 * scale,
        width: 4 * scale,
        height: 5 * scale,
        backgroundColor: "#FFFEF0",
        borderTopLeftRadius: 2 * scale,
        borderTopRightRadius: 2 * scale,
        borderBottomLeftRadius: 1 * scale,
        borderBottomRightRadius: 1 * scale,
      }} />

      {/* Ember sparks */}
      <View style={{
        position: "absolute",
        bottom: 22 * scale,
        left: 8 * scale,
        width: 2 * scale,
        height: 2 * scale,
        backgroundColor: "#FFD93D",
        borderRadius: 1 * scale,
      }} />
      <View style={{
        position: "absolute",
        bottom: 25 * scale,
        right: 9 * scale,
        width: 2 * scale,
        height: 2 * scale,
        backgroundColor: "#FF9F1C",
        borderRadius: 1 * scale,
      }} />
    </View>
  );
}

export default {
  DetailedCampfire,
  DetailedPineTree,
  DetailedGrass,
  SmallFireIcon,
};
