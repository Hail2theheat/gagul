/**
 * Shared animation constants for Reanimated and layout animations.
 * Centralizes spring configs, timing defaults, and density settings.
 */

import { WithSpringConfig, WithTimingConfig, Easing } from 'react-native-reanimated';

// ===== SPRING CONFIGS =====
export const SPRING_GENTLE: WithSpringConfig = {
  damping: 20,
  stiffness: 90,
  mass: 1,
};

export const SPRING_BOUNCY: WithSpringConfig = {
  damping: 12,
  stiffness: 150,
  mass: 0.8,
};

export const SPRING_SNAPPY: WithSpringConfig = {
  damping: 15,
  stiffness: 200,
  mass: 0.6,
};

// ===== TIMING DEFAULTS =====
export const TIMING_FADE_IN: WithTimingConfig = {
  duration: 200,
  easing: Easing.out(Easing.quad),
};

export const TIMING_TRANSITION: WithTimingConfig = {
  duration: 300,
  easing: Easing.inOut(Easing.quad),
};

export const TIMING_SLOW: WithTimingConfig = {
  duration: 500,
  easing: Easing.inOut(Easing.quad),
};

// ===== DURATION CONSTANTS =====
export const Durations = {
  FADE_IN: 200,
  TRANSITION: 300,
  SLOW: 500,
  STAR_TWINKLE_MIN: 600,
  STAR_TWINKLE_MAX: 1400,
  FIREFLY_GLOW: 1200,
  FIREFLY_FADE: 1800,
  SHOOTING_STAR: 900,
  MOON_PULSE: 3000,
} as const;

// ===== SKY ELEMENT DENSITY =====
export const SkyDensity = {
  default: {
    largeBrightStars: 10,
    mediumStars: 22,
    smallStars: 25,
    tinyStars: 30,
    shootingStars: 4,
    fireflies: 8,
  },
  minimal: {
    largeBrightStars: 4,
    mediumStars: 8,
    smallStars: 10,
    tinyStars: 12,
    shootingStars: 2,
    fireflies: 4,
  },
  dense: {
    largeBrightStars: 15,
    mediumStars: 30,
    smallStars: 35,
    tinyStars: 40,
    shootingStars: 6,
    fireflies: 12,
  },
} as const;

// ===== STAR COLOR PALETTES =====
export const StarColors = [
  '#FFF',
  '#FFF8DC',
  '#FFE8C0',
  '#E8E0FF',
  '#FFFACD',
] as const;

// ===== STAGGER DELAYS =====
export const Stagger = {
  /** Delay between items in a list animation */
  LIST_ITEM: 80,
  /** Delay between cards entering */
  CARD: 100,
  /** Delay between tab content transitions */
  TAB: 50,
} as const;
