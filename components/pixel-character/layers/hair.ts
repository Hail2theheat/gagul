// layers/hair.ts — All 17 hair styles at 32x48 resolution (Octopath Traveler style)
import { PixelRect, ColorPalette } from "../types";
import { OUTLINE } from "../constants";

const r = (x: number, y: number, w: number, h: number, color: string): PixelRect => ({ x, y, w, h, color });

/** Back hair layers rendered behind the body */
export function hairBackPixels(style: string, hair: ColorPalette): PixelRect[] {
  switch (style) {
    case "long":
      return [
        // Long flowing hair behind body — tapered silhouette
        r(7, 6, 1, 36, OUTLINE),
        r(24, 6, 1, 36, OUTLINE),
        r(8, 42, 2, 1, OUTLINE),
        r(22, 42, 2, 1, OUTLINE),
        // Left strand layers
        r(8, 7, 3, 10, hair.shadow),
        r(8, 17, 3, 12, hair.base),
        r(8, 29, 2, 10, hair.midtone),
        r(9, 37, 1, 5, hair.shadow),
        // Center back fill
        r(11, 7, 10, 8, hair.base),
        r(11, 15, 10, 14, hair.midtone),
        r(12, 29, 8, 8, hair.shadow),
        r(13, 37, 6, 4, hair.shadow),
        // Right strand layers
        r(21, 7, 3, 10, hair.shadow),
        r(21, 17, 3, 12, hair.base),
        r(22, 29, 2, 10, hair.midtone),
        r(22, 37, 1, 5, hair.shadow),
        // Interior strand detail — alternating midtone/shadow
        r(10, 12, 1, 8, hair.shadow),
        r(14, 10, 1, 10, hair.shadow),
        r(17, 10, 1, 10, hair.shadow),
        r(21, 12, 1, 8, hair.shadow),
        // Tapered tips at bottom
        r(10, 39, 1, 2, hair.shadow),
        r(21, 39, 1, 2, hair.shadow),
      ];
    case "dreads":
      return [
        // Dread strands behind body — individual tapered locks
        // Left back dreads
        r(3, 8, 1, 30, OUTLINE),
        r(4, 8, 2, 28, hair.shadow),
        r(4, 12, 1, 6, hair.midtone),
        r(4, 22, 1, 4, hair.midtone),
        r(4, 36, 1, 2, hair.base),
        r(7, 9, 1, 28, OUTLINE),
        r(6, 9, 1, 26, hair.base),
        r(6, 14, 1, 4, hair.midtone),
        r(6, 24, 1, 4, hair.midtone),
        r(6, 35, 1, 2, hair.shadow),
        // Right back dreads
        r(28, 8, 1, 30, OUTLINE),
        r(26, 8, 2, 28, hair.shadow),
        r(27, 12, 1, 6, hair.midtone),
        r(27, 22, 1, 4, hair.midtone),
        r(27, 36, 1, 2, hair.base),
        r(24, 9, 1, 28, OUTLINE),
        r(25, 9, 1, 26, hair.base),
        r(25, 14, 1, 4, hair.midtone),
        r(25, 24, 1, 4, hair.midtone),
        r(25, 35, 1, 2, hair.shadow),
      ];
    case "ponytail":
      return [
        // Ponytail flowing down from back of head
        r(24, 8, 1, 22, OUTLINE),
        r(25, 7, 3, 1, OUTLINE),
        r(28, 8, 1, 20, OUTLINE),
        r(25, 28, 3, 1, OUTLINE),
        // Fill with strand detail
        r(25, 8, 3, 6, hair.base),
        r(25, 8, 2, 3, hair.highlight),
        r(25, 14, 3, 6, hair.midtone),
        r(25, 20, 3, 4, hair.shadow),
        r(25, 24, 2, 4, hair.shadow),
        // Interior strand lines
        r(26, 10, 1, 8, hair.shadow),
      ];

    case "braids":
      return [
        // Two long braids behind body — cross-hatch detail, tapered ends
        // Left braid outline
        r(7, 8, 1, 30, OUTLINE),
        r(11, 8, 1, 28, OUTLINE),
        r(8, 37, 1, 1, OUTLINE),
        r(10, 36, 1, 1, OUTLINE),
        r(9, 38, 1, 1, OUTLINE),
        // Left braid fill — layered shading
        r(8, 8, 3, 6, hair.base),
        r(8, 14, 3, 6, hair.midtone),
        r(8, 20, 3, 6, hair.base),
        r(8, 26, 3, 5, hair.midtone),
        r(8, 31, 2, 4, hair.shadow),
        r(9, 35, 1, 3, hair.shadow),
        // Left braid highlight streaks
        r(8, 8, 1, 4, hair.highlight),
        r(8, 20, 1, 4, hair.highlight),
        // Left braid cross-hatch detail — alternating shadow/midtone
        r(9, 10, 2, 1, hair.shadow),
        r(8, 13, 2, 1, hair.shadow),
        r(9, 16, 2, 1, hair.shadow),
        r(8, 19, 2, 1, hair.shadow),
        r(9, 22, 2, 1, hair.shadow),
        r(8, 25, 2, 1, hair.shadow),
        r(9, 28, 1, 1, hair.shadow),
        r(8, 31, 1, 1, hair.shadow),
        // Right braid outline
        r(20, 8, 1, 28, OUTLINE),
        r(24, 8, 1, 30, OUTLINE),
        r(23, 37, 1, 1, OUTLINE),
        r(21, 36, 1, 1, OUTLINE),
        r(22, 38, 1, 1, OUTLINE),
        // Right braid fill — layered shading
        r(21, 8, 3, 6, hair.base),
        r(21, 14, 3, 6, hair.midtone),
        r(21, 20, 3, 6, hair.base),
        r(21, 26, 3, 5, hair.midtone),
        r(22, 31, 2, 4, hair.shadow),
        r(22, 35, 1, 3, hair.shadow),
        // Right braid highlight streaks
        r(23, 8, 1, 4, hair.highlight),
        r(23, 20, 1, 4, hair.highlight),
        // Right braid cross-hatch detail
        r(21, 10, 2, 1, hair.shadow),
        r(22, 13, 2, 1, hair.shadow),
        r(21, 16, 2, 1, hair.shadow),
        r(22, 19, 2, 1, hair.shadow),
        r(21, 22, 2, 1, hair.shadow),
        r(22, 25, 2, 1, hair.shadow),
        r(22, 28, 1, 1, hair.shadow),
        r(23, 31, 1, 1, hair.shadow),
        // Center back fill between braids
        r(11, 8, 9, 6, hair.base),
        r(12, 14, 7, 4, hair.midtone),
        r(13, 18, 5, 2, hair.shadow),
      ];

    case "side_swept":
      return [
        // Small amount of back hair on right side
        r(23, 8, 1, 10, OUTLINE),
        r(24, 8, 2, 8, hair.base),
        r(24, 16, 1, 2, hair.midtone),
        r(25, 12, 1, 4, hair.shadow),
      ];

    case "wild":
      return [
        // Long flowing strands behind body — dramatic windswept look
        // Left flowing strand
        r(5, 8, 1, 24, OUTLINE),
        r(9, 8, 1, 20, OUTLINE),
        r(6, 8, 3, 8, hair.base),
        r(6, 16, 3, 6, hair.midtone),
        r(6, 22, 2, 6, hair.shadow),
        r(7, 28, 1, 3, hair.shadow),
        r(6, 31, 2, 1, OUTLINE),
        // Left strand highlight
        r(6, 8, 1, 6, hair.highlight),
        // Left strand detail
        r(7, 12, 1, 4, hair.shadow),
        r(8, 10, 1, 6, hair.midtone),
        // Center back mass
        r(10, 8, 12, 6, hair.base),
        r(10, 14, 12, 6, hair.midtone),
        r(11, 20, 10, 5, hair.shadow),
        r(12, 25, 8, 4, hair.shadow),
        r(13, 29, 6, 2, hair.shadow),
        // Center strand detail — alternating midtone/shadow
        r(12, 10, 1, 8, hair.shadow),
        r(15, 9, 1, 10, hair.shadow),
        r(18, 10, 1, 8, hair.shadow),
        r(21, 11, 1, 6, hair.midtone),
        // Right flowing strand
        r(22, 8, 1, 20, OUTLINE),
        r(26, 8, 1, 24, OUTLINE),
        r(23, 8, 3, 8, hair.base),
        r(23, 16, 3, 6, hair.midtone),
        r(24, 22, 2, 6, hair.shadow),
        r(24, 28, 1, 3, hair.shadow),
        r(24, 31, 2, 1, OUTLINE),
        // Right strand highlight
        r(25, 8, 1, 6, hair.highlight),
        // Right strand detail
        r(24, 12, 1, 4, hair.shadow),
        r(23, 10, 1, 6, hair.midtone),
        // Tapered tips at bottom
        r(7, 30, 1, 1, hair.shadow),
        r(24, 30, 1, 1, hair.shadow),
        r(14, 30, 1, 1, hair.shadow),
        r(17, 30, 1, 1, hair.shadow),
      ];

    default:
      return [];
  }
}

/** Front hair layers rendered on top of the head */
export function hairFrontPixels(style: string, hair: ColorPalette, skin: ColorPalette): PixelRect[] {
  switch (style) {
    case "bald":
      return [];

    case "short":
      return [
        // Top outline with staircase edges
        r(9, 2, 14, 1, OUTLINE),
        r(8, 3, 1, 1, OUTLINE),
        r(23, 3, 1, 1, OUTLINE),
        r(7, 4, 1, 6, OUTLINE),
        r(24, 4, 1, 6, OUTLINE),
        // Main fill — layered shading
        r(9, 3, 14, 1, hair.shadow),
        r(8, 4, 16, 2, hair.base),
        r(8, 6, 16, 3, hair.base),
        // Highlight streak on top
        r(10, 3, 6, 2, hair.highlight),
        r(11, 5, 4, 1, hair.highlight),
        // Side taper — staircase 1px offsets
        r(8, 9, 3, 1, hair.midtone),
        r(9, 10, 2, 1, hair.shadow),
        r(21, 9, 3, 1, hair.midtone),
        r(21, 10, 2, 1, hair.shadow),
        // Strand detail
        r(14, 4, 1, 4, hair.shadow),
        r(18, 5, 1, 3, hair.midtone),
      ];

    case "medium":
      return [
        // Top outline with flowing shape
        r(9, 0, 14, 1, OUTLINE),
        r(8, 1, 1, 1, OUTLINE),
        r(23, 1, 1, 1, OUTLINE),
        r(7, 2, 1, 13, OUTLINE),
        r(24, 2, 1, 13, OUTLINE),
        // Main hair mass
        r(9, 1, 14, 1, hair.shadow),
        r(8, 2, 16, 3, hair.base),
        r(8, 5, 16, 4, hair.base),
        // Highlight streak
        r(10, 1, 6, 3, hair.highlight),
        r(11, 4, 4, 1, hair.highlight),
        // Strand detail
        r(14, 3, 1, 5, hair.shadow),
        r(18, 4, 1, 4, hair.midtone),
        r(10, 5, 1, 3, hair.midtone),
        // Side locks — tapered tips (staircase)
        r(8, 9, 3, 3, hair.base),
        r(8, 12, 2, 3, hair.midtone),
        r(8, 15, 1, 2, hair.shadow),
        r(21, 9, 3, 3, hair.base),
        r(22, 12, 2, 3, hair.midtone),
        r(23, 15, 1, 2, hair.shadow),
      ];

    case "long":
      return [
        // Top outline
        r(9, 0, 14, 1, OUTLINE),
        r(8, 1, 1, 1, OUTLINE),
        r(23, 1, 1, 1, OUTLINE),
        r(7, 2, 1, 6, OUTLINE),
        r(24, 2, 1, 6, OUTLINE),
        // Main hair mass
        r(9, 1, 14, 1, hair.shadow),
        r(8, 2, 16, 3, hair.base),
        r(8, 5, 16, 4, hair.base),
        // Highlight streak
        r(10, 1, 6, 3, hair.highlight),
        r(11, 4, 4, 1, hair.highlight),
        // Strand detail in top
        r(14, 3, 1, 5, hair.shadow),
        r(18, 4, 1, 4, hair.midtone),
        // Side frame pieces (front of long hair visible)
        r(8, 9, 2, 6, hair.base),
        r(8, 15, 1, 3, hair.midtone),
        r(22, 9, 2, 6, hair.base),
        r(23, 15, 1, 3, hair.midtone),
      ];

    case "curly":
      return [
        // Bigger, rounder silhouette — staircase outline
        r(8, 0, 16, 1, OUTLINE),
        r(7, 1, 1, 1, OUTLINE),
        r(24, 1, 1, 1, OUTLINE),
        r(6, 2, 1, 1, OUTLINE),
        r(25, 2, 1, 1, OUTLINE),
        r(5, 3, 1, 12, OUTLINE),
        r(26, 3, 1, 12, OUTLINE),
        // Main curly mass
        r(8, 1, 16, 1, hair.shadow),
        r(7, 2, 18, 2, hair.base),
        r(6, 4, 20, 7, hair.base),
        // Highlight patches (top)
        r(9, 1, 5, 3, hair.highlight),
        r(17, 1, 5, 3, hair.highlight),
        // Curl texture — alternating bumps
        r(6, 5, 2, 2, hair.shadow),
        r(10, 4, 2, 2, hair.shadow),
        r(14, 5, 2, 2, hair.shadow),
        r(18, 4, 2, 2, hair.shadow),
        r(22, 5, 2, 2, hair.shadow),
        r(8, 8, 2, 2, hair.midtone),
        r(12, 7, 2, 2, hair.midtone),
        r(16, 8, 2, 2, hair.midtone),
        r(20, 7, 2, 2, hair.midtone),
        // Side curls — tapered with staircase
        r(6, 11, 3, 3, hair.base),
        r(6, 14, 2, 2, hair.midtone),
        r(7, 16, 1, 1, hair.shadow),
        r(23, 11, 3, 3, hair.base),
        r(24, 14, 2, 2, hair.midtone),
        r(24, 16, 1, 1, hair.shadow),
      ];

    case "afro":
      return [
        // Big round afro — staircase rounded outline
        r(8, -5, 16, 1, OUTLINE),
        r(6, -4, 2, 1, OUTLINE),
        r(24, -4, 2, 1, OUTLINE),
        r(5, -3, 1, 1, OUTLINE),
        r(26, -3, 1, 1, OUTLINE),
        r(4, -2, 1, 1, OUTLINE),
        r(27, -2, 1, 1, OUTLINE),
        r(3, -1, 1, 18, OUTLINE),
        r(28, -1, 1, 18, OUTLINE),
        r(4, 17, 4, 1, OUTLINE),
        r(24, 17, 4, 1, OUTLINE),
        // Afro fill
        r(8, -4, 16, 1, hair.base),
        r(6, -3, 20, 2, hair.base),
        r(5, -1, 22, 2, hair.base),
        r(4, 1, 24, 16, hair.base),
        // Highlights — top dome
        r(9, -4, 6, 3, hair.highlight),
        r(17, -4, 6, 3, hair.highlight),
        r(7, -1, 4, 3, hair.highlight),
        r(21, -1, 4, 3, hair.highlight),
        // Side shadows
        r(4, 8, 4, 9, hair.shadow),
        r(24, 8, 4, 9, hair.shadow),
        // Texture bumps — midtone dots for volume
        r(8, 0, 2, 2, hair.midtone),
        r(12, -2, 2, 2, hair.midtone),
        r(18, -2, 2, 2, hair.midtone),
        r(22, 0, 2, 2, hair.midtone),
        r(6, 4, 2, 2, hair.midtone),
        r(10, 6, 2, 2, hair.midtone),
        r(18, 6, 2, 2, hair.midtone),
        r(24, 4, 2, 2, hair.midtone),
        // Face cutout
        r(10, 9, 12, 8, skin.base),
        r(10, 9, 6, 4, skin.highlight),
      ];

    case "dreads":
      return [
        // Top cap with dread roots
        r(9, 0, 14, 1, OUTLINE),
        r(8, 1, 1, 1, OUTLINE),
        r(23, 1, 1, 1, OUTLINE),
        r(7, 2, 1, 8, OUTLINE),
        r(24, 2, 1, 8, OUTLINE),
        // Hair cap
        r(9, 1, 14, 1, hair.shadow),
        r(8, 2, 16, 3, hair.base),
        r(8, 5, 16, 4, hair.base),
        r(10, 1, 6, 3, hair.highlight),
        // Strand detail in cap
        r(12, 3, 1, 5, hair.shadow),
        r(16, 3, 1, 5, hair.shadow),
        r(20, 4, 1, 4, hair.midtone),
        // Front dread strands — tapered individual locks
        r(9, 9, 2, 5, hair.base),
        r(9, 14, 1, 2, hair.midtone),
        r(9, 16, 1, 1, hair.shadow),
        r(21, 9, 2, 5, hair.base),
        r(22, 14, 1, 2, hair.midtone),
        r(22, 16, 1, 1, hair.shadow),
        // Center front locks
        r(13, 9, 2, 3, hair.base),
        r(13, 12, 1, 1, hair.midtone),
        r(17, 9, 2, 3, hair.base),
        r(18, 12, 1, 1, hair.midtone),
      ];

    case "ponytail":
      return [
        // Top — same shape as short but pulled back
        r(9, 2, 14, 1, OUTLINE),
        r(8, 3, 1, 1, OUTLINE),
        r(23, 3, 1, 1, OUTLINE),
        r(7, 4, 1, 6, OUTLINE),
        r(24, 4, 1, 4, OUTLINE),
        // Main fill
        r(9, 3, 14, 1, hair.shadow),
        r(8, 4, 16, 2, hair.base),
        r(8, 6, 16, 3, hair.base),
        // Highlight
        r(10, 3, 6, 2, hair.highlight),
        r(11, 5, 4, 1, hair.highlight),
        // Pulled-back detail
        r(20, 4, 4, 2, hair.midtone),
        r(22, 6, 2, 2, hair.shadow),
        // Side wisps
        r(8, 9, 2, 2, hair.midtone),
        r(8, 11, 1, 1, hair.shadow),
      ];

    case "bun":
      return [
        // Top hair with bun
        r(9, 2, 14, 1, OUTLINE),
        r(8, 3, 1, 1, OUTLINE),
        r(23, 3, 1, 1, OUTLINE),
        r(7, 4, 1, 6, OUTLINE),
        r(24, 4, 1, 6, OUTLINE),
        // Bun outline — rounded staircase
        r(13, -3, 6, 1, OUTLINE),
        r(12, -2, 1, 1, OUTLINE),
        r(19, -2, 1, 1, OUTLINE),
        r(11, -1, 1, 4, OUTLINE),
        r(20, -1, 1, 4, OUTLINE),
        r(12, 3, 1, 1, OUTLINE),
        r(19, 3, 1, 1, OUTLINE),
        // Main hair fill
        r(9, 3, 14, 1, hair.shadow),
        r(8, 4, 16, 2, hair.base),
        r(8, 6, 16, 3, hair.base),
        r(10, 3, 6, 2, hair.highlight),
        // Bun fill — shaded sphere
        r(13, -2, 6, 1, hair.base),
        r(12, -1, 8, 4, hair.base),
        r(13, -2, 3, 2, hair.highlight),
        r(15, 1, 4, 2, hair.midtone),
        r(12, 2, 8, 1, hair.shadow),
        // Wrap detail
        r(14, 2, 4, 1, hair.shadow),
      ];

    case "spiky":
      return [
        // Base hair mass
        r(7, 4, 1, 6, OUTLINE),
        r(24, 4, 1, 6, OUTLINE),
        r(8, 1, 16, 8, hair.base),
        r(10, 2, 4, 3, hair.highlight),
        r(18, 2, 4, 3, hair.highlight),

        // === TOP SPIKES — tall, dramatic ===
        // Center spike (tallest)
        r(14, -7, 4, 1, OUTLINE),
        r(13, -6, 1, 1, OUTLINE),
        r(18, -6, 1, 1, OUTLINE),
        r(14, -6, 4, 7, hair.base),
        r(15, -6, 2, 4, hair.highlight),
        // Left top spike
        r(9, -4, 3, 1, OUTLINE),
        r(8, -3, 1, 1, OUTLINE),
        r(12, -3, 1, 1, OUTLINE),
        r(9, -3, 3, 4, hair.base),
        r(10, -3, 1, 2, hair.highlight),
        // Right top spike
        r(20, -4, 3, 1, OUTLINE),
        r(19, -3, 1, 1, OUTLINE),
        r(23, -3, 1, 1, OUTLINE),
        r(20, -3, 3, 4, hair.base),
        r(21, -3, 1, 2, hair.highlight),

        // === LEFT SIDE SPIKES — pointing outward ===
        // Upper left spike
        r(3, 2, 3, 1, OUTLINE),
        r(2, 3, 1, 1, OUTLINE),
        r(6, 3, 1, 3, OUTLINE),
        r(3, 3, 4, 3, hair.base),
        r(4, 3, 2, 1, hair.highlight),
        // Lower left spike (longer, pointing out)
        r(1, 7, 5, 1, OUTLINE),
        r(0, 8, 1, 1, OUTLINE),
        r(6, 8, 1, 3, OUTLINE),
        r(1, 8, 6, 3, hair.base),
        r(2, 8, 2, 1, hair.highlight),

        // === RIGHT SIDE SPIKES — pointing outward (mirror) ===
        // Upper right spike
        r(26, 2, 3, 1, OUTLINE),
        r(29, 3, 1, 1, OUTLINE),
        r(25, 3, 1, 3, OUTLINE),
        r(25, 3, 4, 3, hair.base),
        r(26, 3, 2, 1, hair.highlight),
        // Lower right spike (longer)
        r(26, 7, 5, 1, OUTLINE),
        r(31, 8, 1, 1, OUTLINE),
        r(25, 8, 1, 3, OUTLINE),
        r(25, 8, 6, 3, hair.base),
        r(28, 8, 2, 1, hair.highlight),

        // Strand detail in base
        r(11, 5, 1, 3, hair.shadow),
        r(15, 4, 1, 4, hair.shadow),
        r(20, 5, 1, 3, hair.shadow),
      ];

    case "mohawk":
      return [
        // Tall mohawk — tapered staircase silhouette
        r(13, -7, 6, 1, OUTLINE),
        r(12, -6, 1, 1, OUTLINE),
        r(19, -6, 1, 1, OUTLINE),
        r(11, -5, 1, 15, OUTLINE),
        r(20, -5, 1, 15, OUTLINE),
        // Shaved sides outline
        r(8, 7, 3, 2, OUTLINE),
        r(21, 7, 3, 2, OUTLINE),
        // Mohawk fill
        r(13, -6, 6, 1, hair.base),
        r(12, -5, 8, 15, hair.base),
        // Highlight stripe
        r(14, -6, 4, 6, hair.highlight),
        r(15, -4, 2, 3, hair.highlight),
        // Shadow at base
        r(12, 7, 8, 3, hair.shadow),
        // Strand detail
        r(13, -3, 1, 6, hair.midtone),
        r(16, -4, 1, 8, hair.shadow),
        r(18, -3, 1, 6, hair.midtone),
        // Tapered tip
        r(14, -6, 1, 1, hair.midtone),
        r(17, -6, 1, 1, hair.midtone),
      ];

    case "pigtails":
      return [
        // Top hair
        r(9, 2, 14, 1, OUTLINE),
        r(8, 3, 1, 1, OUTLINE),
        r(23, 3, 1, 1, OUTLINE),
        r(7, 4, 1, 6, OUTLINE),
        r(24, 4, 1, 6, OUTLINE),
        // Left pigtail — tapered
        r(2, 8, 4, 1, OUTLINE),
        r(1, 9, 1, 1, OUTLINE),
        r(6, 9, 1, 18, OUTLINE),
        r(0, 10, 1, 16, OUTLINE),
        r(1, 26, 3, 1, OUTLINE),
        r(4, 25, 1, 1, OUTLINE),
        // Right pigtail — tapered
        r(26, 8, 4, 1, OUTLINE),
        r(30, 9, 1, 1, OUTLINE),
        r(25, 9, 1, 18, OUTLINE),
        r(31, 10, 1, 16, OUTLINE),
        r(28, 26, 3, 1, OUTLINE),
        r(27, 25, 1, 1, OUTLINE),
        // Hair fill
        r(9, 3, 14, 1, hair.shadow),
        r(8, 4, 16, 2, hair.base),
        r(8, 6, 16, 3, hair.base),
        r(10, 3, 6, 2, hair.highlight),
        // Part line
        r(15, 3, 2, 5, hair.shadow),
        // Left pigtail fill — tapered bottom
        r(2, 9, 4, 4, hair.base),
        r(1, 10, 5, 6, hair.base),
        r(1, 16, 5, 5, hair.midtone),
        r(1, 21, 4, 3, hair.shadow),
        r(2, 24, 2, 2, hair.shadow),
        // Left pigtail highlight
        r(2, 9, 2, 4, hair.highlight),
        // Left pigtail strand detail
        r(3, 13, 1, 6, hair.shadow),
        // Right pigtail fill — tapered bottom
        r(26, 9, 4, 4, hair.base),
        r(26, 10, 5, 6, hair.base),
        r(26, 16, 5, 5, hair.midtone),
        r(27, 21, 4, 3, hair.shadow),
        r(28, 24, 2, 2, hair.shadow),
        // Right pigtail highlight
        r(28, 9, 2, 4, hair.highlight),
        // Right pigtail strand detail
        r(28, 13, 1, 6, hair.shadow),
      ];

    case "braids":
      return [
        // Top cap — hair pulled back, parted center
        r(9, 2, 14, 1, OUTLINE),
        r(8, 3, 1, 1, OUTLINE),
        r(23, 3, 1, 1, OUTLINE),
        r(7, 4, 1, 6, OUTLINE),
        r(24, 4, 1, 6, OUTLINE),
        // Main cap fill
        r(9, 3, 14, 1, hair.shadow),
        r(8, 4, 16, 2, hair.base),
        r(8, 6, 16, 3, hair.base),
        // Highlight streak on top
        r(10, 3, 5, 2, hair.highlight),
        r(17, 3, 5, 2, hair.highlight),
        // Center part line
        r(15, 3, 2, 5, hair.shadow),
        // Pulled-back detail — strands converging to braids
        r(9, 6, 2, 2, hair.midtone),
        r(21, 6, 2, 2, hair.midtone),
        r(10, 8, 1, 1, hair.shadow),
        r(21, 8, 1, 1, hair.shadow),
        // Front braid strands framing face — left
        r(8, 9, 2, 4, hair.base),
        r(8, 13, 2, 3, hair.midtone),
        r(8, 16, 1, 2, hair.shadow),
        r(9, 11, 1, 2, hair.shadow),
        // Front braid strands framing face — right
        r(22, 9, 2, 4, hair.base),
        r(22, 13, 2, 3, hair.midtone),
        r(23, 16, 1, 2, hair.shadow),
        r(22, 11, 1, 2, hair.shadow),
      ];

    case "space_buns":
      return [
        // Base hair cap — similar to short
        r(9, 2, 14, 1, OUTLINE),
        r(8, 3, 1, 1, OUTLINE),
        r(23, 3, 1, 1, OUTLINE),
        r(7, 4, 1, 6, OUTLINE),
        r(24, 4, 1, 6, OUTLINE),
        // Main cap fill
        r(9, 3, 14, 1, hair.shadow),
        r(8, 4, 16, 2, hair.base),
        r(8, 6, 16, 3, hair.base),
        // Highlight streak on cap
        r(10, 3, 6, 2, hair.highlight),
        // Side taper
        r(8, 9, 2, 1, hair.midtone),
        r(22, 9, 2, 1, hair.midtone),
        // Strand detail in cap
        r(14, 4, 1, 4, hair.shadow),
        r(18, 5, 1, 3, hair.midtone),

        // === LEFT BUN — rounded ball at top-left ===
        // Bun outline — staircase rounded
        r(7, -2, 3, 1, OUTLINE),
        r(6, -1, 1, 1, OUTLINE),
        r(10, -1, 1, 1, OUTLINE),
        r(5, 0, 1, 3, OUTLINE),
        r(11, 0, 1, 3, OUTLINE),
        r(6, 3, 1, 1, OUTLINE),
        r(10, 3, 1, 1, OUTLINE),
        r(7, 4, 3, 1, OUTLINE),
        // Left bun fill — shaded sphere
        r(7, -1, 3, 1, hair.base),
        r(6, 0, 5, 3, hair.base),
        r(7, 3, 3, 1, hair.base),
        // Left bun highlight — top-left
        r(7, -1, 2, 2, hair.highlight),
        r(6, 0, 1, 1, hair.highlight),
        // Left bun shadow — bottom-right
        r(9, 2, 2, 1, hair.shadow),
        r(8, 3, 2, 1, hair.shadow),
        // Left bun midtone — transition
        r(9, 0, 1, 2, hair.midtone),

        // === RIGHT BUN — rounded ball at top-right ===
        // Bun outline — staircase rounded
        r(22, -2, 3, 1, OUTLINE),
        r(21, -1, 1, 1, OUTLINE),
        r(25, -1, 1, 1, OUTLINE),
        r(20, 0, 1, 3, OUTLINE),
        r(26, 0, 1, 3, OUTLINE),
        r(21, 3, 1, 1, OUTLINE),
        r(25, 3, 1, 1, OUTLINE),
        r(22, 4, 3, 1, OUTLINE),
        // Right bun fill — shaded sphere
        r(22, -1, 3, 1, hair.base),
        r(21, 0, 5, 3, hair.base),
        r(22, 3, 3, 1, hair.base),
        // Right bun highlight — top-left
        r(22, -1, 2, 2, hair.highlight),
        r(21, 0, 1, 1, hair.highlight),
        // Right bun shadow — bottom-right
        r(24, 2, 2, 1, hair.shadow),
        r(23, 3, 2, 1, hair.shadow),
        // Right bun midtone — transition
        r(24, 0, 1, 2, hair.midtone),
      ];

    case "side_swept":
      return [
        // Dramatic side-swept hair — thick right side, long left fringe
        // Top outline with asymmetric shape
        r(9, 0, 14, 1, OUTLINE),
        r(8, 1, 1, 1, OUTLINE),
        r(23, 1, 1, 1, OUTLINE),
        r(7, 2, 1, 14, OUTLINE),
        r(24, 2, 1, 8, OUTLINE),
        // Main hair mass — swept from right to left
        r(9, 1, 14, 1, hair.shadow),
        r(8, 2, 16, 3, hair.base),
        r(8, 5, 16, 4, hair.base),
        // Highlight on right side volume
        r(17, 1, 5, 3, hair.highlight),
        r(19, 4, 4, 2, hair.highlight),
        // Right side volume above ear
        r(22, 6, 2, 4, hair.base),
        r(22, 6, 1, 2, hair.midtone),
        r(23, 8, 1, 2, hair.shadow),
        // Left fringe — sweeping down over left eye, tapered staircase
        r(8, 9, 4, 2, hair.base),
        r(8, 11, 3, 2, hair.midtone),
        r(8, 13, 2, 2, hair.midtone),
        r(8, 15, 1, 2, hair.shadow),
        // Fringe strand detail
        r(9, 9, 1, 4, hair.shadow),
        r(10, 10, 1, 2, hair.midtone),
        // Diagonal sweep detail across top — staircase offsets
        r(20, 2, 3, 1, hair.midtone),
        r(17, 3, 3, 1, hair.midtone),
        r(14, 4, 3, 1, hair.shadow),
        r(11, 5, 3, 1, hair.shadow),
        r(9, 6, 2, 1, hair.shadow),
        // Strand texture in main mass
        r(12, 3, 1, 5, hair.shadow),
        r(16, 2, 1, 4, hair.midtone),
        r(20, 3, 1, 3, hair.shadow),
      ];

    case "wild":
      return [
        // Big dramatic JRPG protagonist hair — asymmetric spikes
        // Base hair mass
        r(7, 4, 1, 6, OUTLINE),
        r(24, 4, 1, 6, OUTLINE),
        r(8, 1, 16, 8, hair.base),
        r(10, 2, 4, 3, hair.highlight),
        r(18, 2, 4, 3, hair.highlight),

        // === TOP SPIKES — tall, dramatic, asymmetric ===
        // Center-left spike (tallest)
        r(12, -8, 4, 1, OUTLINE),
        r(11, -7, 1, 1, OUTLINE),
        r(16, -7, 1, 1, OUTLINE),
        r(12, -7, 4, 8, hair.base),
        r(13, -7, 2, 5, hair.highlight),
        r(12, -2, 1, 3, hair.midtone),
        r(15, -4, 1, 3, hair.shadow),
        // Center-right spike (second tallest)
        r(17, -6, 3, 1, OUTLINE),
        r(16, -5, 1, 1, OUTLINE),
        r(20, -5, 1, 1, OUTLINE),
        r(17, -5, 3, 6, hair.base),
        r(18, -5, 1, 3, hair.highlight),
        r(19, -2, 1, 3, hair.midtone),
        // Far left spike — pointing outward
        r(6, -4, 3, 1, OUTLINE),
        r(5, -3, 1, 1, OUTLINE),
        r(9, -3, 1, 1, OUTLINE),
        r(6, -3, 3, 5, hair.base),
        r(7, -3, 1, 3, hair.highlight),
        r(6, 0, 1, 2, hair.midtone),
        r(8, -1, 1, 2, hair.shadow),
        // Far right spike — shorter, windswept
        r(22, -3, 3, 1, OUTLINE),
        r(21, -2, 1, 1, OUTLINE),
        r(25, -2, 1, 1, OUTLINE),
        r(22, -2, 3, 4, hair.base),
        r(23, -2, 1, 2, hair.highlight),
        r(24, 0, 1, 2, hair.shadow),

        // === LEFT SIDE SPIKES — pointing outward, flowing back ===
        // Upper left side spike
        r(2, 1, 4, 1, OUTLINE),
        r(1, 2, 1, 1, OUTLINE),
        r(6, 2, 1, 4, OUTLINE),
        r(2, 2, 5, 3, hair.base),
        r(3, 2, 2, 1, hair.highlight),
        r(2, 4, 3, 1, hair.shadow),
        // Lower left side spike — longer
        r(0, 6, 5, 1, OUTLINE),
        r(0, 7, 1, 1, OUTLINE),
        r(6, 7, 1, 4, OUTLINE),
        r(1, 7, 6, 3, hair.base),
        r(1, 7, 3, 1, hair.highlight),
        r(2, 9, 2, 1, hair.shadow),

        // === RIGHT SIDE SPIKES — pointing outward (mirror, asymmetric) ===
        // Upper right side spike
        r(26, 2, 3, 1, OUTLINE),
        r(29, 3, 1, 1, OUTLINE),
        r(25, 3, 1, 3, OUTLINE),
        r(25, 3, 4, 2, hair.base),
        r(27, 3, 2, 1, hair.highlight),
        r(25, 4, 2, 1, hair.shadow),
        // Lower right side spike
        r(27, 6, 4, 1, OUTLINE),
        r(31, 7, 1, 1, OUTLINE),
        r(25, 7, 1, 4, OUTLINE),
        r(25, 7, 6, 3, hair.base),
        r(28, 7, 3, 1, hair.highlight),
        r(28, 9, 2, 1, hair.shadow),

        // === BACK-FLOWING WISP TIPS visible at sides ===
        r(4, 5, 2, 1, hair.midtone),
        r(3, 4, 1, 1, hair.shadow),
        r(26, 5, 2, 1, hair.midtone),
        r(29, 4, 1, 1, hair.shadow),

        // Strand detail in base mass
        r(11, 5, 1, 3, hair.shadow),
        r(15, 4, 1, 4, hair.shadow),
        r(19, 3, 1, 3, hair.midtone),
        r(21, 5, 1, 3, hair.shadow),
      ];

    case "undercut":
      return [
        // Top section — swept-back volume
        r(9, 0, 14, 1, OUTLINE),
        r(8, 1, 1, 1, OUTLINE),
        r(23, 1, 1, 1, OUTLINE),
        r(7, 2, 1, 4, OUTLINE),
        r(24, 2, 1, 4, OUTLINE),
        // Top volume fill — layered shading
        r(9, 1, 14, 1, hair.shadow),
        r(8, 2, 16, 2, hair.base),
        r(8, 4, 16, 2, hair.base),
        r(9, 6, 14, 2, hair.base),
        r(10, 8, 12, 1, hair.midtone),
        // Highlight streak on top — swept back
        r(10, 1, 6, 2, hair.highlight),
        r(12, 3, 4, 1, hair.highlight),
        r(14, 4, 3, 1, hair.highlight),
        // Swept-back strand detail
        r(16, 2, 1, 4, hair.shadow),
        r(19, 3, 1, 3, hair.midtone),
        r(12, 3, 1, 4, hair.shadow),
        r(21, 4, 1, 3, hair.midtone),
        // Shaved sides — 1px stubble using midtone (very short/buzzed look)
        r(8, 7, 2, 3, hair.midtone),
        r(8, 7, 1, 2, hair.shadow),
        r(9, 9, 1, 1, hair.shadow),
        r(22, 7, 2, 3, hair.midtone),
        r(23, 7, 1, 2, hair.shadow),
        r(22, 9, 1, 1, hair.shadow),
        // Transition line between top volume and shaved sides
        r(8, 6, 2, 1, hair.shadow),
        r(22, 6, 2, 1, hair.shadow),
      ];

    default:
      return [];
  }
}
