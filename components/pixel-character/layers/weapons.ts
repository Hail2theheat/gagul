// layers/weapons.ts — Held weapons rendered near character's hand
import { PixelRect } from "../types";
import { OUTLINE } from "../constants";

const r = (x: number, y: number, w: number, h: number, color: string): PixelRect => ({ x, y, w, h, color });

/** Returns the right hand grip position for each pose */
function weaponGrip(pose: string): { x: number; y: number } {
  switch (pose) {
    case "waving": return { x: 28, y: 30 };
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
    case "superhero": return { x: 28, y: 30 };
    case "ninja": return { x: 28, y: 28 };
    case "idle": default: return { x: 28, y: 30 };
  }
}

/** Weapons rendered near the character's hand */
export function weaponPixels(weapon: string, pose: string): PixelRect[] {
  const g = weaponGrip(pose);

  switch (weapon) {
    case "wooden_sword": {
      // Simple wooden practice sword
      const sx = g.x;
      return [
        // Blade (wooden)
        r(sx, g.y - 16, 1, 18, OUTLINE),
        r(sx + 3, g.y - 16, 1, 18, OUTLINE),
        r(sx + 1, g.y - 16, 2, 1, OUTLINE),
        r(sx + 1, g.y - 15, 2, 16, "#C89868"),   // wood body
        r(sx + 1, g.y - 15, 1, 14, "#D8A878"),   // highlight
        r(sx + 2, g.y - 5, 1, 8, "#B08050"),     // shadow
        // Crossguard (simple)
        r(sx - 1, g.y, 6, 1, OUTLINE),
        r(sx - 1, g.y + 1, 6, 1, "#A07848"),
        // Handle
        r(sx + 1, g.y + 2, 2, 4, "#6B4420"),
        r(sx + 1, g.y + 3, 1, 2, "#8B5A30"),     // wrap
      ];
    }

    case "dagger": {
      // Short curved dagger
      const sx = g.x;
      return [
        // Blade (short, silver)
        r(sx + 1, g.y - 10, 2, 1, OUTLINE),
        r(sx, g.y - 9, 1, 10, OUTLINE),
        r(sx + 3, g.y - 9, 1, 10, OUTLINE),
        r(sx + 1, g.y - 9, 2, 9, "#C0C8D0"),     // steel
        r(sx + 1, g.y - 9, 1, 7, "#E0E8F0"),     // highlight
        r(sx + 2, g.y - 5, 1, 5, "#A0A8B0"),     // shadow
        // Crossguard
        r(sx - 1, g.y, 6, 1, OUTLINE),
        r(sx, g.y, 4, 1, "#B8960C"),             // gold guard
        // Handle (wrapped leather)
        r(sx, g.y + 1, 1, 5, OUTLINE),
        r(sx + 3, g.y + 1, 1, 5, OUTLINE),
        r(sx + 1, g.y + 1, 2, 5, "#4A2810"),
        r(sx + 1, g.y + 2, 2, 1, "#6B3A1F"),     // wrap
        r(sx + 1, g.y + 4, 2, 1, "#6B3A1F"),
        // Pommel
        r(sx + 1, g.y + 6, 2, 1, "#B8960C"),
      ];
    }

    case "bow": {
      // Wooden bow with string
      const sx = g.x;
      return [
        // Bow limb (curved left side)
        r(sx - 3, g.y - 14, 1, 1, OUTLINE),
        r(sx - 4, g.y - 13, 1, 3, OUTLINE),
        r(sx - 5, g.y - 10, 1, 4, "#8B6840"),    // upper limb
        r(sx - 5, g.y - 6, 1, 4, "#8B6840"),     // mid
        r(sx - 4, g.y - 2, 1, 4, "#8B6840"),     // lower limb
        r(sx - 3, g.y + 2, 1, 3, OUTLINE),
        r(sx - 3, g.y + 5, 1, 1, OUTLINE),
        // Bow wood highlight
        r(sx - 4, g.y - 12, 1, 2, "#A08050"),
        r(sx - 4, g.y - 1, 1, 2, "#A08050"),
        // Grip (center of bow)
        r(sx - 4, g.y - 3, 2, 4, "#6B4420"),
        r(sx - 3, g.y - 2, 1, 2, "#8B5A30"),
        // String (vertical line)
        r(sx - 2, g.y - 13, 1, 18, "#D8D8D0"),
        // Arrow nocked
        r(sx - 2, g.y - 4, 1, 1, "#C0C8D0"),     // arrowhead
        r(sx - 1, g.y - 4, 8, 1, "#8B6840"),     // arrow shaft
        r(sx + 5, g.y - 5, 1, 1, "#DC2626"),     // fletching
        r(sx + 5, g.y - 3, 1, 1, "#DC2626"),
      ];
    }

    case "battle_axe": {
      // Double-headed battle axe
      const sx = g.x;
      return [
        // Shaft
        r(sx + 1, g.y - 18, 1, 22, OUTLINE),
        r(sx + 2, g.y - 18, 1, 22, OUTLINE),
        r(sx + 1, g.y - 17, 2, 20, "#8B6840"),   // wood shaft
        r(sx + 1, g.y - 17, 1, 18, "#A08050"),   // highlight
        // Left axe head
        r(sx - 3, g.y - 16, 4, 1, OUTLINE),
        r(sx - 4, g.y - 15, 1, 6, OUTLINE),
        r(sx - 3, g.y - 15, 4, 6, "#A0A8B0"),    // steel
        r(sx - 2, g.y - 14, 2, 4, "#C0C8D0"),    // highlight
        r(sx - 3, g.y - 10, 4, 1, "#707880"),     // shadow edge
        r(sx - 3, g.y - 9, 4, 1, OUTLINE),
        // Right axe head
        r(sx + 3, g.y - 16, 4, 1, OUTLINE),
        r(sx + 7, g.y - 15, 1, 6, OUTLINE),
        r(sx + 3, g.y - 15, 4, 6, "#A0A8B0"),
        r(sx + 4, g.y - 14, 2, 4, "#C0C8D0"),
        r(sx + 3, g.y - 10, 4, 1, "#707880"),
        r(sx + 3, g.y - 9, 4, 1, OUTLINE),
        // Pommel
        r(sx, g.y + 3, 4, 1, "#B8960C"),
      ];
    }

    case "trident": {
      // Three-pronged trident
      const sx = g.x;
      return [
        // Shaft
        r(sx + 1, g.y - 10, 1, 14, OUTLINE),
        r(sx + 2, g.y - 10, 1, 14, OUTLINE),
        r(sx + 1, g.y - 9, 2, 12, "#20B2AA"),    // teal shaft
        r(sx + 1, g.y - 9, 1, 10, "#40D2CA"),    // highlight
        // Center prong
        r(sx + 1, g.y - 18, 2, 9, OUTLINE),
        r(sx + 1, g.y - 17, 1, 7, "#C0C8D0"),    // steel
        r(sx + 1, g.y - 17, 1, 5, "#E0E8F0"),
        // Left prong
        r(sx - 2, g.y - 15, 1, 6, OUTLINE),
        r(sx - 1, g.y - 14, 1, 5, "#C0C8D0"),
        r(sx - 1, g.y - 14, 1, 3, "#E0E8F0"),
        r(sx - 2, g.y - 16, 1, 1, OUTLINE),       // prong tip
        // Right prong
        r(sx + 4, g.y - 15, 1, 6, OUTLINE),
        r(sx + 3, g.y - 14, 1, 5, "#C0C8D0"),
        r(sx + 3, g.y - 14, 1, 3, "#E0E8F0"),
        r(sx + 4, g.y - 16, 1, 1, OUTLINE),
        // Cross bar connecting prongs
        r(sx - 1, g.y - 10, 5, 1, "#B8960C"),
        r(sx, g.y - 10, 3, 1, "#FFD700"),
      ];
    }

    case "flame_sword": {
      // Fiery magical sword
      const sx = g.x;
      return [
        // Blade
        r(sx, g.y - 18, 1, 18, OUTLINE),
        r(sx + 3, g.y - 18, 1, 18, OUTLINE),
        r(sx + 1, g.y - 18, 2, 1, OUTLINE),
        r(sx + 1, g.y - 17, 2, 16, "#C0C8D0"),   // steel base
        r(sx + 1, g.y - 17, 1, 14, "#E0E8F0"),   // highlight
        // Flame enchantment on blade
        r(sx + 1, g.y - 16, 1, 2, "#FF6B35"),
        r(sx + 2, g.y - 14, 1, 2, "#FFD700"),
        r(sx + 1, g.y - 12, 1, 2, "#FF6B35"),
        r(sx + 2, g.y - 10, 1, 2, "#DC2626"),
        r(sx + 1, g.y - 8, 1, 2, "#FFD700"),
        r(sx + 2, g.y - 6, 1, 2, "#FF6B35"),
        // Flame wisps at blade tip
        r(sx, g.y - 20, 1, 2, "#FFD700"),
        r(sx + 1, g.y - 21, 1, 3, "#FF6B35"),
        r(sx + 2, g.y - 20, 1, 2, "#FFEC8B"),
        r(sx + 3, g.y - 19, 1, 1, "#FF8C42"),
        // Crossguard (red hot)
        r(sx - 1, g.y, 6, 1, OUTLINE),
        r(sx - 1, g.y + 1, 6, 1, "#DC2626"),
        r(sx, g.y + 1, 2, 1, "#FF6B35"),
        // Handle
        r(sx, g.y + 2, 1, 5, OUTLINE),
        r(sx + 3, g.y + 2, 1, 5, OUTLINE),
        r(sx + 1, g.y + 2, 2, 5, "#4A2810"),
        r(sx + 1, g.y + 3, 2, 1, "#6B3A1F"),
        // Pommel (glowing ember)
        r(sx + 1, g.y + 7, 2, 1, "#FF6B35"),
      ];
    }

    case "celestial_staff": {
      // Glowing cosmic staff with star orb
      const sx = g.x;
      const orbY = g.y - 24;
      const poleTop = orbY + 8;
      return [
        // Staff pole
        r(sx, poleTop, 1, g.y - poleTop, OUTLINE),
        r(sx + 3, poleTop, 1, g.y - poleTop, OUTLINE),
        r(sx + 1, poleTop, 2, g.y - poleTop - 2, "#9370DB"),   // purple staff
        r(sx + 1, poleTop, 1, 10, "#B090E0"),    // highlight
        r(sx + 2, poleTop + 10, 1, Math.max(0, g.y - poleTop - 12), "#7B50C0"),
        // Star/crystal orb
        r(sx - 2, orbY + 1, 8, 1, OUTLINE),
        r(sx - 3, orbY + 2, 1, 1, OUTLINE),
        r(sx + 6, orbY + 2, 1, 1, OUTLINE),
        r(sx - 4, orbY + 3, 1, 3, OUTLINE),
        r(sx + 7, orbY + 3, 1, 3, OUTLINE),
        r(sx - 3, orbY + 6, 1, 1, OUTLINE),
        r(sx + 6, orbY + 6, 1, 1, OUTLINE),
        r(sx - 2, orbY + 7, 8, 1, OUTLINE),
        // Orb fill (deep blue cosmic)
        r(sx - 2, orbY + 2, 8, 1, "#1E3A8A"),
        r(sx - 3, orbY + 3, 10, 3, "#1E3A8A"),
        r(sx - 2, orbY + 6, 8, 1, "#1E3A8A"),
        // Star inside
        r(sx + 1, orbY + 2, 2, 1, "#FFFFFF"),
        r(sx, orbY + 3, 4, 2, "#FFEC8B"),
        r(sx + 1, orbY + 5, 2, 1, "#FFFFFF"),
        // Cosmic sparkles
        r(sx - 2, orbY + 3, 1, 1, "#FFFFFF"),
        r(sx + 5, orbY + 4, 1, 1, "#FFFFFF"),
        r(sx - 1, orbY + 5, 1, 1, "#B0C4FF"),
        r(sx + 4, orbY + 2, 1, 1, "#B0C4FF"),
        // Glow around orb
        r(sx - 1, orbY, 1, 1, "#B0C4FF"),
        r(sx + 4, orbY, 1, 1, "#B0C4FF"),
        r(sx - 5, orbY + 4, 1, 1, "#FFEC8B"),
        r(sx + 8, orbY + 4, 1, 1, "#FFEC8B"),
      ];
    }

    default:
      return [];
  }
}
