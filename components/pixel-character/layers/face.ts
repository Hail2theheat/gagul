// layers/face.ts — Eyes, eyebrows, nose, mouth at 32x48 resolution
import { PixelRect, ColorPalette } from "../types";
import { OUTLINE } from "../constants";

const r = (x: number, y: number, w: number, h: number, color: string): PixelRect => ({ x, y, w, h, color });

export function facePixels(skin: ColorPalette, blinking = false): PixelRect[] {
  const eyes: PixelRect[] = blinking
    ? [
        // Closed eyes — thin skin-colored lines
        r(11, 13, 4, 1, skin.shadow),
        r(18, 13, 4, 1, skin.shadow),
      ]
    : [
        // Left eye — 4x3 with sclera, iris, pupil, highlight
        r(11, 12, 4, 3, "#FFFFFF"),
        r(12, 12, 2, 3, "#4080C0"),
        r(13, 13, 1, 2, OUTLINE),
        r(12, 12, 1, 1, "#E0F0FF"),
        // Right eye — 4x3 mirror
        r(18, 12, 4, 3, "#FFFFFF"),
        r(19, 12, 2, 3, "#4080C0"),
        r(19, 13, 1, 2, OUTLINE),
        r(21, 12, 1, 1, "#E0F0FF"),
      ];

  return [
    ...eyes,

    // === EYEBROWS ===
    r(11, 11, 4, 1, skin.shadow),
    r(18, 11, 4, 1, skin.shadow),

    // === NOSE ===
    r(15, 16, 2, 2, skin.shadow),
    r(15, 17, 1, 1, skin.midtone),

    // === MOUTH ===
    r(13, 19, 6, 1, skin.shadow),
    r(14, 19, 4, 1, "#c08070"),
    r(15, 20, 2, 1, skin.midtone), // lower lip shadow
  ];
}
