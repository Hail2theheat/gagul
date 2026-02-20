// layers/face.ts — Eyes, eyebrows, nose, mouth at 32x48 resolution
import { PixelRect, ColorPalette } from "../types";
import { OUTLINE } from "../constants";

const r = (x: number, y: number, w: number, h: number, color: string): PixelRect => ({ x, y, w, h, color });

export function facePixels(skin: ColorPalette, blinking = false): PixelRect[] {
  const eyes: PixelRect[] = blinking
    ? [
        // Closed eyes — thin skin-colored lines with lash detail
        r(11, 13, 4, 1, skin.shadow),
        r(18, 13, 4, 1, skin.shadow),
        // Subtle lash tips
        r(11, 14, 1, 1, OUTLINE),
        r(14, 14, 1, 1, OUTLINE),
        r(18, 14, 1, 1, OUTLINE),
        r(21, 14, 1, 1, OUTLINE),
      ]
    : [
        // Left eye — Enhanced with better shading
        r(11, 12, 4, 3, "#FFFFFF"),       // Sclera
        r(12, 12, 2, 3, "#4080C0"),       // Iris
        r(13, 13, 1, 2, OUTLINE),         // Pupil
        r(12, 12, 1, 1, "#E0F0FF"),       // Highlight (top-left)
        r(13, 14, 1, 1, "#6AA0D8"),       // Lower iris shine
        // Eye outline for definition
        r(11, 11, 4, 1, OUTLINE),         // Top lid
        r(11, 15, 4, 1, skin.shadow),     // Bottom lid crease

        // Right eye — Enhanced mirror
        r(18, 12, 4, 3, "#FFFFFF"),       // Sclera
        r(19, 12, 2, 3, "#4080C0"),       // Iris
        r(19, 13, 1, 2, OUTLINE),         // Pupil
        r(21, 12, 1, 1, "#E0F0FF"),       // Highlight
        r(19, 14, 1, 1, "#6AA0D8"),       // Lower iris shine
        // Eye outline
        r(18, 11, 4, 1, OUTLINE),         // Top lid
        r(18, 15, 4, 1, skin.shadow),     // Bottom lid crease
      ];

  return [
    ...eyes,

    // === EYEBROWS === Enhanced with gradient
    r(11, 10, 4, 1, skin.shadow),        // Brow base (shadow)
    r(12, 10, 2, 1, OUTLINE),            // Darker center
    r(18, 10, 4, 1, skin.shadow),        // Right brow base
    r(19, 10, 2, 1, OUTLINE),            // Darker center

    // === CHEEK BLUSH === Rosy cheeks for warmth
    r(10, 17, 1, 1, "#FF9999"),          // Left cheek
    r(10, 18, 2, 1, "#FFAAAA"),
    r(11, 18, 1, 1, "#FFCCCC"),
    r(20, 18, 2, 1, "#FFAAAA"),          // Right cheek
    r(21, 17, 1, 1, "#FF9999"),
    r(21, 18, 1, 1, "#FFCCCC"),

    // === NOSE === Enhanced with bridge and tip highlight
    r(15, 14, 2, 1, skin.highlight),     // Bridge highlight
    r(15, 16, 2, 2, skin.shadow),        // Nostril shadow
    r(15, 17, 1, 1, skin.midtone),       // Nose tip
    r(16, 17, 1, 1, skin.highlight),     // Tip highlight

    // === MOUTH === Enhanced with better lip definition
    r(13, 19, 6, 1, skin.shadow),        // Mouth line (top)
    r(14, 19, 4, 1, "#c08070"),          // Upper lip base
    r(15, 19, 2, 1, "#d09080"),          // Upper lip highlight
    r(14, 20, 4, 1, "#d09080"),          // Lower lip
    r(15, 20, 2, 1, "#e0a090"),          // Lower lip highlight
    r(15, 21, 2, 1, skin.midtone),       // Lower lip shadow

    // === FRECKLES === Optional cute detail (subtle)
    r(12, 16, 1, 1, skin.shadow),        // Left side
    r(13, 17, 1, 1, skin.shadow),
    r(19, 16, 1, 1, skin.shadow),        // Right side
    r(18, 17, 1, 1, skin.shadow),
  ];
}
