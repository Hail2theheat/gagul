// components/pixel-character/renderer.tsx
// DESIGN_SYSTEM.md compliant: View-based pixel blocks with hard edges (no SVG anti-aliasing)
import React from "react";
import { View } from "react-native";
import { PixelRect } from "./types";

interface PixelRendererProps {
  pixels: PixelRect[];
  width: number;
  height: number;
  size: number;
}

export function PixelRenderer({ pixels, width, height, size }: PixelRendererProps) {
  // Scale so the character body matches the requested size
  const scale = size / width; // e.g. 120/32 = 3.75

  return (
    <View style={{
      width: size,
      height: size * (height / width),
      position: "relative",
      overflow: "visible",
    }}>
      {pixels.map((p, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: p.x * scale,
            top: p.y * scale,
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
