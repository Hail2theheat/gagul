// layers/pets.ts — Companion pets rendered at character's feet
import { PixelRect } from "../types";
import { OUTLINE } from "../constants";

const r = (x: number, y: number, w: number, h: number, color: string): PixelRect => ({ x, y, w, h, color });

/** Pet companion rendered to the right of the character's feet */
export function petPixels(pet: string): PixelRect[] {
  switch (pet) {
    case "puppy": {
      // Small brown puppy sitting at feet
      const px = 27, py = 40;
      return [
        // Body
        r(px, py + 2, 6, 4, OUTLINE),
        r(px + 1, py + 3, 4, 2, "#B8885C"),     // brown fur
        r(px + 1, py + 3, 2, 1, "#D4A878"),     // highlight
        r(px + 1, py + 5, 4, 1, "#A07848"),     // belly shadow
        // Head
        r(px + 1, py, 4, 3, OUTLINE),
        r(px + 2, py + 1, 2, 1, "#B8885C"),     // face
        r(px + 2, py, 2, 1, "#D4A878"),         // forehead highlight
        // Ears (floppy)
        r(px, py, 1, 2, "#A07848"),
        r(px + 5, py, 1, 2, "#A07848"),
        // Eyes
        r(px + 2, py + 1, 1, 1, "#1a1a1a"),
        r(px + 3, py + 1, 1, 1, "#1a1a1a"),
        // Nose
        r(px + 2, py + 2, 2, 1, "#1a1a1a"),
        // Tail (wagging up)
        r(px + 6, py + 2, 1, 1, "#B8885C"),
        r(px + 7, py + 1, 1, 1, "#B8885C"),
      ];
    }

    case "kitten": {
      // Small gray kitten sitting
      const px = 27, py = 40;
      return [
        // Body
        r(px, py + 2, 6, 4, OUTLINE),
        r(px + 1, py + 3, 4, 2, "#A0A0A0"),     // gray fur
        r(px + 1, py + 3, 2, 1, "#C0C0C0"),     // highlight
        r(px + 1, py + 5, 4, 1, "#808080"),     // shadow
        // Head
        r(px + 1, py, 4, 3, OUTLINE),
        r(px + 2, py + 1, 2, 1, "#A0A0A0"),
        r(px + 2, py, 2, 1, "#C0C0C0"),
        // Ears (pointed)
        r(px + 1, py - 1, 1, 1, "#A0A0A0"),
        r(px + 4, py - 1, 1, 1, "#A0A0A0"),
        r(px + 1, py - 1, 1, 1, "#FF9090"),     // inner ear
        r(px + 4, py - 1, 1, 1, "#FF9090"),
        // Eyes
        r(px + 2, py + 1, 1, 1, "#32CD32"),     // green eyes
        r(px + 3, py + 1, 1, 1, "#32CD32"),
        // Nose
        r(px + 2, py + 2, 1, 1, "#FF69B4"),
        // Whiskers (subtle)
        r(px, py + 2, 1, 1, "#C0C0C0"),
        r(px + 5, py + 2, 1, 1, "#C0C0C0"),
        // Tail (curled up)
        r(px + 6, py + 3, 1, 1, "#A0A0A0"),
        r(px + 7, py + 2, 1, 1, "#A0A0A0"),
        r(px + 7, py + 1, 1, 1, "#A0A0A0"),
      ];
    }

    case "frog": {
      // Small green frog sitting
      const px = 28, py = 42;
      return [
        // Body (round)
        r(px, py + 1, 5, 3, OUTLINE),
        r(px + 1, py + 2, 3, 1, "#32CD32"),     // green body
        r(px + 1, py + 2, 2, 1, "#44E044"),     // highlight
        r(px + 1, py + 3, 3, 1, "#228B22"),     // belly
        // Head
        r(px + 1, py, 3, 2, OUTLINE),
        r(px + 2, py, 1, 1, "#32CD32"),
        r(px + 2, py + 1, 1, 1, "#44E044"),
        // Big eyes (bulging)
        r(px, py - 1, 2, 2, OUTLINE),
        r(px + 3, py - 1, 2, 2, OUTLINE),
        r(px + 1, py - 1, 1, 1, "#FFFFFF"),
        r(px + 1, py, 1, 1, "#1a1a1a"),          // pupil
        r(px + 3, py - 1, 1, 1, "#FFFFFF"),
        r(px + 3, py, 1, 1, "#1a1a1a"),
        // Front legs
        r(px, py + 4, 2, 1, "#228B22"),
        r(px + 3, py + 4, 2, 1, "#228B22"),
      ];
    }

    case "owl": {
      // Small owl perched near feet
      const px = 27, py = 38;
      return [
        // Body (round)
        r(px, py + 3, 6, 5, OUTLINE),
        r(px + 1, py + 4, 4, 3, "#8B6914"),     // brown feathers
        r(px + 1, py + 4, 2, 2, "#A08030"),     // highlight
        r(px + 2, py + 6, 2, 1, "#F5F5DC"),     // chest patch
        // Head (round)
        r(px + 1, py, 4, 4, OUTLINE),
        r(px + 2, py + 1, 2, 2, "#8B6914"),
        r(px + 2, py + 1, 1, 1, "#A08030"),
        // Ear tufts
        r(px + 1, py - 1, 1, 1, "#8B6914"),
        r(px + 4, py - 1, 1, 1, "#8B6914"),
        // Big round eyes
        r(px + 1, py + 1, 2, 2, "#FFD700"),     // golden eyes
        r(px + 3, py + 1, 2, 2, "#FFD700"),
        r(px + 2, py + 2, 1, 1, "#1a1a1a"),     // pupil
        r(px + 3, py + 2, 1, 1, "#1a1a1a"),
        // Beak
        r(px + 2, py + 3, 2, 1, "#E8A030"),
        // Feet/talons
        r(px + 1, py + 7, 2, 1, "#E8A030"),
        r(px + 3, py + 7, 2, 1, "#E8A030"),
      ];
    }

    case "fox": {
      // Small red fox sitting
      const px = 26, py = 39;
      return [
        // Body
        r(px, py + 3, 7, 4, OUTLINE),
        r(px + 1, py + 4, 5, 2, "#E06020"),     // orange fur
        r(px + 1, py + 4, 3, 1, "#FF7830"),     // highlight
        r(px + 3, py + 6, 2, 1, "#FFFFFF"),     // white belly tip
        // Head
        r(px + 1, py, 5, 4, OUTLINE),
        r(px + 2, py + 1, 3, 2, "#E06020"),
        r(px + 2, py + 1, 2, 1, "#FF7830"),
        // Pointy ears
        r(px + 1, py - 1, 1, 1, "#E06020"),
        r(px + 2, py - 2, 1, 1, "#E06020"),
        r(px + 4, py - 2, 1, 1, "#E06020"),
        r(px + 5, py - 1, 1, 1, "#E06020"),
        // Inner ears
        r(px + 2, py - 1, 1, 1, "#FF9060"),
        r(px + 4, py - 1, 1, 1, "#FF9060"),
        // Eyes
        r(px + 2, py + 1, 1, 1, "#FFD700"),     // amber
        r(px + 4, py + 1, 1, 1, "#FFD700"),
        // Nose
        r(px + 3, py + 2, 1, 1, "#1a1a1a"),
        // White muzzle
        r(px + 2, py + 2, 3, 1, "#FFFFFF"),
        // Bushy tail
        r(px + 7, py + 3, 2, 1, "#E06020"),
        r(px + 8, py + 2, 2, 1, "#E06020"),
        r(px + 9, py + 1, 1, 1, "#FFFFFF"),     // white tip
      ];
    }

    case "baby_dragon": {
      // Small green/teal dragon
      const px = 26, py = 37;
      return [
        // Body
        r(px, py + 4, 7, 5, OUTLINE),
        r(px + 1, py + 5, 5, 3, "#20B2AA"),     // teal scales
        r(px + 1, py + 5, 3, 2, "#40D2CA"),     // highlight
        r(px + 3, py + 7, 2, 1, "#80E0D8"),     // belly
        // Head
        r(px + 2, py + 1, 4, 4, OUTLINE),
        r(px + 3, py + 2, 2, 2, "#20B2AA"),
        r(px + 3, py + 2, 1, 1, "#40D2CA"),
        // Small horns
        r(px + 2, py, 1, 1, "#FFD700"),
        r(px + 5, py, 1, 1, "#FFD700"),
        // Eyes (glowing)
        r(px + 3, py + 2, 1, 1, "#FF6B35"),     // orange eyes
        r(px + 4, py + 2, 1, 1, "#FF6B35"),
        // Snout
        r(px + 3, py + 3, 2, 1, "#189898"),
        r(px + 4, py + 3, 1, 1, "#1a1a1a"),     // nostril
        // Small wings
        r(px - 1, py + 3, 2, 3, "#40D2CA"),
        r(px - 2, py + 4, 1, 2, "#60E0D8"),
        r(px + 7, py + 3, 2, 3, "#40D2CA"),
        r(px + 8, py + 4, 1, 2, "#60E0D8"),
        // Tail
        r(px + 7, py + 7, 1, 1, "#20B2AA"),
        r(px + 8, py + 6, 1, 1, "#20B2AA"),
        r(px + 9, py + 5, 1, 1, "#20B2AA"),
        // Tail flame
        r(px + 9, py + 4, 1, 1, "#FF6B35"),
      ];
    }

    case "phoenix": {
      // Small fire phoenix perched near feet
      const px = 25, py = 36;
      return [
        // Body (fiery)
        r(px + 1, py + 5, 7, 4, OUTLINE),
        r(px + 2, py + 6, 5, 2, "#FF6B35"),     // orange body
        r(px + 2, py + 6, 3, 1, "#FFD700"),     // golden highlight
        r(px + 4, py + 8, 2, 1, "#DC2626"),     // deep red belly
        // Head
        r(px + 3, py + 2, 4, 4, OUTLINE),
        r(px + 4, py + 3, 2, 2, "#FF6B35"),
        r(px + 4, py + 3, 1, 1, "#FFD700"),
        // Crest (flames on head)
        r(px + 4, py, 1, 2, "#FFD700"),
        r(px + 5, py - 1, 1, 2, "#FFEC8B"),
        r(px + 6, py, 1, 1, "#FF6B35"),
        r(px + 3, py + 1, 1, 1, "#FF8C42"),
        // Eyes
        r(px + 4, py + 3, 1, 1, "#FFFFFF"),
        r(px + 5, py + 3, 1, 1, "#FFFFFF"),
        // Beak
        r(px + 4, py + 4, 2, 1, "#B8960C"),
        // Wings (spread slightly)
        r(px - 1, py + 4, 3, 4, "#FF6B35"),
        r(px - 2, py + 5, 2, 2, "#FFD700"),
        r(px - 3, py + 6, 1, 1, "#FFEC8B"),     // wing tip glow
        r(px + 8, py + 4, 3, 4, "#FF6B35"),
        r(px + 9, py + 5, 2, 2, "#FFD700"),
        r(px + 11, py + 6, 1, 1, "#FFEC8B"),
        // Tail feathers (long, fiery)
        r(px + 3, py + 9, 1, 2, "#DC2626"),
        r(px + 5, py + 9, 1, 3, "#FF6B35"),
        r(px + 7, py + 9, 1, 2, "#FFD700"),
        r(px + 5, py + 11, 1, 1, "#FFEC8B"),    // tail tip glow
        // Sparkle accents
        r(px - 1, py + 3, 1, 1, "#FFEC8B"),
        r(px + 10, py + 3, 1, 1, "#FFEC8B"),
      ];
    }

    default:
      return [];
  }
}
