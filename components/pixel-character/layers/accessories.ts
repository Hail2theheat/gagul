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

    // === SEASONAL ACCESSORIES (back layer) ===
    case "butterfly_wings": {
      // Colorful butterfly wings behind character
      const wy = TORSO_TOP - 2;
      return [
        // Left wing
        r(0, wy, 8, 10, "#FF69B4"),
        r(1, wy + 1, 6, 8, "#FF85C2"),
        r(2, wy + 2, 2, 2, "#FFB0D0"),
        r(0, wy + 6, 3, 2, "#E050A0"),
        r(-2, wy + 2, 3, 6, "#FF50A0"),
        // Right wing
        r(24, wy, 8, 10, "#FF69B4"),
        r(25, wy + 1, 6, 8, "#FF85C2"),
        r(28, wy + 2, 2, 2, "#FFB0D0"),
        r(29, wy + 6, 3, 2, "#E050A0"),
        r(31, wy + 2, 3, 6, "#FF50A0"),
        // Wing spots
        r(3, wy + 4, 2, 2, "#4080FF"),
        r(27, wy + 4, 2, 2, "#4080FF"),
      ];
    }

    case "surfboard": {
      // Surfboard behind character, angled
      return [
        // Board body
        r(26, 18, 4, 30, OUTLINE),
        r(27, 16, 2, 2, OUTLINE),
        r(27, 19, 2, 28, "#40B8E0"),
        r(28, 20, 1, 24, "#60D0F0"),
        r(27, 30, 2, 4, "#FFFFFF"),   // stripe
        r(27, 36, 2, 2, "#FF6B35"),   // accent stripe
        // Fin
        r(28, 46, 2, 2, "#40B8E0"),
      ];
    }

    case "camping_backpack": {
      // Backpack behind character, anchored to torso
      return [
        // Main backpack body (behind torso)
        r(24, 26, 10, 14, OUTLINE),
        r(25, 27, 8, 12, "#6B4423"),   // leather brown
        r(26, 28, 6, 4, "#8B6914"),    // front pocket
        r(27, 29, 4, 2, "#A08030"),    // pocket highlight
        r(25, 27, 2, 10, "#7D5428"),   // side highlight
        // Straps
        r(24, 27, 1, 8, "#5C3A1E"),
        r(33, 27, 1, 8, "#5C3A1E"),
        // Top flap
        r(25, 26, 8, 2, "#7D5428"),
        r(26, 26, 6, 1, "#8B7030"),
        // Buckle
        r(28, 32, 2, 1, "#FFD700"),
        // Bedroll on top
        r(26, 24, 6, 3, OUTLINE),
        r(27, 24, 4, 2, "#808060"),
        r(27, 24, 2, 1, "#909070"),
      ];
    }

    case "tiny_wings": {
      // Small fairy-like wings behind character (smaller than regular wings)
      const wy = TORSO_TOP - 1;
      return [
        // Left wing
        r(2, wy + 2, 5, 6, OUTLINE),
        r(3, wy + 3, 3, 4, "#B0C4FF"),
        r(3, wy + 3, 2, 2, "#D0E0FF"),
        r(4, wy + 4, 1, 1, "#FFFFFF"),
        // Right wing
        r(25, wy + 2, 5, 6, OUTLINE),
        r(26, wy + 3, 3, 4, "#B0C4FF"),
        r(27, wy + 3, 2, 2, "#D0E0FF"),
        r(27, wy + 4, 1, 1, "#FFFFFF"),
        // Sparkle accents
        r(1, wy + 4, 1, 1, "#FFFFFF"),
        r(30, wy + 3, 1, 1, "#FFFFFF"),
      ];
    }

    case "golden_cape": {
      // Flowing golden cape behind character
      return [
        // Cape outline
        r(6, 26, 1, 18, OUTLINE),
        r(25, 26, 1, 18, OUTLINE),
        r(6, 44, 20, 1, OUTLINE),
        // Cape body — rich gold
        r(7, 26, 18, 17, "#B8960C"),
        // Gold shimmer stripes
        r(8, 27, 4, 15, "#FFD700"),
        r(14, 28, 3, 14, "#FFEC8B"),
        r(20, 27, 4, 15, "#FFD700"),
        // Dark folds
        r(12, 28, 2, 14, "#8B6914"),
        r(18, 29, 1, 13, "#8B6914"),
        // Bottom scallop
        r(7, 42, 3, 1, "#FFD700"),
        r(12, 43, 3, 1, "#FFD700"),
        r(17, 42, 3, 1, "#FFD700"),
        r(22, 43, 2, 1, "#FFD700"),
        // Clasp at neck
        r(10, 25, 12, 2, OUTLINE),
        r(11, 25, 10, 1, "#FFD700"),
        r(15, 25, 2, 1, "#DC2626"), // ruby
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

    // === SEASONAL ACCESSORIES (front layer) ===
    case "winter_scarf": {
      // Cozy knit scarf
      return [
        r(6, 24, 20, 3, "#DC2626"),    // main scarf
        r(8, 24, 8, 1, "#F04040"),     // highlight stripe
        r(18, 24, 4, 1, "#F04040"),
        r(6, 26, 20, 1, "#9c1818"),    // bottom shadow
        // Knit pattern dots
        r(9, 25, 1, 1, "#FFFFFF"),
        r(13, 25, 1, 1, "#FFFFFF"),
        r(17, 25, 1, 1, "#FFFFFF"),
        r(21, 25, 1, 1, "#FFFFFF"),
        // Dangling end
        r(20, 27, 4, 6, "#DC2626"),
        r(20, 27, 2, 2, "#F04040"),
        r(20, 31, 4, 2, "#9c1818"),
        r(21, 33, 2, 1, "#9c1818"),
        // Fringe
        r(20, 33, 1, 2, "#DC2626"),
        r(22, 33, 1, 2, "#DC2626"),
      ];
    }

    case "snow_goggles": {
      // Ski goggles over eyes
      return [
        // Strap
        r(7, 12, 18, 1, "#333333"),
        // Left lens
        r(9, 11, 6, 4, OUTLINE),
        r(10, 12, 4, 2, "#80D0FF"),    // blue lens
        r(10, 12, 2, 1, "#B0E8FF"),    // lens highlight
        // Right lens
        r(17, 11, 6, 4, OUTLINE),
        r(18, 12, 4, 2, "#80D0FF"),
        r(18, 12, 2, 1, "#B0E8FF"),
        // Bridge
        r(15, 12, 2, 2, "#333333"),
      ];
    }

    case "earmuffs": {
      // Fluffy earmuffs
      return [
        // Headband
        r(8, 6, 16, 1, "#333333"),
        r(7, 7, 1, 1, "#333333"),
        r(24, 7, 1, 1, "#333333"),
        // Left muff
        r(5, 12, 5, 6, OUTLINE),
        r(6, 13, 3, 4, "#E0E0E0"),
        r(6, 13, 2, 2, "#F5F5F5"),
        // Right muff
        r(22, 12, 5, 6, OUTLINE),
        r(23, 13, 3, 4, "#E0E0E0"),
        r(23, 13, 2, 2, "#F5F5F5"),
      ];
    }

    case "flower_crown": {
      // Ring of flowers on head
      const topY = hairTopY(hairStyle);
      return [
        // Vine base
        r(7, topY + 2, 18, 1, "#228B22"),
        // Flowers
        r(8, topY + 1, 2, 2, "#FF69B4"),    // pink
        r(9, topY + 1, 1, 1, "#FFD700"),    // center
        r(12, topY, 2, 2, "#FFFFFF"),         // white
        r(13, topY, 1, 1, "#FFD700"),
        r(16, topY + 1, 2, 2, "#FF6B35"),   // orange
        r(17, topY + 1, 1, 1, "#FFD700"),
        r(20, topY, 2, 2, "#9370DB"),        // purple
        r(21, topY, 1, 1, "#FFD700"),
        // Leaves
        r(10, topY + 2, 2, 1, "#32CD32"),
        r(18, topY + 2, 2, 1, "#32CD32"),
      ];
    }

    case "rain_boots": {
      // Yellow rubber rain boots
      return [
        // Left boot
        r(9, 40, 6, 8, OUTLINE),
        r(10, 41, 4, 6, "#FFD700"),    // yellow rubber
        r(10, 41, 2, 3, "#FFEC8B"),    // highlight
        r(10, 46, 4, 1, "#B8960C"),    // sole
        // Right boot
        r(17, 40, 6, 8, OUTLINE),
        r(18, 41, 4, 6, "#FFD700"),
        r(18, 41, 2, 3, "#FFEC8B"),
        r(18, 46, 4, 1, "#B8960C"),
      ];
    }

    case "lei": {
      // Hawaiian flower lei around neck
      return [
        r(8, 25, 16, 2, "#228B22"),     // vine
        // Flowers around neck
        r(8, 25, 2, 2, "#FF69B4"),
        r(11, 25, 2, 2, "#FFD700"),
        r(14, 25, 2, 2, "#FF6B35"),
        r(17, 25, 2, 2, "#FF69B4"),
        r(20, 25, 2, 2, "#FFD700"),
        // Hanging part
        r(12, 27, 2, 3, "#228B22"),
        r(12, 27, 2, 1, "#FF6B35"),
        r(12, 29, 2, 1, "#FF69B4"),
      ];
    }

    case "beach_hat": {
      // Straw beach hat
      const topY = hairTopY(hairStyle);
      return [
        // Wide brim
        r(2, topY + 2, 28, 1, OUTLINE),
        r(1, topY + 3, 30, 1, OUTLINE),
        r(2, topY + 4, 28, 1, OUTLINE),
        r(3, topY + 3, 26, 1, "#F0E68C"),   // straw
        // Crown
        r(8, topY - 2, 16, 5, OUTLINE),
        r(9, topY - 1, 14, 3, "#F0E68C"),
        r(10, topY - 1, 6, 2, "#F5EE9E"),   // highlight
        // Ribbon
        r(9, topY + 1, 14, 1, "#FF6B35"),
        r(12, topY + 1, 4, 1, "#FF8C42"),
      ];
    }

    case "leaf_crown": {
      // Autumn leaves crown
      const topY = hairTopY(hairStyle);
      return [
        // Vine
        r(7, topY + 2, 18, 1, "#8B4513"),
        // Leaves in autumn colors
        r(7, topY, 3, 2, "#DC2626"),     // red leaf
        r(11, topY + 1, 3, 2, "#FF8C00"),  // orange leaf
        r(15, topY, 3, 2, "#FFD700"),    // gold leaf
        r(19, topY + 1, 3, 2, "#DC2626"), // red leaf
        r(23, topY, 2, 2, "#FF8C00"),    // orange leaf
        // Stems
        r(8, topY + 2, 1, 1, "#654321"),
        r(16, topY + 2, 1, 1, "#654321"),
      ];
    }

    case "pumpkin_hat": {
      // Cute pumpkin on head
      const topY = hairTopY(hairStyle);
      return [
        // Pumpkin body
        r(9, topY - 4, 14, 1, OUTLINE),
        r(8, topY - 3, 16, 5, OUTLINE),
        r(9, topY - 3, 14, 4, "#FF6B35"),   // orange
        r(10, topY - 3, 4, 3, "#FF8C42"),   // highlight
        r(17, topY - 2, 3, 2, "#E05520"),   // shadow
        // Ridges
        r(13, topY - 3, 1, 4, "#E05520"),
        r(18, topY - 3, 1, 4, "#E05520"),
        // Stem
        r(15, topY - 6, 2, 3, "#228B22"),
        r(14, topY - 5, 1, 1, "#32CD32"),   // leaf
        // Face
        r(11, topY - 1, 2, 1, "#1a1a1a"),   // left eye
        r(19, topY - 1, 2, 1, "#1a1a1a"),   // right eye
        r(14, topY, 4, 1, "#1a1a1a"),        // mouth
      ];
    }

    case "cozy_sweater": {
      // Knit sweater over torso (front layer covers shirt)
      return [
        // Main sweater body
        r(7, 27, 18, 7, "#8B4513"),
        r(8, 27, 6, 4, "#A0522D"),     // highlight
        r(16, 28, 4, 3, "#7B3A10"),    // shadow
        // Collar
        r(10, 26, 12, 2, "#8B4513"),
        r(11, 26, 10, 1, "#A0522D"),
        // Knit pattern (zigzag)
        r(8, 29, 1, 1, "#FFD700"),
        r(10, 30, 1, 1, "#FFD700"),
        r(12, 29, 1, 1, "#FFD700"),
        r(14, 30, 1, 1, "#FFD700"),
        r(16, 29, 1, 1, "#FFD700"),
        r(18, 30, 1, 1, "#FFD700"),
        r(20, 29, 1, 1, "#FFD700"),
        r(22, 30, 1, 1, "#FFD700"),
        // Bottom ribbing
        r(7, 33, 18, 1, "#7B3A10"),
      ];
    }

    case "bandana": {
      // Tied bandana across forehead
      return [
        // Band across forehead
        r(7, 7, 18, 3, OUTLINE),
        r(8, 8, 16, 1, "#2563EB"),              // blue bandana
        r(10, 8, 8, 1, "#4080FF"),              // highlight
        // Knot on right side with trailing ends
        r(25, 7, 2, 3, "#2563EB"),
        r(27, 7, 1, 2, "#2563EB"),
        r(27, 9, 2, 1, "#2563EB"),
        r(28, 10, 2, 1, "#1845a8"),
        r(29, 11, 1, 1, "#1845a8"),
        r(26, 9, 2, 1, "#2563EB"),
        r(27, 10, 1, 1, "#1845a8"),
      ];
    }

    case "monocle": {
      // Fancy monocle on right eye with chain
      return [
        // Monocle rim (circle around right eye)
        r(17, 11, 7, 1, "#B8960C"),
        r(16, 12, 1, 3, "#B8960C"),
        r(24, 12, 1, 3, "#B8960C"),
        r(17, 15, 7, 1, "#B8960C"),
        // Lens (light blue tint)
        r(18, 12, 5, 3, "#E8F0FF"),
        r(19, 12, 2, 1, "#FFFFFF"),              // lens glint
        // Gold highlight on rim
        r(18, 11, 3, 1, "#FFD700"),
        r(18, 15, 3, 1, "#FFD700"),
        // Chain down to vest
        r(20, 16, 1, 1, "#B8960C"),
        r(21, 17, 1, 1, "#B8960C"),
        r(22, 18, 1, 2, "#B8960C"),
        r(21, 20, 1, 2, "#B8960C"),
        r(20, 22, 1, 2, "#B8960C"),
        r(19, 24, 1, 2, "#B8960C"),
      ];
    }

    case "war_paint": {
      // Tribal war paint on face
      return [
        // Left cheek stripe (red)
        r(8, 14, 3, 1, "#DC2626"),
        r(7, 15, 4, 1, "#DC2626"),
        r(8, 16, 3, 1, "#DC2626"),
        // Right cheek stripe
        r(21, 14, 3, 1, "#DC2626"),
        r(21, 15, 4, 1, "#DC2626"),
        r(21, 16, 3, 1, "#DC2626"),
        // Forehead mark (diamond)
        r(15, 8, 2, 1, "#DC2626"),
        r(14, 9, 4, 1, "#DC2626"),
        r(15, 10, 2, 1, "#DC2626"),
        // Under-eye marks
        r(10, 15, 2, 1, "#1a1a1a"),
        r(20, 15, 2, 1, "#1a1a1a"),
      ];
    }

    case "demon_horns": {
      // Curved demon horns from top of head
      const topY = hairTopY(hairStyle);
      return [
        // Left horn
        r(7, topY - 1, 2, 3, OUTLINE),
        r(5, topY - 3, 2, 3, OUTLINE),
        r(4, topY - 5, 2, 3, OUTLINE),
        r(3, topY - 7, 2, 2, OUTLINE),
        r(8, topY, 1, 2, "#8B1818"),
        r(6, topY - 2, 2, 2, "#DC2626"),
        r(5, topY - 4, 2, 2, "#DC2626"),
        r(4, topY - 6, 2, 2, "#F04040"),
        r(4, topY - 7, 1, 1, "#FF6060"),         // tip highlight
        // Right horn
        r(23, topY - 1, 2, 3, OUTLINE),
        r(25, topY - 3, 2, 3, OUTLINE),
        r(26, topY - 5, 2, 3, OUTLINE),
        r(27, topY - 7, 2, 2, OUTLINE),
        r(23, topY, 1, 2, "#8B1818"),
        r(24, topY - 2, 2, 2, "#DC2626"),
        r(25, topY - 4, 2, 2, "#DC2626"),
        r(26, topY - 6, 2, 2, "#F04040"),
        r(27, topY - 7, 1, 1, "#FF6060"),
      ];
    }

    case "fire_crown": {
      // Blazing fire crown on head
      return [
        // Crown base (gold)
        r(8, 3, 16, 4, "#FFD700"),
        r(8, 7, 16, 1, "#B8960C"),
        r(10, 3, 8, 2, "#FFEC8B"),
        // Crown spikes
        r(8, 0, 4, 3, "#FFD700"),
        r(14, -2, 4, 5, "#FFD700"),
        r(20, 0, 4, 3, "#FFD700"),
        // Fire on top of each spike
        r(9, -2, 2, 2, "#FF6B35"),
        r(9, -4, 1, 2, "#FFD700"),
        r(10, -3, 1, 1, "#FFEC8B"),
        r(15, -4, 2, 2, "#FF6B35"),
        r(15, -6, 1, 2, "#FFD700"),
        r(16, -5, 1, 1, "#FFEC8B"),
        r(21, -2, 2, 2, "#FF6B35"),
        r(21, -4, 1, 2, "#FFD700"),
        r(22, -3, 1, 1, "#FFEC8B"),
        // Extra flame wisps
        r(12, -1, 1, 1, "#FF8C42"),
        r(19, -1, 1, 1, "#FF8C42"),
        // Gems (like regular crown)
        r(16, 1, 1, 1, "#DC2626"),
        r(10, 5, 2, 2, "#FF6B35"),
        r(20, 5, 2, 2, "#FF6B35"),
        // Outline
        r(8, 2, 16, 1, OUTLINE),
        r(7, 3, 1, 5, OUTLINE),
        r(24, 3, 1, 5, OUTLINE),
      ];
    }

    case "flame_aura": {
      // Orange glow outline around character silhouette
      return [
        // Top glow (above head)
        r(10, 4, 12, 1, "#FF6B35"),
        r(8, 5, 2, 1, "#FF8C42"),
        r(22, 5, 2, 1, "#FF8C42"),
        // Side glows
        r(6, 10, 1, 14, "#FF6B35"),
        r(5, 14, 1, 8, "#FF8C42"),
        r(25, 10, 1, 14, "#FF6B35"),
        r(26, 14, 1, 8, "#FF8C42"),
        // Torso glow
        r(5, 28, 1, 8, "#FF6B35"),
        r(26, 28, 1, 8, "#FF6B35"),
        // Flicker accents
        r(9, 2, 1, 1, "#FFEC8B"),
        r(22, 3, 1, 1, "#FFEC8B"),
        r(4, 18, 1, 1, "#FFD700"),
        r(27, 20, 1, 1, "#FFD700"),
      ];
    }

    case "hiking_boots": {
      // Rugged brown boots replacing the shoe area (rendered on top)
      return [
        // Left boot
        r(9, 42, 6, 6, OUTLINE),
        r(10, 42, 4, 5, "#6B3A1F"),   // dark leather
        r(10, 42, 2, 3, "#8B5A30"),   // leather highlight
        r(10, 46, 4, 1, "#5C2D0C"),   // sole
        r(8, 46, 1, 1, "#5C2D0C"),    // toe cap
        r(10, 44, 3, 1, "#A07040"),   // lace line
        // Right boot
        r(17, 42, 6, 6, OUTLINE),
        r(18, 42, 4, 5, "#6B3A1F"),
        r(18, 42, 2, 3, "#8B5A30"),
        r(18, 46, 4, 1, "#5C2D0C"),
        r(16, 46, 1, 1, "#5C2D0C"),
        r(18, 44, 3, 1, "#A07040"),
      ];
    }

    case "marshmallow_stick": {
      // Held marshmallow on a stick — extends from right hand
      const g = staffGrip(pose);
      return [
        // Stick
        r(g.x, g.y - 12, 1, 14, "#8B6840"),
        r(g.x + 1, g.y - 12, 1, 14, "#A07848"),
        // Marshmallow (slightly toasted)
        r(g.x - 1, g.y - 16, 4, 4, "#FFF8E7"),    // white marshmallow
        r(g.x, g.y - 16, 2, 1, "#FFFFFF"),          // top highlight
        r(g.x - 1, g.y - 13, 4, 1, "#D4A060"),     // toasted bottom
        r(g.x, g.y - 13, 2, 1, "#C08040"),          // darker toast
      ];
    }

    case "ranger_hat": {
      // Wide-brimmed park ranger hat
      const topY = hairTopY(hairStyle);
      return [
        // Brim outline
        r(4, topY + 2, 24, 1, OUTLINE),
        r(3, topY + 3, 26, 1, OUTLINE),
        r(4, topY + 4, 24, 1, OUTLINE),
        // Brim fill
        r(5, topY + 3, 22, 1, "#8B6914"),
        // Crown
        r(8, topY - 3, 16, 1, OUTLINE),
        r(7, topY - 2, 18, 1, OUTLINE),
        r(7, topY - 1, 18, 1, OUTLINE),
        r(7, topY, 18, 1, OUTLINE),
        r(7, topY + 1, 18, 1, OUTLINE),
        r(7, topY + 2, 18, 1, OUTLINE),
        // Crown fill
        r(8, topY - 2, 16, 4, "#8B6914"),     // main hat body
        r(9, topY - 2, 6, 2, "#A08030"),      // left highlight
        r(17, topY - 1, 4, 2, "#7D5428"),     // right shadow
        // Pinch at top
        r(11, topY - 3, 10, 1, "#8B6914"),
        r(13, topY - 4, 6, 1, "#A08030"),
        // Hat band
        r(8, topY + 1, 16, 1, "#5C3A1E"),
        r(14, topY + 1, 4, 1, "#B8960C"),   // gold badge
      ];
    }

    default:
      return [];
  }
}
