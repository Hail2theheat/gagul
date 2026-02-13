// components/pixel-character/constants.ts
import { ColorPalette, CharacterConfig } from "./types";

export const SKIN_TONES: ColorPalette[] = [
  // 8 realistic tones
  { id: "porcelain", base: "#FFF5EE", shadow: "#F0E0D8", highlight: "#FFFFFF", midtone: "#FFF0E8" },
  { id: "fair", base: "#F0C8A0", shadow: "#D4A878", highlight: "#FFDDC0", midtone: "#E8BC90" },
  { id: "warm_beige", base: "#DEB887", shadow: "#C49A6C", highlight: "#F0CCA0", midtone: "#D0A878" },
  { id: "medium", base: "#D4A574", shadow: "#B8865C", highlight: "#E8BC90", midtone: "#C49668" },
  { id: "tan", base: "#C68642", shadow: "#A66A2C", highlight: "#D8A060", midtone: "#B87838" },
  { id: "brown", base: "#8D5524", shadow: "#6D3D14", highlight: "#A86C38", midtone: "#7D4820" },
  { id: "dark", base: "#5C3A21", shadow: "#3C2211", highlight: "#7A5030", midtone: "#4D2E18" },
  { id: "espresso", base: "#4A3020", shadow: "#301810", highlight: "#604030", midtone: "#3C2418" },
  // 10 fantasy colors
  { id: "blue", base: "#7CB9E8", shadow: "#5090C0", highlight: "#A0D0F0", midtone: "#68A8D8" },
  { id: "green", base: "#90C090", shadow: "#60A060", highlight: "#B0E0B0", midtone: "#78B078" },
  { id: "purple", base: "#B090D0", shadow: "#8060A0", highlight: "#D0B0F0", midtone: "#9878B8" },
  { id: "pink", base: "#FFB0C0", shadow: "#E08090", highlight: "#FFD0E0", midtone: "#F098A8" },
  { id: "gray", base: "#A0A0A0", shadow: "#707070", highlight: "#C8C8C8", midtone: "#888888" },
  { id: "red", base: "#E07060", shadow: "#B84840", highlight: "#F09888", midtone: "#D06050" },
  { id: "gold", base: "#E8C858", shadow: "#C0A030", highlight: "#F8E088", midtone: "#D8B848" },
  { id: "cyan", base: "#70D0D0", shadow: "#48A8A8", highlight: "#98E8E8", midtone: "#60C0C0" },
  { id: "lavender", base: "#C8A8E8", shadow: "#A080C0", highlight: "#E0C8FF", midtone: "#B898D8" },
  { id: "mint", base: "#88D8A8", shadow: "#60B080", highlight: "#B0F0C8", midtone: "#78C898" },
];

export const HAIR_COLORS: ColorPalette[] = [
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
  { id: "silver", base: "#C0C0C0", shadow: "#909090", highlight: "#E0E0E0", midtone: "#A8A8A8" },
  { id: "white", base: "#F0F0F0", shadow: "#C8C8C8", highlight: "#FFFFFF", midtone: "#E0E0E0" },
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
  { id: "braids", name: "Braids", pointsRequired: 60 },
  { id: "space_buns", name: "Space Buns", pointsRequired: 80 },
  { id: "side_swept", name: "Side Swept", pointsRequired: 90 },
  { id: "wild", name: "Wild", pointsRequired: 120 },
  { id: "undercut", name: "Undercut", pointsRequired: 70 },
  { id: "bald", name: "Bald", unlocked: true },
];

export const SHIRT_COLORS: ColorPalette[] = [
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
  { id: "brown", base: "#8B6914", shadow: "#6B4C0C", highlight: "#A8842C", midtone: "#7A5C10" },
  { id: "crimson", base: "#9B1B30", shadow: "#6D1020", highlight: "#C02040", midtone: "#881828" },
];

export const SHIRT_STYLES = [
  { id: "tshirt", name: "T-Shirt", unlocked: true },
  { id: "polo", name: "Polo", unlocked: true },
  { id: "tank", name: "Tank Top", unlocked: true },
  { id: "crop", name: "Crop Top", unlocked: true },
  { id: "hoodie", name: "Hoodie", pointsRequired: 30 },
  { id: "vest", name: "Vest", pointsRequired: 35 },
  { id: "sweater", name: "Sweater", pointsRequired: 40 },
  { id: "jacket", name: "Jacket", pointsRequired: 55 },
  { id: "flannel", name: "Flannel", pointsRequired: 60 },
  { id: "overalls", name: "Overalls", pointsRequired: 45 },
  { id: "robe", name: "Robe", pointsRequired: 80 },
  { id: "armor", name: "Armor", pointsRequired: 150 },
];

export const PANTS_COLORS: ColorPalette[] = [
  { id: "blue", base: "#1E40AF", shadow: "#142c78", highlight: "#2858D0", midtone: "#183898" },
  { id: "black", base: "#1F1F1F", shadow: "#0a0a0a", highlight: "#383838", midtone: "#151515" },
  { id: "brown", base: "#78350F", shadow: "#4c2208", highlight: "#985018", midtone: "#602c0c" },
  { id: "gray", base: "#4B5563", shadow: "#303840", highlight: "#687080", midtone: "#404850" },
  { id: "green", base: "#166534", shadow: "#0d4020", highlight: "#208548", midtone: "#125028" },
  { id: "khaki", base: "#A8A29E", shadow: "#807870", highlight: "#C0B8B0", midtone: "#989088" },
  { id: "white", base: "#E8E8E8", shadow: "#B8B8B8", highlight: "#FFFFFF", midtone: "#D8D8D8" },
  { id: "red", base: "#8B2020", shadow: "#5C1010", highlight: "#B03030", midtone: "#781818" },
];

export const PANTS_STYLES = [
  { id: "jeans", name: "Jeans", unlocked: true },
  { id: "skinny", name: "Skinny Pants", unlocked: true },
  { id: "ripped", name: "Ripped Jeans", unlocked: true },
  { id: "shorts", name: "Shorts", unlocked: true },
  { id: "skirt", name: "Skirt", unlocked: true },
  { id: "baggy", name: "Baggy Pants", pointsRequired: 40 },
  { id: "dress", name: "Dress", pointsRequired: 50 },
];

export const SHOE_COLORS: ColorPalette[] = [
  { id: "brown", base: "#78350F", shadow: "#4c2208", highlight: "#985018", midtone: "#602c0c" },
  { id: "black", base: "#1F1F1F", shadow: "#0a0a0a", highlight: "#383838", midtone: "#151515" },
  { id: "white", base: "#E5E5E5", shadow: "#b8b8b8", highlight: "#FFFFFF", midtone: "#d0d0d0" },
  { id: "red", base: "#DC2626", shadow: "#9c1818", highlight: "#F04040", midtone: "#c42020" },
  { id: "blue", base: "#2563EB", shadow: "#1845a8", highlight: "#4080FF", midtone: "#2055d0" },
  { id: "green", base: "#166534", shadow: "#0d4020", highlight: "#208548", midtone: "#125028" },
  { id: "pink", base: "#EC4899", shadow: "#c03078", highlight: "#FF60B0", midtone: "#d83888" },
];

export const ACCESSORIES = [
  { id: "none", name: "None", unlocked: true },
  { id: "glasses", name: "Glasses", unlocked: true },
  { id: "wings", name: "Wings", unlocked: true },
  { id: "staff", name: "Staff", unlocked: true },
  { id: "unicorn_horn", name: "Unicorn Horn", unlocked: true },
  { id: "headband", name: "Headband", pointsRequired: 15 },
  { id: "earrings", name: "Earrings", pointsRequired: 20 },
  { id: "bow_tie", name: "Bow Tie", pointsRequired: 20 },
  { id: "sunglasses", name: "Sunglasses", pointsRequired: 25 },
  { id: "hat_cap", name: "Cap", pointsRequired: 30 },
  { id: "hat_beanie", name: "Beanie", pointsRequired: 35 },
  { id: "necklace", name: "Necklace", pointsRequired: 40 },
  { id: "scarf", name: "Scarf", pointsRequired: 45 },
  { id: "cape", name: "Cape", pointsRequired: 50 },
  { id: "witch_hat", name: "Witch Hat", pointsRequired: 60 },
  { id: "viking_helm", name: "Viking Helm", pointsRequired: 80 },
  { id: "shield", name: "Shield", pointsRequired: 90 },
  { id: "hat_cowboy", name: "Cowboy Hat", pointsRequired: 100 },
  { id: "sword", name: "Sword", pointsRequired: 120 },
  { id: "halo", name: "Halo", pointsRequired: 150 },
  { id: "crown", name: "Crown", pointsRequired: 500 },
];

export const POSES = [
  { id: "idle", name: "Idle", unlocked: true },
  { id: "waving", name: "Waving", unlocked: true },
  { id: "raising_roof", name: "Raising the Roof", unlocked: true },
  { id: "robot", name: "Robot Arms", unlocked: true },
  { id: "tpose", name: "T-Pose", unlocked: true },
  { id: "karate", name: "Karate", unlocked: true },
  { id: "hands_up", name: "Hands Up", pointsRequired: 25 },
  { id: "dab", name: "Dab", pointsRequired: 30 },
  { id: "thinking", name: "Thinking", pointsRequired: 35 },
  { id: "peace", name: "Peace Signs", pointsRequired: 40 },
  { id: "crossed_arms", name: "Crossed Arms", pointsRequired: 45 },
  { id: "flexing", name: "Flexing", pointsRequired: 50 },
  { id: "fighting_stance", name: "Fighter", pointsRequired: 60 },
  { id: "casting", name: "Casting", pointsRequired: 70 },
  { id: "middle_fingers", name: "Middle Fingers", pointsRequired: 75 },
  { id: "victory", name: "Victory", pointsRequired: 55 },
  { id: "sitting", name: "Sitting", pointsRequired: 80 },
];

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

export const OUTLINE = "#1a1a1a";
