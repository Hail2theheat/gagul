// components/pixel-character/index.tsx
// HD-2D pixel art character renderer (32x48 grid, SVG-based)
import React, { useMemo } from "react";
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

// Grid dimensions
const GRID_W = 32;
const GRID_H = 48;

interface PixelCharacterProps {
  config: CharacterConfig;
  size?: number;
}

function PixelCharacterInner({ config, size = 80 }: PixelCharacterProps) {
  const skin = SKIN_TONES.find(s => s.id === config.skinTone) || SKIN_TONES[3];
  const hair = HAIR_COLORS.find(h => h.id === config.hairColor) || HAIR_COLORS[1];
  const shirt = SHIRT_COLORS.find(s => s.id === config.shirtColor) || SHIRT_COLORS[3];
  const pants = PANTS_COLORS.find(p => p.id === config.pantsColor) || PANTS_COLORS[0];
  const shoes = SHOE_COLORS.find(s => s.id === config.shoeColor) || SHOE_COLORS[0];
  const pose = config.pose || "idle";

  const pixels = useMemo((): PixelRect[] => {
    const layers: PixelRect[][] = [
      // Back layers (rendered first, behind everything)
      hairBackPixels(config.hairStyle, hair),
      accessoryBackPixels(config.accessory, config.hairStyle, pose),

      // Head & face
      headPixels(skin),
      facePixels(skin),
      neckPixels(skin),

      // Body
      bodyPixels(config.shirtStyle, shirt, skin),

      // Arms
      armPixels(pose, config.shirtStyle, shirt, skin),

      // Legs & shoes
      legPixels(config.pantsStyle, pose, pants, skin, shoes),
      shoePixels(shoes, config.pantsStyle, pose),

      // Front accessories (glasses, hats, etc.)
      hairFrontPixels(config.hairStyle, hair, skin),
      accessoryFrontPixels(config.accessory, config.hairStyle, pose),
    ];

    return layers.flat();
  }, [
    config.skinTone, config.hairStyle, config.hairColor,
    config.shirtStyle, config.shirtColor,
    config.pantsStyle, config.pantsColor,
    config.shoeColor, config.accessory, pose,
    skin, hair, shirt, pants, shoes,
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
