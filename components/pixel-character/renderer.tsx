// components/pixel-character/renderer.tsx
// DESIGN_SYSTEM.md compliant: View-based pixel blocks with hard edges (no SVG anti-aliasing)
import React from "react";
import { View } from "react-native";
import { PixelRect } from "./types";

// Padding around the 32x48 character body to show arms/accessories that extend beyond
const PAD_X = 24; // arms can reach x=-20 to x=52
const PAD_Y = 14; // unicorn horn to y=-10, staff to y=51

interface PixelRendererProps {
  pixels: PixelRect[];
  width: number;
  height: number;
  size: number;
}

export function PixelRenderer({ pixels, width, height, size }: PixelRendererProps) {
  // The viewBox covers a wider area to include arms/accessories
  const totalW = width + PAD_X * 2;   // 32 + 48 = 80
  const totalH = height + PAD_Y * 2;  // 48 + 28 = 76

  // Scale so the character body matches the requested size
  const scale = size / width; // e.g. 120/32 = 3.75

  return (
    <View style={{
      width: size,
      height: size * (height / width),
      position: "relative",
    }}>
      {pixels.map((p, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: (p.x + PAD_X) * scale,
            top: (p.y + PAD_Y) * scale,
            width: p.w * scale,
            height: p.h * scale,
            backgroundColor: p.color,
            // Hard edges - DESIGN_SYSTEM.md rule: borderRadius: 0 for pixel blocks
          }}
        />
      ))}
    </View>
  );
}
