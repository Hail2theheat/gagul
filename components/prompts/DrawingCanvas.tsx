/**
 * DrawingCanvas - Opens a full-screen art studio for drawing
 * Fixes: multiple strokes, color per stroke, scroll interference
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  SafeAreaView,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(SCREEN_WIDTH - 40, SCREEN_HEIGHT * 0.5);

const COLORS = {
  bg: '#0D1426',
  card: '#1A1A2E',
  border: '#27406B',
  text: '#E6F0FF',
  muted: '#9CA3AF',
  accent: '#FF6B35',
  canvas: '#FFFFFF',
};

const PALETTE = [
  '#000000', '#FF0000', '#FF6B35', '#FFD93D', '#4ADE80',
  '#3B82F6', '#8B5CF6', '#EC4899', '#8B4513', '#FFFFFF',
];

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
  disabled?: boolean;
  prompt?: string;
}

export function DrawingCanvas({ onSave, disabled, prompt }: DrawingCanvasProps) {
  const [showStudio, setShowStudio] = useState(false);
  const [paths, setPaths] = useState<PathData[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [strokeSize, setStrokeSize] = useState(8);
  const [undoStack, setUndoStack] = useState<PathData[][]>([]);
  const [redoStack, setRedoStack] = useState<PathData[][]>([]);
  const [saving, setSaving] = useState(false);

  const viewShotRef = useRef<ViewShot>(null);

  // Use refs to avoid stale closure issues
  const pathsRef = useRef<PathData[]>([]);
  const currentPathRef = useRef<string>('');
  const selectedColorRef = useRef('#000000');
  const strokeSizeRef = useRef(8);

  // Keep refs in sync
  pathsRef.current = paths;
  currentPathRef.current = currentPath;
  selectedColorRef.current = selectedColor;
  strokeSizeRef.current = strokeSize;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        const x = Math.max(0, Math.min(CANVAS_SIZE, locationX));
        const y = Math.max(0, Math.min(CANVAS_SIZE, locationY));
        currentPathRef.current = `M${x},${y}`;
        setCurrentPath(`M${x},${y}`);
      },

      onPanResponderMove: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        const x = Math.max(0, Math.min(CANVAS_SIZE, locationX));
        const y = Math.max(0, Math.min(CANVAS_SIZE, locationY));
        const newPath = currentPathRef.current + `L${x},${y}`;
        currentPathRef.current = newPath;
        setCurrentPath(newPath);
      },

      onPanResponderRelease: () => {
        if (currentPathRef.current && currentPathRef.current.length > 0) {
          const newPath: PathData = {
            d: currentPathRef.current,
            color: selectedColorRef.current,
            strokeWidth: strokeSizeRef.current,
          };

          setUndoStack(prev => [...prev, pathsRef.current]);
          setRedoStack([]);
          setPaths(prev => [...prev, newPath]);
        }
        currentPathRef.current = '';
        setCurrentPath('');
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
    if (saving || !viewShotRef.current || paths.length === 0) return;

    setSaving(true);
    try {
      const uri = await viewShotRef.current.capture();
      setShowStudio(false);
      onSave(uri);
    } catch (error) {
      console.error('Error saving drawing:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setShowStudio(false);
  };

  const openStudio = () => {
    if (!disabled) {
      setShowStudio(true);
    }
  };

  // Preview component (shown in the card)
  const PreviewCanvas = () => (
    <TouchableOpacity
      style={styles.previewContainer}
      onPress={openStudio}
      disabled={disabled}
    >
      {paths.length > 0 ? (
        <View style={styles.previewCanvas}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}>
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
      ) : (
        <View style={styles.previewPlaceholder}>
          <Text style={styles.previewIcon}>🎨</Text>
          <Text style={styles.previewText}>Tap to open Art Studio</Text>
          <Text style={styles.previewHint}>Draw your masterpiece!</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <PreviewCanvas />

      <Modal
        visible={showStudio}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleClose}
      >
        <SafeAreaView style={styles.studioContainer}>
          {/* Header */}
          <View style={styles.studioHeader}>
            <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>✕ Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Art Studio</Text>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.headerButton, styles.saveHeaderButton, paths.length === 0 && styles.headerButtonDisabled]}
              disabled={paths.length === 0 || saving}
            >
              <Text style={[styles.headerButtonText, styles.saveHeaderText]}>
                {saving ? 'Saving...' : 'Done ✓'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Prompt */}
          {prompt && (
            <View style={styles.promptBar}>
              <Text style={styles.promptLabel}>Draw:</Text>
              <Text style={styles.promptText}>"{prompt}"</Text>
            </View>
          )}

          {/* Canvas */}
          <View style={styles.canvasWrapper}>
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'png', quality: 0.9 }}
              style={styles.viewShot}
            >
              <View style={styles.canvas} {...panResponder.panHandlers}>
                <Svg width={CANVAS_SIZE} height={CANVAS_SIZE}>
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
          </View>

          {/* Tools */}
          <View style={styles.toolsContainer}>
            {/* Stroke size */}
            <View style={styles.toolSection}>
              <Text style={styles.toolLabel}>Brush Size</Text>
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
                        { width: s.size + 6, height: s.size + 6, backgroundColor: selectedColor },
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
                <Text style={styles.actionIcon}>↩</Text>
                <Text style={styles.actionText}>Undo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, redoStack.length === 0 && styles.actionButtonDisabled]}
                onPress={handleRedo}
                disabled={redoStack.length === 0}
              >
                <Text style={styles.actionIcon}>↪</Text>
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
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Preview (in card)
  previewContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.canvas,
  },
  previewCanvas: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  previewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  previewIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  previewText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  previewHint: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 4,
  },

  // Studio (modal)
  studioContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  studioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  headerButtonDisabled: {
    opacity: 0.4,
  },
  saveHeaderButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
  },
  saveHeaderText: {
    color: '#FFF',
    fontWeight: '700',
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  promptBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 6,
  },
  promptLabel: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  promptText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    flexShrink: 1,
  },

  // Canvas
  canvasWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  viewShot: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    backgroundColor: COLORS.canvas,
    borderRadius: 12,
  },

  // Tools
  toolsContainer: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
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
    width: 44,
    height: 44,
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
    gap: 10,
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.bg,
    borderRadius: 8,
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DrawingCanvas;
