/**
 * Design tokens for the Stokie campfire theme.
 * All colors, spacing, typography, radii, and shadows are centralized here.
 */

import { Platform, TextStyle } from 'react-native';

// ===== CAMPFIRE PALETTE =====
// Extracted from 6+ files that duplicated these values
export const CampfireColors = {
  // Sky gradient bands (top to bottom)
  BG_TOP: '#060B18',
  BG_MID: '#0C1428',
  BG_LOW: '#111D35',
  BG_HORIZON: '#1A2844',
  BG_BOTTOM: '#1E3050',

  // Flat background (login, settings, character creator)
  BG: '#0B1026',

  // Cards & surfaces
  CARD: 'rgba(22, 28, 48, 0.88)',
  CARD_SOLID: 'rgba(20, 30, 50, 0.85)',
  CARD_BORDER: 'rgba(80, 100, 140, 0.35)',
  BORDER: '#2a3f5f',
  INPUT_BG: 'rgba(10, 16, 32, 0.7)',
  INPUT_BG_DARK: 'rgba(10, 16, 32, 0.8)',

  // Text
  TEXT: '#FFF5E4',
  TEXT_WARM: '#FFE8C8',
  TEXT_CREAM: '#FFF8DC',
  MUTED: '#C4B8A0', // Bumped from #A89880 / #B8A88A for AA contrast
  MUTED_OLD: '#A89880', // Keep reference for gradual migration

  // Primary action
  BTN_PRIMARY: '#FF6B35',
  BTN_HOVER: '#FF8555',
  BTN_OUTLINE: 'rgba(120, 100, 80, 0.4)',

  // Status
  SUCCESS: '#4ADE80',
  DANGER: '#FCA5A5',
  DANGER_BORDER: '#7f1d1d',
  WARNING: '#EAB308',

  // Tab bar
  TAB_BG: '#080E1C',
  TAB_BORDER: 'rgba(80, 100, 140, 0.2)',
  TAB_ACTIVE: '#FF8555',
  TAB_INACTIVE: '#6B6058',

  // Campfire / fire elements
  FIRE_RED: '#CC2200',
  FIRE_ORANGE: '#FF6B35',
  FIRE_YELLOW: '#FFD93D',
  FIRE_CORE: '#FFFEF0',
  EMBER: '#FF9F1C',

  // Moon & stars
  MOON: '#FFF8DC',
  MOON_GLOW: '#FFFACD',
  STAR_WHITE: '#FFF',
  STAR_WARM: '#FFE8C0',
  STAR_LAVENDER: '#E8E0FF',

  // Forest / ground
  GROUND_DARK: '#1A3018',
  GROUND_GRASS: '#254A22',
  GROUND_MOSS: '#1F3D1C',
  GROUND_DEEP: '#152515',

  // Firefly
  FIREFLY: '#FFE4A0',
  FIREFLY_GLOW: '#FFD060',

  // Stone
  STONE_LIGHT: '#7A7A82',
  STONE_MID: '#6B6B73',
  STONE_DARK: '#5A5A62',
  STONE_DARKEST: '#4A4A52',
} as const;

// ===== SPACING SCALE =====
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ===== BORDER RADIUS =====
export const Radii = {
  card: 18,
  button: 14,
  input: 14,
  modal: 24,
  pill: 20,
  circle: 9999,
  sm: 8,
  md: 12,
  lg: 16,
} as const;

// ===== TYPOGRAPHY PRESETS =====
export const Typography = {
  heading1: {
    fontFamily: 'Bitova',
    fontSize: 28,
    letterSpacing: 0.5,
  } as TextStyle,
  heading2: {
    fontFamily: 'Bitova',
    fontSize: 20,
  } as TextStyle,
  heading3: {
    fontFamily: 'Bitova',
    fontSize: 16,
  } as TextStyle,
  body: {
    fontFamily: 'Bitova',
    fontSize: 16,
  } as TextStyle,
  bodyBold: {
    fontFamily: 'Bitova',
    fontSize: 16,
  } as TextStyle,
  caption: {
    fontFamily: 'Bitova',
    fontSize: 13,
  } as TextStyle,
  button: {
    fontFamily: 'Bitova',
    fontSize: 16,
    letterSpacing: 0.5,
  } as TextStyle,
  tab: {
    fontFamily: 'Bitova',
    fontSize: 12,
  } as TextStyle,
} as const;

// ===== SHADOW PRESETS =====
export const Shadows = {
  fireGlow: {
    textShadowColor: 'rgba(255, 107, 53, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  } as TextStyle,
  moonGlow: {
    shadowColor: '#FFF8DC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
  },
  cardGlow: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  starGlow: (color: string, size: number) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: size * 2,
  }),
} as const;

// ===== MINIMUM TOUCH TARGET (Accessibility) =====
export const A11y = {
  minTouchSize: 44,
} as const;

// ===== LEGACY EXPORTS (keep existing API working) =====
const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
