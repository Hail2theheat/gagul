// WeatherBackground - beautiful night sky with stars, moon, trees, owl and grass

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { CampfireColors } from '../constants/theme';
import { SwayingTree } from './sky/SwayingTree';
import { DetailedPineTree } from './PixelArt';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const BG = CampfireColors.BG;

interface WeatherBackgroundProps {
  children?: React.ReactNode;
}

// Pixel art star with twinkle - multiple sizes and colors
function PixelStar({ x, y, size, delay, color = "#FFF" }: { x: number; y: number; size: number; delay: number; color?: string }) {
  const opacity = useRef(new Animated.Value(0.2)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(opacity, { toValue: 1, duration: 600 + Math.random() * 400, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.2, duration: 600 + Math.random() * 400, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.3, duration: 600, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };
    const timer = setTimeout(animate, delay);
    return () => clearTimeout(timer);
  }, []);

  // Cross-shaped star for larger sizes
  if (size >= 3) {
    return (
      <Animated.View style={{ position: "absolute", left: x, top: y, opacity, transform: [{ scale }] }}>
        <View style={{ width: size, height: size, backgroundColor: color, position: "absolute" }} />
        <View style={{ width: size * 0.6, height: size * 0.6, backgroundColor: color, position: "absolute", top: -size * 0.5, left: size * 0.2 }} />
        <View style={{ width: size * 0.6, height: size * 0.6, backgroundColor: color, position: "absolute", bottom: -size * 0.5, left: size * 0.2 }} />
        <View style={{ width: size * 0.6, height: size * 0.6, backgroundColor: color, position: "absolute", left: -size * 0.5, top: size * 0.2 }} />
        <View style={{ width: size * 0.6, height: size * 0.6, backgroundColor: color, position: "absolute", right: -size * 0.5, top: size * 0.2 }} />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: size / 2,
        opacity,
        transform: [{ scale }],
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: size * 3,
      }}
    />
  );
}

// Shooting star with trail
function ShootingStar({ delay }: { delay: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);
  const startY = useRef(30 + Math.random() * 120).current;
  const startX = useRef(30 + Math.random() * (SCREEN_WIDTH * 0.6)).current;
  const length = useRef(80 + Math.random() * 60).current;

  useEffect(() => {
    const animate = () => {
      setVisible(true);
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 800 + Math.random() * 400,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
        setTimeout(animate, 4000 + Math.random() * 8000);
      });
    };
    const timer = setTimeout(animate, delay);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <View style={{ position: "absolute", left: startX, top: startY }}>
      <Animated.View
        style={{
          position: "absolute",
          width: length,
          height: 2,
          backgroundColor: "transparent",
          opacity: progress.interpolate({
            inputRange: [0, 0.3, 0.7, 1],
            outputRange: [0, 0.8, 0.6, 0],
          }),
          transform: [
            { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 120] }) },
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 80] }) },
            { rotate: "35deg" },
          ],
        }}
      >
        <View style={{ position: "absolute", right: 0, width: "100%", height: 2, backgroundColor: "#FFF", opacity: 0.3 }} />
        <View style={{ position: "absolute", right: 0, width: "60%", height: 2, backgroundColor: "#FFF", opacity: 0.5 }} />
        <View style={{ position: "absolute", right: 0, width: "30%", height: 2, backgroundColor: "#FFF", opacity: 0.8 }} />
      </Animated.View>
      <Animated.View
        style={{
          width: 4,
          height: 4,
          backgroundColor: "#FFF",
          borderRadius: 2,
          opacity: progress.interpolate({
            inputRange: [0, 0.1, 0.8, 1],
            outputRange: [0, 1, 1, 0],
          }),
          transform: [
            { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 120 + length] }) },
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 80] }) },
          ],
        }}
      />
    </View>
  );
}

// Pixel moon with craters
function PixelMoon() {
  return (
    <View style={{
      position: "absolute",
      top: 90,
      right: 25,
      width: 55,
      height: 55,
      backgroundColor: "#FEF3C7",
      borderRadius: 27.5,
      shadowColor: "#FEF3C7",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 25,
      zIndex: 5,
    }}>
      <View style={{ position: "absolute", top: 12, left: 10, width: 10, height: 10, backgroundColor: "#E5DDB3", borderRadius: 5 }} />
      <View style={{ position: "absolute", top: 30, left: 28, width: 8, height: 8, backgroundColor: "#E5DDB3", borderRadius: 4 }} />
      <View style={{ position: "absolute", top: 18, left: 35, width: 6, height: 6, backgroundColor: "#E5DDB3", borderRadius: 3 }} />
      <View style={{ position: "absolute", top: 38, left: 12, width: 5, height: 5, backgroundColor: "#E5DDB3", borderRadius: 2.5 }} />
    </View>
  );
}

// Cute pixel owl that roosts in trees
function PixelOwl({ x, y }: { x: number; y: number }) {
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start(() => {
        setIsBlinking(false);
        setTimeout(blink, 2000 + Math.random() * 4000);
      });
    };
    const timer = setTimeout(blink, 1000 + Math.random() * 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ position: "absolute", left: x, top: y, width: 20, height: 24, zIndex: 50 }}>
      {/* Body */}
      <View style={{ position: "absolute", bottom: 0, left: 2, width: 16, height: 16, backgroundColor: "#5C4033", borderRadius: 8 }} />
      {/* Head */}
      <View style={{ position: "absolute", top: 0, left: 0, width: 20, height: 14, backgroundColor: "#6B4423", borderRadius: 10 }} />
      {/* Ear tufts */}
      <View style={{ position: "absolute", top: -3, left: 2, width: 4, height: 6, backgroundColor: "#5C4033", borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
      <View style={{ position: "absolute", top: -3, right: 2, width: 4, height: 6, backgroundColor: "#5C4033", borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
      {/* Eyes */}
      <Animated.View style={{ position: "absolute", top: 4, left: 3, width: 6, height: 6, backgroundColor: "#FFD700", borderRadius: 3, opacity: blinkAnim }}>
        <View style={{ position: "absolute", top: 1, left: 2, width: 3, height: 3, backgroundColor: "#000", borderRadius: 1.5 }} />
      </Animated.View>
      <Animated.View style={{ position: "absolute", top: 4, right: 3, width: 6, height: 6, backgroundColor: "#FFD700", borderRadius: 3, opacity: blinkAnim }}>
        <View style={{ position: "absolute", top: 1, left: 2, width: 3, height: 3, backgroundColor: "#000", borderRadius: 1.5 }} />
      </Animated.View>
      {/* Beak */}
      <View style={{ position: "absolute", top: 8, left: 8, width: 4, height: 4, backgroundColor: "#FF8C00", borderRadius: 2 }} />
      {/* Chest pattern */}
      <View style={{ position: "absolute", bottom: 2, left: 5, width: 10, height: 8, backgroundColor: "#D2B48C", borderRadius: 5 }} />
    </View>
  );
}

// Owl that flies in and roosts
function RoostingOwl({ treeX, treeHeight }: { treeX: number; treeHeight: number }) {
  const [visible, setVisible] = useState(false);
  const flyAnim = useRef(new Animated.Value(-50)).current;
  const flapAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showOwl = () => {
      setVisible(true);
      flyAnim.setValue(-50);

      // Flapping animation
      const flap = Animated.loop(
        Animated.sequence([
          Animated.timing(flapAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(flapAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        ])
      );
      flap.start();

      // Fly to tree
      Animated.timing(flyAnim, {
        toValue: treeX + 15,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        flap.stop();
        // Stay for a while then leave
        setTimeout(() => {
          Animated.timing(flyAnim, {
            toValue: SCREEN_WIDTH + 50,
            duration: 2000,
            useNativeDriver: true,
          }).start(() => {
            setVisible(false);
            // Come back after a while
            setTimeout(showOwl, 15000 + Math.random() * 30000);
          });
        }, 8000 + Math.random() * 12000);
      });
    };

    const timer = setTimeout(showOwl, 5000 + Math.random() * 10000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const roostY = SCREEN_HEIGHT - treeHeight - 50;

  return (
    <Animated.View style={{
      position: "absolute",
      top: roostY,
      left: 0,
      transform: [{ translateX: flyAnim }],
      zIndex: 55,
    }}>
      <PixelOwl x={0} y={0} />
    </Animated.View>
  );
}

// Detailed pine tree
function PineTree({ height, x, shade }: { height: number; x: number; shade: number }) {
  const scale = height / 100;

  const palettes = [
    { dark: "#0A2E0A", mid: "#0F3D0F", light: "#1A4D1A" },
    { dark: "#0D350D", mid: "#144514", light: "#1F5F1F" },
    { dark: "#103D10", mid: "#1A4D1A", light: "#257025" },
    { dark: "#144514", mid: "#1F5F1F", light: "#2D7B2D" },
  ];

  const colors = palettes[Math.min(shade, 3)];

  return (
    <View style={{ position: "absolute", left: x, bottom: 25, width: 60 * scale, height: 100 * scale, alignItems: "center", zIndex: 10 }}>
      {/* Top tier */}
      <View style={{
        width: 0, height: 0,
        borderLeftWidth: 12 * scale, borderRightWidth: 12 * scale, borderBottomWidth: 22 * scale,
        borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: colors.light,
        marginBottom: -6 * scale,
      }} />
      {/* Second tier */}
      <View style={{
        width: 0, height: 0,
        borderLeftWidth: 18 * scale, borderRightWidth: 18 * scale, borderBottomWidth: 26 * scale,
        borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: colors.mid,
        marginBottom: -8 * scale,
      }} />
      {/* Third tier */}
      <View style={{
        width: 0, height: 0,
        borderLeftWidth: 24 * scale, borderRightWidth: 24 * scale, borderBottomWidth: 30 * scale,
        borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: colors.mid,
        marginBottom: -10 * scale,
      }} />
      {/* Bottom tier */}
      <View style={{
        width: 0, height: 0,
        borderLeftWidth: 30 * scale, borderRightWidth: 30 * scale, borderBottomWidth: 35 * scale,
        borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: colors.dark,
      }} />
      {/* Trunk */}
      <View style={{
        width: 12 * scale, height: 18 * scale,
        backgroundColor: "#2A1810", marginTop: -2 * scale,
      }} />
    </View>
  );
}


export function WeatherBackground({ children }: WeatherBackgroundProps) {
  // Generate random stars with variety - go all the way down to tree tops
  const stars = useMemo(() => {
    const result = [];
    const starColors = ["#FFF", "#FFF", "#FFF", "#FFE4B5", "#ADD8E6", "#FFB6C1"];
    for (let i = 0; i < 40; i++) {
      result.push({
        x: Math.random() * SCREEN_WIDTH,
        y: Math.random() * (SCREEN_HEIGHT * 0.75), // Stars go down to 75% of screen (tree top level)
        size: Math.random() < 0.15 ? 3 + Math.random() * 2 : 1 + Math.random() * 2,
        delay: Math.random() * 3000,
        color: starColors[Math.floor(Math.random() * starColors.length)],
      });
    }
    return result;
  }, []);

  // Generate more trees at various positions - taller
  const trees = useMemo(() => {
    return [
      // Left side trees
      { x: -15, height: 130, shade: 0 },
      { x: 15, height: 160, shade: 1 },
      { x: 50, height: 110, shade: 0 },
      { x: 85, height: 145, shade: 2 },
      { x: 115, height: 95, shade: 0 },
      // Right side trees
      { x: SCREEN_WIDTH - 160, height: 100, shade: 0 },
      { x: SCREEN_WIDTH - 130, height: 155, shade: 1 },
      { x: SCREEN_WIDTH - 95, height: 125, shade: 2 },
      { x: SCREEN_WIDTH - 60, height: 170, shade: 1 },
      { x: SCREEN_WIDTH - 25, height: 140, shade: 0 },
    ];
  }, []);

  // Pick a random tree for the owl to roost in
  const owlTree = useMemo(() => {
    const tallTrees = trees.filter(t => t.height > 130);
    return tallTrees[Math.floor(Math.random() * tallTrees.length)] || trees[1];
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Moon */}
      <PixelMoon />

      {/* Stars */}
      {stars.map((star, i) => (
        <PixelStar key={i} x={star.x} y={star.y} size={star.size} delay={star.delay} color={star.color} />
      ))}

      {/* Shooting star */}
      <ShootingStar delay={4000} />

      {/* Trees */}
      {trees.map((tree, i) => (
        <View key={i} style={{ position: 'absolute', left: tree.x, bottom: 0, zIndex: 10 }}>
          <SwayingTree height={tree.height} shade={tree.shade} stagger={i * 0.05}>
            <DetailedPineTree height={tree.height} shade={tree.shade} />
          </SwayingTree>
        </View>
      ))}

      {/* Roosting owl */}
      <RoostingOwl treeX={owlTree.x} treeHeight={owlTree.height} />

      {/* Ground layers - DESIGN.md inspired: Clean depth-based layers */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 30,
        backgroundColor: CampfireColors.GROUND_DARK,
        zIndex: 85,
      }}>
        {/* Top grass layer - bright accent */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          backgroundColor: CampfireColors.GROUND_GRASS
        }} />
        {/* Moss/shadow layer - depth */}
        <View style={{
          position: 'absolute',
          top: 4,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: CampfireColors.GROUND_MOSS
        }} />
      </View>

      {/* Content */}
      {children}
    </View>
  );
}

export default WeatherBackground;
