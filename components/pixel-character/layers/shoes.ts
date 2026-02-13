// layers/shoes.ts — Shoes at 32x48 resolution (adjusted for longer legs)
import { PixelRect, ColorPalette } from "../types";
import { OUTLINE } from "../constants";

const r = (x: number, y: number, w: number, h: number, color: string): PixelRect => ({ x, y, w, h, color });

/** Shoes: rows 42-47 (shifted up to match longer legs) */
export function shoePixels(shoes: ColorPalette, pantsStyle: string, pose: string): PixelRect[] {
  // Karate pose — right shoe drawn in legs layer
  if (pose === "karate") {
    return [
      r(4, 42, 10, 1, OUTLINE),
      r(3, 43, 1, 4, OUTLINE),
      r(14, 43, 1, 4, OUTLINE),
      r(3, 47, 12, 1, OUTLINE),
      r(4, 43, 10, 4, shoes.base),
      r(4, 43, 4, 2, shoes.highlight),
      r(4, 46, 10, 1, shoes.shadow),
    ];
  }

  // Sitting pose — shoes at bottom of hanging legs
  if (pose === "sitting") {
    return [
      // Left shoe (below hanging left leg)
      r(4, 42, 10, 1, OUTLINE),
      r(3, 43, 1, 4, OUTLINE),
      r(14, 43, 1, 4, OUTLINE),
      r(3, 47, 12, 1, OUTLINE),
      r(4, 43, 10, 4, shoes.base),
      r(4, 43, 4, 2, shoes.highlight),
      r(4, 46, 10, 1, shoes.shadow),
      // Right shoe (below hanging right leg)
      r(18, 42, 10, 1, OUTLINE),
      r(17, 43, 1, 4, OUTLINE),
      r(28, 43, 1, 4, OUTLINE),
      r(17, 47, 12, 1, OUTLINE),
      r(18, 43, 10, 4, shoes.base),
      r(24, 43, 4, 2, shoes.highlight),
      r(18, 46, 10, 1, shoes.shadow),
    ];
  }

  // Dress shoes peek out under hem
  if (pantsStyle === "dress") {
    return [
      r(4, 42, 10, 1, OUTLINE),
      r(3, 43, 1, 4, OUTLINE),
      r(14, 43, 1, 4, OUTLINE),
      r(3, 47, 12, 1, OUTLINE),
      r(4, 43, 10, 4, shoes.base),
      r(4, 43, 4, 2, shoes.highlight),
      r(4, 46, 10, 1, shoes.shadow),
      r(18, 42, 10, 1, OUTLINE),
      r(17, 43, 1, 4, OUTLINE),
      r(28, 43, 1, 4, OUTLINE),
      r(17, 47, 12, 1, OUTLINE),
      r(18, 43, 10, 4, shoes.base),
      r(24, 43, 4, 2, shoes.highlight),
      r(18, 46, 10, 1, shoes.shadow),
    ];
  }

  return [
    // Left shoe
    r(4, 42, 10, 1, OUTLINE),
    r(3, 43, 1, 4, OUTLINE),
    r(14, 43, 1, 4, OUTLINE),
    r(3, 47, 12, 1, OUTLINE),
    r(4, 43, 10, 4, shoes.base),
    r(4, 43, 4, 2, shoes.highlight),
    r(4, 46, 10, 1, shoes.shadow),
    // Right shoe
    r(18, 42, 10, 1, OUTLINE),
    r(17, 43, 1, 4, OUTLINE),
    r(28, 43, 1, 4, OUTLINE),
    r(17, 47, 12, 1, OUTLINE),
    r(18, 43, 10, 4, shoes.base),
    r(24, 43, 4, 2, shoes.highlight),
    r(18, 46, 10, 1, shoes.shadow),
  ];
}
