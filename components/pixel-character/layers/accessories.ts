// layers/accessories.ts — All accessories at 32x48 resolution
import { PixelRect, ColorPalette } from "../types";
import { OUTLINE } from "../constants";

const r = (x: number, y: number, w: number, h: number, color: string): PixelRect => ({ x, y, w, h, color });

/** Returns the topmost Y coordinate for each hair style */
function hairTopY(hairStyle: string): number {
  switch (hairStyle) {
    case "afro": return -5;
    case "mohawk": return -7;
    case "spiky": return -7;
    case "bun": return -3;
    case "medium": case "long": case "curly": case "dreads": case "side_swept": case "undercut": return 0;
    case "short": case "ponytail": case "pigtails": case "braids": return 2;
    case "space_buns": return -2;
    case "wild": return -8;
    case "bald": default: return 6; // head top
  }
}

/** Returns the right hand grip position {x, y} for each pose */
function staffGrip(pose: string): { x: number; y: number } {
  switch (pose) {
    case "waving": return { x: 28, y: 30 }; // left hand (at side)
    case "raising_roof": return { x: 28, y: 30 };
    case "robot": return { x: 34, y: 37 };
    case "tpose": return { x: 39, y: 28 };
    case "karate": return { x: 28, y: 30 };
    case "dab": return { x: 28, y: 30 };
    case "flexing": return { x: 34, y: 18 };
    case "peace": return { x: 28, y: 30 };
    case "hands_up": return { x: 28, y: 30 };
    case "thinking": return { x: 28, y: 30 };
    case "crossed_arms": return { x: 28, y: 30 };
    case "middle_fingers": return { x: 28, y: 30 };
    case "fighting_stance": return { x: 28, y: 28 };
    case "casting": return { x: 28, y: 20 };
    case "victory": return { x: 28, y: 30 };
    case "sitting": return { x: 28, y: 30 };
    case "idle": default: return { x: 28, y: 30 };
  }
}

// Torso Y range: y=26 to y=33
const TORSO_TOP = 26;

/** Accessories rendered behind the body */
export function accessoryBackPixels(accessory: string, hairStyle: string, pose: string): PixelRect[] {
  switch (accessory) {
    case "wings": {
      // Wings anchored to the torso (y=26-33), extending outward
      const wy = TORSO_TOP; // wing top at torso top
      // Wings raised to just above shoulders (wy=22), shorter so they don't reach shoes
      // Mostly white with light gray/blue accents on tips
      const w = wy - 4; // wing top at y=22, above shoulders
      return [
        // === LEFT WING ===
        r(2, w, 3, 1, OUTLINE),
        r(-2, w + 1, 4, 1, OUTLINE),
        r(-6, w + 2, 4, 1, OUTLINE),
        r(-9, w + 3, 3, 1, OUTLINE),
        r(-10, w + 4, 1, 8, OUTLINE),
        r(-9, w + 12, 1, 2, OUTLINE),
        r(-8, w + 14, 1, 2, OUTLINE),
        r(-6, w + 16, 2, 1, OUTLINE),
        r(-3, w + 17, 3, 1, OUTLINE),
        r(0, w + 18, 3, 1, OUTLINE),
        r(3, w + 18, 2, 1, OUTLINE),
        // Primary feathers (outer tips — light silver-gray with blue tint)
        r(-9, w + 4, 6, 3, "#D8DCE0"),
        r(-9, w + 7, 5, 2, "#C8D0D8"),
        r(-9, w + 9, 4, 3, "#C0C8D0"),
        r(-8, w + 12, 4, 2, "#B8C4D0"),
        r(-6, w + 14, 3, 2, "#B0BCC8"),
        r(-3, w + 16, 4, 1, "#B0BCC8"),
        // Secondary feathers — off-white
        r(-3, w + 2, 4, 4, "#F0F2F5"),
        r(-4, w + 6, 5, 4, "#E8ECF0"),
        r(-4, w + 10, 4, 3, "#E0E4E8"),
        r(-1, w + 13, 4, 3, "#D8DDE2"),
        // Covert feathers (near body) — white
        r(1, w + 1, 4, 3, "#FFFFFF"),
        r(2, w + 4, 5, 4, "#FAFBFC"),
        r(3, w + 8, 4, 4, "#F5F6F8"),
        r(4, w + 12, 3, 4, "#F0F2F4"),
        r(5, w + 16, 2, 2, "#ECEEF0"),
        // Bright white highlights
        r(-2, w + 2, 3, 2, "#FFFFFF"),
        r(2, w + 1, 3, 2, "#FFFFFF"),
        r(-8, w + 4, 2, 2, "#F0F4F8"),
        // Feather lines — very subtle light gray
        r(-5, w + 5, 1, 4, "#D0D4D8"),
        r(-2, w + 3, 1, 4, "#D8DCE0"),
        r(1, w + 6, 1, 4, "#E0E4E8"),
        r(3, w + 10, 1, 4, "#E8ECF0"),

        // === RIGHT WING (mirror) ===
        r(28, w, 3, 1, OUTLINE),
        r(31, w + 1, 4, 1, OUTLINE),
        r(35, w + 2, 4, 1, OUTLINE),
        r(39, w + 3, 3, 1, OUTLINE),
        r(42, w + 4, 1, 8, OUTLINE),
        r(41, w + 12, 1, 2, OUTLINE),
        r(40, w + 14, 1, 2, OUTLINE),
        r(37, w + 16, 2, 1, OUTLINE),
        r(33, w + 17, 3, 1, OUTLINE),
        r(30, w + 18, 3, 1, OUTLINE),
        r(28, w + 18, 2, 1, OUTLINE),
        // Primary feathers (tips)
        r(36, w + 4, 6, 3, "#D8DCE0"),
        r(37, w + 7, 5, 2, "#C8D0D8"),
        r(38, w + 9, 4, 3, "#C0C8D0"),
        r(37, w + 12, 4, 2, "#B8C4D0"),
        r(36, w + 14, 3, 2, "#B0BCC8"),
        r(32, w + 16, 4, 1, "#B0BCC8"),
        // Secondary feathers
        r(32, w + 2, 4, 4, "#F0F2F5"),
        r(32, w + 6, 5, 4, "#E8ECF0"),
        r(33, w + 10, 4, 3, "#E0E4E8"),
        r(30, w + 13, 4, 3, "#D8DDE2"),
        // Covert feathers (near body) — white
        r(28, w + 1, 4, 3, "#FFFFFF"),
        r(26, w + 4, 5, 4, "#FAFBFC"),
        r(26, w + 8, 4, 4, "#F5F6F8"),
        r(26, w + 12, 3, 4, "#F0F2F4"),
        r(26, w + 16, 2, 2, "#ECEEF0"),
        // Bright white highlights
        r(32, w + 2, 3, 2, "#FFFFFF"),
        r(28, w + 1, 3, 2, "#FFFFFF"),
        r(39, w + 4, 2, 2, "#F0F4F8"),
        // Feather lines
        r(37, w + 5, 1, 4, "#D0D4D8"),
        r(34, w + 3, 1, 4, "#D8DCE0"),
        r(31, w + 6, 1, 4, "#E0E4E8"),
        r(29, w + 10, 1, 4, "#E8ECF0"),
      ];
    }

    case "staff": {
      // Staff lower shaft — positioned based on hand grip
      const g = staffGrip(pose);
      const sx = g.x; // shaft x (left edge)
      return [
        r(sx, g.y, 1, 48 - g.y, OUTLINE),
        r(sx + 3, g.y, 1, 48 - g.y, OUTLINE),
        r(sx + 1, g.y, 2, 48 - g.y - 2, "#B8885C"),
        r(sx + 1, g.y, 1, Math.min(8, 48 - g.y), "#C89868"),
        r(sx + 2, g.y + 8, 1, Math.max(0, 48 - g.y - 10), "#A07848"),
        r(sx + 1, 46, 2, 2, "#8B6840"),
        r(sx, 48, 4, 1, OUTLINE),
      ];
    }

    case "unicorn_horn": {
      // Horn starts at the top of whatever is highest — hair or head
      const topY = hairTopY(hairStyle);
      const hornH = 10; // horn is 10px tall
      const hornTop = topY - hornH;
      return [
        // Horn outline
        r(15, hornTop, 2, 1, OUTLINE),
        r(14, hornTop + 1, 1, 1, OUTLINE),
        r(17, hornTop + 1, 1, 1, OUTLINE),
        r(13, hornTop + 2, 1, hornH - 2, OUTLINE),
        r(18, hornTop + 2, 1, hornH - 2, OUTLINE),
        r(14, topY, 4, 2, OUTLINE),
        // Horn fill
        r(14, hornTop + 1, 3, 1, "#FFF8DC"),
        r(14, hornTop + 2, 4, hornH - 1, "#FFF8DC"),
        // Spiral gold stripes (every other row)
        ...Array.from({ length: Math.floor(hornH / 2) }, (_, i) => {
          const sy = hornTop + 2 + i * 2;
          return i % 2 === 0
            ? r(14, sy, 2, 1, "#FFD700")
            : r(16, sy, 2, 1, "#FFD700");
        }),
        // Highlights
        r(15, hornTop + 1, 1, 1, "#FFFFFF"),
        r(15, hornTop + 3, 1, 1, "#FFFFFF"),
        r(15, hornTop + 5, 1, 1, "#FFFFFF"),
        r(15, hornTop + 7, 1, 1, "#FFFFFF"),
        // Sparkles
        r(11, hornTop + 2, 1, 1, "#FFFFFF"),
        r(20, hornTop + 4, 1, 1, "#FFFFFF"),
        r(12, hornTop + 6, 1, 1, "#FFD700"),
        r(19, hornTop + 2, 1, 1, "#FFD700"),
      ];
    }

    case "cape":
      return [
        // Flowing cape behind body
        r(4, 25, 1, 18, OUTLINE),
        r(27, 25, 1, 18, OUTLINE),
        r(5, 43, 22, 1, OUTLINE),
        r(5, 25, 22, 18, "#B22222"),
        r(7, 25, 8, 6, "#DC2626"),
        r(5, 37, 22, 6, "#8B1818"),
        r(5, 25, 1, 18, "#FFD700"),
        r(26, 25, 1, 18, "#FFD700"),
        r(5, 42, 22, 1, "#FFD700"),
        r(12, 28, 1, 12, "#8B1818"),
        r(19, 28, 1, 12, "#8B1818"),
        r(10, 25, 12, 1, "#FFD700"),
        r(14, 25, 4, 1, "#FFEC8B"),
      ];

    case "sword": {
      // Diagonal sword on back — handle at right shoulder, blade going up-left
      return [
        // === BLADE (silver, going up-left from crossguard) ===
        // Blade outline
        r(10, -2, 2, 1, OUTLINE),
        r(9, -1, 1, 1, OUTLINE),
        r(12, -1, 1, 1, OUTLINE),
        r(8, 0, 1, 14, OUTLINE),
        r(13, 0, 1, 14, OUTLINE),
        // Blade tip (pointed top)
        r(10, -2, 2, 2, "#E0E8F0"),
        // Blade body
        r(9, 0, 4, 14, "#C0C8D0"),
        // Blade highlight (left edge catch light)
        r(9, 0, 1, 12, "#E0E8F0"),
        // Blade shadow (right edge)
        r(12, 2, 1, 12, "#A0A8B0"),
        // Blade center fuller (groove)
        r(10, 1, 2, 11, "#D0D8E0"),
        r(11, 1, 1, 11, "#B0B8C0"),

        // === CROSSGUARD (gold, horizontal) ===
        r(6, 14, 10, 1, OUTLINE),
        r(6, 17, 10, 1, OUTLINE),
        r(6, 14, 1, 3, OUTLINE),
        r(15, 14, 1, 3, OUTLINE),
        r(7, 15, 8, 2, "#FFD700"),
        r(7, 15, 4, 1, "#FFEC8B"),
        r(11, 16, 4, 1, "#B8960C"),

        // === HANDLE (brown, wrapped) ===
        r(8, 18, 1, 8, OUTLINE),
        r(13, 18, 1, 8, OUTLINE),
        r(9, 18, 4, 8, "#6B4420"),
        // Lighter wrap detail (alternating bands)
        r(9, 19, 4, 1, "#8B6340"),
        r(9, 21, 4, 1, "#8B6340"),
        r(9, 23, 4, 1, "#8B6340"),
        // Handle shadow
        r(12, 18, 1, 8, "#5A3818"),

        // === POMMEL (gold circle at bottom of handle) ===
        r(9, 26, 4, 1, OUTLINE),
        r(8, 27, 1, 2, OUTLINE),
        r(13, 27, 1, 2, OUTLINE),
        r(9, 29, 4, 1, OUTLINE),
        r(9, 27, 4, 2, "#FFD700"),
        r(10, 27, 2, 1, "#FFEC8B"),
      ];
    }

    case "shield": {
      // Round shield behind body, centered on torso
      const cx = 11; // left edge of 10-wide shield centered on 32-wide grid
      const cy = 24; // top edge, centered on torso
      return [
        // === OUTLINE (rounded rectangle with staircase corners) ===
        r(cx + 2, cy, 6, 1, OUTLINE),
        r(cx + 1, cy + 1, 1, 1, OUTLINE),
        r(cx + 8, cy + 1, 1, 1, OUTLINE),
        r(cx, cy + 2, 1, 6, OUTLINE),
        r(cx + 9, cy + 2, 1, 6, OUTLINE),
        r(cx + 1, cy + 8, 1, 1, OUTLINE),
        r(cx + 8, cy + 8, 1, 1, OUTLINE),
        r(cx + 2, cy + 9, 6, 1, OUTLINE),

        // === GOLD RIM (1px inside outline) ===
        r(cx + 2, cy + 1, 6, 1, "#FFD700"),
        r(cx + 1, cy + 2, 1, 6, "#FFD700"),
        r(cx + 8, cy + 2, 1, 6, "#FFD700"),
        r(cx + 2, cy + 8, 6, 1, "#FFD700"),
        // Corner rim pixels
        r(cx + 2, cy + 2, 1, 1, "#FFD700"),
        r(cx + 7, cy + 2, 1, 1, "#FFD700"),
        r(cx + 2, cy + 7, 1, 1, "#FFD700"),
        r(cx + 7, cy + 7, 1, 1, "#FFD700"),

        // === BLUE BASE (inner fill) ===
        r(cx + 2, cy + 2, 6, 6, "#2858D0"),
        // Lighter blue highlight (upper left area)
        r(cx + 3, cy + 3, 3, 2, "#3868E0"),

        // === CROSS EMBLEM (gold, centered) ===
        // Vertical bar of cross
        r(cx + 4, cy + 3, 2, 4, "#FFD700"),
        // Horizontal bar of cross
        r(cx + 3, cy + 4, 4, 2, "#FFD700"),
        // Cross highlight
        r(cx + 4, cy + 4, 2, 1, "#FFEC8B"),

        // === CENTER BOSS (gold circle) ===
        r(cx + 4, cy + 4, 2, 2, "#FFEC8B"),

        // === SHADOW (lower right) ===
        r(cx + 6, cy + 5, 2, 2, "#1E48A0"),
        r(cx + 4, cy + 7, 4, 1, "#1E48A0"),
      ];
    }

    default:
      return [];
  }
}

/** Accessories rendered on top of the face/head */
export function accessoryFrontPixels(accessory: string, hairStyle: string, pose: string): PixelRect[] {
  switch (accessory) {
    case "glasses":
    case "sunglasses":
      return [
        r(8, 12, 16, 1, "#4a4a4a"),
        r(8, 15, 6, 1, "#4a4a4a"),
        r(18, 15, 6, 1, "#4a4a4a"),
        r(8, 12, 1, 4, "#4a4a4a"),
        r(13, 12, 1, 4, "#4a4a4a"),
        r(18, 12, 1, 4, "#4a4a4a"),
        r(23, 12, 1, 4, "#4a4a4a"),
        r(14, 12, 4, 1, "#5a5a5a"),
        ...(accessory === "sunglasses" ? [
          r(9, 13, 4, 2, "#1a1a1a"),
          r(19, 13, 4, 2, "#1a1a1a"),
          r(9, 13, 1, 1, "#3a3a3a"),
          r(19, 13, 1, 1, "#3a3a3a"),
        ] : []),
      ];

    case "staff": {
      // Staff upper pole + crystal orb — positioned at hand grip
      const g = staffGrip(pose);
      const sx = g.x; // shaft x
      const orbY = g.y - 24; // orb sits 24px above grip
      const poleTop = orbY + 7; // pole starts below orb
      return [
        // Upper pole (from below orb to grip)
        r(sx, poleTop, 1, g.y - poleTop, OUTLINE),
        r(sx + 3, poleTop, 1, g.y - poleTop, OUTLINE),
        r(sx + 1, poleTop, 2, g.y - poleTop - 2, "#C89868"),
        r(sx + 1, poleTop, 1, Math.min(10, g.y - poleTop), "#D8A878"),
        r(sx + 2, poleTop + 10, 1, Math.max(0, g.y - poleTop - 12), "#B08050"),
        // Grip wrapping
        r(sx + 1, g.y - 4, 2, 1, "#E8C090"),
        r(sx + 1, g.y - 2, 2, 1, "#E8C090"),

        // Crystal orb on top
        r(sx - 2, orbY, 8, 1, OUTLINE),
        r(sx - 3, orbY + 1, 1, 1, OUTLINE),
        r(sx + 6, orbY + 1, 1, 1, OUTLINE),
        r(sx - 4, orbY + 2, 1, 4, OUTLINE),
        r(sx + 7, orbY + 2, 1, 4, OUTLINE),
        r(sx - 3, orbY + 6, 1, 1, OUTLINE),
        r(sx + 6, orbY + 6, 1, 1, OUTLINE),
        r(sx - 2, orbY + 7, 8, 1, OUTLINE),
        // Orb fill
        r(sx - 2, orbY + 1, 8, 1, "#7B68EE"),
        r(sx - 3, orbY + 2, 10, 4, "#7B68EE"),
        r(sx - 2, orbY + 6, 8, 1, "#7B68EE"),
        // Inner glow
        r(sx - 1, orbY + 2, 6, 3, "#9890FF"),
        r(sx, orbY + 2, 4, 2, "#B8B0FF"),
        // White sparkle
        r(sx, orbY + 2, 2, 1, "#FFFFFF"),
        r(sx - 1, orbY + 3, 1, 1, "#E0D8FF"),
        // Deep shadow
        r(sx - 2, orbY + 5, 8, 1, "#4840A0"),
      ];
    }

    case "hat_cap":
      return [
        r(6, 0, 20, 1, OUTLINE),
        r(5, 1, 1, 8, OUTLINE),
        r(26, 1, 1, 8, OUTLINE),
        r(6, 1, 20, 8, "#DC2626"),
        r(8, 1, 10, 3, "#F04040"),
        r(6, 8, 20, 1, "#9c1818"),
        r(0, 8, 6, 1, OUTLINE),
        r(1, 9, 5, 2, "#9c1818"),
        r(1, 9, 3, 1, "#DC2626"),
        // Side panels covering hair
        r(6, 9, 3, 5, "#DC2626"),
        r(6, 13, 2, 1, "#9c1818"),
        r(23, 9, 3, 5, "#DC2626"),
        r(24, 13, 2, 1, "#9c1818"),
      ];

    case "hat_beanie":
      return [
        r(7, -1, 18, 1, OUTLINE),
        r(6, 0, 1, 10, OUTLINE),
        r(25, 0, 1, 10, OUTLINE),
        r(12, -5, 8, 1, OUTLINE),
        r(10, -3, 1, 3, OUTLINE),
        r(21, -3, 1, 3, OUTLINE),
        r(12, -3, 8, 4, "#7C3AED"),
        r(14, -3, 4, 2, "#9F67FF"),
        r(7, 0, 18, 10, "#7C3AED"),
        r(7, 0, 18, 3, "#9F67FF"),
        r(7, 9, 18, 1, "#6820b0"),
        r(7, 3, 18, 1, "#6820b0"),
        r(7, 5, 18, 1, "#6820b0"),
        r(7, 7, 18, 1, "#6820b0"),
        r(7, 10, 3, 4, "#7C3AED"),
        r(7, 13, 2, 1, "#6820b0"),
        r(22, 10, 3, 4, "#7C3AED"),
        r(23, 13, 2, 1, "#6820b0"),
      ];

    case "hat_cowboy":
      return [
        r(0, 5, 32, 1, OUTLINE),
        r(1, 6, 30, 3, "#8B4513"),
        r(3, 6, 8, 2, "#A65D2E"),
        r(21, 6, 8, 2, "#A65D2E"),
        r(1, 8, 30, 1, "#5c2d0c"),
        r(7, -1, 18, 1, OUTLINE),
        r(6, 0, 1, 6, OUTLINE),
        r(25, 0, 1, 6, OUTLINE),
        r(7, 0, 18, 6, "#8B4513"),
        r(9, 0, 10, 3, "#A65D2E"),
        r(7, 5, 18, 1, "#5c2d0c"),
        r(7, 4, 18, 1, "#B8960C"),
        r(14, 4, 4, 1, "#FFD700"),
        r(7, 9, 3, 5, "#8B4513"),
        r(7, 13, 2, 1, "#5c2d0c"),
        r(22, 9, 3, 5, "#8B4513"),
        r(23, 13, 2, 1, "#5c2d0c"),
      ];

    case "crown":
      return [
        r(8, 2, 16, 1, OUTLINE),
        r(7, 3, 1, 5, OUTLINE),
        r(24, 3, 1, 5, OUTLINE),
        r(8, -1, 4, 1, OUTLINE),
        r(14, -3, 4, 1, OUTLINE),
        r(20, -1, 4, 1, OUTLINE),
        r(8, 3, 16, 5, "#FFD700"),
        r(10, 3, 8, 3, "#FFEC8B"),
        r(8, 7, 16, 1, "#B8960C"),
        r(8, 0, 4, 3, "#FFD700"),
        r(14, -2, 4, 5, "#FFD700"),
        r(20, 0, 4, 3, "#FFD700"),
        r(9, 0, 2, 2, "#FFEC8B"),
        r(15, -2, 2, 3, "#FFEC8B"),
        r(21, 0, 2, 2, "#FFEC8B"),
        r(16, 0, 1, 1, "#DC2626"),
        r(10, 5, 2, 2, "#2563EB"),
        r(20, 5, 2, 2, "#16A34A"),
      ];

    case "halo":
      return [
        r(6, -1, 20, 1, OUTLINE),
        r(7, 0, 18, 2, "#FFD700"),
        r(9, 0, 14, 1, "#FFEC8B"),
        r(12, 0, 8, 1, "#FFFFFF"),
        r(6, 2, 20, 1, OUTLINE),
      ];

    case "earrings":
      return [
        r(8, 16, 1, 3, "#FFD700"),
        r(8, 16, 1, 1, "#FFEC8B"),
        r(8, 18, 1, 1, "#FFFFFF"),
        r(23, 16, 1, 3, "#FFD700"),
        r(23, 16, 1, 1, "#FFEC8B"),
        r(23, 18, 1, 1, "#FFFFFF"),
      ];

    case "scarf":
      return [
        r(6, 24, 20, 3, "#DC2626"),
        r(8, 24, 8, 1, "#F04040"),
        r(6, 26, 20, 1, "#9c1818"),
        r(20, 27, 4, 5, "#DC2626"),
        r(20, 27, 2, 2, "#F04040"),
        r(20, 30, 4, 2, "#9c1818"),
        r(21, 32, 2, 1, "#9c1818"),
      ];

    case "necklace":
      return [
        r(11, 26, 1, 1, "#B8960C"),
        r(12, 26, 8, 1, "#B8960C"),
        r(20, 26, 1, 1, "#B8960C"),
        r(14, 27, 4, 2, "#FFD700"),
        r(14, 27, 2, 1, "#FFEC8B"),
        r(15, 28, 2, 1, "#FFFFFF"),
      ];

    case "witch_hat": {
      // Tall pointed witch/wizard hat sitting on head
      return [
        // === BRIM (wide, extends 3px beyond head on each side) ===
        // Head is roughly x=7-24, so brim is x=4-27
        r(4, 5, 24, 1, OUTLINE),       // brim top outline
        r(3, 6, 26, 1, OUTLINE),       // brim outline wider row
        r(3, 7, 26, 1, OUTLINE),       // brim bottom outline
        r(4, 6, 24, 1, "#3C1078"),     // brim fill top
        r(4, 7, 24, 1, "#2A0A58"),     // brim fill bottom (shadow)

        // === GOLD BUCKLE BAND (at brim line) ===
        r(12, 5, 8, 1, "#B8960C"),
        r(13, 4, 6, 1, "#FFD700"),
        r(14, 3, 4, 2, "#FFEC8B"),     // buckle highlight center
        r(13, 5, 6, 1, "#FFD700"),

        // === CONE BODY (narrowing from brim up to tip) ===
        // Layer at y=3-5 (base of cone, widest part above brim)
        r(8, 3, 16, 1, OUTLINE),       // outline top of this layer
        r(7, 4, 1, 2, OUTLINE),        // left outline
        r(24, 4, 1, 2, OUTLINE),       // right outline
        r(8, 4, 16, 2, "#3C1078"),     // fill
        r(9, 4, 6, 1, "#5C30A0"),      // highlight

        // Layer at y=0-3 (mid cone)
        r(10, 0, 12, 1, OUTLINE),
        r(9, 1, 1, 3, OUTLINE),
        r(22, 1, 1, 3, OUTLINE),
        r(10, 1, 12, 3, "#3C1078"),
        r(11, 1, 4, 2, "#5C30A0"),     // highlight

        // Layer at y=-4 to 0 (upper cone)
        r(12, -4, 8, 1, OUTLINE),
        r(11, -3, 1, 4, OUTLINE),
        r(20, -3, 1, 4, OUTLINE),
        r(12, -3, 8, 4, "#3C1078"),
        r(13, -3, 3, 2, "#5C30A0"),    // highlight

        // Layer at y=-7 to -4 (narrow upper)
        r(13, -7, 6, 1, OUTLINE),
        r(12, -6, 1, 3, OUTLINE),
        r(19, -6, 1, 3, OUTLINE),
        r(13, -6, 6, 3, "#3C1078"),
        r(14, -6, 2, 2, "#5C30A0"),

        // Layer at y=-9 to -7 (near tip)
        r(14, -9, 4, 1, OUTLINE),
        r(13, -8, 1, 2, OUTLINE),
        r(18, -8, 1, 2, OUTLINE),
        r(14, -8, 4, 2, "#3C1078"),
        r(15, -8, 1, 1, "#5C30A0"),

        // Tip at y=-10
        r(15, -10, 2, 1, OUTLINE),
        r(15, -10, 2, 1, "#5C30A0"),
      ];
    }

    case "viking_helm": {
      // Metal helmet covering top of head with curved horns
      return [
        // === HELMET DOME ===
        r(9, 2, 14, 1, OUTLINE),       // top outline
        r(8, 3, 1, 6, OUTLINE),        // left outline
        r(23, 3, 1, 6, OUTLINE),       // right outline
        r(8, 9, 16, 1, OUTLINE),       // bottom outline
        // Helmet fill
        r(9, 3, 14, 6, "#A0A8B0"),     // base steel
        r(10, 3, 8, 3, "#C0C8D0"),     // highlight dome top
        r(9, 7, 14, 2, "#707880"),     // shadow bottom

        // === NOSE GUARD (center strip) ===
        r(15, 9, 2, 5, OUTLINE),
        r(15, 9, 1, 4, "#A0A8B0"),
        r(16, 9, 1, 4, "#707880"),

        // === GOLD TRIM (bottom edge) ===
        r(8, 8, 16, 1, "#FFD700"),
        r(9, 8, 6, 1, "#FFEC8B"),

        // === LEFT HORN (curving outward and up) ===
        // Horn base at helmet side
        r(6, 4, 2, 3, OUTLINE),
        r(4, 3, 2, 3, OUTLINE),
        r(2, 2, 2, 2, OUTLINE),
        r(2, 0, 2, 2, OUTLINE),
        r(3, -1, 2, 1, OUTLINE),
        r(4, -2, 2, 1, OUTLINE),
        // Horn fill
        r(6, 5, 2, 2, "#C0C8D0"),
        r(4, 4, 2, 2, "#C0C8D0"),
        r(3, 2, 2, 2, "#C0C8D0"),
        r(3, 1, 2, 1, "#E0E4E8"),     // horn highlight
        r(4, -1, 1, 1, "#E0E4E8"),

        // === RIGHT HORN (mirror, curving outward and up) ===
        r(24, 4, 2, 3, OUTLINE),
        r(26, 3, 2, 3, OUTLINE),
        r(28, 2, 2, 2, OUTLINE),
        r(28, 0, 2, 2, OUTLINE),
        r(27, -1, 2, 1, OUTLINE),
        r(26, -2, 2, 1, OUTLINE),
        // Horn fill
        r(24, 5, 2, 2, "#C0C8D0"),
        r(26, 4, 2, 2, "#C0C8D0"),
        r(27, 2, 2, 2, "#C0C8D0"),
        r(27, 1, 2, 1, "#E0E4E8"),
        r(27, -1, 1, 1, "#E0E4E8"),

        // === RIVET DETAILS ===
        r(10, 8, 1, 1, "#FFD700"),
        r(21, 8, 1, 1, "#FFD700"),
      ];
    }

    case "headband": {
      // Fighter headband (Street Fighter style) across forehead
      return [
        // === MAIN BAND (across forehead y=8-9) ===
        r(7, 8, 18, 2, "#DC2626"),
        // Band outline top & bottom
        r(7, 7, 18, 1, OUTLINE),
        r(7, 10, 18, 1, OUTLINE),
        // Band highlight
        r(9, 8, 10, 1, "#F04040"),

        // === KNOT on left side ===
        r(5, 7, 2, 4, OUTLINE),       // knot outline
        r(5, 8, 2, 2, "#DC2626"),     // knot fill
        r(5, 8, 1, 1, "#F04040"),     // knot highlight

        // === TRAILING RIBBONS from knot ===
        r(3, 9, 2, 1, OUTLINE),
        r(2, 10, 2, 1, "#DC2626"),
        r(1, 11, 2, 1, "#DC2626"),
        r(1, 12, 1, 1, "#9c1818"),
        // Second ribbon
        r(4, 10, 2, 1, "#DC2626"),
        r(3, 11, 2, 1, "#DC2626"),
        r(3, 12, 1, 1, "#9c1818"),
        r(2, 13, 1, 1, "#9c1818"),
      ];
    }

    case "bow_tie": {
      // Cute bow tie at neck/collar area
      return [
        // === LEFT WING of bow ===
        r(10, 25, 1, 3, OUTLINE),      // left outline
        r(10, 25, 4, 1, OUTLINE),      // top outline
        r(10, 27, 4, 1, OUTLINE),      // bottom outline
        r(11, 25, 3, 3, "#DC2626"),    // left wing fill
        r(11, 25, 2, 1, "#F04040"),    // highlight

        // === CENTER KNOT ===
        r(14, 25, 1, 1, OUTLINE),
        r(14, 27, 1, 1, OUTLINE),
        r(14, 26, 1, 1, "#DC2626"),
        r(15, 25, 1, 1, OUTLINE),
        r(15, 27, 1, 1, OUTLINE),
        r(15, 26, 1, 1, "#F04040"),    // knot highlight

        // === RIGHT WING of bow ===
        r(16, 25, 4, 1, OUTLINE),      // top outline
        r(16, 27, 4, 1, OUTLINE),      // bottom outline
        r(19, 25, 1, 3, OUTLINE),      // right outline
        r(16, 25, 3, 3, "#DC2626"),    // right wing fill
        r(17, 25, 2, 1, "#F04040"),    // highlight
      ];
    }

    default:
      return [];
  }
}
