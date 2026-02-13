// components/AnimatedLogo.tsx
import React, { useEffect, useRef, useMemo } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import Svg, { Rect } from "react-native-svg";

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

interface PixelRect {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

/** Shorthand rect builder */
const r = (x: number, y: number, w: number, h: number, color: string): PixelRect => ({
  x, y, w, h, color,
});

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------

const C = {
  flameOuter:  "#CC2200",
  flameOuter2: "#B81C00",
  flameMid:    "#FF6B35",
  flameInner:  "#FFD93D",
  flameCore:   "#FFFACD",
  logDark:     "#4A3020",
  logLight:    "#5C3D2E",
  coalBase:    "#2A1810",
  coalGlow1:   "#CC2200",
  coalGlow2:   "#FF4500",
  rock1:       "#4a4a52",
  rock2:       "#5a5a62",
  rock3:       "#6b6b73",
  glow:        "#FF6B35",
};

// ---------------------------------------------------------------------------
// Pixel data — 32×33 grid
// ---------------------------------------------------------------------------

const ROCK_PIXELS: PixelRect[] = [
  // Left rock cluster
  r(2, 29, 4, 3, C.rock1),
  r(3, 28, 3, 1, C.rock3),
  r(7, 30, 3, 3, C.rock2),
  r(7, 29, 2, 1, C.rock3),
  // Right rock cluster
  r(22, 30, 3, 3, C.rock2),
  r(23, 29, 2, 1, C.rock3),
  r(26, 29, 4, 3, C.rock1),
  r(27, 28, 3, 1, C.rock3),
];

const LOG_PIXELS: PixelRect[] = [
  // Left log (angled via stagger)
  r(6, 27, 3, 2, C.logLight),
  r(8, 26, 3, 2, C.logDark),
  r(10, 25, 3, 2, C.logLight),
  r(12, 24, 3, 2, C.logDark),
  r(14, 23, 2, 2, C.logLight),
  // Right log (angled via stagger)
  r(16, 23, 2, 2, C.logLight),
  r(18, 24, 3, 2, C.logDark),
  r(20, 25, 3, 2, C.logLight),
  r(22, 26, 3, 2, C.logDark),
  r(24, 27, 3, 2, C.logLight),
  // Cross log
  r(11, 26, 10, 2, C.logDark),
  r(12, 25, 8, 1, C.logLight),
];

const COAL_PIXELS: PixelRect[] = [
  r(10, 28, 12, 2, C.coalBase),
  r(12, 27, 8, 1, C.coalBase),
  // Glowing spots
  r(12, 28, 2, 1, C.coalGlow1),
  r(16, 28, 3, 1, C.coalGlow2),
  r(20, 28, 2, 1, C.coalGlow1),
  r(14, 29, 2, 1, C.coalGlow2),
  r(18, 29, 2, 1, C.coalGlow1),
];

const CENTER_FLAME_PIXELS: PixelRect[] = [
  // Tapered top (narrowest)
  r(15, 5, 2, 1, C.flameOuter),
  r(15, 6, 2, 1, C.flameOuter2),
  // Widening
  r(14, 7, 4, 1, C.flameOuter),
  r(14, 8, 4, 1, C.flameOuter2),
  r(13, 9, 6, 1, C.flameOuter),
  r(13, 10, 6, 1, C.flameOuter),
  r(12, 11, 8, 1, C.flameOuter2),
  r(12, 12, 8, 1, C.flameOuter),
  r(11, 13, 10, 1, C.flameOuter),
  r(11, 14, 10, 1, C.flameOuter2),
  r(10, 15, 12, 1, C.flameOuter),
  r(10, 16, 12, 1, C.flameOuter),
  r(10, 17, 12, 1, C.flameOuter2),
  r(9, 18, 14, 1, C.flameOuter),
  r(9, 19, 14, 1, C.flameOuter),
  r(9, 20, 14, 1, C.flameOuter2),
  r(9, 21, 14, 1, C.flameOuter),
  r(9, 22, 14, 1, C.flameOuter),
  r(10, 23, 12, 1, C.flameOuter2),
];

const LEFT_TONGUE_PIXELS: PixelRect[] = [
  r(7, 14, 2, 1, C.flameOuter),
  r(7, 15, 3, 1, C.flameOuter2),
  r(6, 16, 4, 1, C.flameOuter),
  r(6, 17, 4, 1, C.flameOuter),
  r(7, 18, 3, 1, C.flameOuter2),
  r(7, 19, 2, 1, C.flameOuter),
  r(8, 20, 2, 1, C.flameOuter2),
];

const RIGHT_TONGUE_PIXELS: PixelRect[] = [
  r(23, 15, 2, 1, C.flameOuter),
  r(23, 16, 3, 1, C.flameOuter2),
  r(23, 17, 4, 1, C.flameOuter),
  r(22, 18, 4, 1, C.flameOuter),
  r(22, 19, 3, 1, C.flameOuter2),
  r(23, 20, 2, 1, C.flameOuter),
  r(23, 21, 2, 1, C.flameOuter2),
];

const INNER_FLAME_PIXELS: PixelRect[] = [
  r(15, 9, 2, 1, C.flameMid),
  r(14, 10, 4, 1, C.flameMid),
  r(14, 11, 4, 1, C.flameMid),
  r(13, 12, 6, 1, C.flameMid),
  r(13, 13, 6, 1, C.flameMid),
  r(12, 14, 8, 1, C.flameMid),
  r(12, 15, 8, 1, C.flameMid),
  r(12, 16, 8, 1, C.flameMid),
  r(11, 17, 10, 1, C.flameMid),
  r(11, 18, 10, 1, C.flameMid),
  r(11, 19, 10, 1, C.flameMid),
  r(12, 20, 8, 1, C.flameMid),
  r(12, 21, 8, 1, C.flameMid),
];

const CORE_PIXELS: PixelRect[] = [
  r(15, 13, 2, 1, C.flameInner),
  r(14, 14, 4, 1, C.flameInner),
  r(14, 15, 4, 1, C.flameCore),
  r(13, 16, 6, 1, C.flameInner),
  r(13, 17, 6, 1, C.flameCore),
  r(13, 18, 6, 1, C.flameInner),
  r(14, 19, 4, 1, C.flameCore),
  r(14, 20, 4, 1, C.flameInner),
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AnimatedLogoProps {
  size?: "small" | "medium" | "large" | number;
  showText?: boolean;
  animated?: boolean;
}

const SIZE_MAP = { small: 48, medium: 120, large: 200 } as const;
const GRID_W = 32;
const GRID_H = 33;

export function AnimatedLogo({
  size = "large",
  showText = false,
  animated = true,
}: AnimatedLogoProps) {
  const px = typeof size === "number" ? size : SIZE_MAP[size];
  const scale = px / GRID_W;

  // ---- Animation values ----
  const flicker1 = useRef(new Animated.Value(1.0)).current;
  const flicker2ScaleY = useRef(new Animated.Value(0.92)).current;
  const flicker2TransX = useRef(new Animated.Value(0)).current;
  const flicker3ScaleY = useRef(new Animated.Value(1.02)).current;
  const flicker3TransX = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.12)).current;

  const ember1Y = useRef(new Animated.Value(0)).current;
  const ember1Opacity = useRef(new Animated.Value(0)).current;
  const ember2Y = useRef(new Animated.Value(0)).current;
  const ember2Opacity = useRef(new Animated.Value(0)).current;
  const ember3Y = useRef(new Animated.Value(0)).current;
  const ember3Opacity = useRef(new Animated.Value(0)).current;

  const titleGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    const animations: Animated.CompositeAnimation[] = [];

    // Center flame flicker
    const a1 = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker1, { toValue: 1.08, duration: 250, useNativeDriver: true }),
        Animated.timing(flicker1, { toValue: 1.0, duration: 300, useNativeDriver: true }),
      ])
    );
    animations.push(a1);

    // Left tongue flicker
    const a2a = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker2ScaleY, { toValue: 1.05, duration: 200, useNativeDriver: true }),
        Animated.timing(flicker2ScaleY, { toValue: 0.92, duration: 280, useNativeDriver: true }),
      ])
    );
    const a2b = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker2TransX, { toValue: -1 * scale, duration: 200, useNativeDriver: true }),
        Animated.timing(flicker2TransX, { toValue: 0, duration: 280, useNativeDriver: true }),
      ])
    );
    animations.push(a2a, a2b);

    // Right tongue flicker
    const a3a = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker3ScaleY, { toValue: 0.88, duration: 180, useNativeDriver: true }),
        Animated.timing(flicker3ScaleY, { toValue: 1.02, duration: 250, useNativeDriver: true }),
      ])
    );
    const a3b = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker3TransX, { toValue: 1 * scale, duration: 180, useNativeDriver: true }),
        Animated.timing(flicker3TransX, { toValue: 0, duration: 250, useNativeDriver: true }),
      ])
    );
    animations.push(a3a, a3b);

    // Glow pulse
    const a4 = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.30, duration: 1200, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.12, duration: 1200, useNativeDriver: true }),
      ])
    );
    animations.push(a4);

    // Ember helpers
    const makeEmber = (
      yVal: Animated.Value,
      opVal: Animated.Value,
      duration: number,
      delay: number,
    ) => {
      const rise = px * 0.6;
      const timer = setTimeout(() => {
        Animated.loop(
          Animated.parallel([
            Animated.timing(yVal, {
              toValue: -rise,
              duration,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(opVal, { toValue: 1, duration: duration * 0.3, useNativeDriver: true }),
              Animated.timing(opVal, { toValue: 0, duration: duration * 0.7, useNativeDriver: true }),
            ]),
          ])
        ).start();
      }, delay);
      return timer;
    };

    const t1 = makeEmber(ember1Y, ember1Opacity, 2200, 0);
    const t2 = makeEmber(ember2Y, ember2Opacity, 1800, 800);
    const t3 = makeEmber(ember3Y, ember3Opacity, 2500, 1500);

    // Title glow
    let a5: Animated.CompositeAnimation | undefined;
    if (showText) {
      a5 = Animated.loop(
        Animated.sequence([
          Animated.timing(titleGlow, { toValue: 1, duration: 2000, useNativeDriver: false }),
          Animated.timing(titleGlow, { toValue: 0, duration: 2000, useNativeDriver: false }),
        ])
      );
      animations.push(a5);
    }

    animations.forEach((a) => a.start());

    return () => {
      animations.forEach((a) => a.stop());
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [animated, px, scale, showText]);

  // ---- Memoized SVG rect arrays ----
  const renderPixels = (pixels: PixelRect[], key: string) =>
    pixels.map((p, i) => (
      <Rect
        key={`${key}-${i}`}
        x={p.x}
        y={p.y}
        width={p.w}
        height={p.h}
        fill={p.color}
      />
    ));

  const staticRects = useMemo(
    () => [
      ...renderPixels(ROCK_PIXELS, "rock"),
      ...renderPixels(LOG_PIXELS, "log"),
      ...renderPixels(COAL_PIXELS, "coal"),
    ],
    [],
  );

  const centerFlameRects = useMemo(
    () => [
      ...renderPixels(CENTER_FLAME_PIXELS, "cf"),
      ...renderPixels(INNER_FLAME_PIXELS, "if"),
      ...renderPixels(CORE_PIXELS, "core"),
    ],
    [],
  );

  const leftTongueRects = useMemo(() => renderPixels(LEFT_TONGUE_PIXELS, "lt"), []);
  const rightTongueRects = useMemo(() => renderPixels(RIGHT_TONGUE_PIXELS, "rt"), []);

  // ---- Derived sizes ----
  const svgW = GRID_W * scale;
  const svgH = GRID_H * scale;
  const fontSize = Math.max(14, px * 0.28);
  const emberSize = Math.max(2, scale * 1.2);

  return (
    <View style={styles.container}>
      {/* Warm glow behind campfire */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: svgW * 1.4,
            height: svgH * 0.6,
            borderRadius: svgW * 0.7,
            bottom: svgH * 0.15,
            opacity: glowPulse,
          },
        ]}
      />

      {/* Static layer: rocks, logs, coals */}
      <Svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${GRID_W} ${GRID_H}`}
        style={{ position: "absolute" }}
      >
        {staticRects}
      </Svg>

      {/* Center flame (animated scaleY) */}
      <Animated.View
        style={{
          position: "absolute",
          width: svgW,
          height: svgH,
          transform: [{ scaleY: flicker1 }],
          transformOrigin: "center bottom",
        }}
      >
        <Svg width={svgW} height={svgH} viewBox={`0 0 ${GRID_W} ${GRID_H}`}>
          {centerFlameRects}
        </Svg>
      </Animated.View>

      {/* Left tongue (animated) */}
      <Animated.View
        style={{
          position: "absolute",
          width: svgW,
          height: svgH,
          transform: [
            { scaleY: flicker2ScaleY },
            { translateX: flicker2TransX },
          ],
          transformOrigin: "center bottom",
        }}
      >
        <Svg width={svgW} height={svgH} viewBox={`0 0 ${GRID_W} ${GRID_H}`}>
          {leftTongueRects}
        </Svg>
      </Animated.View>

      {/* Right tongue (animated) */}
      <Animated.View
        style={{
          position: "absolute",
          width: svgW,
          height: svgH,
          transform: [
            { scaleY: flicker3ScaleY },
            { translateX: flicker3TransX },
          ],
          transformOrigin: "center bottom",
        }}
      >
        <Svg width={svgW} height={svgH} viewBox={`0 0 ${GRID_W} ${GRID_H}`}>
          {rightTongueRects}
        </Svg>
      </Animated.View>

      {/* Ember particles */}
      <Animated.View
        style={[
          styles.ember,
          {
            width: emberSize,
            height: emberSize,
            backgroundColor: C.flameInner,
            left: svgW * 0.35,
            bottom: svgH * 0.6,
            opacity: ember1Opacity,
            transform: [{ translateY: ember1Y }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ember,
          {
            width: emberSize,
            height: emberSize,
            backgroundColor: C.flameMid,
            left: svgW * 0.55,
            bottom: svgH * 0.65,
            opacity: ember2Opacity,
            transform: [{ translateY: ember2Y }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ember,
          {
            width: emberSize,
            height: emberSize,
            backgroundColor: C.coalGlow2,
            left: svgW * 0.45,
            bottom: svgH * 0.55,
            opacity: ember3Opacity,
            transform: [{ translateY: ember3Y }],
          },
        ]}
      />

      {/* Campfire hitbox / size container */}
      <View style={{ width: svgW, height: svgH }} />

      {/* STOKIE text */}
      {showText && (
        <Animated.Text
          style={[
            styles.title,
            {
              fontSize,
              textShadowColor: titleGlow.interpolate({
                inputRange: [0, 1],
                outputRange: ["rgba(255, 107, 53, 0.5)", "rgba(255, 107, 53, 1)"],
              }),
              textShadowRadius: fontSize * 0.4,
              marginTop: scale * 2,
            },
          ]}
        >
          STOKIE
        </Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    backgroundColor: C.glow,
  },
  ember: {
    position: "absolute",
  },
  title: {
    fontFamily: "Retro",
    color: "#FFF8DC",
    textShadowOffset: { width: 0, height: 0 },
  },
});
