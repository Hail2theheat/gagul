// components/pixel-character/types.ts

/** A single rectangle in the pixel grid */
export interface PixelRect {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

/** 4-shade color palette used throughout the character */
export interface ColorPalette {
  id: string;
  base: string;
  shadow: string;
  highlight: string;
  midtone: string;
  pointsRequired?: number;
}

export interface CharacterConfig {
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  shirtStyle: string;
  shirtColor: string;
  pantsStyle: string;
  pantsColor: string;
  shoeColor: string;
  accessory: string;
  pose?: string;
  pet?: string;
  weapon?: string;
}
