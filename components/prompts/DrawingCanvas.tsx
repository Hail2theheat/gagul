/**
 * DrawingCanvas - A drawing component with stroke size, colors, undo/redo
 * Used for Telephone game prompts
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = SCREEN_WIDTH - 40; // 20px padding on each side

const COLORS = {
  bg: '#0D1426',
  card: '#1A1A2E',
  border: '#27406B',
  text: '#E6F0FF',
  muted: '#9CA3AF',
  accent: '#FF6B35',
  canvas: '#FFFFFF',
};

// Available colors for drawing
const PALETTE = [
  '#000000', // Black
  '#FF0000', // Red
  '#FF6B35', // Orange
  '#FFD93D', // Yellow
  '#4ADE80', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#8B4513', // Brown
  '#FFFFFF', // White (eraser effect on white canvas)
];

// Stroke sizes
const STROKE_SIZES = [
  { label: 'S', size: 3 },
  { label: 'M', size: 8 },
  { label: 'L', size: 16 },
];

interface PathData {
  d: string;
  color: string;
  strokeWidth: number;
}

interface DrawingCanvasProps {
  onSave: (imageUri: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export function DrawingCanvas({ onSave, onCancel, disabled }: DrawingCanvasProps) {
  const [paths, setPaths] = useState<PathData[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [strokeSize, setStrokeSize] = useState(8);
  const [undoStack, setUndoStack] = useState<PathData[][]>([]);
  const [redoStack, setRedoStack] = useState<PathData[][]>([]);
  const [saving, setSaving] = useState(false);

  const viewShotRef = useRef<ViewShot>(null);

  // Convert touch coordinates to SVG path
  const touchToPath = useCallback((x: number, y: number, isFirst: boolean) => {
    // Clamp coordinates to canvas bounds
    const clampedX = Math.max(0, Math.min(CANVAS_SIZE, x));
    const clampedY = Math.max(0, Math.min(CANVAS_SIZE, y));

    if (isFirst) {
      return `M${clampedX},${clampedY}`;
    }
    return `L${clampedX},${clampedY}`;
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,

      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(touchToPath(locationX, locationY, true));
      },

      onPanResponderMove: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(prev => prev + touchToPath(locationX, locationY, false));
      },

      onPanResponderRelease: () => {
        if (currentPath) {
          // Save current state for undo
          setUndoStack(prev => [...prev, paths]);
          setRedoStack([]); // Clear redo stack on new action

          const newPath: PathData = {
            d: currentPath,
            color: selectedColor,
            strokeWidth: strokeSize,
          };
          setPaths(prev => [...prev, newPath]);
          setCurrentPath('');
        }
      },
    })
  ).current;

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, paths]);
      setPaths(previousState);
      setUndoStack(prev => prev.slice(0, -1));
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, paths]);
      setPaths(nextState);
      setRedoStack(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (paths.length > 0) {
      setUndoStack(prev => [...prev, paths]);
      setRedoStack([]);
      setPaths([]);
    }
  };

  const handleSave = async () => {
    if (saving || !viewShotRef.current) return;

    setSaving(true);
    try {
      const uri = await viewShotRef.current.capture();
      onSave(uri);
    } catch (error) {
      console.error('Error saving drawing:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Canvas area */}
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'png', quality: 0.9 }}
        style={styles.canvasContainer}
      >
        <View style={styles.canvas} {...panResponder.panHandlers}>
          <Svg width={CANVAS_SIZE} height={CANVAS_SIZE} style={styles.svg}>
            {/* Completed paths */}
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
              {/* Current path being drawn */}
              {currentPath && (
                <Path
                  d={currentPath}
                  stroke={selectedColor}
                  strokeWidth={strokeSize}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </G>
          </Svg>
        </View>
      </ViewShot>

      {/* Tools */}
      <View style={styles.tools}>
        {/* Stroke size */}
        <View style={styles.toolSection}>
          <Text style={styles.toolLabel}>Size</Text>
          <View style={styles.sizeRow}>
            {STROKE_SIZES.map((s) => (
              <TouchableOpacity
                key={s.label}
                style={[
                  styles.sizeButton,
                  strokeSize === s.size && styles.sizeButtonActive,
                ]}
                onPress={() => setStrokeSize(s.size)}
              >
                <View
                  style={[
                    styles.sizePreview,
                    { width: s.size + 4, height: s.size + 4, backgroundColor: selectedColor },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Colors */}
        <View style={styles.toolSection}>
          <Text style={styles.toolLabel}>Color</Text>
          <View style={styles.colorRow}>
            {PALETTE.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorButton,
                  { backgroundColor: color },
                  color === '#FFFFFF' && styles.colorButtonWhite,
                  selectedColor === color && styles.colorButtonActive,
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, undoStack.length === 0 && styles.actionButtonDisabled]}
            onPress={handleUndo}
            disabled={undoStack.length === 0}
          >
            <Text style={styles.actionIcon}>↶</Text>
            <Text style={styles.actionText}>Undo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, redoStack.length === 0 && styles.actionButtonDisabled]}
            onPress={handleRedo}
            disabled={redoStack.length === 0}
          >
            <Text style={styles.actionIcon}>↷</Text>
            <Text style={styles.actionText}>Redo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, paths.length === 0 && styles.actionButtonDisabled]}
            onPress={handleClear}
            disabled={paths.length === 0}
          >
            <Text style={styles.actionIcon}>🗑</Text>
            <Text style={styles.actionText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom buttons */}
      <View style={styles.bottomRow}>
        {onCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.saveButton,
            (paths.length === 0 || saving) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={paths.length === 0 || saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Done'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 16,
  },
  canvasContainer: {
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    backgroundColor: COLORS.canvas,
    borderRadius: 12,
  },
  svg: {
    backgroundColor: 'transparent',
  },
  tools: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  toolSection: {
    gap: 8,
  },
  toolLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sizeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sizeButtonActive: {
    borderColor: COLORS.accent,
  },
  sizePreview: {
    borderRadius: 20,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonWhite: {
    borderColor: COLORS.border,
  },
  colorButtonActive: {
    borderColor: COLORS.text,
    borderWidth: 3,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 8,
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  actionIcon: {
    fontSize: 16,
  },
  actionText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default DrawingCanvas;
