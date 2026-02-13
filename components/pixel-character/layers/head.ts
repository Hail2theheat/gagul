// layers/head.ts — Head shape at 32x48 resolution
import { PixelRect, ColorPalette } from "../types";
import { OUTLINE } from "../constants";

const r = (x: number, y: number, w: number, h: number, color: string): PixelRect => ({ x, y, w, h, color });

/** Head: rows 6–24 (18px tall, 12px wide centered) */
export function headPixels(skin: ColorPalette): PixelRect[] {
  return [
    // Head outline — softened jaw with staircase edges
    r(10, 6, 12, 1, OUTLINE),   // top
    r(9, 7, 1, 15, OUTLINE),    // left side
    r(22, 7, 1, 15, OUTLINE),   // right side
    r(10, 22, 1, 1, OUTLINE),   // left jaw taper
    r(21, 22, 1, 1, OUTLINE),   // right jaw taper
    r(11, 23, 10, 1, OUTLINE),  // chin (narrower)

    // Head fill with shading — highlight top-left, shadow bottom
    r(10, 7, 6, 4, skin.highlight),
    r(16, 7, 6, 4, skin.base),
    r(10, 11, 12, 6, skin.base),
    r(10, 17, 12, 4, skin.midtone),
    r(10, 21, 12, 1, skin.shadow),
    r(11, 22, 10, 1, skin.shadow),

    // Ears
    r(8, 13, 2, 4, skin.midtone),
    r(8, 14, 1, 2, skin.shadow),
    r(22, 13, 2, 4, skin.midtone),
    r(23, 14, 1, 2, skin.shadow),
  ];
}

/** Neck: rows 24-25 */
export function neckPixels(skin: ColorPalette): PixelRect[] {
  return [
    r(13, 24, 6, 2, skin.base),
    r(14, 24, 4, 2, skin.shadow),
  ];
}
