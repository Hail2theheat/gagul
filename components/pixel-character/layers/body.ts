// layers/body.ts — Torso/shirt at 32x48 resolution (shorter torso for better proportions)
import { PixelRect, ColorPalette } from "../types";
import { OUTLINE } from "../constants";

const r = (x: number, y: number, w: number, h: number, color: string): PixelRect => ({ x, y, w, h, color });

/** Body/torso: rows 25-33 (9px tall — shorter torso, longer legs) */
export function bodyPixels(
  shirtStyle: string,
  shirt: ColorPalette,
  skin: ColorPalette,
): PixelRect[] {
  const pixels: PixelRect[] = [
    // Body outline
    r(6, 25, 20, 1, OUTLINE),
    r(5, 26, 1, 8, OUTLINE),
    r(26, 26, 1, 8, OUTLINE),

    // Shirt fill with shading
    r(6, 26, 8, 2, shirt.highlight),
    r(14, 26, 12, 2, shirt.base),
    r(6, 28, 20, 3, shirt.base),
    r(6, 31, 20, 2, shirt.midtone),
    r(6, 33, 20, 1, shirt.shadow),

    // Shoulder shading
    r(6, 26, 3, 2, shirt.midtone),
    r(23, 26, 3, 2, shirt.midtone),
  ];

  switch (shirtStyle) {
    case "polo":
      pixels.push(
        r(12, 26, 8, 3, shirt.shadow),
        r(14, 26, 4, 4, OUTLINE),
      );
      break;
    case "hoodie":
      pixels.push(
        r(10, 26, 12, 3, shirt.shadow),
        r(12, 29, 8, 3, shirt.midtone),
        r(6, 26, 2, 3, shirt.shadow),
        r(24, 26, 2, 3, shirt.shadow),
      );
      break;
    case "tank":
      pixels.push(
        r(6, 26, 4, 3, skin.base),
        r(6, 29, 3, 1, skin.shadow),
        r(22, 26, 4, 3, skin.base),
        r(23, 29, 3, 1, skin.shadow),
      );
      break;
    case "crop":
      // Crop top — shirt ends early, showing belly
      pixels.push(
        r(6, 31, 20, 1, shirt.shadow),
        r(6, 32, 20, 2, skin.base),
        r(8, 33, 16, 1, skin.shadow),
      );
      break;
    case "vest":
      // Vest with open sides
      pixels.push(
        r(6, 26, 3, 8, shirt.shadow),
        r(23, 26, 3, 8, shirt.shadow),
        r(12, 26, 8, 3, shirt.shadow),
        r(14, 26, 4, 4, shirt.midtone),
        r(9, 28, 3, 4, skin.base),
        r(20, 28, 3, 4, skin.base),
      );
      break;
    case "jacket":
      // Jacket with lapels and center seam
      pixels.push(
        r(6, 26, 4, 8, shirt.shadow),
        r(22, 26, 4, 8, shirt.shadow),
        r(10, 26, 2, 5, shirt.midtone),
        r(20, 26, 2, 5, shirt.midtone),
        r(15, 26, 2, 8, shirt.shadow),
        r(12, 26, 8, 2, shirt.shadow),
      );
      break;
    case "flannel":
      pixels.push(
        r(8, 26, 2, 8, shirt.shadow),
        r(12, 26, 2, 8, shirt.shadow),
        r(16, 26, 2, 8, shirt.shadow),
        r(20, 26, 2, 8, shirt.shadow),
        r(24, 26, 2, 8, shirt.shadow),
      );
      break;
    case "sweater":
      pixels.push(
        r(8, 27, 16, 1, shirt.midtone),
        r(8, 29, 16, 1, shirt.midtone),
        r(8, 31, 16, 1, shirt.midtone),
      );
      break;
    case "overalls":
      // Stardew Valley-style farmer overalls over a shirt
      pixels.push(
        // Shirt underneath (visible at chest)
        r(9, 26, 14, 3, shirt.highlight),
        r(12, 26, 8, 2, shirt.base),
        // Overall straps
        r(8, 26, 1, 8, "#2858D0"),
        r(23, 26, 1, 8, "#2858D0"),
        r(9, 26, 1, 2, "#2858D0"),
        r(22, 26, 1, 2, "#2858D0"),
        // Overall bib (front panel)
        r(9, 28, 14, 6, "#1E40AF"),
        r(10, 28, 6, 2, "#2858D0"),
        // Pocket
        r(12, 30, 8, 3, "#183898"),
        r(13, 31, 6, 1, "#142c78"),
        // Buttons on straps
        r(9, 28, 1, 1, "#FFD700"),
        r(22, 28, 1, 1, "#FFD700"),
        // Side panels
        r(6, 29, 3, 5, "#1E40AF"),
        r(23, 29, 3, 5, "#1E40AF"),
        r(6, 33, 3, 1, "#142c78"),
        r(23, 33, 3, 1, "#142c78"),
      );
      break;
    case "robe":
      // Wizard/mage robe — longer garment extending over legs
      pixels.push(
        // High collar
        r(12, 24, 8, 2, shirt.shadow),
        r(14, 24, 4, 1, shirt.midtone),
        // Robe body (overwrites default shirt)
        r(6, 26, 20, 2, shirt.base),
        r(8, 26, 6, 1, shirt.highlight),
        r(6, 28, 20, 6, shirt.base),
        r(6, 32, 20, 2, shirt.shadow),
        // Center seam with gold trim
        r(15, 26, 2, 8, shirt.shadow),
        r(15, 26, 1, 8, "#B8960C"),
        // Shoulder pads (wider)
        r(4, 25, 2, 3, shirt.midtone),
        r(26, 25, 2, 3, shirt.midtone),
        r(4, 26, 2, 2, shirt.base),
        r(26, 26, 2, 2, shirt.base),
        // Belt/sash
        r(6, 31, 20, 1, "#B8960C"),
        r(8, 31, 8, 1, "#FFD700"),
        // Emblem on chest
        r(17, 27, 3, 3, "#B8960C"),
        r(18, 28, 1, 1, "#FFD700"),
      );
      break;
    case "armor":
      // Knight chest plate — metallic with detail
      pixels.push(
        // Armor plate overwrites default fill
        r(6, 26, 20, 8, "#A0A8B0"),
        // Highlight on chest
        r(8, 26, 8, 3, "#C0C8D0"),
        r(10, 26, 4, 2, "#D8E0E8"),
        // Shadow at bottom and edges
        r(6, 32, 20, 2, "#707880"),
        r(6, 26, 2, 8, "#808890"),
        r(24, 26, 2, 8, "#808890"),
        // Shoulder pauldrons (wider, larger)
        r(2, 24, 4, 4, "#A0A8B0"),
        r(2, 24, 4, 2, "#C0C8D0"),
        r(2, 27, 4, 1, "#707880"),
        r(26, 24, 4, 4, "#A0A8B0"),
        r(26, 24, 4, 2, "#C0C8D0"),
        r(26, 27, 4, 1, "#707880"),
        // Center plate seam
        r(15, 26, 2, 8, "#808890"),
        // Chest emblem
        r(13, 28, 6, 4, "#B8960C"),
        r(14, 29, 4, 2, "#FFD700"),
        r(15, 29, 2, 1, "#FFEC8B"),
        // Belt
        r(6, 33, 20, 1, "#6B4420"),
        r(14, 33, 4, 1, "#B8960C"),
        // Rivets
        r(8, 26, 1, 1, "#FFD700"),
        r(23, 26, 1, 1, "#FFD700"),
        r(8, 33, 1, 1, "#FFD700"),
        r(23, 33, 1, 1, "#FFD700"),
      );
      break;
  }

  return pixels;
}
