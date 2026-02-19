/**
 * ForestFloorDetails - Ground detail elements
 * DESIGN.md §15.3: Enhanced forest floor with moss, rocks, mushrooms
 *
 * Adds visual richness to the ground layer:
 * - Moss patches
 * - Scattered rocks
 * - Small mushrooms
 * - Fallen logs
 */

import React from 'react';
import { View } from 'react-native';
import { CampfireColors } from '../../constants/theme';

interface MossPatchProps {
  x: number;
  width: number;
  color?: string;
}

function MossPatch({ x, width, color = CampfireColors.GROUND_MOSS }: MossPatchProps) {
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 6,
        left: x,
        width,
        height: 3,
        backgroundColor: color,
        borderRadius: 1.5,
        opacity: 0.6,
      }}
    />
  );
}

interface RockProps {
  x: number;
  y: number;
  size: number;
  shade?: number; // 0-2 for color variation
}

function Rock({ x, y, size, shade = 0 }: RockProps) {
  const colors = [
    CampfireColors.STONE_LIGHT,
    CampfireColors.STONE_MID,
    CampfireColors.STONE_DARK,
  ];

  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        bottom: y,
        width: size,
        height: size * 0.7,
        backgroundColor: colors[shade],
        borderRadius: size * 0.3,
      }}
    />
  );
}

interface MushroomProps {
  x: number;
  capColor?: string;
  stemColor?: string;
}

function Mushroom({
  x,
  capColor = '#A85D5D',
  stemColor = '#E8D0B8',
}: MushroomProps) {
  return (
    <View style={{ position: 'absolute', bottom: 6, left: x }}>
      {/* Cap */}
      <View
        style={{
          width: 8,
          height: 5,
          backgroundColor: capColor,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
        }}
      >
        {/* Cap spots */}
        <View
          style={{
            position: 'absolute',
            top: 1,
            left: 2,
            width: 2,
            height: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            borderRadius: 1,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 1.5,
            left: 5,
            width: 1.5,
            height: 1.5,
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            borderRadius: 0.75,
          }}
        />
      </View>
      {/* Stem */}
      <View
        style={{
          position: 'absolute',
          top: 4,
          left: 3,
          width: 2,
          height: 4,
          backgroundColor: stemColor,
          borderRadius: 1,
        }}
      />
    </View>
  );
}

interface FallenLogProps {
  x: number;
  width: number;
}

function FallenLog({ x, width }: FallenLogProps) {
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 8,
        left: x,
      }}
    >
      {/* Log body */}
      <View
        style={{
          width,
          height: 6,
          backgroundColor: CampfireColors.LOG_DARK,
          borderRadius: 3,
        }}
      >
        {/* Bark texture */}
        <View
          style={{
            position: 'absolute',
            top: 1,
            left: 2,
            width: 1,
            height: 4,
            backgroundColor: CampfireColors.LOG_MID,
            opacity: 0.6,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 1,
            left: width - 4,
            width: 1,
            height: 4,
            backgroundColor: CampfireColors.LOG_MID,
            opacity: 0.6,
          }}
        />
      </View>
      {/* End rings */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: 6,
          height: 6,
          backgroundColor: CampfireColors.LOG_MID,
          borderRadius: 3,
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: 2,
            left: 2,
            width: 2,
            height: 2,
            backgroundColor: CampfireColors.LOG_DARK,
            borderRadius: 1,
          }}
        />
      </View>
    </View>
  );
}

interface ForestFloorDetailsProps {
  /** Screen width for positioning */
  screenWidth: number;
  /** Show moss patches */
  showMoss?: boolean;
  /** Show rocks */
  showRocks?: boolean;
  /** Show mushrooms */
  showMushrooms?: boolean;
  /** Show fallen logs */
  showLogs?: boolean;
}

export function ForestFloorDetails({
  screenWidth,
  showMoss = true,
  showRocks = true,
  showMushrooms = true,
  showLogs = true,
}: ForestFloorDetailsProps) {
  return (
    <>
      {/* Moss patches */}
      {showMoss && (
        <>
          <MossPatch x={20} width={25} />
          <MossPatch x={screenWidth * 0.3} width={30} />
          <MossPatch x={screenWidth * 0.65} width={20} />
          <MossPatch x={screenWidth - 60} width={35} />
        </>
      )}

      {/* Scattered rocks */}
      {showRocks && (
        <>
          <Rock x={15} y={10} size={8} shade={0} />
          <Rock x={35} y={8} size={6} shade={1} />
          <Rock x={screenWidth * 0.4} y={12} size={10} shade={2} />
          <Rock x={screenWidth * 0.6} y={9} size={7} shade={1} />
          <Rock x={screenWidth - 45} y={11} size={9} shade={0} />
          <Rock x={screenWidth - 25} y={7} size={5} shade={2} />
        </>
      )}

      {/* Mushrooms */}
      {showMushrooms && (
        <>
          <Mushroom x={50} capColor="#A85D5D" />
          <Mushroom x={screenWidth * 0.35} capColor="#8B6B4D" />
          <Mushroom x={screenWidth * 0.7} capColor="#A85D5D" />
        </>
      )}

      {/* Fallen logs */}
      {showLogs && (
        <>
          <FallenLog x={screenWidth * 0.15} width={35} />
          <FallenLog x={screenWidth * 0.55} width={40} />
        </>
      )}
    </>
  );
}

export default ForestFloorDetails;
