// layers/legs.ts — Legs/pants at 32x48 resolution (longer legs for better proportions)
import { PixelRect, ColorPalette } from "../types";
import { OUTLINE } from "../constants";

const r = (x: number, y: number, w: number, h: number, color: string): PixelRect => ({ x, y, w, h, color });

export function legPixels(
  pantsStyle: string,
  pose: string,
  pants: ColorPalette,
  skin: ColorPalette,
  shoes: ColorPalette,
): PixelRect[] {
  if (pantsStyle === "dress") return dressPixels(pants);
  if (pose === "karate") return karateLegs(pants, shoes);
  if (pose === "sitting") return sittingLegs(pants, skin);
  if (pantsStyle === "skirt") return skirtPixels(pants, skin);
  if (pantsStyle === "shorts") return shortsPixels(pants, skin);
  if (pantsStyle === "skinny") return skinnyLegs(pants);
  if (pantsStyle === "baggy") return baggyLegs(pants);

  const pixels = standardLegs(pants);

  if (pantsStyle === "ripped") {
    pixels.push(
      r(8, 38, 4, 1, skin.base),
      r(20, 37, 4, 1, skin.base),
      r(22, 39, 2, 1, skin.base),
    );
  }

  return pixels;
}

function standardLegs(pants: ColorPalette): PixelRect[] {
  return [
    // Left leg
    r(6, 33, 8, 1, OUTLINE),
    r(5, 34, 1, 9, OUTLINE),
    r(14, 34, 1, 9, OUTLINE),
    r(6, 34, 8, 9, pants.base),
    r(6, 34, 4, 4, pants.highlight),
    r(6, 39, 8, 4, pants.shadow),
    // Right leg
    r(18, 33, 8, 1, OUTLINE),
    r(17, 34, 1, 9, OUTLINE),
    r(26, 34, 1, 9, OUTLINE),
    r(18, 34, 8, 9, pants.base),
    r(22, 34, 4, 4, pants.highlight),
    r(18, 39, 8, 4, pants.shadow),
  ];
}

function skinnyLegs(pants: ColorPalette): PixelRect[] {
  return [
    // Left leg (tapers below knee)
    r(6, 33, 8, 1, OUTLINE),
    r(5, 34, 1, 3, OUTLINE),
    r(14, 34, 1, 3, OUTLINE),
    r(7, 37, 1, 6, OUTLINE),
    r(12, 37, 1, 6, OUTLINE),
    r(6, 34, 8, 3, pants.base),
    r(6, 34, 4, 2, pants.highlight),
    r(8, 37, 4, 6, pants.base),
    r(8, 40, 4, 3, pants.shadow),
    // Right leg
    r(18, 33, 8, 1, OUTLINE),
    r(17, 34, 1, 3, OUTLINE),
    r(26, 34, 1, 3, OUTLINE),
    r(19, 37, 1, 6, OUTLINE),
    r(24, 37, 1, 6, OUTLINE),
    r(18, 34, 8, 3, pants.base),
    r(22, 34, 4, 2, pants.highlight),
    r(20, 37, 4, 6, pants.base),
    r(20, 40, 4, 3, pants.shadow),
  ];
}

function baggyLegs(pants: ColorPalette): PixelRect[] {
  return [
    // Left leg (wider, baggy)
    r(4, 33, 10, 1, OUTLINE),
    r(3, 34, 1, 9, OUTLINE),
    r(14, 34, 1, 9, OUTLINE),
    r(4, 34, 10, 9, pants.base),
    r(4, 34, 5, 4, pants.highlight),
    r(4, 39, 10, 4, pants.shadow),
    r(6, 36, 3, 1, pants.midtone),
    r(8, 39, 2, 1, pants.midtone),
    // Right leg (wider, baggy)
    r(18, 33, 10, 1, OUTLINE),
    r(17, 34, 1, 9, OUTLINE),
    r(28, 34, 1, 9, OUTLINE),
    r(18, 34, 10, 9, pants.base),
    r(23, 34, 5, 4, pants.highlight),
    r(18, 39, 10, 4, pants.shadow),
    r(22, 36, 3, 1, pants.midtone),
    r(20, 39, 2, 1, pants.midtone),
  ];
}

function shortsPixels(pants: ColorPalette, skin: ColorPalette): PixelRect[] {
  return [
    // Left leg
    r(6, 33, 8, 1, OUTLINE),
    r(5, 34, 1, 9, OUTLINE),
    r(14, 34, 1, 9, OUTLINE),
    // Right leg
    r(18, 33, 8, 1, OUTLINE),
    r(17, 34, 1, 9, OUTLINE),
    r(26, 34, 1, 9, OUTLINE),
    // Shorts fill (top 4 rows)
    r(6, 34, 20, 4, pants.base),
    r(8, 34, 6, 2, pants.highlight),
    r(6, 37, 20, 1, pants.shadow),
    // Exposed legs below
    r(6, 38, 8, 5, skin.base),
    r(6, 41, 8, 2, skin.shadow),
    r(18, 38, 8, 5, skin.base),
    r(18, 41, 8, 2, skin.shadow),
  ];
}

function skirtPixels(pants: ColorPalette, skin: ColorPalette): PixelRect[] {
  return [
    // Skirt — wider, flared A-line, above knee
    r(4, 33, 24, 1, OUTLINE),
    r(3, 34, 1, 5, OUTLINE),
    r(28, 34, 1, 5, OUTLINE),
    r(4, 39, 24, 1, OUTLINE),
    // Skirt fill (wider than body)
    r(4, 34, 24, 5, pants.base),
    r(6, 34, 8, 2, pants.highlight),
    r(4, 37, 24, 2, pants.shadow),
    // Waist
    r(6, 34, 20, 1, pants.midtone),
    // Pleat details
    r(10, 35, 1, 3, pants.midtone),
    r(16, 35, 1, 3, pants.shadow),
    r(22, 35, 1, 3, pants.midtone),
    // Exposed legs below skirt
    r(5, 39, 1, 4, OUTLINE),
    r(14, 39, 1, 4, OUTLINE),
    r(17, 39, 1, 4, OUTLINE),
    r(26, 39, 1, 4, OUTLINE),
    r(6, 39, 8, 4, skin.base),
    r(6, 41, 8, 2, skin.shadow),
    r(18, 39, 8, 4, skin.base),
    r(18, 41, 8, 2, skin.shadow),
  ];
}

function dressPixels(pants: ColorPalette): PixelRect[] {
  return [
    // Full-length dress — triangular A-line, flares wider at bottom
    // Waist (narrow, body width)
    r(6, 33, 20, 1, OUTLINE),
    // Staircase flare outline — left side gets wider each section
    r(5, 34, 1, 2, OUTLINE),
    r(4, 36, 1, 2, OUTLINE),
    r(2, 38, 2, 2, OUTLINE),
    r(1, 40, 1, 3, OUTLINE),
    // Right side (mirror)
    r(26, 34, 1, 2, OUTLINE),
    r(27, 36, 1, 2, OUTLINE),
    r(28, 38, 2, 2, OUTLINE),
    r(30, 40, 1, 3, OUTLINE),
    // Hem (widest)
    r(2, 43, 28, 1, OUTLINE),

    // Fill — triangular shape, wider each row-band
    r(6, 34, 20, 2, pants.base),       // waist area (body width)
    r(5, 36, 22, 2, pants.base),       // slightly wider
    r(4, 38, 24, 2, pants.base),       // wider
    r(2, 40, 28, 3, pants.base),       // widest at hem
    // Highlight on upper portion
    r(8, 34, 8, 3, pants.highlight),
    // Shadow at hem
    r(2, 41, 28, 2, pants.shadow),
    // Waist cinch / belt
    r(8, 34, 16, 1, pants.shadow),
    r(10, 35, 12, 1, pants.midtone),
    // Fold details that follow the flare
    r(9, 36, 1, 6, pants.midtone),
    r(15, 36, 1, 6, pants.shadow),
    r(21, 36, 1, 6, pants.midtone),
    // Decorative hem
    r(4, 42, 2, 1, pants.highlight),
    r(10, 42, 2, 1, pants.highlight),
    r(16, 42, 2, 1, pants.highlight),
    r(22, 42, 2, 1, pants.highlight),
    r(28, 42, 2, 1, pants.highlight),
  ];
}

function karateLegs(pants: ColorPalette, shoes: ColorPalette): PixelRect[] {
  return [
    // Left leg (standing)
    r(6, 33, 8, 1, OUTLINE),
    r(5, 34, 1, 9, OUTLINE),
    r(14, 34, 1, 9, OUTLINE),
    r(6, 34, 8, 9, pants.base),
    r(6, 34, 4, 4, pants.highlight),
    r(6, 39, 8, 4, pants.shadow),
    // Right leg (kicking forward!)
    r(18, 33, 8, 1, OUTLINE),
    r(17, 34, 1, 5, OUTLINE),
    r(26, 34, 1, 5, OUTLINE),
    r(27, 36, 10, 1, OUTLINE),
    r(37, 37, 1, 5, OUTLINE),
    r(27, 42, 10, 1, OUTLINE),
    r(18, 34, 8, 5, pants.base),
    r(27, 37, 9, 5, pants.base),
    r(27, 41, 9, 1, pants.shadow),
    // Kicking foot
    r(34, 37, 4, 5, shoes.base),
    r(35, 37, 3, 2, shoes.highlight),
    r(34, 41, 4, 1, shoes.shadow),
  ];
}

function sittingLegs(pants: ColorPalette, skin: ColorPalette): PixelRect[] {
  return [
    // Left thigh (horizontal, y=34-37)
    r(6, 33, 8, 1, OUTLINE),
    r(5, 34, 1, 4, OUTLINE),
    r(14, 34, 1, 4, OUTLINE),
    r(6, 34, 8, 4, pants.base),
    r(6, 34, 4, 2, pants.highlight),
    r(6, 37, 8, 1, pants.shadow),
    // Left lower leg (hanging down, y=38-42)
    r(5, 38, 1, 5, OUTLINE),
    r(14, 38, 1, 5, OUTLINE),
    r(6, 38, 8, 5, pants.base),
    r(6, 40, 8, 3, pants.shadow),
    // Right thigh (horizontal, y=34-37)
    r(18, 33, 8, 1, OUTLINE),
    r(17, 34, 1, 4, OUTLINE),
    r(26, 34, 1, 4, OUTLINE),
    r(18, 34, 8, 4, pants.base),
    r(22, 34, 4, 2, pants.highlight),
    r(18, 37, 8, 1, pants.shadow),
    // Right lower leg (hanging down, y=38-42)
    r(17, 38, 1, 5, OUTLINE),
    r(26, 38, 1, 5, OUTLINE),
    r(18, 38, 8, 5, pants.base),
    r(18, 40, 8, 3, pants.shadow),
  ];
}
