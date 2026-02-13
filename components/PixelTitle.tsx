// components/PixelTitle.tsx
// Two-tone pixel font heading inspired by retro game title screens.
// Yellow highlight on the top ~40%, orange body, dark pixel outline.

import React from "react";
import { View, Text, TextStyle } from "react-native";

type Props = {
  children: string;
  fontSize?: number;
  style?: TextStyle;
};

export function PixelTitle({ children, fontSize = 18, style }: Props) {
  const baseStyle: TextStyle = {
    fontFamily: "PressStart2P_400Regular",
    fontSize,
    color: "#E05A1A",
    textShadowColor: "#2A1506",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    ...style,
  };

  // Height of the yellow highlight band (~40% of the line)
  const highlightHeight = fontSize * 0.45;

  return (
    <View style={{ position: "relative" }}>
      {/* Base layer: orange text with dark outline shadow */}
      <Text style={baseStyle} allowFontScaling={false}>
        {children}
      </Text>

      {/* Top highlight layer: yellow, clipped to upper portion */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: highlightHeight,
          overflow: "hidden",
        }}
        pointerEvents="none"
      >
        <Text
          style={[baseStyle, { color: "#FFD93D", textShadowColor: "transparent" }]}
          allowFontScaling={false}
        >
          {children}
        </Text>
      </View>
    </View>
  );
}

export default PixelTitle;
