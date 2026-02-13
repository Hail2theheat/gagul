// components/pixel-character/renderer.tsx
import React from "react";
import { View } from "react-native";
import Svg, { Rect } from "react-native-svg";
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
  const renderedWidth = totalW * scale;   // full SVG width including padding
  const renderedHeight = totalH * scale;  // full SVG height including padding

  // Negative margins so the padding doesn't affect layout —
  // the component takes up the same space as before (size x size*aspectRatio)
  const marginX = -PAD_X * scale;
  const marginY = -PAD_Y * scale;

  return (
    <View style={{
      width: size,
      height: size * (height / width),
      overflow: "visible",
    }}>
      <Svg
        width={renderedWidth}
        height={renderedHeight}
        viewBox={`${-PAD_X} ${-PAD_Y} ${totalW} ${totalH}`}
        style={{
          marginLeft: marginX,
          marginTop: marginY,
        }}
      >
        {pixels.map((p, i) => (
          <Rect
            key={i}
            x={p.x}
            y={p.y}
            width={p.w}
            height={p.h}
            fill={p.color}
          />
        ))}
      </Svg>
    </View>
  );
}
