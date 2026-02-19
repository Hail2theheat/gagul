import React, { useMemo, useState } from 'react';
import { View, Dimensions } from 'react-native';
import { DetailedPineTree } from '../PixelArt';
import { SwayingTree } from './SwayingTree';
import { GhostCamper } from '../effects/GhostCamper';
import { CharacterConfig } from '../PixelCharacter';
import { CampfireColors } from '../../constants/theme';
import { useSeasonal } from '../../lib/hooks/useSeasonal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mountain triangle helper
function MountainTriangle({ x, w, h, color }: { x: number; w: number; h: number; color: string }) {
  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        bottom: 0,
        width: 0,
        height: 0,
        borderLeftWidth: w / 2,
        borderRightWidth: w / 2,
        borderBottomWidth: h,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: color,
      }}
    />
  );
}

// Wildflower cluster - DESIGN.md §15.3: Seasonal colors
function Wildflowers({
  x,
  color1,
  color2,
  color3,
  stemColor,
}: {
  x: number;
  color1: string;
  color2: string;
  color3: string;
  stemColor: string;
}) {
  return (
    <View style={{ position: 'absolute', bottom: 18, left: x }}>
      <View style={{ width: 3, height: 3, backgroundColor: color1, borderRadius: 1.5, position: 'absolute', bottom: 8, left: 0 }} />
      <View style={{ width: 2, height: 6, backgroundColor: stemColor, position: 'absolute', bottom: 2, left: 0.5 }} />
      <View style={{ width: 3, height: 3, backgroundColor: color2, borderRadius: 1.5, position: 'absolute', bottom: 10, left: 6 }} />
      <View style={{ width: 2, height: 7, backgroundColor: stemColor, position: 'absolute', bottom: 3, left: 6.5 }} />
      <View style={{ width: 2.5, height: 2.5, backgroundColor: color3, borderRadius: 1.5, position: 'absolute', bottom: 7, left: 12 }} />
      <View style={{ width: 2, height: 5, backgroundColor: stemColor, position: 'absolute', bottom: 2, left: 12 }} />
    </View>
  );
}

interface ForestGroundProps {
  /** Show the full mountain range backdrop */
  showMountains?: boolean;
  /** Show wildflower clusters */
  showWildflowers?: boolean;
  /** Show the dense forest */
  showForest?: boolean;
  /** Use seasonal colors (DESIGN.md §15.3) */
  useSeasonal?: boolean;
}

export function ForestGround({
  showMountains = true,
  showWildflowers = true,
  showForest = true,
  useSeasonal = false,
}: ForestGroundProps) {
  // DESIGN.md §15.3: Seasonal color palette
  const { palette } = useSeasonal();

  // Choose colors based on seasonal mode
  const groundDark = useSeasonal ? palette.groundDark : CampfireColors.GROUND_DARK;
  const groundGrass = useSeasonal ? palette.groundGrass : CampfireColors.GROUND_GRASS;
  const groundMoss = useSeasonal ? palette.groundMoss : CampfireColors.GROUND_MOSS;

  // DESIGN.md §15.2: Ghost camper easter egg (5% spawn chance)
  const ghostCamper = useMemo(() => {
    const shouldSpawn = Math.random() < 0.05; // 5% chance
    if (!shouldSpawn) return null;

    // Random ghost character configuration
    const skinTones = ['light', 'tan', 'olive', 'brown', 'dark'] as const;
    const hairStyles = ['short', 'long', 'bald', 'ponytail', 'curly'] as const;
    const hairColors = ['black', 'brown', 'blonde', 'ginger', 'silver', 'pink'] as const;
    const shirtColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'white', 'black'] as const;
    const pantsColors = ['blue', 'black', 'brown', 'green', 'gray'] as const;

    const config: CharacterConfig = {
      skinTone: skinTones[Math.floor(Math.random() * skinTones.length)],
      hairStyle: hairStyles[Math.floor(Math.random() * hairStyles.length)],
      hairColor: hairColors[Math.floor(Math.random() * hairColors.length)],
      shirt: shirtColors[Math.floor(Math.random() * shirtColors.length)],
      pants: pantsColors[Math.floor(Math.random() * pantsColors.length)],
      shoes: 'brown',
      pose: 'idle',
    };

    return {
      config,
      startY: 80 + Math.random() * 60, // Random Y between 80-140px from top (mid-forest)
    };
  }, []); // Only evaluate once per component mount

  // Dense forest with 4 depth layers
  const trees = useMemo(() => [
    // Far background (shade 0 - darkest, smallest)
    { x: -20, height: 50, shade: 0 }, { x: 15, height: 42, shade: 0 },
    { x: 45, height: 55, shade: 0 }, { x: 75, height: 38, shade: 0 },
    { x: 105, height: 48, shade: 0 },
    { x: SCREEN_WIDTH - 135, height: 45, shade: 0 }, { x: SCREEN_WIDTH - 105, height: 52, shade: 0 },
    { x: SCREEN_WIDTH - 75, height: 40, shade: 0 }, { x: SCREEN_WIDTH - 45, height: 55, shade: 0 },
    { x: SCREEN_WIDTH - 15, height: 42, shade: 0 },
    // Mid-far (shade 1)
    { x: -15, height: 75, shade: 1 }, { x: 25, height: 60, shade: 1 },
    { x: 60, height: 82, shade: 1 }, { x: 95, height: 55, shade: 1 },
    { x: SCREEN_WIDTH - 120, height: 62, shade: 1 }, { x: SCREEN_WIDTH - 85, height: 78, shade: 1 },
    { x: SCREEN_WIDTH - 50, height: 65, shade: 1 }, { x: SCREEN_WIDTH - 20, height: 70, shade: 1 },
    // Mid-near (shade 2)
    { x: -25, height: 110, shade: 2 }, { x: 10, height: 85, shade: 2 },
    { x: 50, height: 120, shade: 2 }, { x: 90, height: 70, shade: 2 },
    { x: SCREEN_WIDTH - 140, height: 75, shade: 2 }, { x: SCREEN_WIDTH - 95, height: 100, shade: 2 },
    { x: SCREEN_WIDTH - 55, height: 125, shade: 2 }, { x: SCREEN_WIDTH - 15, height: 80, shade: 2 },
    // Nearest foreground (shade 3 - brightest, tallest)
    { x: -30, height: 145, shade: 3 }, { x: 35, height: 160, shade: 3 },
    { x: 80, height: 100, shade: 3 },
    { x: SCREEN_WIDTH - 110, height: 95, shade: 3 }, { x: SCREEN_WIDTH - 60, height: 155, shade: 3 },
    { x: SCREEN_WIDTH - 20, height: 110, shade: 3 },
  ], []);

  return (
    <>
      {/* Far distant mountains */}
      {showMountains && (
        <>
          <View style={{ position: 'absolute', bottom: 190, left: 0, right: 0, height: 250, zIndex: 0 }}>
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 25, backgroundColor: '#151D30' }} />
            <MountainTriangle x={-60} w={240} h={160} color="#151D30" />
            <MountainTriangle x={120} w={280} h={190} color="#161E32" />
            <MountainTriangle x={SCREEN_WIDTH - 250} w={260} h={170} color="#141C2E" />
            <MountainTriangle x={SCREEN_WIDTH - 100} w={220} h={150} color="#161E32" />
          </View>

          {/* Mid mountains with tree silhouettes */}
          <View style={{ position: 'absolute', bottom: 155, left: 0, right: 0, height: 220, zIndex: 0 }}>
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 20, backgroundColor: '#111A24' }} />
            <MountainTriangle x={-30} w={200} h={130} color="#111A24" />
            <MountainTriangle x={90} w={250} h={155} color="#121B26" />
            <MountainTriangle x={230} w={220} h={140} color="#111A24" />
            <MountainTriangle x={SCREEN_WIDTH - 180} w={230} h={145} color="#121B26" />
            {Array.from({ length: 14 }).map((_, i) => (
              <View key={`mt-${i}`} style={{
                position: 'absolute',
                left: 20 + i * ((SCREEN_WIDTH - 40) / 14),
                bottom: 30 + Math.sin(i * 1.2) * 15 + (i % 3) * 8,
                width: 0, height: 0,
                borderLeftWidth: 4, borderRightWidth: 4, borderBottomWidth: 10,
                borderLeftColor: 'transparent', borderRightColor: 'transparent',
                borderBottomColor: '#0E1820',
              }} />
            ))}
          </View>

          {/* Near mountains */}
          <View style={{ position: 'absolute', bottom: 125, left: 0, right: 0, height: 180, zIndex: 0 }}>
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 20, backgroundColor: '#0E1A1A' }} />
            <MountainTriangle x={-50} w={180} h={100} color="#0E1A1A" />
            <MountainTriangle x={70} w={200} h={120} color="#0F1B1C" />
            <MountainTriangle x={SCREEN_WIDTH - 210} w={190} h={110} color="#0E1A1A" />
            <MountainTriangle x={SCREEN_WIDTH - 80} w={180} h={100} color="#0F1B1C" />
            {Array.from({ length: 18 }).map((_, i) => (
              <View key={`nt-${i}`} style={{
                position: 'absolute',
                left: 10 + i * ((SCREEN_WIDTH - 20) / 18),
                bottom: 22 + Math.sin(i * 0.9) * 12 + (i % 2) * 10,
                width: 0, height: 0,
                borderLeftWidth: 5, borderRightWidth: 5, borderBottomWidth: 12,
                borderLeftColor: 'transparent', borderRightColor: 'transparent',
                borderBottomColor: '#0C1618',
              }} />
            ))}
          </View>
        </>
      )}

      {/* Forest - DESIGN.md §15.1: Trees sway with staggered timing */}
      {showForest && (
        <View style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 250, zIndex: 1 }}>
          {trees.map((tree, i) => (
            <View key={i} style={{ position: 'absolute', left: tree.x, bottom: 0 }}>
              <SwayingTree height={tree.height} shade={tree.shade} stagger={i * 0.05}>
                <DetailedPineTree height={tree.height} shade={tree.shade} />
              </SwayingTree>
            </View>
          ))}

          {/* DESIGN.md §15.2: Ghost camper easter egg (5% spawn, drifts across screen) */}
          {ghostCamper && (
            <GhostCamper
              screenWidth={SCREEN_WIDTH}
              startY={ghostCamper.startY}
              config={ghostCamper.config}
              delay={2000} // Wait 2s before starting drift
            />
          )}
        </View>
      )}

      {/* Ground layers - DESIGN.md §15.3: Seasonal colors */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 30,
        backgroundColor: groundDark,
        zIndex: 2,
      }}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: groundGrass }} />
        <View style={{ position: 'absolute', top: 4, left: 0, right: 0, height: 2, backgroundColor: groundMoss }} />
      </View>

      {/* Wildflowers - DESIGN.md §15.3: Seasonal accent colors */}
      {showWildflowers && (
        <>
          <Wildflowers
            x={30}
            color1={useSeasonal ? palette.accent1 : '#E890B0'}
            color2={useSeasonal ? palette.accent2 : '#FFD060'}
            color3={useSeasonal ? palette.accent3 : '#B0C0FF'}
            stemColor={useSeasonal ? palette.treeLight : '#2D5B2D'}
          />
          <Wildflowers
            x={SCREEN_WIDTH - 50}
            color1={useSeasonal ? palette.accent2 : '#FFD060'}
            color2={useSeasonal ? palette.accent3 : '#B0C0FF'}
            color3={useSeasonal ? palette.accent1 : '#E890B0'}
            stemColor={useSeasonal ? palette.treeLight : '#2D5B2D'}
          />
          <Wildflowers
            x={SCREEN_WIDTH / 2 - 80}
            color1={useSeasonal ? palette.accent3 : '#B0C0FF'}
            color2={useSeasonal ? palette.accent1 : '#E890B0'}
            color3={useSeasonal ? palette.accent2 : '#FFD060'}
            stemColor={useSeasonal ? palette.treeLight : '#2D5B2D'}
          />
          <Wildflowers
            x={SCREEN_WIDTH / 2 + 60}
            color1={useSeasonal ? palette.accent1 : '#E890B0'}
            color2={useSeasonal ? palette.accent3 : '#B0C0FF'}
            color3={useSeasonal ? palette.accent2 : '#FFD060'}
            stemColor={useSeasonal ? palette.treeLight : '#2D5B2D'}
          />
        </>
      )}
    </>
  );
}
