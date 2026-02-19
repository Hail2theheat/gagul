import React, { useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import { PixelStar } from './PixelStar';
import { Firefly } from './Firefly';
import { ShootingStar } from './ShootingStar';
import { PixelMoon } from './PixelMoon';
import { MoonPhases } from './MoonPhases';
import { DriftingClouds } from './DriftingClouds';
import { isMoonVisible } from '../../lib/services/lunarService';
import { useSeasonal } from '../../lib/hooks/useSeasonal';
import { SkyDensity, StarColors } from '../../constants/animations';
import { CampfireColors } from '../../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type DensityPreset = keyof typeof SkyDensity;

interface NightSkyProps {
  /** Density preset or custom density values */
  density?: DensityPreset;
  /** Show the crescent moon */
  showMoon?: boolean;
  /** Use realistic moon phases (DESIGN.md §15.3) */
  useRealisticMoon?: boolean;
  /** Show shooting stars */
  showShootingStars?: boolean;
  /** Show drifting clouds (DESIGN.md §15.3) */
  showClouds?: boolean;
  /** Show fireflies (typically near ground level) */
  showFireflies?: boolean;
  /** Background color for moon crescent shadow */
  moonBgColor?: string;
  /** Show the sky gradient bands */
  showGradient?: boolean;
  /** Use seasonal sky colors (DESIGN.MD §15.3) */
  enableSeasonal?: boolean;
}

/** Seeded pseudo-random number generator for deterministic star placement */
function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export function NightSky({
  density = 'default',
  showMoon = true,
  useRealisticMoon = false,
  showShootingStars = true,
  showClouds = false,
  showFireflies = true,
  moonBgColor,
  showGradient = true,
  enableSeasonal = false,
}: NightSkyProps) {
  const config = SkyDensity[density];

  // DESIGN.md §15.3: Seasonal sky colors
  const { palette } = useSeasonal();
  const skyTop = enableSeasonal ? palette.skyTop : CampfireColors.BG_TOP;
  const skyMid = enableSeasonal ? palette.skyMid : CampfireColors.BG_MID;
  const skyLow = enableSeasonal ? palette.skyLow : CampfireColors.BG_LOW;

  const stars = useMemo(() => {
    const result: { x: number; y: number; size: number; delay: number; color: string }[] = [];
    const rand = createRng(42);
    const skyH = SCREEN_HEIGHT * 0.58;

    // Large bright stars
    for (let i = 0; i < config.largeBrightStars; i++) {
      result.push({
        x: rand() * (SCREEN_WIDTH - 20) + 10,
        y: rand() * skyH + 15,
        size: 3.5 + rand() * 1.5,
        delay: rand() * 2000,
        color: StarColors[Math.floor(rand() * StarColors.length)],
      });
    }
    // Medium stars
    for (let i = 0; i < config.mediumStars; i++) {
      result.push({
        x: rand() * (SCREEN_WIDTH - 10) + 5,
        y: rand() * (skyH + 30) + 10,
        size: 2.5 + rand(),
        delay: rand() * 2500,
        color: StarColors[Math.floor(rand() * StarColors.length)],
      });
    }
    // Small stars
    for (let i = 0; i < config.smallStars; i++) {
      result.push({
        x: rand() * SCREEN_WIDTH,
        y: rand() * (skyH + 50),
        size: 1.5 + rand() * 0.5,
        delay: rand() * 3000,
        color: '#FFF',
      });
    }
    // Tiny distant stars
    for (let i = 0; i < config.tinyStars; i++) {
      result.push({
        x: rand() * SCREEN_WIDTH,
        y: rand() * (skyH + 70),
        size: 0.8 + rand() * 0.7,
        delay: rand() * 4000,
        color: '#FFF',
      });
    }
    return result;
  }, [config.largeBrightStars, config.mediumStars, config.smallStars, config.tinyStars]);

  const shootingStarDelays = useMemo(() => {
    const delays: number[] = [];
    for (let i = 0; i < config.shootingStars; i++) {
      delays.push(2000 + i * 5000 + Math.random() * 2000);
    }
    return delays;
  }, [config.shootingStars]);

  const fireflyPositions = useMemo(() => {
    const positions: { x: number; y: number; delay: number }[] = [];
    const rand = createRng(99);
    for (let i = 0; i < config.fireflies; i++) {
      positions.push({
        x: 40 + rand() * (SCREEN_WIDTH - 80),
        y: SCREEN_HEIGHT - 180 - rand() * 80,
        delay: rand() * 5000,
      });
    }
    return positions;
  }, [config.fireflies]);

  return (
    <>
      {/* Sky gradient background - DESIGN.md §15.3: Seasonal colors */}
      {showGradient && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <View style={{ flex: 1, backgroundColor: skyTop }} />
          <View style={{ flex: 1, backgroundColor: skyMid }} />
          <View style={{ flex: 1, backgroundColor: skyLow }} />
          <View style={{ flex: 1, backgroundColor: CampfireColors.BG_HORIZON }} />
          <View style={{ flex: 1, backgroundColor: CampfireColors.BG_BOTTOM }} />
        </View>
      )}

      {/* Subtle aurora/nebula glow near horizon */}
      {showGradient && (
        <>
          <View style={{
            position: 'absolute',
            bottom: 160,
            left: 0,
            right: 0,
            height: 120,
            backgroundColor: 'rgba(40, 80, 120, 0.08)',
          }} />
          <View style={{
            position: 'absolute',
            bottom: 180,
            left: SCREEN_WIDTH * 0.2,
            width: SCREEN_WIDTH * 0.4,
            height: 80,
            backgroundColor: 'rgba(100, 60, 120, 0.06)',
            borderRadius: 40,
          }} />
        </>
      )}

      {/* Drifting clouds - DESIGN.md §15.3: Slow parallax cloud movement */}
      {showClouds && <DriftingClouds layers={3} />}

      {/* Moon - DESIGN.md §15.3: Realistic phases or tappable crescent */}
      {showMoon && (
        useRealisticMoon ? (
          isMoonVisible() ? (
            <View style={{ position: 'absolute', top: 50, right: SCREEN_WIDTH * 0.15 }}>
              <MoonPhases size={32} showGlow />
            </View>
          ) : null
        ) : (
          <PixelMoon bgColor={moonBgColor} />
        )
      )}

      {/* Stars */}
      {stars.map((star, i) => (
        <PixelStar key={`star-${i}`} x={star.x} y={star.y} size={star.size} delay={star.delay} color={star.color} />
      ))}

      {/* Shooting stars */}
      {showShootingStars && shootingStarDelays.map((d, i) => (
        <ShootingStar key={`ss-${i}`} delay={d} />
      ))}

      {/* Fireflies */}
      {showFireflies && fireflyPositions.map((ff, i) => (
        <Firefly key={`ff-${i}`} x={ff.x} y={ff.y} delay={ff.delay} />
      ))}
    </>
  );
}
