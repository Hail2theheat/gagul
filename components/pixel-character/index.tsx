// components/pixel-character/index.tsx
// HD-2D pixel art character renderer (32x48 grid, SVG-based)
import React, { useMemo, useState, useEffect, useRef } from "react";
import { CharacterConfig, PixelRect } from "./types";
import {
  SKIN_TONES,
  HAIR_COLORS,
  SHIRT_COLORS,
  PANTS_COLORS,
  SHOE_COLORS,
} from "./constants";
import { PixelRenderer } from "./renderer";
import { headPixels, neckPixels } from "./layers/head";
import { facePixels } from "./layers/face";
import { hairBackPixels, hairFrontPixels } from "./layers/hair";
import { bodyPixels } from "./layers/body";
import { armPixels } from "./layers/arms";
import { legPixels } from "./layers/legs";
import { shoePixels } from "./layers/shoes";
import { accessoryBackPixels, accessoryFrontPixels } from "./layers/accessories";
import { petPixels } from "./layers/pets";
import { weaponPixels } from "./layers/weapons";

// Weekly crown with sparkle (rendered on top when user is the weekly winner)
function weeklyCrownPixels(): PixelRect[] {
  const r = (x: number, y: number, w: number, h: number, color: string): PixelRect => ({ x, y, w, h, color });
  const OUTLINE = "#1a1a1a";
  return [
    // Crown (same as accessory crown)
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
    // Gems
    r(16, 0, 1, 1, "#DC2626"),
    r(10, 5, 2, 2, "#2563EB"),
    r(20, 5, 2, 2, "#16A34A"),
    // Sparkle accents (distinguishes weekly crown from purchased)
    r(6, -1, 1, 1, "#FFFFFF"),
    r(26, -2, 1, 1, "#FFFFFF"),
    r(5, 4, 1, 1, "#FFEC8B"),
    r(27, 3, 1, 1, "#FFEC8B"),
  ];
}

// Streak leader torch — held to the right of the character
function streakTorchPixels(): PixelRect[] {
  const r = (x: number, y: number, w: number, h: number, color: string): PixelRect => ({ x, y, w, h, color });
  return [
    // Wooden handle
    r(27, 19, 2, 8, "#6B3A1F"),
    r(28, 19, 1, 8, "#8B5A30"),
    // Handle cap
    r(26, 26, 4, 1, "#5C2D0C"),
    // Flame base (orange)
    r(26, 15, 4, 4, "#FF6B35"),
    r(27, 14, 2, 1, "#FF6B35"),
    // Flame core (yellow)
    r(27, 15, 2, 3, "#FFD700"),
    r(27, 13, 2, 2, "#FFEC8B"),
    // Flame tip
    r(28, 12, 1, 1, "#FFEC8B"),
    // Ember accents
    r(25, 14, 1, 1, "#FF8C42"),
    r(30, 16, 1, 1, "#FF8C42"),
  ];
}

// Fire aura glow — rendered behind character for 20+ streaks
function streakAuraPixels(): PixelRect[] {
  const r = (x: number, y: number, w: number, h: number, color: string): PixelRect => ({ x, y, w, h, color });
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

// Grid dimensions
const GRID_W = 32;
const GRID_H = 48;

interface PixelCharacterProps {
  config: CharacterConfig;
  size?: number;
  showWeeklyCrown?: boolean;
  showTorch?: boolean;
  showStreakAura?: boolean;
}

function PixelCharacterInner({ config, size = 80, showWeeklyCrown = false, showTorch = false, showStreakAura = false }: PixelCharacterProps) {
  const pose = config.pose || "idle";

  // Blink animation — random interval, quick close
  const [blinking, setBlinking] = useState(false);
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    const scheduleBlink = () => {
      blinkTimer.current = setTimeout(() => {
        if (!mounted) return;
        setBlinking(true);
        blinkCloseTimer.current = setTimeout(() => {
          if (!mounted) return;
          setBlinking(false);
          scheduleBlink();
        }, 120);
      }, 2500 + Math.random() * 4000);
    };
    scheduleBlink();
    return () => {
      mounted = false;
      if (blinkTimer.current) clearTimeout(blinkTimer.current);
      if (blinkCloseTimer.current) clearTimeout(blinkCloseTimer.current);
    };
  }, []);

  const pixels = useMemo((): PixelRect[] => {
    const skin = SKIN_TONES.find(s => s.id === config.skinTone) || SKIN_TONES[3];
    const hair = HAIR_COLORS.find(h => h.id === config.hairColor) || HAIR_COLORS[1];
    const shirt = SHIRT_COLORS.find(s => s.id === config.shirtColor) || SHIRT_COLORS[3];
    const pants = PANTS_COLORS.find(p => p.id === config.pantsColor) || PANTS_COLORS[0];
    const shoes = SHOE_COLORS.find(s => s.id === config.shoeColor) || SHOE_COLORS[0];

    const layers: PixelRect[][] = [
      // Streak aura (behind everything)
      ...(showStreakAura ? [streakAuraPixels()] : []),

      // Back layers (rendered first, behind everything)
      hairBackPixels(config.hairStyle, hair),
      accessoryBackPixels(config.accessory, config.hairStyle, pose),

      // Head & face
      headPixels(skin),
      facePixels(skin, blinking),
      neckPixels(skin),

      // Body
      bodyPixels(config.shirtStyle, shirt, skin),

      // Arms
      armPixels(pose, config.shirtStyle, shirt, skin),

      // Legs & shoes
      legPixels(config.pantsStyle, pose, pants, skin, shoes),
      shoePixels(shoes, config.pantsStyle, pose),

      // Pets (rendered at feet level)
      ...(config.pet && config.pet !== "none" ? [petPixels(config.pet)] : []),

      // Front accessories (glasses, hats, etc.)
      hairFrontPixels(config.hairStyle, hair, skin),
      accessoryFrontPixels(config.accessory, config.hairStyle, pose),

      // Weapons (rendered on top, near hand)
      ...(config.weapon && config.weapon !== "none" ? [weaponPixels(config.weapon, pose)] : []),

      // Streak leader torch
      ...(showTorch ? [streakTorchPixels()] : []),

      // Weekly crown overlay — rendered on top if winner and not already wearing crown
      ...(showWeeklyCrown && config.accessory !== "crown" ? [
        weeklyCrownPixels(),
      ] : []),
    ];

    return layers.flat();
  }, [
    config.skinTone, config.hairStyle, config.hairColor,
    config.shirtStyle, config.shirtColor,
    config.pantsStyle, config.pantsColor,
    config.shoeColor, config.accessory, config.pet, config.weapon,
    pose, blinking, showWeeklyCrown, showTorch, showStreakAura,
  ]);

  return (
    <PixelRenderer
      pixels={pixels}
      width={GRID_W}
      height={GRID_H}
      size={size}
    />
  );
}

export const PixelCharacter = React.memo(PixelCharacterInner);
