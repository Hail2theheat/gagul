// components/PixelCharacter.tsx
// Barrel re-export — all consumer imports remain unchanged.
// Actual implementation lives in ./pixel-character/

export { PixelCharacter } from "./pixel-character";
export type { CharacterConfig } from "./pixel-character/types";
export {
  SKIN_TONES,
  HAIR_COLORS,
  HAIR_STYLES,
  SHIRT_COLORS,
  SHIRT_STYLES,
  PANTS_COLORS,
  PANTS_STYLES,
  SHOE_COLORS,
  ACCESSORIES,
  POSES,
  DEFAULT_CHARACTER,
} from "./pixel-character/constants";
