/**
 * BlindRankingInput - Full-screen modal ranking scale
 *
 * Shows a "Where's it Rank?" button in the prompt card. Tapping opens a
 * full-screen modal with a tall vertical tower building. Floors are labeled
 * with scale items (most plausible at top, least at bottom). A horizontal
 * arrow to the right of the building slides up and down to pick a level.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  Pressable,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  FadeIn,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { CampfireColors } from '../../constants/theme';
import { SPRING_SNAPPY } from '../../constants/animations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Button component (in-card) ─────────────────────────────────

interface BlindRankingInputProps {
  value: string;
  onChangeText: (text: string) => void;
  scaleItems: string[];
  disabled?: boolean;
}

export function BlindRankingInput({
  value,
  onChangeText,
  scaleItems,
  disabled = false,
}: BlindRankingInputProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const buttonScale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const itemCount = scaleItems.length;

  // Current display label
  const currentVal = localValue ? parseFloat(localValue) : -1;
  const hasValue = currentVal >= 0;

  const handleOpen = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalVisible(true);
  };

  const handleConfirm = (val: string) => {
    setLocalValue(val);
    onChangeText(val);
    setModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleClose = () => {
    setModalVisible(false);
  };

  // Display label for the button
  let buttonLabel = 'Tap to rank';
  if (hasValue) {
    const lowerIdx = Math.floor(currentVal);
    const upperIdx = Math.ceil(currentVal);
    const fraction = currentVal - lowerIdx;
    if (lowerIdx === upperIdx || fraction < 0.1) {
      buttonLabel = scaleItems[Math.min(lowerIdx, itemCount - 1)] || '';
    } else if (fraction > 0.9) {
      buttonLabel = scaleItems[Math.min(upperIdx, itemCount - 1)] || '';
    } else {
      buttonLabel = `Between ${scaleItems[Math.min(lowerIdx, itemCount - 1)]} & ${scaleItems[Math.min(upperIdx, itemCount - 1)]}`;
    }
  }

  return (
    <>
      {/* Button in the prompt card */}
      <Animated.View style={buttonStyle}>
        <Pressable
          style={[styles.openButton, hasValue && styles.openButtonSelected]}
          onPress={handleOpen}
          onPressIn={() => { buttonScale.value = withSpring(0.96, SPRING_SNAPPY); }}
          onPressOut={() => { buttonScale.value = withSpring(1, SPRING_SNAPPY); }}
          disabled={disabled}
        >
          <Text style={styles.openButtonEmoji}>{hasValue ? '\uD83C\uDFAF' : '\uD83E\uDD14'}</Text>
          <View style={styles.openButtonTextCol}>
            <Text style={styles.openButtonTitle}>
              {hasValue ? 'Ranked!' : "Where's it Rank?"}
            </Text>
            {hasValue && (
              <Text style={styles.openButtonValue} numberOfLines={1}>
                {buttonLabel}
              </Text>
            )}
            {!hasValue && (
              <Text style={styles.openButtonHint}>Tap to open the ranking scale</Text>
            )}
          </View>
          <Text style={styles.openButtonChevron}>{'\u203A'}</Text>
        </Pressable>
      </Animated.View>

      {/* Full-screen ranking modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleClose}
      >
        <RankingScreen
          scaleItems={scaleItems}
          initialValue={localValue}
          onConfirm={handleConfirm}
          onClose={handleClose}
        />
      </Modal>
    </>
  );
}

// ─── Full-screen ranking tower ──────────────────────────────────

interface RankingScreenProps {
  scaleItems: string[];
  initialValue: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

function RankingScreen({ scaleItems, initialValue, onConfirm, onClose }: RankingScreenProps) {
  const itemCount = scaleItems.length;
  const maxValue = Math.max(itemCount - 1, 1);

  // Dynamic layout — adapt floor height to screen
  const BLDG_LEFT = 18;
  const BLDG_W = SCREEN_WIDTH * 0.54;
  const MAX_FLOOR_H = 64;
  const AVAIL_H = SCREEN_HEIGHT - 340;
  const FLOOR_H = Math.min(MAX_FLOOR_H, Math.floor(AVAIL_H / itemCount));
  const BLDG_H = FLOOR_H * itemCount;
  const BLDG_Y = 32; // building top within gesture area (space for antenna + label)
  const AREA_H = BLDG_Y + BLDG_H + 24;
  const PLANE_LEFT = BLDG_LEFT + BLDG_W + 2;

  const initVal = initialValue ? parseFloat(initialValue) : maxValue / 2;
  const currentValue = useSharedValue(initVal);
  const [displayValue, setDisplayValue] = useState(initVal);
  const lastTickRef = useRef(Math.round(initVal));

  const confirmScale = useSharedValue(1);
  const confirmStyle = useAnimatedStyle(() => ({
    transform: [{ scale: confirmScale.value }],
  }));

  // Plane Y — maps value to vertical position within the gesture area
  const planeStyle = useAnimatedStyle(() => {
    const floorFromTop = maxValue - currentValue.value;
    const centerY = BLDG_Y + floorFromTop * FLOOR_H + FLOOR_H / 2;
    return { top: centerY - 18 }; // center the 36px-tall plane
  });

  const updateDisplay = useCallback((val: number) => {
    setDisplayValue(val);
    const nearest = Math.round(val);
    if (nearest !== lastTickRef.current) {
      lastTickRef.current = nearest;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  // Pan gesture — drag anywhere to move plane
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const relY = e.y - BLDG_Y - FLOOR_H / 2;
      const val = maxValue - relY / FLOOR_H;
      const clamped = Math.max(0, Math.min(maxValue, val));
      currentValue.value = clamped;
      runOnJS(updateDisplay)(clamped);
    });

  // Tap gesture — tap to place plane
  const tapGesture = Gesture.Tap()
    .onEnd((e) => {
      const relY = e.y - BLDG_Y - FLOOR_H / 2;
      const val = maxValue - relY / FLOOR_H;
      const clamped = Math.max(0, Math.min(maxValue, val));
      currentValue.value = clamped;
      runOnJS(updateDisplay)(clamped);
    });

  const composed = Gesture.Race(panGesture, tapGesture);

  // Position label
  const lowerIdx = Math.floor(displayValue);
  const upperIdx = Math.ceil(displayValue);
  const fraction = displayValue - lowerIdx;
  let positionLabel = '';
  if (lowerIdx === upperIdx || fraction < 0.08) {
    positionLabel = scaleItems[Math.min(lowerIdx, itemCount - 1)] || '';
  } else if (fraction > 0.92) {
    positionLabel = scaleItems[Math.min(upperIdx, itemCount - 1)] || '';
  } else {
    const lower = scaleItems[Math.min(lowerIdx, itemCount - 1)] || '';
    const upper = scaleItems[Math.min(upperIdx, itemCount - 1)] || '';
    positionLabel = `Between ${lower} & ${upper}`;
  }

  const activeFloor = Math.round(displayValue);

  return (
    <GestureHandlerRootView style={rs.root}>
      <StatusBar barStyle="light-content" />

      {/* Close X */}
      <Pressable style={rs.closeButton} onPress={onClose} hitSlop={20}>
        <Text style={rs.closeX}>{'\u2715'}</Text>
      </Pressable>

      {/* Title */}
      <Text style={rs.title}>Where does it rank?</Text>
      <Text style={rs.subtitle}>Fly the plane up & down</Text>

      {/* Building + Plane interactive area */}
      <Animated.View entering={FadeIn.delay(300).duration(400)}>
        <GestureDetector gesture={composed}>
          <View style={[rs.gestureArea, { height: AREA_H }]}>

            {/* "Most plausible" label above building */}
            <Text style={[rs.endLabel, { top: BLDG_Y - 16, left: BLDG_LEFT }]}>
              {'\u25B2'} Most plausible
            </Text>

            {/* Antenna spire */}
            <View style={[rs.antennaWrap, {
              left: BLDG_LEFT + BLDG_W / 2 - 3,
              top: BLDG_Y - 24,
            }]}>
              <View style={rs.antennaLine} />
              <View style={rs.antennaDot} />
            </View>

            {/* Rooftop cap */}
            <View style={[rs.roofCap, {
              left: BLDG_LEFT + BLDG_W / 2 - 18,
              top: BLDG_Y - 8,
              width: 36,
            }]} />

            {/* Building ledge */}
            <View style={[rs.buildingLedge, {
              left: BLDG_LEFT - 3,
              top: BLDG_Y - 1,
              width: BLDG_W + 6,
            }]} />

            {/* Building body */}
            <View style={[rs.building, {
              left: BLDG_LEFT,
              top: BLDG_Y,
              width: BLDG_W,
              height: BLDG_H,
            }]}>
              {/* Floors — rendered top (most plausible) to bottom (least) */}
              {scaleItems.slice().reverse().map((item, renderIdx) => {
                const actualIdx = itemCount - 1 - renderIdx;
                const isActive = actualIdx === activeFloor;
                const isLast = renderIdx === itemCount - 1;
                // Pseudo-random window lighting pattern
                const lit1 = (actualIdx * 7 + 1) % 3 !== 0;
                const lit2 = (actualIdx * 7 + 2) % 3 !== 0;
                return (
                  <View
                    key={actualIdx}
                    style={[
                      rs.floor,
                      { height: FLOOR_H },
                      !isLast && rs.floorDivider,
                      isActive && rs.floorActive,
                    ]}
                  >
                    {isActive && <View style={rs.floorAccent} />}
                    <Text style={[rs.floorNum, isActive && rs.floorNumActive]}>
                      {actualIdx + 1}
                    </Text>
                    {/* Faint windows */}
                    <View style={rs.windowCol}>
                      <View style={[rs.window, lit1 && rs.windowLit, isActive && rs.windowGlow]} />
                      <View style={[rs.window, lit2 && rs.windowLit, isActive && rs.windowGlow]} />
                    </View>
                    <Text
                      style={[rs.floorLabel, isActive && rs.floorLabelActive]}
                      numberOfLines={2}
                    >
                      {item}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Building base / foundation */}
            <View style={[rs.buildingBase, {
              left: BLDG_LEFT - 4,
              top: BLDG_Y + BLDG_H,
              width: BLDG_W + 8,
            }]} />

            {/* "Least plausible" label below building */}
            <Text style={[rs.endLabel, {
              top: BLDG_Y + BLDG_H + 10,
              left: BLDG_LEFT,
            }]}>
              {'\u25BC'} Least plausible
            </Text>

            {/* Plane — side view, flying left toward building */}
            <Animated.View style={[rs.planeWrap, { left: PLANE_LEFT }, planeStyle]}>
              {/* Tail fin (vertical stabilizer) */}
              <View style={rs.planeTailFin} />
              {/* Horizontal stabilizer */}
              <View style={rs.planeHStab} />
              {/* Fuselage (rounded nose on left) */}
              <View style={rs.planeFuselage} />
              {/* Cockpit window */}
              <View style={rs.planeCockpit} />
              {/* Fuselage stripe */}
              <View style={rs.planeStripe} />
              {/* Wing (edge-on, below fuselage) */}
              <View style={rs.planeWing} />
              {/* Engine pod under wing */}
              <View style={rs.planeEngine} />
            </Animated.View>

          </View>
        </GestureDetector>
      </Animated.View>

      {/* Current position display */}
      <View style={rs.valueBox}>
        <Text style={rs.valueLabel}>{positionLabel || 'Drag to pick a spot'}</Text>
      </View>

      {/* Lock In button */}
      <Animated.View style={confirmStyle}>
        <Pressable
          style={rs.confirmButton}
          onPress={() => onConfirm(displayValue.toFixed(2))}
          onPressIn={() => { confirmScale.value = withSpring(0.95, SPRING_SNAPPY); }}
          onPressOut={() => { confirmScale.value = withSpring(1, SPRING_SNAPPY); }}
        >
          <Text style={rs.confirmText}>Lock It In</Text>
        </Pressable>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

// ─── Button Styles (in-card) ────────────────────────────────────

const styles = StyleSheet.create({
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CampfireColors.BG + 'CC',
    borderWidth: 1,
    borderColor: CampfireColors.BORDER,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  openButtonSelected: {
    borderColor: CampfireColors.FIRE_ORANGE + '80',
    backgroundColor: CampfireColors.FIRE_ORANGE + '10',
  },
  openButtonEmoji: {
    fontSize: 28,
  },
  openButtonTextCol: {
    flex: 1,
    gap: 2,
  },
  openButtonTitle: {
    color: CampfireColors.TEXT,
    fontSize: 16,
    fontFamily: 'Paaxel',
  },
  openButtonValue: {
    color: CampfireColors.FIRE_YELLOW,
    fontSize: 13,
    fontFamily: 'Paaxel',
  },
  openButtonHint: {
    color: CampfireColors.MUTED,
    fontSize: 12,
    fontFamily: 'Paaxel',
  },
  openButtonChevron: {
    color: CampfireColors.MUTED,
    fontSize: 24,
    fontWeight: '300',
  },
});

// ─── Full-Screen Tower Styles ───────────────────────────────────

const rs = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CampfireColors.BG,
    paddingTop: 60,
  },
  closeButton: {
    position: 'absolute',
    top: 54,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CampfireColors.CARD,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: CampfireColors.BORDER,
  },
  closeX: {
    color: CampfireColors.MUTED,
    fontSize: 16,
  },
  title: {
    color: CampfireColors.FIRE_YELLOW,
    fontSize: 22,
    fontFamily: 'Paaxel',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    color: CampfireColors.MUTED,
    fontSize: 13,
    fontFamily: 'Paaxel',
    textAlign: 'center',
    marginBottom: 10,
  },
  gestureArea: {
    width: SCREEN_WIDTH,
  },

  // Building
  building: {
    position: 'absolute',
    backgroundColor: '#12162A',
    borderWidth: 3,
    borderColor: '#3A4060',
    overflow: 'hidden',
  },
  buildingLedge: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#4A5070',
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  buildingBase: {
    position: 'absolute',
    height: 6,
    backgroundColor: '#3A4060',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  floor: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 6,
    gap: 6,
  },
  floorDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#1E2340',
  },
  floorActive: {
    backgroundColor: CampfireColors.FIRE_ORANGE + '1A',
  },
  floorAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: CampfireColors.FIRE_ORANGE,
  },
  floorNum: {
    color: '#3A4565',
    fontSize: 11,
    fontFamily: 'Paaxel',
    width: 14,
    textAlign: 'center',
  },
  floorNumActive: {
    color: CampfireColors.FIRE_ORANGE,
  },
  floorLabel: {
    color: CampfireColors.MUTED,
    fontSize: 13,
    fontFamily: 'Paaxel',
    flex: 1,
    lineHeight: 17,
  },
  floorLabelActive: {
    color: CampfireColors.TEXT,
  },

  // Windows
  windowCol: {
    flexDirection: 'column',
    gap: 3,
  },
  window: {
    width: 5,
    height: 6,
    backgroundColor: '#161B32',
    borderWidth: 0.5,
    borderColor: '#1E2545',
  },
  windowLit: {
    backgroundColor: '#1C2548',
    borderColor: '#283060',
  },
  windowGlow: {
    backgroundColor: '#2E3A65',
    borderColor: CampfireColors.FIRE_ORANGE + '30',
  },

  // Antenna + Roof
  antennaWrap: {
    position: 'absolute',
    width: 6,
    alignItems: 'center',
  },
  antennaLine: {
    width: 2,
    height: 16,
    backgroundColor: '#4A5070',
  },
  antennaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: CampfireColors.FIRE_ORANGE,
    marginTop: -1,
  },
  roofCap: {
    position: 'absolute',
    height: 8,
    backgroundColor: '#1A1F38',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: '#3A4060',
  },

  // End labels
  endLabel: {
    position: 'absolute',
    color: CampfireColors.MUTED + 'AA',
    fontSize: 10,
    fontFamily: 'Paaxel',
  },

  // Plane (side view, flying left)
  // Container: 70w x 36h
  planeWrap: {
    position: 'absolute',
    width: 70,
    height: 36,
  },
  // Tail fin — vertical stabilizer at back (right side, above fuselage)
  planeTailFin: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 8,
    height: 14,
    backgroundColor: CampfireColors.FIRE_ORANGE,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 2,
  },
  // Horizontal stabilizer — small bar at tail
  planeHStab: {
    position: 'absolute',
    right: 0,
    top: 12,
    width: 16,
    height: 3,
    backgroundColor: CampfireColors.FIRE_ORANGE + 'C0',
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 1,
  },
  // Fuselage — main body with rounded nose
  planeFuselage: {
    position: 'absolute',
    left: 0,
    top: 13,
    width: 62,
    height: 12,
    backgroundColor: CampfireColors.FIRE_ORANGE,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  // Cockpit window — on upper-front of fuselage
  planeCockpit: {
    position: 'absolute',
    left: 4,
    top: 13,
    width: 8,
    height: 5,
    backgroundColor: CampfireColors.FIRE_YELLOW,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 1,
    borderBottomRightRadius: 1,
  },
  // Fuselage stripe — thin accent line
  planeStripe: {
    position: 'absolute',
    left: 12,
    top: 19,
    width: 44,
    height: 2,
    backgroundColor: CampfireColors.FIRE_YELLOW + '50',
  },
  // Wing — edge-on view, thin bar below fuselage
  planeWing: {
    position: 'absolute',
    left: 14,
    top: 25,
    width: 34,
    height: 4,
    backgroundColor: CampfireColors.FIRE_ORANGE + 'D0',
    borderRadius: 1,
  },
  // Engine pod — small oval under wing
  planeEngine: {
    position: 'absolute',
    left: 22,
    top: 27,
    width: 8,
    height: 5,
    backgroundColor: CampfireColors.FIRE_ORANGE + '90',
    borderRadius: 2,
  },

  // Value display
  valueBox: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  valueLabel: {
    color: CampfireColors.FIRE_YELLOW,
    fontSize: 18,
    fontFamily: 'Paaxel',
    textAlign: 'center',
  },

  // Confirm
  confirmButton: {
    backgroundColor: CampfireColors.BTN_PRIMARY,
    marginHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmText: {
    color: CampfireColors.TEXT,
    fontSize: 18,
    fontFamily: 'Paaxel',
    fontWeight: '600',
  },
});

export default BlindRankingInput;
