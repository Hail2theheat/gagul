// components/PixelCharacter.tsx
// Stardew Valley / Terraria style pixel art character
// 16x32 proportions with proper shading (base + shadow + highlight + midtone)

import React from "react";
import { View } from "react-native";

// Character customization options with proper shading palettes
// Full spectrum of skin tones
export const SKIN_TONES = [
  { id: "porcelain", base: "#FFF5EE", shadow: "#F0E0D8", highlight: "#FFFFFF", midtone: "#FFF0E8" },
  { id: "ivory", base: "#FFEEE0", shadow: "#E8D4C4", highlight: "#FFF8F2", midtone: "#FFEAD8" },
  { id: "light", base: "#FFDFC4", shadow: "#E8C4A8", highlight: "#FFF0E0", midtone: "#F5D4B4" },
  { id: "fair", base: "#F0C8A0", shadow: "#D4A878", highlight: "#FFDDC0", midtone: "#E8BC90" },
  { id: "beige", base: "#E8C09C", shadow: "#C8A078", highlight: "#F8D8B8", midtone: "#D8B08C" },
  { id: "warm_beige", base: "#DEB887", shadow: "#C49A6C", highlight: "#F0CCA0", midtone: "#D0A878" },
  { id: "medium", base: "#D4A574", shadow: "#B8865C", highlight: "#E8BC90", midtone: "#C49668" },
  { id: "olive", base: "#C4A070", shadow: "#A08050", highlight: "#D8B888", midtone: "#B89060" },
  { id: "tan", base: "#C68642", shadow: "#A66A2C", highlight: "#D8A060", midtone: "#B87838" },
  { id: "caramel", base: "#A67B5B", shadow: "#886040", highlight: "#C09070", midtone: "#98704C" },
  { id: "brown", base: "#8D5524", shadow: "#6D3D14", highlight: "#A86C38", midtone: "#7D4820" },
  { id: "chestnut", base: "#7B4B32", shadow: "#5C3520", highlight: "#986044", midtone: "#6C4028" },
  { id: "dark", base: "#5C3A21", shadow: "#3C2211", highlight: "#7A5030", midtone: "#4D2E18" },
  { id: "espresso", base: "#4A3020", shadow: "#301810", highlight: "#604030", midtone: "#3C2418" },
  { id: "deep", base: "#3D2816", shadow: "#28180C", highlight: "#503820", midtone: "#322010" },
  // Fun fantasy colors
  { id: "blue", base: "#7CB9E8", shadow: "#5090C0", highlight: "#A0D0F0", midtone: "#68A8D8" },
  { id: "green", base: "#90C090", shadow: "#60A060", highlight: "#B0E0B0", midtone: "#78B078" },
  { id: "purple", base: "#B090D0", shadow: "#8060A0", highlight: "#D0B0F0", midtone: "#9878B8" },
  { id: "pink", base: "#FFB0C0", shadow: "#E08090", highlight: "#FFD0E0", midtone: "#F098A8" },
  { id: "gray", base: "#A0A0A0", shadow: "#707070", highlight: "#C8C8C8", midtone: "#888888" },
];

export const HAIR_COLORS = [
  { id: "black", base: "#1a1a1a", shadow: "#0a0a0a", highlight: "#3a3a3a", midtone: "#282828" },
  { id: "brown", base: "#4a3728", shadow: "#2d2118", highlight: "#6d5545", midtone: "#3d2d20" },
  { id: "auburn", base: "#8B4513", shadow: "#5c2d0c", highlight: "#B06030", midtone: "#724010" },
  { id: "ginger", base: "#D2691E", shadow: "#994c12", highlight: "#E88040", midtone: "#B85818" },
  { id: "blonde", base: "#DAA520", shadow: "#a07810", highlight: "#F0C040", midtone: "#C49018" },
  { id: "platinum", base: "#E8E8E8", shadow: "#c0c0c0", highlight: "#FFFFFF", midtone: "#d8d8d8" },
  { id: "red", base: "#B22222", shadow: "#801818", highlight: "#D44444", midtone: "#991c1c" },
  { id: "pink", base: "#FF69B4", shadow: "#d44090", highlight: "#FF8DC7", midtone: "#f050a0" },
  { id: "blue", base: "#4169E1", shadow: "#2848a8", highlight: "#6189FF", midtone: "#3858c8" },
  { id: "purple", base: "#8B5CF6", shadow: "#6840c0", highlight: "#A87CFF", midtone: "#7a50e0" },
  { id: "green", base: "#228B22", shadow: "#166016", highlight: "#44AD44", midtone: "#1c781c" },
  { id: "teal", base: "#20B2AA", shadow: "#148884", highlight: "#40D2CA", midtone: "#189898" },
];

export const HAIR_STYLES = [
  { id: "short", name: "Short", unlocked: true },
  { id: "medium", name: "Medium", unlocked: true },
  { id: "long", name: "Long", unlocked: true },
  { id: "curly", name: "Curly", unlocked: true },
  { id: "afro", name: "Afro", unlocked: true },
  { id: "dreads", name: "Dreads", unlocked: true },
  { id: "ponytail", name: "Ponytail", unlocked: true },
  { id: "bun", name: "Bun", unlocked: true },
  { id: "spiky", name: "Spiky", pointsRequired: 50 },
  { id: "mohawk", name: "Mohawk", pointsRequired: 100 },
  { id: "pigtails", name: "Pigtails", pointsRequired: 75 },
  { id: "bald", name: "Bald", unlocked: true },
];

export const SHIRT_COLORS = [
  { id: "white", base: "#F5F5F5", shadow: "#C8C8C8", highlight: "#FFFFFF", midtone: "#E0E0E0" },
  { id: "black", base: "#2D2D2D", shadow: "#151515", highlight: "#454545", midtone: "#222222" },
  { id: "red", base: "#DC2626", shadow: "#9c1818", highlight: "#F04040", midtone: "#c42020" },
  { id: "blue", base: "#2563EB", shadow: "#1845a8", highlight: "#4080FF", midtone: "#2055d0" },
  { id: "green", base: "#16A34A", shadow: "#0e7030", highlight: "#28C860", midtone: "#129040" },
  { id: "yellow", base: "#EAB308", shadow: "#b08800", highlight: "#FFD030", midtone: "#d0a008" },
  { id: "purple", base: "#9333EA", shadow: "#6820b0", highlight: "#B050FF", midtone: "#8028d0" },
  { id: "pink", base: "#EC4899", shadow: "#c03078", highlight: "#FF60B0", midtone: "#d83888" },
  { id: "orange", base: "#EA580C", shadow: "#b04008", highlight: "#FF7028", midtone: "#d04c0a" },
  { id: "teal", base: "#0D9488", shadow: "#087068", highlight: "#20B8A8", midtone: "#0a8078" },
];

export const SHIRT_STYLES = [
  { id: "tshirt", name: "T-Shirt", unlocked: true },
  { id: "polo", name: "Polo", unlocked: true },
  { id: "hoodie", name: "Hoodie", pointsRequired: 30 },
  { id: "sweater", name: "Sweater", pointsRequired: 40 },
  { id: "tank", name: "Tank Top", unlocked: true },
  { id: "flannel", name: "Flannel", pointsRequired: 60 },
];

export const PANTS_COLORS = [
  { id: "blue", base: "#1E40AF", shadow: "#142c78", highlight: "#2858D0", midtone: "#183898" },
  { id: "black", base: "#1F1F1F", shadow: "#0a0a0a", highlight: "#383838", midtone: "#151515" },
  { id: "brown", base: "#78350F", shadow: "#4c2208", highlight: "#985018", midtone: "#602c0c" },
  { id: "gray", base: "#4B5563", shadow: "#303840", highlight: "#687080", midtone: "#404850" },
  { id: "green", base: "#166534", shadow: "#0d4020", highlight: "#208548", midtone: "#125028" },
  { id: "khaki", base: "#A8A29E", shadow: "#807870", highlight: "#C0B8B0", midtone: "#989088" },
];

export const PANTS_STYLES = [
  { id: "jeans", name: "Jeans", unlocked: true },
  { id: "shorts", name: "Shorts", unlocked: true },
  { id: "skirt", name: "Skirt", unlocked: true },
  { id: "dress", name: "Dress", pointsRequired: 50 },
];

export const SHOE_COLORS = [
  { id: "brown", base: "#78350F", shadow: "#4c2208", highlight: "#985018", midtone: "#602c0c" },
  { id: "black", base: "#1F1F1F", shadow: "#0a0a0a", highlight: "#383838", midtone: "#151515" },
  { id: "white", base: "#E5E5E5", shadow: "#b8b8b8", highlight: "#FFFFFF", midtone: "#d0d0d0" },
  { id: "red", base: "#DC2626", shadow: "#9c1818", highlight: "#F04040", midtone: "#c42020" },
  { id: "blue", base: "#2563EB", shadow: "#1845a8", highlight: "#4080FF", midtone: "#2055d0" },
];

export const ACCESSORIES = [
  { id: "none", name: "None", unlocked: true },
  { id: "glasses", name: "Glasses", unlocked: true },
  { id: "wings", name: "Wings", unlocked: true },
  { id: "staff", name: "Staff", unlocked: true },
  { id: "unicorn_horn", name: "Unicorn Horn", unlocked: true },
  { id: "sunglasses", name: "Sunglasses", pointsRequired: 25 },
  { id: "hat_cap", name: "Cap", pointsRequired: 30 },
  { id: "hat_beanie", name: "Beanie", pointsRequired: 35 },
  { id: "hat_cowboy", name: "Cowboy Hat", pointsRequired: 100 },
  { id: "earrings", name: "Earrings", pointsRequired: 20 },
  { id: "necklace", name: "Necklace", pointsRequired: 40 },
  { id: "scarf", name: "Scarf", pointsRequired: 45 },
  { id: "pride_flag", name: "Pride Flag", pointsRequired: 50 },
  { id: "halo", name: "Halo", pointsRequired: 150 },
  { id: "crown", name: "Crown", pointsRequired: 500 },
];

// Character poses - affects arm positions
export const POSES = [
  { id: "idle", name: "Idle", unlocked: true },
  { id: "waving", name: "Waving", unlocked: true },
  { id: "raising_roof", name: "Raising the Roof", unlocked: true },
  { id: "robot", name: "Robot Arms", unlocked: true },
  { id: "tpose", name: "T-Pose", unlocked: true },
  { id: "karate", name: "Karate", unlocked: true },
  { id: "dab", name: "Dab", pointsRequired: 30 },
  { id: "flexing", name: "Flexing", pointsRequired: 50 },
  { id: "peace", name: "Peace Signs", pointsRequired: 40 },
  { id: "hands_up", name: "Hands Up", pointsRequired: 25 },
  { id: "thinking", name: "Thinking", pointsRequired: 35 },
  { id: "crossed_arms", name: "Crossed Arms", pointsRequired: 45 },
];

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
}

export const DEFAULT_CHARACTER: CharacterConfig = {
  skinTone: "fair",
  hairStyle: "short",
  hairColor: "brown",
  shirtStyle: "tshirt",
  shirtColor: "blue",
  pantsStyle: "jeans",
  pantsColor: "blue",
  shoeColor: "brown",
  accessory: "none",
  pose: "idle",
};

interface PixelCharacterProps {
  config: CharacterConfig;
  size?: number;
}

// Single pixel block component
function Px({ color, x, y, w = 1, h = 1, scale }: { color: string; x: number; y: number; w?: number; h?: number; scale: number }) {
  return (
    <View
      style={{
        position: "absolute",
        left: x * scale,
        top: y * scale,
        width: w * scale,
        height: h * scale,
        backgroundColor: color,
      }}
    />
  );
}

export function PixelCharacter({ config, size = 80 }: PixelCharacterProps) {
  // Base scale - character is 16 pixels wide x 32 tall, scale to desired size
  const scale = size / 16;

  const skin = SKIN_TONES.find(s => s.id === config.skinTone) || SKIN_TONES[1];
  const hair = HAIR_COLORS.find(h => h.id === config.hairColor) || HAIR_COLORS[1];
  const shirt = SHIRT_COLORS.find(s => s.id === config.shirtColor) || SHIRT_COLORS[3];
  const pants = PANTS_COLORS.find(p => p.id === config.pantsColor) || PANTS_COLORS[0];
  const shoes = SHOE_COLORS.find(s => s.id === config.shoeColor) || SHOE_COLORS[0];
  const pose = config.pose || "idle";

  const OUTLINE = "#1a1a1a";

  // Character is 16x32 pixels (Stardew Valley proportions)
  return (
    <View style={{ width: 16 * scale, height: 32 * scale }}>

      {/* === HAIR (back layer for long styles) === */}
      {config.hairStyle === "long" && (
        <>
          {/* Long flowing hair behind body */}
          <Px color={OUTLINE} x={3} y={3} w={1} h={18} scale={scale} />
          <Px color={OUTLINE} x={12} y={3} w={1} h={18} scale={scale} />
          <Px color={hair.shadow} x={4} y={4} w={2} h={16} scale={scale} />
          <Px color={hair.base} x={6} y={4} w={4} h={14} scale={scale} />
          <Px color={hair.shadow} x={10} y={4} w={2} h={16} scale={scale} />
        </>
      )}

      {config.hairStyle === "dreads" && (
        <>
          {/* Dread strands behind body */}
          <Px color={OUTLINE} x={1} y={4} w={1} h={18} scale={scale} />
          <Px color={OUTLINE} x={3} y={5} w={1} h={16} scale={scale} />
          <Px color={hair.shadow} x={2} y={4} w={1} h={17} scale={scale} />
          <Px color={hair.base} x={4} y={5} w={1} h={14} scale={scale} />
          <Px color={OUTLINE} x={14} y={4} w={1} h={18} scale={scale} />
          <Px color={OUTLINE} x={12} y={5} w={1} h={16} scale={scale} />
          <Px color={hair.shadow} x={13} y={4} w={1} h={17} scale={scale} />
          <Px color={hair.base} x={11} y={5} w={1} h={14} scale={scale} />
        </>
      )}

      {/* === WINGS ACCESSORY (behind body) === */}
      {config.accessory === "wings" && (
        <>
          {/* Left wing - more detailed feathered look */}
          <Px color={OUTLINE} x={-3} y={12} w={1} h={10} scale={scale} />
          <Px color={OUTLINE} x={-2} y={11} w={1} h={1} scale={scale} />
          <Px color={OUTLINE} x={-1} y={10} w={1} h={1} scale={scale} />
          <Px color={OUTLINE} x={-2} y={22} w={2} h={1} scale={scale} />
          <Px color="#FFFFFF" x={-2} y={12} w={3} h={3} scale={scale} />
          <Px color="#F0F0FF" x={-1} y={11} w={2} h={2} scale={scale} />
          <Px color="#E8E8F8" x={-2} y={15} w={3} h={4} scale={scale} />
          <Px color="#D8D8F0" x={-1} y={19} w={2} h={3} scale={scale} />
          <Px color="#C8C8E8" x={0} y={20} w={1} h={2} scale={scale} />
          {/* Right wing */}
          <Px color={OUTLINE} x={18} y={12} w={1} h={10} scale={scale} />
          <Px color={OUTLINE} x={17} y={11} w={1} h={1} scale={scale} />
          <Px color={OUTLINE} x={16} y={10} w={1} h={1} scale={scale} />
          <Px color={OUTLINE} x={16} y={22} w={2} h={1} scale={scale} />
          <Px color="#FFFFFF" x={15} y={12} w={3} h={3} scale={scale} />
          <Px color="#F0F0FF" x={15} y={11} w={2} h={2} scale={scale} />
          <Px color="#E8E8F8" x={15} y={15} w={3} h={4} scale={scale} />
          <Px color="#D8D8F0" x={15} y={19} w={2} h={3} scale={scale} />
          <Px color="#C8C8E8" x={15} y={20} w={1} h={2} scale={scale} />
        </>
      )}

      {/* === STAFF ACCESSORY (behind body) === */}
      {config.accessory === "staff" && (
        <>
          {/* Staff pole */}
          <Px color={OUTLINE} x={-2} y={10} w={1} h={24} scale={scale} />
          <Px color="#8B4513" x={-1} y={11} w={1} h={22} scale={scale} />
          <Px color="#A0522D" x={-1} y={11} w={1} h={8} scale={scale} />
          <Px color="#6B3510" x={-1} y={28} w={1} h={5} scale={scale} />
          {/* Crystal orb on top */}
          <Px color={OUTLINE} x={-3} y={7} w={5} h={1} scale={scale} />
          <Px color={OUTLINE} x={-4} y={8} w={1} h={3} scale={scale} />
          <Px color={OUTLINE} x={1} y={8} w={1} h={3} scale={scale} />
          <Px color={OUTLINE} x={-3} y={11} w={5} h={1} scale={scale} />
          <Px color="#9370DB" x={-3} y={8} w={5} h={3} scale={scale} />
          <Px color="#BA55D3" x={-2} y={8} w={2} h={2} scale={scale} />
          <Px color="#E6E6FA" x={-2} y={8} w={1} h={1} scale={scale} />
        </>
      )}

      {/* === UNICORN HORN ACCESSORY === */}
      {config.accessory === "unicorn_horn" && (
        <>
          {/* Spiraling horn */}
          <Px color={OUTLINE} x={7} y={-3} w={2} h={1} scale={scale} />
          <Px color={OUTLINE} x={6} y={-2} w={1} h={3} scale={scale} />
          <Px color={OUTLINE} x={9} y={-2} w={1} h={3} scale={scale} />
          <Px color={OUTLINE} x={7} y={1} w={2} h={1} scale={scale} />
          {/* Horn fill with spiral pattern */}
          <Px color="#FFF8DC" x={7} y={-2} w={2} h={4} scale={scale} />
          <Px color="#FFE4B5" x={7} y={-1} w={1} h={1} scale={scale} />
          <Px color="#FFE4B5" x={8} y={0} w={1} h={1} scale={scale} />
          <Px color="#FFD700" x={7} y={0} w={1} h={1} scale={scale} />
          {/* Sparkles */}
          <Px color="#FFFFFF" x={5} y={-2} w={1} h={1} scale={scale} />
          <Px color="#FFFFFF" x={10} y={-1} w={1} h={1} scale={scale} />
        </>
      )}

      {/* === HEAD === */}
      {/* Head outline */}
      <Px color={OUTLINE} x={5} y={4} w={6} h={1} scale={scale} />
      <Px color={OUTLINE} x={4} y={5} w={1} h={8} scale={scale} />
      <Px color={OUTLINE} x={11} y={5} w={1} h={8} scale={scale} />
      <Px color={OUTLINE} x={5} y={13} w={6} h={1} scale={scale} />

      {/* Head fill with shading */}
      <Px color={skin.highlight} x={5} y={5} w={3} h={2} scale={scale} />
      <Px color={skin.base} x={8} y={5} w={3} h={2} scale={scale} />
      <Px color={skin.base} x={5} y={7} w={6} h={3} scale={scale} />
      <Px color={skin.midtone} x={5} y={10} w={6} h={2} scale={scale} />
      <Px color={skin.shadow} x={5} y={12} w={6} h={1} scale={scale} />

      {/* Eyes with more detail */}
      <Px color="#FFFFFF" x={5} y={7} w={2} h={2} scale={scale} />
      <Px color="#FFFFFF" x={9} y={7} w={2} h={2} scale={scale} />
      <Px color={OUTLINE} x={6} y={7} w={1} h={2} scale={scale} />
      <Px color={OUTLINE} x={9} y={7} w={1} h={2} scale={scale} />
      <Px color="#4080FF" x={6} y={8} w={1} h={1} scale={scale} />
      <Px color="#4080FF" x={9} y={8} w={1} h={1} scale={scale} />

      {/* Nose hint */}
      <Px color={skin.shadow} x={7} y={9} w={2} h={1} scale={scale} />

      {/* Mouth */}
      <Px color={skin.shadow} x={6} y={11} w={4} h={1} scale={scale} />
      <Px color="#c08070" x={7} y={11} w={2} h={1} scale={scale} />

      {/* Ears */}
      <Px color={skin.midtone} x={4} y={8} w={1} h={2} scale={scale} />
      <Px color={skin.midtone} x={11} y={8} w={1} h={2} scale={scale} />

      {/* === HAIR (front layer) === */}
      {config.hairStyle !== "bald" && (
        <>
          {/* Short hair */}
          {config.hairStyle === "short" && (
            <>
              <Px color={OUTLINE} x={4} y={1} w={8} h={1} scale={scale} />
              <Px color={OUTLINE} x={3} y={2} w={1} h={4} scale={scale} />
              <Px color={OUTLINE} x={12} y={2} w={1} h={4} scale={scale} />
              <Px color={hair.shadow} x={4} y={2} w={8} h={1} scale={scale} />
              <Px color={hair.base} x={4} y={3} w={8} h={2} scale={scale} />
              <Px color={hair.highlight} x={5} y={2} w={4} h={1} scale={scale} />
              <Px color={hair.midtone} x={4} y={5} w={2} h={1} scale={scale} />
              <Px color={hair.midtone} x={10} y={5} w={2} h={1} scale={scale} />
            </>
          )}

          {/* Medium hair */}
          {config.hairStyle === "medium" && (
            <>
              <Px color={OUTLINE} x={4} y={0} w={8} h={1} scale={scale} />
              <Px color={OUTLINE} x={3} y={1} w={1} h={8} scale={scale} />
              <Px color={OUTLINE} x={12} y={1} w={1} h={8} scale={scale} />
              <Px color={hair.shadow} x={4} y={1} w={8} h={1} scale={scale} />
              <Px color={hair.base} x={4} y={2} w={8} h={3} scale={scale} />
              <Px color={hair.highlight} x={5} y={1} w={4} h={2} scale={scale} />
              <Px color={hair.base} x={4} y={5} w={2} h={4} scale={scale} />
              <Px color={hair.shadow} x={4} y={7} w={2} h={2} scale={scale} />
              <Px color={hair.base} x={10} y={5} w={2} h={4} scale={scale} />
              <Px color={hair.shadow} x={10} y={7} w={2} h={2} scale={scale} />
            </>
          )}

          {/* Long hair */}
          {config.hairStyle === "long" && (
            <>
              <Px color={OUTLINE} x={4} y={0} w={8} h={1} scale={scale} />
              <Px color={OUTLINE} x={3} y={1} w={1} h={3} scale={scale} />
              <Px color={OUTLINE} x={12} y={1} w={1} h={3} scale={scale} />
              <Px color={hair.shadow} x={4} y={1} w={8} h={1} scale={scale} />
              <Px color={hair.base} x={4} y={2} w={8} h={3} scale={scale} />
              <Px color={hair.highlight} x={5} y={1} w={4} h={2} scale={scale} />
            </>
          )}

          {/* Curly hair */}
          {config.hairStyle === "curly" && (
            <>
              <Px color={OUTLINE} x={3} y={0} w={10} h={1} scale={scale} />
              <Px color={OUTLINE} x={2} y={1} w={1} h={7} scale={scale} />
              <Px color={OUTLINE} x={13} y={1} w={1} h={7} scale={scale} />
              <Px color={hair.shadow} x={3} y={1} w={10} h={1} scale={scale} />
              <Px color={hair.base} x={3} y={2} w={10} h={4} scale={scale} />
              <Px color={hair.highlight} x={4} y={1} w={3} h={2} scale={scale} />
              <Px color={hair.highlight} x={8} y={1} w={3} h={2} scale={scale} />
              {/* Curl details */}
              <Px color={hair.shadow} x={3} y={4} w={1} h={1} scale={scale} />
              <Px color={hair.shadow} x={5} y={3} w={1} h={1} scale={scale} />
              <Px color={hair.shadow} x={7} y={4} w={1} h={1} scale={scale} />
              <Px color={hair.shadow} x={9} y={3} w={1} h={1} scale={scale} />
              <Px color={hair.shadow} x={11} y={4} w={1} h={1} scale={scale} />
              <Px color={hair.base} x={3} y={6} w={2} h={2} scale={scale} />
              <Px color={hair.base} x={11} y={6} w={2} h={2} scale={scale} />
            </>
          )}

          {/* Afro */}
          {config.hairStyle === "afro" && (
            <>
              {/* Big round afro */}
              <Px color={OUTLINE} x={2} y={-3} w={12} h={1} scale={scale} />
              <Px color={OUTLINE} x={1} y={-2} w={1} h={10} scale={scale} />
              <Px color={OUTLINE} x={14} y={-2} w={1} h={10} scale={scale} />
              <Px color={OUTLINE} x={2} y={8} w={2} h={1} scale={scale} />
              <Px color={OUTLINE} x={12} y={8} w={2} h={1} scale={scale} />
              {/* Afro fill with shading */}
              <Px color={hair.base} x={2} y={-2} w={12} h={10} scale={scale} />
              <Px color={hair.highlight} x={3} y={-2} w={4} h={2} scale={scale} />
              <Px color={hair.highlight} x={9} y={-2} w={4} h={2} scale={scale} />
              <Px color={hair.shadow} x={2} y={4} w={2} h={4} scale={scale} />
              <Px color={hair.shadow} x={12} y={4} w={2} h={4} scale={scale} />
              {/* Texture details */}
              <Px color={hair.midtone} x={4} y={0} w={1} h={1} scale={scale} />
              <Px color={hair.midtone} x={6} y={-1} w={1} h={1} scale={scale} />
              <Px color={hair.midtone} x={9} y={-1} w={1} h={1} scale={scale} />
              <Px color={hair.midtone} x={11} y={0} w={1} h={1} scale={scale} />
              {/* Face cutout */}
              <Px color={skin.base} x={5} y={5} w={6} h={3} scale={scale} />
              <Px color={skin.highlight} x={5} y={5} w={3} h={2} scale={scale} />
            </>
          )}

          {/* Dreads */}
          {config.hairStyle === "dreads" && (
            <>
              <Px color={OUTLINE} x={4} y={0} w={8} h={1} scale={scale} />
              <Px color={OUTLINE} x={3} y={1} w={1} h={4} scale={scale} />
              <Px color={OUTLINE} x={12} y={1} w={1} h={4} scale={scale} />
              <Px color={hair.shadow} x={4} y={1} w={8} h={1} scale={scale} />
              <Px color={hair.base} x={4} y={2} w={8} h={3} scale={scale} />
              <Px color={hair.highlight} x={5} y={1} w={4} h={2} scale={scale} />
              {/* Top dreads visible */}
              <Px color={hair.base} x={5} y={5} w={1} h={4} scale={scale} />
              <Px color={hair.base} x={10} y={5} w={1} h={4} scale={scale} />
            </>
          )}

          {/* Ponytail */}
          {config.hairStyle === "ponytail" && (
            <>
              <Px color={OUTLINE} x={4} y={1} w={8} h={1} scale={scale} />
              <Px color={OUTLINE} x={3} y={2} w={1} h={4} scale={scale} />
              <Px color={OUTLINE} x={12} y={2} w={1} h={12} scale={scale} />
              <Px color={OUTLINE} x={13} y={5} w={1} h={10} scale={scale} />
              <Px color={hair.shadow} x={4} y={2} w={8} h={1} scale={scale} />
              <Px color={hair.base} x={4} y={3} w={8} h={3} scale={scale} />
              <Px color={hair.highlight} x={5} y={2} w={4} h={2} scale={scale} />
              {/* Ponytail */}
              <Px color={hair.base} x={12} y={6} w={1} h={8} scale={scale} />
              <Px color={hair.shadow} x={12} y={10} w={1} h={4} scale={scale} />
            </>
          )}

          {/* Bun */}
          {config.hairStyle === "bun" && (
            <>
              <Px color={OUTLINE} x={4} y={1} w={8} h={1} scale={scale} />
              <Px color={OUTLINE} x={3} y={2} w={1} h={4} scale={scale} />
              <Px color={OUTLINE} x={12} y={2} w={1} h={4} scale={scale} />
              {/* Bun on top */}
              <Px color={OUTLINE} x={6} y={-2} w={4} h={1} scale={scale} />
              <Px color={OUTLINE} x={5} y={-1} w={1} h={3} scale={scale} />
              <Px color={OUTLINE} x={10} y={-1} w={1} h={3} scale={scale} />
              <Px color={hair.shadow} x={4} y={2} w={8} h={1} scale={scale} />
              <Px color={hair.base} x={4} y={3} w={8} h={3} scale={scale} />
              <Px color={hair.highlight} x={5} y={2} w={4} h={2} scale={scale} />
              {/* Bun fill */}
              <Px color={hair.base} x={6} y={-1} w={4} h={3} scale={scale} />
              <Px color={hair.highlight} x={7} y={-1} w={2} h={1} scale={scale} />
              <Px color={hair.shadow} x={6} y={1} w={4} h={1} scale={scale} />
            </>
          )}

          {/* Spiky hair */}
          {config.hairStyle === "spiky" && (
            <>
              <Px color={OUTLINE} x={3} y={2} w={1} h={4} scale={scale} />
              <Px color={OUTLINE} x={12} y={2} w={1} h={4} scale={scale} />
              {/* Spikes */}
              <Px color={OUTLINE} x={3} y={-1} w={2} h={1} scale={scale} />
              <Px color={OUTLINE} x={6} y={-2} w={2} h={1} scale={scale} />
              <Px color={OUTLINE} x={9} y={-2} w={2} h={1} scale={scale} />
              <Px color={OUTLINE} x={12} y={-1} w={2} h={1} scale={scale} />
              <Px color={hair.base} x={4} y={0} w={8} h={5} scale={scale} />
              <Px color={hair.base} x={4} y={-1} w={2} h={1} scale={scale} />
              <Px color={hair.base} x={6} y={-2} w={2} h={2} scale={scale} />
              <Px color={hair.base} x={9} y={-2} w={2} h={2} scale={scale} />
              <Px color={hair.base} x={11} y={-1} w={2} h={1} scale={scale} />
              <Px color={hair.highlight} x={5} y={0} w={2} h={2} scale={scale} />
              <Px color={hair.highlight} x={7} y={-1} w={1} h={2} scale={scale} />
              <Px color={hair.highlight} x={10} y={-1} w={1} h={2} scale={scale} />
            </>
          )}

          {/* Mohawk */}
          {config.hairStyle === "mohawk" && (
            <>
              <Px color={OUTLINE} x={6} y={-4} w={4} h={1} scale={scale} />
              <Px color={OUTLINE} x={5} y={-3} w={1} h={9} scale={scale} />
              <Px color={OUTLINE} x={10} y={-3} w={1} h={9} scale={scale} />
              <Px color={OUTLINE} x={4} y={4} w={1} h={2} scale={scale} />
              <Px color={OUTLINE} x={11} y={4} w={1} h={2} scale={scale} />
              <Px color={hair.base} x={6} y={-3} w={4} h={9} scale={scale} />
              <Px color={hair.highlight} x={7} y={-3} w={2} h={3} scale={scale} />
              <Px color={hair.shadow} x={6} y={4} w={4} h={2} scale={scale} />
            </>
          )}

          {/* Pigtails */}
          {config.hairStyle === "pigtails" && (
            <>
              <Px color={OUTLINE} x={4} y={1} w={8} h={1} scale={scale} />
              <Px color={OUTLINE} x={3} y={2} w={1} h={4} scale={scale} />
              <Px color={OUTLINE} x={12} y={2} w={1} h={4} scale={scale} />
              {/* Left pigtail */}
              <Px color={OUTLINE} x={0} y={5} w={1} h={10} scale={scale} />
              <Px color={OUTLINE} x={1} y={4} w={2} h={1} scale={scale} />
              <Px color={OUTLINE} x={3} y={5} w={1} h={9} scale={scale} />
              {/* Right pigtail */}
              <Px color={OUTLINE} x={15} y={5} w={1} h={10} scale={scale} />
              <Px color={OUTLINE} x={13} y={4} w={2} h={1} scale={scale} />
              <Px color={OUTLINE} x={12} y={5} w={1} h={9} scale={scale} />
              {/* Hair fill */}
              <Px color={hair.shadow} x={4} y={2} w={8} h={1} scale={scale} />
              <Px color={hair.base} x={4} y={3} w={8} h={3} scale={scale} />
              <Px color={hair.highlight} x={5} y={2} w={4} h={2} scale={scale} />
              <Px color={hair.base} x={1} y={5} w={2} h={9} scale={scale} />
              <Px color={hair.shadow} x={1} y={10} w={2} h={4} scale={scale} />
              <Px color={hair.base} x={13} y={5} w={2} h={9} scale={scale} />
              <Px color={hair.shadow} x={13} y={10} w={2} h={4} scale={scale} />
            </>
          )}
        </>
      )}

      {/* === GLASSES ACCESSORY === */}
      {(config.accessory === "glasses" || config.accessory === "sunglasses") && (
        <>
          {/* Frame */}
          <Px color="#4a4a4a" x={4} y={7} w={8} h={1} scale={scale} />
          <Px color="#4a4a4a" x={4} y={9} w={3} h={1} scale={scale} />
          <Px color="#4a4a4a" x={9} y={9} w={3} h={1} scale={scale} />
          <Px color="#4a4a4a" x={4} y={7} w={1} h={3} scale={scale} />
          <Px color="#4a4a4a" x={6} y={7} w={1} h={3} scale={scale} />
          <Px color="#4a4a4a" x={9} y={7} w={1} h={3} scale={scale} />
          <Px color="#4a4a4a" x={11} y={7} w={1} h={3} scale={scale} />
          {config.accessory === "sunglasses" && (
            <>
              <Px color="#1a1a1a" x={5} y={8} w={1} h={1} scale={scale} />
              <Px color="#1a1a1a" x={10} y={8} w={1} h={1} scale={scale} />
            </>
          )}
        </>
      )}

      {/* === HAT ACCESSORIES === */}
      {config.accessory === "hat_cap" && (
        <>
          <Px color={OUTLINE} x={3} y={0} w={10} h={1} scale={scale} />
          <Px color={OUTLINE} x={2} y={1} w={1} h={4} scale={scale} />
          <Px color={OUTLINE} x={13} y={1} w={1} h={3} scale={scale} />
          <Px color={OUTLINE} x={0} y={4} w={3} h={1} scale={scale} />
          <Px color="#DC2626" x={3} y={1} w={10} h={4} scale={scale} />
          <Px color="#F04040" x={4} y={1} w={4} h={2} scale={scale} />
          <Px color="#9c1818" x={3} y={4} w={10} h={1} scale={scale} />
          {/* Brim */}
          <Px color="#9c1818" x={0} y={5} w={4} h={1} scale={scale} />
        </>
      )}

      {config.accessory === "hat_beanie" && (
        <>
          <Px color={OUTLINE} x={4} y={-1} w={8} h={1} scale={scale} />
          <Px color={OUTLINE} x={3} y={0} w={1} h={5} scale={scale} />
          <Px color={OUTLINE} x={12} y={0} w={1} h={5} scale={scale} />
          <Px color={OUTLINE} x={6} y={-3} w={4} h={1} scale={scale} />
          <Px color={OUTLINE} x={5} y={-2} w={1} h={2} scale={scale} />
          <Px color={OUTLINE} x={10} y={-2} w={1} h={2} scale={scale} />
          <Px color="#7C3AED" x={4} y={0} w={8} h={5} scale={scale} />
          <Px color="#9F67FF" x={4} y={0} w={8} h={2} scale={scale} />
          <Px color="#6820b0" x={4} y={4} w={8} h={1} scale={scale} />
          <Px color="#7C3AED" x={6} y={-2} w={4} h={2} scale={scale} />
          <Px color="#9F67FF" x={7} y={-2} w={2} h={1} scale={scale} />
        </>
      )}

      {config.accessory === "hat_cowboy" && (
        <>
          <Px color={OUTLINE} x={0} y={3} w={16} h={1} scale={scale} />
          <Px color={OUTLINE} x={4} y={-1} w={8} h={1} scale={scale} />
          <Px color={OUTLINE} x={3} y={0} w={1} h={4} scale={scale} />
          <Px color={OUTLINE} x={12} y={0} w={1} h={4} scale={scale} />
          <Px color="#8B4513" x={1} y={4} w={14} h={2} scale={scale} />
          <Px color="#A65D2E" x={2} y={4} w={4} h={1} scale={scale} />
          <Px color="#A65D2E" x={10} y={4} w={4} h={1} scale={scale} />
          <Px color="#5c2d0c" x={1} y={5} w={14} h={1} scale={scale} />
          <Px color="#8B4513" x={4} y={0} w={8} h={4} scale={scale} />
          <Px color="#A65D2E" x={5} y={0} w={4} h={2} scale={scale} />
          <Px color="#5c2d0c" x={4} y={3} w={8} h={1} scale={scale} />
        </>
      )}

      {config.accessory === "crown" && (
        <>
          <Px color={OUTLINE} x={4} y={1} w={8} h={1} scale={scale} />
          <Px color={OUTLINE} x={3} y={2} w={1} h={3} scale={scale} />
          <Px color={OUTLINE} x={12} y={2} w={1} h={3} scale={scale} />
          <Px color={OUTLINE} x={4} y={-1} w={2} h={1} scale={scale} />
          <Px color={OUTLINE} x={7} y={-2} w={2} h={1} scale={scale} />
          <Px color={OUTLINE} x={10} y={-1} w={2} h={1} scale={scale} />
          <Px color="#FFD700" x={4} y={2} w={8} h={3} scale={scale} />
          <Px color="#FFEC8B" x={5} y={2} w={4} h={2} scale={scale} />
          <Px color="#B8960C" x={4} y={4} w={8} h={1} scale={scale} />
          <Px color="#FFD700" x={4} y={0} w={2} h={2} scale={scale} />
          <Px color="#FFD700" x={7} y={-1} w={2} h={3} scale={scale} />
          <Px color="#FFD700" x={10} y={0} w={2} h={2} scale={scale} />
          {/* Jewels */}
          <Px color="#DC2626" x={8} y={0} w={1} h={1} scale={scale} />
          <Px color="#2563EB" x={5} y={3} w={1} h={1} scale={scale} />
          <Px color="#16A34A" x={10} y={3} w={1} h={1} scale={scale} />
        </>
      )}

      {config.accessory === "halo" && (
        <>
          <Px color={OUTLINE} x={4} y={-1} w={8} h={1} scale={scale} />
          <Px color="#FFD700" x={4} y={0} w={8} h={1} scale={scale} />
          <Px color="#FFEC8B" x={5} y={0} w={6} h={1} scale={scale} />
        </>
      )}

      {/* === EARRINGS ACCESSORY === */}
      {config.accessory === "earrings" && (
        <>
          <Px color="#FFD700" x={4} y={9} w={1} h={2} scale={scale} />
          <Px color="#FFEC8B" x={4} y={9} w={1} h={1} scale={scale} />
          <Px color="#FFD700" x={11} y={9} w={1} h={2} scale={scale} />
          <Px color="#FFEC8B" x={11} y={9} w={1} h={1} scale={scale} />
        </>
      )}

      {/* === NECK === */}
      <Px color={OUTLINE} x={6} y={13} w={4} h={1} scale={scale} />
      <Px color={skin.base} x={6} y={14} w={4} h={1} scale={scale} />
      <Px color={skin.shadow} x={7} y={14} w={2} h={1} scale={scale} />

      {/* === BODY/SHIRT === */}
      {/* Body outline */}
      <Px color={OUTLINE} x={3} y={14} w={10} h={1} scale={scale} />
      <Px color={OUTLINE} x={2} y={15} w={1} h={8} scale={scale} />
      <Px color={OUTLINE} x={13} y={15} w={1} h={8} scale={scale} />

      {/* Shirt fill with shading */}
      <Px color={shirt.highlight} x={3} y={15} w={4} h={2} scale={scale} />
      <Px color={shirt.base} x={7} y={15} w={6} h={2} scale={scale} />
      <Px color={shirt.base} x={3} y={17} w={10} h={3} scale={scale} />
      <Px color={shirt.midtone} x={3} y={20} w={10} h={2} scale={scale} />
      <Px color={shirt.shadow} x={3} y={21} w={10} h={1} scale={scale} />

      {/* Shirt details based on style */}
      {config.shirtStyle === "polo" && (
        <>
          <Px color={shirt.shadow} x={6} y={15} w={4} h={2} scale={scale} />
          <Px color={OUTLINE} x={7} y={15} w={2} h={3} scale={scale} />
        </>
      )}
      {config.shirtStyle === "hoodie" && (
        <>
          <Px color={shirt.shadow} x={5} y={15} w={6} h={3} scale={scale} />
          <Px color={shirt.midtone} x={6} y={17} w={4} h={3} scale={scale} />
          {/* Hood lines */}
          <Px color={shirt.shadow} x={3} y={15} w={1} h={3} scale={scale} />
          <Px color={shirt.shadow} x={12} y={15} w={1} h={3} scale={scale} />
        </>
      )}
      {config.shirtStyle === "tank" && (
        <>
          {/* Exposed arms */}
          <Px color={skin.base} x={3} y={15} w={2} h={3} scale={scale} />
          <Px color={skin.shadow} x={3} y={17} w={2} h={1} scale={scale} />
          <Px color={skin.base} x={11} y={15} w={2} h={3} scale={scale} />
          <Px color={skin.shadow} x={11} y={17} w={2} h={1} scale={scale} />
        </>
      )}
      {config.shirtStyle === "flannel" && (
        <>
          <Px color={shirt.shadow} x={4} y={15} w={1} h={7} scale={scale} />
          <Px color={shirt.shadow} x={6} y={15} w={1} h={7} scale={scale} />
          <Px color={shirt.shadow} x={8} y={15} w={1} h={7} scale={scale} />
          <Px color={shirt.shadow} x={10} y={15} w={1} h={7} scale={scale} />
        </>
      )}
      {config.shirtStyle === "sweater" && (
        <>
          {/* Knit texture */}
          <Px color={shirt.midtone} x={4} y={16} w={8} h={1} scale={scale} />
          <Px color={shirt.midtone} x={4} y={18} w={8} h={1} scale={scale} />
          <Px color={shirt.midtone} x={4} y={20} w={8} h={1} scale={scale} />
        </>
      )}

      {/* Scarf accessory */}
      {config.accessory === "scarf" && (
        <>
          <Px color="#DC2626" x={3} y={14} w={10} h={2} scale={scale} />
          <Px color="#F04040" x={4} y={14} w={4} h={1} scale={scale} />
          <Px color="#9c1818" x={3} y={15} w={10} h={1} scale={scale} />
          {/* Scarf tail */}
          <Px color="#DC2626" x={10} y={16} w={2} h={4} scale={scale} />
          <Px color="#9c1818" x={10} y={18} w={2} h={2} scale={scale} />
        </>
      )}

      {/* Necklace accessory */}
      {config.accessory === "necklace" && (
        <>
          <Px color="#B8960C" x={6} y={15} w={4} h={1} scale={scale} />
          <Px color="#FFD700" x={7} y={16} w={2} h={1} scale={scale} />
          <Px color="#FFEC8B" x={7} y={16} w={1} h={1} scale={scale} />
        </>
      )}

      {/* === ARMS WITH POSES === */}
      {/* Idle pose - arms at sides */}
      {(pose === "idle" || !pose) && config.shirtStyle !== "tank" && (
        <>
          {/* Left arm */}
          <Px color={OUTLINE} x={0} y={15} w={1} h={8} scale={scale} />
          <Px color={OUTLINE} x={1} y={14} w={2} h={1} scale={scale} />
          <Px color={OUTLINE} x={1} y={23} w={2} h={1} scale={scale} />
          <Px color={shirt.base} x={1} y={15} w={2} h={4} scale={scale} />
          <Px color={shirt.shadow} x={1} y={18} w={2} h={1} scale={scale} />
          <Px color={skin.base} x={1} y={19} w={2} h={4} scale={scale} />
          <Px color={skin.shadow} x={1} y={21} w={2} h={2} scale={scale} />
          {/* Right arm */}
          <Px color={OUTLINE} x={15} y={15} w={1} h={8} scale={scale} />
          <Px color={OUTLINE} x={13} y={14} w={2} h={1} scale={scale} />
          <Px color={OUTLINE} x={13} y={23} w={2} h={1} scale={scale} />
          <Px color={shirt.base} x={13} y={15} w={2} h={4} scale={scale} />
          <Px color={shirt.shadow} x={13} y={18} w={2} h={1} scale={scale} />
          <Px color={skin.base} x={13} y={19} w={2} h={4} scale={scale} />
          <Px color={skin.shadow} x={13} y={21} w={2} h={2} scale={scale} />
        </>
      )}

      {/* Waving pose - right arm up and waving */}
      {pose === "waving" && config.shirtStyle !== "tank" && (
        <>
          {/* Left arm (normal) */}
          <Px color={OUTLINE} x={0} y={15} w={1} h={8} scale={scale} />
          <Px color={OUTLINE} x={1} y={14} w={2} h={1} scale={scale} />
          <Px color={OUTLINE} x={1} y={23} w={2} h={1} scale={scale} />
          <Px color={shirt.base} x={1} y={15} w={2} h={4} scale={scale} />
          <Px color={skin.base} x={1} y={19} w={2} h={4} scale={scale} />
          {/* Right arm (raised and waving) */}
          <Px color={OUTLINE} x={14} y={6} w={1} h={8} scale={scale} />
          <Px color={OUTLINE} x={13} y={14} w={2} h={1} scale={scale} />
          <Px color={OUTLINE} x={15} y={5} w={3} h={1} scale={scale} />
          <Px color={shirt.base} x={13} y={15} w={2} h={3} scale={scale} />
          <Px color={shirt.base} x={14} y={10} w={2} h={5} scale={scale} />
          <Px color={skin.base} x={14} y={6} w={2} h={4} scale={scale} />
          <Px color={skin.base} x={16} y={5} w={2} h={3} scale={scale} />
          <Px color={skin.highlight} x={17} y={5} w={1} h={2} scale={scale} />
        </>
      )}

      {/* Raising the roof pose - both arms up at angles */}
      {pose === "raising_roof" && config.shirtStyle !== "tank" && (
        <>
          {/* Left arm (raised) */}
          <Px color={OUTLINE} x={-2} y={6} w={1} h={8} scale={scale} />
          <Px color={OUTLINE} x={1} y={14} w={2} h={1} scale={scale} />
          <Px color={OUTLINE} x={-4} y={4} w={3} h={1} scale={scale} />
          <Px color={shirt.base} x={1} y={15} w={2} h={3} scale={scale} />
          <Px color={shirt.base} x={-1} y={10} w={2} h={5} scale={scale} />
          <Px color={skin.base} x={-1} y={6} w={2} h={4} scale={scale} />
          <Px color={skin.base} x={-3} y={4} w={2} h={3} scale={scale} />
          {/* Right arm (raised) */}
          <Px color={OUTLINE} x={17} y={6} w={1} h={8} scale={scale} />
          <Px color={OUTLINE} x={13} y={14} w={2} h={1} scale={scale} />
          <Px color={OUTLINE} x={17} y={4} w={3} h={1} scale={scale} />
          <Px color={shirt.base} x={13} y={15} w={2} h={3} scale={scale} />
          <Px color={shirt.base} x={15} y={10} w={2} h={5} scale={scale} />
          <Px color={skin.base} x={15} y={6} w={2} h={4} scale={scale} />
          <Px color={skin.base} x={17} y={4} w={2} h={3} scale={scale} />
        </>
      )}

      {/* Robot arms pose - bent at 90 degrees */}
      {pose === "robot" && config.shirtStyle !== "tank" && (
        <>
          {/* Left arm */}
          <Px color={OUTLINE} x={-3} y={15} w={4} h={1} scale={scale} />
          <Px color={OUTLINE} x={-4} y={16} w={1} h={7} scale={scale} />
          <Px color={OUTLINE} x={1} y={14} w={2} h={1} scale={scale} />
          <Px color={shirt.base} x={-3} y={16} w={4} h={3} scale={scale} />
          <Px color={skin.base} x={-3} y={19} w={2} h={4} scale={scale} />
          <Px color={skin.base} x={1} y={15} w={2} h={4} scale={scale} />
          {/* Right arm */}
          <Px color={OUTLINE} x={15} y={15} w={4} h={1} scale={scale} />
          <Px color={OUTLINE} x={19} y={16} w={1} h={7} scale={scale} />
          <Px color={OUTLINE} x={13} y={14} w={2} h={1} scale={scale} />
          <Px color={shirt.base} x={15} y={16} w={4} h={3} scale={scale} />
          <Px color={skin.base} x={17} y={19} w={2} h={4} scale={scale} />
          <Px color={skin.base} x={13} y={15} w={2} h={4} scale={scale} />
        </>
      )}

      {/* T-pose - arms straight out */}
      {pose === "tpose" && config.shirtStyle !== "tank" && (
        <>
          {/* Left arm */}
          <Px color={OUTLINE} x={-6} y={15} w={7} h={1} scale={scale} />
          <Px color={OUTLINE} x={-6} y={16} w={1} h={3} scale={scale} />
          <Px color={OUTLINE} x={1} y={14} w={2} h={1} scale={scale} />
          <Px color={shirt.base} x={-2} y={16} w={4} h={2} scale={scale} />
          <Px color={skin.base} x={-5} y={16} w={3} h={2} scale={scale} />
          <Px color={skin.shadow} x={-5} y={17} w={3} h={1} scale={scale} />
          <Px color={shirt.base} x={1} y={15} w={2} h={3} scale={scale} />
          {/* Right arm */}
          <Px color={OUTLINE} x={15} y={15} w={7} h={1} scale={scale} />
          <Px color={OUTLINE} x={21} y={16} w={1} h={3} scale={scale} />
          <Px color={OUTLINE} x={13} y={14} w={2} h={1} scale={scale} />
          <Px color={shirt.base} x={14} y={16} w={4} h={2} scale={scale} />
          <Px color={skin.base} x={18} y={16} w={3} h={2} scale={scale} />
          <Px color={skin.shadow} x={18} y={17} w={3} h={1} scale={scale} />
          <Px color={shirt.base} x={13} y={15} w={2} h={3} scale={scale} />
        </>
      )}

      {/* Karate pose - fighting stance with kick */}
      {pose === "karate" && config.shirtStyle !== "tank" && (
        <>
          {/* Left arm (punching forward) */}
          <Px color={OUTLINE} x={-4} y={17} w={5} h={1} scale={scale} />
          <Px color={OUTLINE} x={-5} y={18} w={1} h={3} scale={scale} />
          <Px color={OUTLINE} x={1} y={14} w={2} h={1} scale={scale} />
          <Px color={shirt.base} x={-1} y={18} w={3} h={2} scale={scale} />
          <Px color={skin.base} x={-4} y={18} w={3} h={2} scale={scale} />
          <Px color={shirt.base} x={1} y={15} w={2} h={3} scale={scale} />
          {/* Right arm (guard position) */}
          <Px color={OUTLINE} x={15} y={15} w={1} h={5} scale={scale} />
          <Px color={OUTLINE} x={14} y={12} w={1} h={4} scale={scale} />
          <Px color={OUTLINE} x={13} y={14} w={2} h={1} scale={scale} />
          <Px color={OUTLINE} x={15} y={11} w={3} h={1} scale={scale} />
          <Px color={shirt.base} x={13} y={15} w={2} h={4} scale={scale} />
          <Px color={shirt.base} x={14} y={13} w={2} h={2} scale={scale} />
          <Px color={skin.base} x={15} y={12} w={2} h={3} scale={scale} />
        </>
      )}

      {/* Arms for tank top (skin showing) - supports poses */}
      {config.shirtStyle === "tank" && (pose === "idle" || !pose) && (
        <>
          {/* Left arm */}
          <Px color={OUTLINE} x={0} y={15} w={1} h={8} scale={scale} />
          <Px color={OUTLINE} x={1} y={14} w={2} h={1} scale={scale} />
          <Px color={OUTLINE} x={1} y={23} w={2} h={1} scale={scale} />
          <Px color={skin.base} x={1} y={15} w={2} h={8} scale={scale} />
          <Px color={skin.highlight} x={1} y={15} w={1} h={3} scale={scale} />
          <Px color={skin.shadow} x={1} y={20} w={2} h={3} scale={scale} />
          {/* Right arm */}
          <Px color={OUTLINE} x={15} y={15} w={1} h={8} scale={scale} />
          <Px color={OUTLINE} x={13} y={14} w={2} h={1} scale={scale} />
          <Px color={OUTLINE} x={13} y={23} w={2} h={1} scale={scale} />
          <Px color={skin.base} x={13} y={15} w={2} h={8} scale={scale} />
          <Px color={skin.highlight} x={14} y={15} w={1} h={3} scale={scale} />
          <Px color={skin.shadow} x={13} y={20} w={2} h={3} scale={scale} />
        </>
      )}

      {/* Tank top - waving pose */}
      {config.shirtStyle === "tank" && pose === "waving" && (
        <>
          {/* Left arm (normal) */}
          <Px color={OUTLINE} x={0} y={15} w={1} h={8} scale={scale} />
          <Px color={OUTLINE} x={1} y={14} w={2} h={1} scale={scale} />
          <Px color={OUTLINE} x={1} y={23} w={2} h={1} scale={scale} />
          <Px color={skin.base} x={1} y={15} w={2} h={8} scale={scale} />
          {/* Right arm (raised waving) */}
          <Px color={OUTLINE} x={14} y={6} w={1} h={8} scale={scale} />
          <Px color={OUTLINE} x={13} y={14} w={2} h={1} scale={scale} />
          <Px color={OUTLINE} x={15} y={5} w={3} h={1} scale={scale} />
          <Px color={skin.base} x={13} y={15} w={2} h={3} scale={scale} />
          <Px color={skin.base} x={14} y={6} w={2} h={9} scale={scale} />
          <Px color={skin.base} x={16} y={5} w={2} h={3} scale={scale} />
        </>
      )}

      {/* Tank top - raising roof pose */}
      {config.shirtStyle === "tank" && pose === "raising_roof" && (
        <>
          {/* Left arm (raised) */}
          <Px color={OUTLINE} x={-2} y={6} w={1} h={8} scale={scale} />
          <Px color={OUTLINE} x={1} y={14} w={2} h={1} scale={scale} />
          <Px color={OUTLINE} x={-4} y={4} w={3} h={1} scale={scale} />
          <Px color={skin.base} x={1} y={15} w={2} h={3} scale={scale} />
          <Px color={skin.base} x={-1} y={6} w={2} h={12} scale={scale} />
          <Px color={skin.base} x={-3} y={4} w={2} h={3} scale={scale} />
          {/* Right arm (raised) */}
          <Px color={OUTLINE} x={17} y={6} w={1} h={8} scale={scale} />
          <Px color={OUTLINE} x={13} y={14} w={2} h={1} scale={scale} />
          <Px color={OUTLINE} x={17} y={4} w={3} h={1} scale={scale} />
          <Px color={skin.base} x={13} y={15} w={2} h={3} scale={scale} />
          <Px color={skin.base} x={15} y={6} w={2} h={12} scale={scale} />
          <Px color={skin.base} x={17} y={4} w={2} h={3} scale={scale} />
        </>
      )}

      {/* Tank top - robot pose */}
      {config.shirtStyle === "tank" && pose === "robot" && (
        <>
          {/* Left arm */}
          <Px color={OUTLINE} x={-3} y={15} w={4} h={1} scale={scale} />
          <Px color={OUTLINE} x={-4} y={16} w={1} h={7} scale={scale} />
          <Px color={OUTLINE} x={1} y={14} w={2} h={1} scale={scale} />
          <Px color={skin.base} x={-3} y={16} w={4} h={7} scale={scale} />
          <Px color={skin.base} x={1} y={15} w={2} h={4} scale={scale} />
          {/* Right arm */}
          <Px color={OUTLINE} x={15} y={15} w={4} h={1} scale={scale} />
          <Px color={OUTLINE} x={19} y={16} w={1} h={7} scale={scale} />
          <Px color={OUTLINE} x={13} y={14} w={2} h={1} scale={scale} />
          <Px color={skin.base} x={15} y={16} w={4} h={7} scale={scale} />
          <Px color={skin.base} x={13} y={15} w={2} h={4} scale={scale} />
        </>
      )}

      {/* Tank top - T-pose */}
      {config.shirtStyle === "tank" && pose === "tpose" && (
        <>
          {/* Left arm */}
          <Px color={OUTLINE} x={-6} y={15} w={7} h={1} scale={scale} />
          <Px color={OUTLINE} x={-6} y={16} w={1} h={3} scale={scale} />
          <Px color={OUTLINE} x={1} y={14} w={2} h={1} scale={scale} />
          <Px color={skin.base} x={-5} y={16} w={7} h={2} scale={scale} />
          <Px color={skin.base} x={1} y={15} w={2} h={3} scale={scale} />
          {/* Right arm */}
          <Px color={OUTLINE} x={15} y={15} w={7} h={1} scale={scale} />
          <Px color={OUTLINE} x={21} y={16} w={1} h={3} scale={scale} />
          <Px color={OUTLINE} x={13} y={14} w={2} h={1} scale={scale} />
          <Px color={skin.base} x={14} y={16} w={7} h={2} scale={scale} />
          <Px color={skin.base} x={13} y={15} w={2} h={3} scale={scale} />
        </>
      )}

      {/* Tank top - karate pose */}
      {config.shirtStyle === "tank" && pose === "karate" && (
        <>
          {/* Left arm (punching) */}
          <Px color={OUTLINE} x={-4} y={17} w={5} h={1} scale={scale} />
          <Px color={OUTLINE} x={-5} y={18} w={1} h={3} scale={scale} />
          <Px color={OUTLINE} x={1} y={14} w={2} h={1} scale={scale} />
          <Px color={skin.base} x={-4} y={18} w={6} h={2} scale={scale} />
          <Px color={skin.base} x={1} y={15} w={2} h={3} scale={scale} />
          {/* Right arm (guard) */}
          <Px color={OUTLINE} x={15} y={15} w={1} h={5} scale={scale} />
          <Px color={OUTLINE} x={14} y={12} w={1} h={4} scale={scale} />
          <Px color={OUTLINE} x={13} y={14} w={2} h={1} scale={scale} />
          <Px color={OUTLINE} x={15} y={11} w={3} h={1} scale={scale} />
          <Px color={skin.base} x={13} y={15} w={2} h={4} scale={scale} />
          <Px color={skin.base} x={14} y={12} w={3} h={3} scale={scale} />
        </>
      )}

      {/* === PRIDE FLAG ACCESSORY === */}
      {config.accessory === "pride_flag" && (
        <>
          <Px color={OUTLINE} x={14} y={15} w={1} h={10} scale={scale} />
          <Px color="#E40303" x={15} y={15} w={1} h={1} scale={scale} />
          <Px color="#FF8C00" x={15} y={16} w={1} h={1} scale={scale} />
          <Px color="#FFED00" x={15} y={17} w={1} h={2} scale={scale} />
          <Px color="#008026" x={15} y={19} w={1} h={1} scale={scale} />
          <Px color="#004DFF" x={15} y={20} w={1} h={2} scale={scale} />
          <Px color="#750787" x={15} y={22} w={1} h={2} scale={scale} />
        </>
      )}

      {/* === LEGS/PANTS === */}
      {/* Karate pose - kicking right leg out */}
      {pose === "karate" && config.pantsStyle !== "dress" ? (
        <>
          {/* Left leg (standing) */}
          <Px color={OUTLINE} x={3} y={22} w={4} h={1} scale={scale} />
          <Px color={OUTLINE} x={2} y={23} w={1} h={6} scale={scale} />
          <Px color={OUTLINE} x={7} y={23} w={1} h={6} scale={scale} />
          <Px color={pants.base} x={3} y={23} w={4} h={6} scale={scale} />
          <Px color={pants.highlight} x={3} y={23} w={2} h={2} scale={scale} />
          <Px color={pants.shadow} x={3} y={27} w={4} h={2} scale={scale} />

          {/* Right leg (kicking forward!) */}
          <Px color={OUTLINE} x={9} y={22} w={4} h={1} scale={scale} />
          <Px color={OUTLINE} x={8} y={23} w={1} h={3} scale={scale} />
          <Px color={OUTLINE} x={13} y={23} w={1} h={3} scale={scale} />
          {/* Horizontal kicking leg */}
          <Px color={OUTLINE} x={14} y={24} w={6} h={1} scale={scale} />
          <Px color={OUTLINE} x={19} y={25} w={1} h={3} scale={scale} />
          <Px color={OUTLINE} x={14} y={28} w={6} h={1} scale={scale} />
          <Px color={pants.base} x={9} y={23} w={4} h={3} scale={scale} />
          <Px color={pants.base} x={14} y={25} w={5} h={3} scale={scale} />
          <Px color={pants.shadow} x={14} y={27} w={5} h={1} scale={scale} />
          {/* Kicking foot */}
          <Px color={shoes.base} x={18} y={25} w={2} h={3} scale={scale} />
          <Px color={shoes.highlight} x={19} y={25} w={1} h={1} scale={scale} />
          <Px color={shoes.shadow} x={18} y={27} w={2} h={1} scale={scale} />
        </>
      ) : config.pantsStyle !== "dress" ? (
        <>
          {/* Normal legs - Pants outline */}
          <Px color={OUTLINE} x={3} y={22} w={4} h={1} scale={scale} />
          <Px color={OUTLINE} x={9} y={22} w={4} h={1} scale={scale} />
          <Px color={OUTLINE} x={2} y={23} w={1} h={6} scale={scale} />
          <Px color={OUTLINE} x={7} y={23} w={1} h={6} scale={scale} />
          <Px color={OUTLINE} x={8} y={23} w={1} h={6} scale={scale} />
          <Px color={OUTLINE} x={13} y={23} w={1} h={6} scale={scale} />

          {/* Pants fill with shading */}
          {config.pantsStyle !== "shorts" && config.pantsStyle !== "skirt" ? (
            <>
              <Px color={pants.base} x={3} y={23} w={4} h={6} scale={scale} />
              <Px color={pants.highlight} x={3} y={23} w={2} h={2} scale={scale} />
              <Px color={pants.shadow} x={3} y={27} w={4} h={2} scale={scale} />
              <Px color={pants.base} x={9} y={23} w={4} h={6} scale={scale} />
              <Px color={pants.highlight} x={11} y={23} w={2} h={2} scale={scale} />
              <Px color={pants.shadow} x={9} y={27} w={4} h={2} scale={scale} />
            </>
          ) : (
            <>
              {/* Shorts or skirt */}
              <Px color={pants.base} x={3} y={23} w={10} h={3} scale={scale} />
              <Px color={pants.highlight} x={4} y={23} w={3} h={1} scale={scale} />
              <Px color={pants.shadow} x={3} y={25} w={10} h={1} scale={scale} />
              {/* Exposed legs */}
              <Px color={skin.base} x={3} y={26} w={4} h={3} scale={scale} />
              <Px color={skin.shadow} x={3} y={28} w={4} h={1} scale={scale} />
              <Px color={skin.base} x={9} y={26} w={4} h={3} scale={scale} />
              <Px color={skin.shadow} x={9} y={28} w={4} h={1} scale={scale} />
            </>
          )}
        </>
      ) : (
        /* Dress */
        <>
          <Px color={OUTLINE} x={2} y={22} w={1} h={7} scale={scale} />
          <Px color={OUTLINE} x={13} y={22} w={1} h={7} scale={scale} />
          <Px color={OUTLINE} x={3} y={29} w={10} h={1} scale={scale} />
          <Px color={pants.base} x={3} y={22} w={10} h={7} scale={scale} />
          <Px color={pants.highlight} x={4} y={22} w={4} h={2} scale={scale} />
          <Px color={pants.shadow} x={3} y={26} w={10} h={3} scale={scale} />
          {/* Dress details */}
          <Px color={pants.midtone} x={5} y={24} w={6} h={1} scale={scale} />
        </>
      )}

      {/* === SHOES === */}
      <Px color={OUTLINE} x={2} y={29} w={5} h={1} scale={scale} />
      <Px color={OUTLINE} x={1} y={30} w={1} h={2} scale={scale} />
      <Px color={OUTLINE} x={7} y={30} w={1} h={2} scale={scale} />
      <Px color={OUTLINE} x={2} y={32} w={5} h={1} scale={scale} />
      <Px color={shoes.base} x={2} y={30} w={5} h={2} scale={scale} />
      <Px color={shoes.highlight} x={2} y={30} w={2} h={1} scale={scale} />
      <Px color={shoes.shadow} x={2} y={31} w={5} h={1} scale={scale} />

      <Px color={OUTLINE} x={9} y={29} w={5} h={1} scale={scale} />
      <Px color={OUTLINE} x={8} y={30} w={1} h={2} scale={scale} />
      <Px color={OUTLINE} x={14} y={30} w={1} h={2} scale={scale} />
      <Px color={OUTLINE} x={9} y={32} w={5} h={1} scale={scale} />
      <Px color={shoes.base} x={9} y={30} w={5} h={2} scale={scale} />
      <Px color={shoes.highlight} x={12} y={30} w={2} h={1} scale={scale} />
      <Px color={shoes.shadow} x={9} y={31} w={5} h={1} scale={scale} />
    </View>
  );
}
