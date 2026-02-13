// layers/arms.ts — Arm poses at 32x48 resolution (v2 - adjusted for shorter torso)
import { PixelRect, ColorPalette } from "../types";
import { OUTLINE } from "../constants";

const r = (x: number, y: number, w: number, h: number, color: string): PixelRect => ({ x, y, w, h, color });

export function armPixels(
  pose: string,
  shirtStyle: string,
  shirt: ColorPalette,
  skin: ColorPalette,
): PixelRect[] {
  const isTank = shirtStyle === "tank";
  const sleeveColor = isTank ? skin.base : shirt.base;
  const sleeveShadow = isTank ? skin.shadow : shirt.shadow;

  switch (pose) {
    case "waving":
      return [
        // Left arm (at side)
        r(1, 26, 1, 11, OUTLINE),
        r(2, 25, 4, 1, OUTLINE),
        r(2, 37, 4, 1, OUTLINE),
        r(2, 26, 4, 4, sleeveColor),
        r(2, 29, 4, 1, sleeveShadow),
        r(2, 30, 4, 5, skin.base),
        r(2, 34, 4, 1, skin.shadow),
        r(2, 35, 4, 2, skin.base),
        // Right arm (raised waving)
        r(26, 25, 4, 1, OUTLINE),
        r(26, 26, 4, 4, sleeveColor),
        r(30, 26, 1, 4, OUTLINE),
        r(28, 18, 3, 8, sleeveColor),
        r(31, 18, 1, 8, OUTLINE),
        r(28, 12, 3, 6, skin.base),
        r(28, 12, 2, 3, skin.highlight),
        r(31, 12, 1, 6, OUTLINE),
        // Waving hand
        r(28, 10, 4, 2, OUTLINE),
        r(29, 10, 3, 2, skin.base),
        r(30, 10, 2, 1, skin.highlight),
      ];

    case "raising_roof":
      return [
        // Left arm (raised)
        r(2, 25, 4, 1, OUTLINE),
        r(2, 26, 4, 4, sleeveColor),
        r(-1, 26, 1, 4, OUTLINE),
        r(0, 18, 3, 8, sleeveColor),
        r(-1, 18, 1, 8, OUTLINE),
        r(0, 12, 3, 6, skin.base),
        r(0, 12, 2, 3, skin.highlight),
        r(-1, 12, 1, 6, OUTLINE),
        r(-3, 10, 4, 2, OUTLINE),
        r(-2, 10, 3, 2, skin.base),
        // Right arm (raised)
        r(26, 25, 4, 1, OUTLINE),
        r(26, 26, 4, 4, sleeveColor),
        r(30, 26, 1, 4, OUTLINE),
        r(29, 18, 3, 8, sleeveColor),
        r(32, 18, 1, 8, OUTLINE),
        r(29, 12, 3, 6, skin.base),
        r(29, 12, 2, 3, skin.highlight),
        r(32, 12, 1, 6, OUTLINE),
        r(29, 10, 4, 2, OUTLINE),
        r(30, 10, 3, 2, skin.base),
      ];

    case "robot":
      return [
        // === LEFT ARM — horizontal out, forearm bends UP (shortened) ===
        r(2, 25, 4, 1, OUTLINE),
        r(1, 26, 1, 6, OUTLINE),
        r(2, 26, 4, 1, OUTLINE),
        r(2, 27, 4, 4, sleeveColor),
        r(2, 31, 4, 1, OUTLINE),
        // Upper arm horizontal (x=-2 to x=1, 4px)
        r(-2, 26, 4, 1, OUTLINE),
        r(-2, 31, 4, 1, OUTLINE),
        r(-2, 27, 4, 4, skin.base),
        r(-2, 30, 4, 1, skin.shadow),
        // Elbow joint (x=-6 to x=-1, 6px)
        r(-6, 25, 5, 1, OUTLINE),
        r(-7, 26, 1, 7, OUTLINE),
        r(-6, 32, 5, 1, OUTLINE),
        r(-1, 26, 1, 7, OUTLINE),
        r(-6, 26, 5, 6, shirt.shadow),
        r(-5, 27, 2, 2, shirt.highlight),
        r(-5, 30, 2, 1, shirt.base),
        // Forearm going UP (7px tall, y=19-25)
        r(-7, 19, 1, 7, OUTLINE),
        r(-2, 19, 1, 7, OUTLINE),
        r(-6, 19, 4, 7, skin.base),
        r(-5, 19, 2, 3, skin.highlight),
        r(-6, 25, 4, 1, skin.shadow),
        // Claw at top
        r(-8, 17, 7, 1, OUTLINE),
        r(-8, 18, 1, 2, OUTLINE),
        r(-7, 18, 5, 2, skin.base),
        r(-6, 18, 3, 1, skin.highlight),
        r(-1, 18, 1, 2, OUTLINE),
        r(-7, 20, 5, 1, OUTLINE),

        // === RIGHT ARM — horizontal out, forearm bends DOWN (shortened) ===
        r(26, 25, 4, 1, OUTLINE),
        r(30, 26, 1, 6, OUTLINE),
        r(26, 26, 4, 1, OUTLINE),
        r(26, 27, 4, 4, sleeveColor),
        r(26, 31, 4, 1, OUTLINE),
        // Upper arm horizontal (x=30 to x=33, 4px)
        r(30, 26, 4, 1, OUTLINE),
        r(30, 31, 4, 1, OUTLINE),
        r(30, 27, 4, 4, skin.base),
        r(30, 30, 4, 1, skin.shadow),
        // Elbow joint (x=33 to x=38, 6px)
        r(33, 25, 5, 1, OUTLINE),
        r(32, 26, 1, 7, OUTLINE),
        r(33, 32, 5, 1, OUTLINE),
        r(38, 26, 1, 7, OUTLINE),
        r(33, 26, 5, 6, shirt.shadow),
        r(35, 27, 2, 2, shirt.highlight),
        r(35, 30, 2, 1, shirt.base),
        // Forearm going DOWN (7px tall, y=32-38)
        r(32, 32, 1, 7, OUTLINE),
        r(38, 32, 1, 7, OUTLINE),
        r(33, 32, 5, 7, skin.base),
        r(34, 32, 3, 3, skin.highlight),
        r(33, 32, 5, 1, skin.shadow),
        // Claw at bottom
        r(32, 39, 7, 1, OUTLINE),
        r(32, 37, 1, 2, OUTLINE),
        r(33, 37, 5, 2, skin.base),
        r(34, 37, 3, 1, skin.highlight),
        r(38, 37, 1, 2, OUTLINE),
        r(33, 37, 5, 1, OUTLINE),
      ];

    case "tpose":
      return [
        // === LEFT ARM — horizontal, 16px total (x=-10 to x=5) ===
        r(2, 25, 4, 1, OUTLINE),
        r(-10, 26, 16, 1, OUTLINE),
        r(-10, 31, 16, 1, OUTLINE),
        r(-11, 27, 1, 4, OUTLINE),
        // Sleeve (x=0 to x=5)
        r(0, 27, 6, 4, sleeveColor),
        r(0, 30, 6, 1, sleeveShadow),
        // Bare arm (x=-7 to x=-1)
        r(-7, 27, 7, 4, skin.base),
        r(-7, 30, 7, 1, skin.shadow),
        // Hand (x=-10 to x=-8)
        r(-10, 27, 3, 4, skin.base),
        r(-10, 27, 2, 2, skin.highlight),
        r(-10, 30, 3, 1, skin.shadow),

        // === RIGHT ARM (mirror, x=26 to x=41) ===
        r(26, 25, 4, 1, OUTLINE),
        r(26, 26, 16, 1, OUTLINE),
        r(26, 31, 16, 1, OUTLINE),
        r(42, 27, 1, 4, OUTLINE),
        r(26, 27, 6, 4, sleeveColor),
        r(26, 30, 6, 1, sleeveShadow),
        r(32, 27, 7, 4, skin.base),
        r(32, 30, 7, 1, skin.shadow),
        r(39, 27, 3, 4, skin.base),
        r(39, 27, 2, 2, skin.highlight),
        r(39, 30, 3, 1, skin.shadow),
      ];

    case "karate":
      return [
        // Left arm (punching forward)
        r(2, 25, 4, 1, OUTLINE),
        r(2, 26, 4, 4, sleeveColor),
        r(-1, 30, 4, 1, OUTLINE),
        r(0, 30, 3, 3, sleeveColor),
        r(-4, 30, 3, 3, skin.base),
        r(-4, 32, 3, 1, skin.shadow),
        r(-5, 30, 1, 3, OUTLINE),
        // Left fist
        r(-7, 30, 2, 3, OUTLINE),
        r(-6, 30, 2, 2, skin.base),
        // Right arm (guard position)
        r(26, 25, 4, 1, OUTLINE),
        r(26, 26, 4, 4, sleeveColor),
        r(30, 26, 1, 4, OUTLINE),
        r(28, 20, 3, 6, sleeveColor),
        r(31, 20, 1, 6, OUTLINE),
        r(28, 18, 3, 2, skin.base),
        r(31, 18, 1, 2, OUTLINE),
        r(28, 16, 4, 2, OUTLINE),
        r(29, 16, 3, 2, skin.base),
      ];

    case "dab":
      return [
        // Left arm (out to the side)
        r(2, 25, 4, 1, OUTLINE),
        r(2, 26, 4, 4, sleeveColor),
        r(-1, 26, 1, 5, OUTLINE),
        r(-4, 30, 3, 1, OUTLINE),
        r(-7, 30, 3, 3, skin.base),
        r(-7, 32, 3, 1, skin.shadow),
        r(-8, 30, 1, 3, OUTLINE),
        r(-4, 30, 4, 3, skin.base),
        r(-10, 30, 2, 3, OUTLINE),
        r(-9, 31, 2, 2, skin.base),
        // Right arm (tucked to face — dab!)
        r(26, 25, 4, 1, OUTLINE),
        r(26, 26, 4, 4, sleeveColor),
        r(30, 18, 1, 8, OUTLINE),
        r(28, 18, 3, 8, sleeveColor),
        r(28, 14, 3, 4, skin.base),
        r(30, 14, 1, 4, OUTLINE),
        r(20, 12, 8, 1, OUTLINE),
        r(19, 13, 1, 3, OUTLINE),
        r(20, 13, 8, 3, skin.base),
        r(20, 15, 8, 1, skin.shadow),
      ];

    case "flexing":
      return [
        // === LEFT ARM — upper arm out, forearm UP, bicep bump (shortened) ===
        r(2, 25, 4, 1, OUTLINE),
        r(1, 26, 1, 6, OUTLINE),
        r(2, 26, 4, 1, OUTLINE),
        r(2, 27, 4, 4, sleeveColor),
        r(2, 31, 4, 1, OUTLINE),
        // Upper arm horizontal (x=-4 to x=1, 6px wide)
        r(-4, 26, 6, 1, OUTLINE),
        r(-4, 31, 6, 1, OUTLINE),
        r(-5, 27, 1, 4, OUTLINE),
        r(-4, 27, 6, 4, skin.base),
        r(-4, 30, 6, 1, skin.shadow),
        // BICEP BUMP on top near elbow (4px wide, 2px above arm)
        r(-3, 24, 4, 1, OUTLINE),
        r(-4, 25, 1, 2, OUTLINE),
        r(-3, 25, 4, 2, skin.base),
        r(-2, 25, 2, 1, skin.highlight),
        r(1, 25, 1, 2, OUTLINE),
        // Forearm straight UP (x=-5 to x=-2, 4px wide, y=18 to y=26, 9px)
        r(-6, 18, 1, 9, OUTLINE),
        r(-1, 18, 1, 9, OUTLINE),
        r(-5, 18, 4, 9, skin.base),
        r(-4, 18, 2, 3, skin.highlight),
        r(-5, 26, 4, 1, skin.shadow),
        // Fist at top
        r(-7, 15, 7, 1, OUTLINE),
        r(-7, 16, 1, 3, OUTLINE),
        r(-6, 16, 5, 3, skin.base),
        r(-5, 16, 3, 1, skin.highlight),
        r(-6, 18, 5, 1, skin.shadow),
        r(-1, 16, 1, 3, OUTLINE),
        r(-6, 19, 5, 1, OUTLINE),

        // === RIGHT ARM (mirror) ===
        r(26, 25, 4, 1, OUTLINE),
        r(30, 26, 1, 6, OUTLINE),
        r(26, 26, 4, 1, OUTLINE),
        r(26, 27, 4, 4, sleeveColor),
        r(26, 31, 4, 1, OUTLINE),
        // Upper arm horizontal (x=30 to x=35, 6px wide)
        r(30, 26, 6, 1, OUTLINE),
        r(30, 31, 6, 1, OUTLINE),
        r(36, 27, 1, 4, OUTLINE),
        r(30, 27, 6, 4, skin.base),
        r(30, 30, 6, 1, skin.shadow),
        // BICEP BUMP (mirror)
        r(31, 24, 4, 1, OUTLINE),
        r(30, 25, 1, 2, OUTLINE),
        r(31, 25, 4, 2, skin.base),
        r(32, 25, 2, 1, skin.highlight),
        r(35, 25, 1, 2, OUTLINE),
        // Forearm straight UP (x=33 to x=36, 4px wide, y=18 to y=26)
        r(32, 18, 1, 9, OUTLINE),
        r(37, 18, 1, 9, OUTLINE),
        r(33, 18, 4, 9, skin.base),
        r(34, 18, 2, 3, skin.highlight),
        r(33, 26, 4, 1, skin.shadow),
        // Fist at top
        r(32, 15, 7, 1, OUTLINE),
        r(32, 16, 1, 3, OUTLINE),
        r(33, 16, 5, 3, skin.base),
        r(34, 16, 3, 1, skin.highlight),
        r(33, 18, 5, 1, skin.shadow),
        r(38, 16, 1, 3, OUTLINE),
        r(33, 19, 5, 1, OUTLINE),
      ];

    case "peace":
      return [
        // Left arm (raised, peace sign)
        r(2, 25, 4, 1, OUTLINE),
        r(2, 26, 4, 4, sleeveColor),
        r(-1, 26, 1, 4, OUTLINE),
        r(0, 18, 3, 8, sleeveColor),
        r(-1, 18, 1, 8, OUTLINE),
        r(0, 12, 3, 6, skin.base),
        r(0, 12, 2, 3, skin.highlight),
        r(-1, 12, 1, 6, OUTLINE),
        // Peace fingers (V shape — two 2px-wide fingers with gap)
        r(-1, 6, 2, 1, OUTLINE),
        r(-2, 7, 1, 5, OUTLINE),
        r(-1, 7, 2, 5, skin.base),
        r(-1, 7, 1, 2, skin.highlight),
        r(1, 7, 1, 5, OUTLINE),
        r(2, 6, 2, 1, OUTLINE),
        r(2, 7, 2, 5, skin.base),
        r(2, 7, 1, 2, skin.highlight),
        r(4, 7, 1, 5, OUTLINE),
        r(0, 12, 1, 1, skin.base),
        // Right arm (raised, peace sign)
        r(26, 25, 4, 1, OUTLINE),
        r(26, 26, 4, 4, sleeveColor),
        r(30, 26, 1, 4, OUTLINE),
        r(29, 18, 3, 8, sleeveColor),
        r(32, 18, 1, 8, OUTLINE),
        r(29, 12, 3, 6, skin.base),
        r(29, 12, 2, 3, skin.highlight),
        r(32, 12, 1, 6, OUTLINE),
        // Peace fingers (same design mirrored)
        r(28, 6, 2, 1, OUTLINE),
        r(27, 7, 1, 5, OUTLINE),
        r(28, 7, 2, 5, skin.base),
        r(28, 7, 1, 2, skin.highlight),
        r(30, 7, 1, 5, OUTLINE),
        r(31, 6, 2, 1, OUTLINE),
        r(31, 7, 2, 5, skin.base),
        r(31, 7, 1, 2, skin.highlight),
        r(33, 7, 1, 5, OUTLINE),
        r(30, 12, 1, 1, skin.base),
      ];

    case "hands_up":
      return [
        // Left arm (straight up)
        r(2, 25, 4, 1, OUTLINE),
        r(1, 21, 1, 5, OUTLINE),
        r(2, 21, 4, 5, sleeveColor),
        r(1, 10, 1, 11, OUTLINE),
        r(2, 10, 4, 11, skin.base),
        r(2, 10, 2, 4, skin.highlight),
        r(6, 10, 1, 16, OUTLINE),
        r(1, 8, 5, 2, OUTLINE),
        r(2, 8, 4, 2, skin.base),
        // Right arm (straight up)
        r(26, 25, 4, 1, OUTLINE),
        r(30, 21, 1, 5, OUTLINE),
        r(26, 21, 4, 5, sleeveColor),
        r(30, 10, 1, 11, OUTLINE),
        r(26, 10, 4, 11, skin.base),
        r(28, 10, 2, 4, skin.highlight),
        r(25, 10, 1, 16, OUTLINE),
        r(26, 8, 5, 2, OUTLINE),
        r(26, 8, 4, 2, skin.base),
      ];

    case "thinking":
      return [
        // Left arm (at side)
        r(1, 26, 1, 11, OUTLINE),
        r(2, 25, 4, 1, OUTLINE),
        r(2, 37, 4, 1, OUTLINE),
        r(2, 26, 4, 4, sleeveColor),
        r(2, 29, 4, 1, sleeveShadow),
        r(2, 30, 4, 5, skin.base),
        r(2, 34, 4, 1, skin.shadow),
        r(2, 35, 4, 2, skin.base),
        // Right arm (hand on chin)
        r(26, 25, 4, 1, OUTLINE),
        r(26, 26, 4, 4, sleeveColor),
        r(30, 26, 1, 4, OUTLINE),
        r(28, 18, 3, 8, sleeveColor),
        r(31, 18, 1, 8, OUTLINE),
        r(27, 18, 1, 8, OUTLINE),
        r(20, 16, 8, 1, OUTLINE),
        r(19, 17, 1, 3, OUTLINE),
        r(20, 17, 8, 3, skin.base),
        r(20, 19, 8, 1, skin.shadow),
      ];

    case "crossed_arms":
      return [
        // Left arm (crossing right)
        r(2, 25, 4, 1, OUTLINE),
        r(1, 26, 1, 4, OUTLINE),
        r(2, 26, 4, 4, sleeveColor),
        r(2, 30, 22, 1, OUTLINE),
        r(6, 31, 18, 2, skin.base),
        r(6, 32, 18, 1, skin.shadow),
        r(24, 31, 2, 2, skin.base),
        r(26, 31, 1, 2, OUTLINE),
        // Right arm (crossing left)
        r(26, 25, 4, 1, OUTLINE),
        r(30, 26, 1, 4, OUTLINE),
        r(26, 26, 4, 4, sleeveColor),
        r(8, 33, 18, 1, OUTLINE),
        r(6, 34, 18, 2, skin.base),
        r(6, 35, 18, 1, skin.shadow),
        r(6, 34, 2, 2, skin.base),
        r(5, 34, 1, 2, OUTLINE),
      ];

    case "middle_fingers":
      return [
        // Left arm (raised, middle finger up)
        r(2, 25, 4, 1, OUTLINE),
        r(2, 26, 4, 4, sleeveColor),
        r(-1, 26, 1, 4, OUTLINE),
        r(0, 18, 3, 8, skin.base),
        r(-1, 18, 1, 8, OUTLINE),
        r(3, 18, 1, 8, OUTLINE),
        // Fist
        r(-1, 16, 5, 2, OUTLINE),
        r(0, 16, 3, 2, skin.base),
        // Middle finger
        r(1, 13, 1, 3, OUTLINE),
        r(1, 14, 1, 2, skin.base),
        // Right arm (raised, middle finger up)
        r(26, 25, 4, 1, OUTLINE),
        r(26, 26, 4, 4, sleeveColor),
        r(30, 26, 1, 4, OUTLINE),
        r(29, 18, 3, 8, skin.base),
        r(28, 18, 1, 8, OUTLINE),
        r(32, 18, 1, 8, OUTLINE),
        // Fist
        r(28, 16, 5, 2, OUTLINE),
        r(29, 16, 3, 2, skin.base),
        // Middle finger
        r(30, 13, 1, 3, OUTLINE),
        r(30, 14, 1, 2, skin.base),
      ];

    case "fighting_stance":
      return [
        // Left arm (forward punching guard — fist out front)
        r(2, 25, 4, 1, OUTLINE),
        r(2, 26, 4, 4, sleeveColor),
        r(1, 26, 1, 4, OUTLINE),
        // Upper arm angled forward
        r(-2, 28, 4, 1, OUTLINE),
        r(-2, 33, 4, 1, OUTLINE),
        r(-2, 29, 4, 4, skin.base),
        r(-2, 32, 4, 1, skin.shadow),
        r(-3, 29, 1, 4, OUTLINE),
        // Fist (x=-2 to x=1, at chest height)
        r(-2, 27, 4, 1, OUTLINE),
        r(-3, 28, 1, 3, OUTLINE),
        r(-2, 28, 4, 3, skin.base),
        r(-1, 28, 2, 1, skin.highlight),
        r(-2, 30, 4, 1, skin.shadow),
        r(2, 28, 1, 3, OUTLINE),
        r(-2, 31, 4, 1, OUTLINE),
        // Right arm (guard position — forearm up, fist near chin)
        r(26, 25, 4, 1, OUTLINE),
        r(26, 26, 4, 4, sleeveColor),
        r(30, 26, 1, 4, OUTLINE),
        r(28, 20, 3, 6, sleeveColor),
        r(31, 20, 1, 6, OUTLINE),
        r(27, 20, 1, 6, OUTLINE),
        // Forearm / fist near chin
        r(28, 18, 3, 2, skin.base),
        r(31, 18, 1, 2, OUTLINE),
        r(27, 18, 1, 2, OUTLINE),
        r(27, 16, 5, 2, OUTLINE),
        r(28, 16, 3, 2, skin.base),
        r(29, 16, 2, 1, skin.highlight),
      ];

    case "casting":
      return [
        // Left arm (extended forward, palm open)
        r(2, 25, 4, 1, OUTLINE),
        r(2, 26, 4, 4, sleeveColor),
        r(1, 26, 1, 4, OUTLINE),
        // Forearm angled forward
        r(-3, 26, 5, 1, OUTLINE),
        r(-3, 31, 5, 1, OUTLINE),
        r(-4, 27, 1, 4, OUTLINE),
        r(-3, 27, 5, 4, skin.base),
        r(-3, 30, 5, 1, skin.shadow),
        // Open palm with spread fingers
        r(-7, 26, 3, 1, OUTLINE),
        r(-8, 27, 1, 4, OUTLINE),
        r(-7, 27, 3, 4, skin.base),
        r(-6, 27, 2, 2, skin.highlight),
        r(-7, 30, 3, 1, skin.shadow),
        r(-7, 31, 3, 1, OUTLINE),
        // Fingers spread
        r(-8, 24, 1, 3, OUTLINE),
        r(-7, 25, 1, 2, skin.base),
        r(-6, 24, 1, 2, OUTLINE),
        r(-5, 25, 1, 2, skin.base),
        r(-4, 24, 1, 3, OUTLINE),
        // Glow effect around left fingertips
        r(-9, 24, 1, 1, "#7B68EE"),
        r(-6, 23, 1, 1, "#9890FF"),
        r(-3, 24, 1, 1, "#7B68EE"),
        r(-8, 23, 1, 1, "#9890FF"),
        // Right arm (extended forward, palm open)
        r(26, 25, 4, 1, OUTLINE),
        r(26, 26, 4, 4, sleeveColor),
        r(30, 26, 1, 4, OUTLINE),
        // Forearm angled forward
        r(30, 26, 5, 1, OUTLINE),
        r(30, 31, 5, 1, OUTLINE),
        r(35, 27, 1, 4, OUTLINE),
        r(30, 27, 5, 4, skin.base),
        r(30, 30, 5, 1, skin.shadow),
        // Open palm with spread fingers
        r(36, 26, 3, 1, OUTLINE),
        r(36, 27, 3, 4, skin.base),
        r(36, 27, 2, 2, skin.highlight),
        r(36, 30, 3, 1, skin.shadow),
        r(39, 27, 1, 4, OUTLINE),
        r(36, 31, 3, 1, OUTLINE),
        // Fingers spread
        r(36, 24, 1, 3, OUTLINE),
        r(37, 25, 1, 2, skin.base),
        r(38, 24, 1, 2, OUTLINE),
        r(39, 25, 1, 2, skin.base),
        r(40, 24, 1, 3, OUTLINE),
        // Glow effect around right fingertips
        r(36, 23, 1, 1, "#9890FF"),
        r(39, 24, 1, 1, "#7B68EE"),
        r(41, 24, 1, 1, "#9890FF"),
        r(38, 23, 1, 1, "#7B68EE"),
        // Spell particles floating in front
        r(-10, 25, 1, 1, "#FFFFFF"),
        r(-5, 22, 1, 1, "#B8B0FF"),
        r(42, 25, 1, 1, "#FFFFFF"),
        r(37, 22, 1, 1, "#B8B0FF"),
      ];

    case "victory":
      return [
        // Left arm (hand on hip)
        r(2, 25, 4, 1, OUTLINE),
        r(2, 26, 4, 4, sleeveColor),
        r(1, 26, 1, 4, OUTLINE),
        // Forearm angled inward to hip
        r(2, 30, 4, 3, skin.base),
        r(2, 32, 4, 1, skin.shadow),
        r(1, 30, 1, 3, OUTLINE),
        // Hand on waist (y=33-35)
        r(2, 33, 5, 1, OUTLINE),
        r(2, 34, 5, 2, skin.base),
        r(3, 34, 3, 1, skin.highlight),
        r(2, 35, 5, 1, skin.shadow),
        r(1, 34, 1, 2, OUTLINE),
        r(2, 36, 5, 1, OUTLINE),
        // Right arm (raised high — fist pump!)
        r(26, 25, 4, 1, OUTLINE),
        r(26, 26, 4, 4, sleeveColor),
        r(30, 26, 1, 4, OUTLINE),
        // Upper arm going up
        r(28, 18, 3, 8, sleeveColor),
        r(31, 18, 1, 8, OUTLINE),
        r(27, 18, 1, 8, OUTLINE),
        // Forearm continuing up
        r(28, 12, 3, 6, skin.base),
        r(28, 12, 2, 3, skin.highlight),
        r(31, 12, 1, 6, OUTLINE),
        r(27, 12, 1, 6, OUTLINE),
        // Raised fist at y=8
        r(27, 7, 5, 1, OUTLINE),
        r(26, 8, 1, 4, OUTLINE),
        r(27, 8, 5, 4, skin.base),
        r(28, 8, 3, 2, skin.highlight),
        r(27, 11, 5, 1, skin.shadow),
        r(32, 8, 1, 4, OUTLINE),
        r(27, 12, 5, 1, OUTLINE),
      ];

    case "sitting":
      return [
        // Left arm (resting at side, slightly bent, hands on lap)
        r(1, 26, 1, 8, OUTLINE),
        r(2, 25, 4, 1, OUTLINE),
        r(2, 26, 4, 4, sleeveColor),
        r(2, 29, 4, 1, sleeveShadow),
        r(2, 30, 4, 3, skin.base),
        r(2, 32, 4, 1, skin.shadow),
        // Hand resting on lap (y=33-35)
        r(2, 33, 5, 1, OUTLINE),
        r(2, 34, 5, 2, skin.base),
        r(3, 34, 3, 1, skin.highlight),
        r(1, 34, 1, 2, OUTLINE),
        r(7, 34, 1, 2, OUTLINE),
        r(2, 36, 5, 1, OUTLINE),
        // Right arm (resting at side, slightly bent, hands on lap)
        r(30, 26, 1, 8, OUTLINE),
        r(26, 25, 4, 1, OUTLINE),
        r(26, 26, 4, 4, sleeveColor),
        r(26, 29, 4, 1, sleeveShadow),
        r(26, 30, 4, 3, skin.base),
        r(26, 32, 4, 1, skin.shadow),
        // Hand resting on lap (y=33-35)
        r(25, 33, 5, 1, OUTLINE),
        r(25, 34, 5, 2, skin.base),
        r(26, 34, 3, 1, skin.highlight),
        r(24, 34, 1, 2, OUTLINE),
        r(30, 34, 1, 2, OUTLINE),
        r(25, 36, 5, 1, OUTLINE),
      ];

    case "idle":
    default:
      return [
        // Left arm
        r(1, 26, 1, 11, OUTLINE),
        r(2, 25, 4, 1, OUTLINE),
        r(2, 37, 4, 1, OUTLINE),
        r(2, 26, 4, 4, sleeveColor),
        r(2, 29, 4, 1, sleeveShadow),
        r(2, 30, 4, 5, skin.base),
        r(2, 34, 4, 1, skin.shadow),
        r(2, 35, 4, 2, skin.base),
        r(2, 35, 2, 1, skin.highlight),
        // Right arm
        r(30, 26, 1, 11, OUTLINE),
        r(26, 25, 4, 1, OUTLINE),
        r(26, 37, 4, 1, OUTLINE),
        r(26, 26, 4, 4, sleeveColor),
        r(26, 29, 4, 1, sleeveShadow),
        r(26, 30, 4, 5, skin.base),
        r(26, 34, 4, 1, skin.shadow),
        r(26, 35, 4, 2, skin.base),
        r(28, 35, 2, 1, skin.highlight),
      ];
  }
}
