/**
 * DrawingPreview - Read-only renderer for SVG path drawings stored as JSON
 * Used in TelephoneCard (write steps) and chain reveal (lowdown)
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, G, Rect } from 'react-native-svg';

export interface PathData {
  d: string;
  color: string;
  strokeWidth: number;
}

export interface DrawingData {
  viewBox: { width: number; height: number };
  paths: PathData[];
}

interface DrawingPreviewProps {
  drawingJson: string;
  size?: number | string;
  backgroundColor?: string;
}

/** Parse a drawing_url JSON string into DrawingData */
export function parseDrawingData(json: string): DrawingData | null {
  try {
    const parsed = JSON.parse(json);
    if (parsed.viewBox && parsed.paths) {
      return parsed as DrawingData;
    }
    if (Array.isArray(parsed)) {
      return {
        viewBox: { width: 300, height: 300 },
        paths: parsed as PathData[],
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function DrawingPreview({
  drawingJson,
  size = '100%',
  backgroundColor = '#FFFFFF',
}: DrawingPreviewProps) {
  const data = parseDrawingData(drawingJson);

  if (!data || data.paths.length === 0) {
    return (
      <View style={[styles.container, { width: size as any, aspectRatio: 1, backgroundColor }]} />
    );
  }

  const { viewBox, paths } = data;

  return (
    <View style={[styles.container, { width: size as any, aspectRatio: 1 }]}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
      >
        <Rect x="0" y="0" width={viewBox.width} height={viewBox.height} fill={backgroundColor} />
        <G>
          {paths.map((path, index) => (
            <Path
              key={index}
              d={path.d}
              stroke={path.color}
              strokeWidth={path.strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});
