/**
 * MoonPhases - Accurate lunar phase rendering
 * DESIGN.md §15.3: Moon phases matching lunar calendar
 *
 * Renders moon with correct phase based on real astronomical data
 * Supports all 8 major phases with smooth illumination
 */

import React, { useMemo } from 'react';
import { View } from 'react-native';
import { getCurrentMoonPhase, MoonPhase } from '../../lib/services/lunarService';
import { CampfireColors } from '../../constants/theme';

interface MoonPhasesProps {
  /** Size of the moon (diameter) */
  size?: number;
  /** Override phase for testing */
  phase?: MoonPhase;
  /** Show glow around moon */
  showGlow?: boolean;
}

export function MoonPhases({ size = 32, phase, showGlow = true }: MoonPhasesProps) {
  const moonData = useMemo(() => {
    // Use provided phase or calculate current phase
    if (phase) {
      // For testing, use approximate illumination
      const illuminationMap: Record<MoonPhase, number> = {
        new: 0,
        waxing_crescent: 0.25,
        first_quarter: 0.5,
        waxing_gibbous: 0.75,
        full: 1,
        waning_gibbous: 0.75,
        last_quarter: 0.5,
        waning_crescent: 0.25,
      };
      return { phase, illumination: illuminationMap[phase], age: 0 };
    }
    return getCurrentMoonPhase();
  }, [phase]);

  const { phase: currentPhase, illumination } = moonData;

  // Don't render if new moon (too dark to see)
  if (illumination < 0.05) {
    return null;
  }

  // Determine if moon is waxing (right side lit) or waning (left side lit)
  const isWaxing = ['waxing_crescent', 'first_quarter', 'waxing_gibbous'].includes(currentPhase);
  const isWaning = ['waning_gibbous', 'last_quarter', 'waning_crescent'].includes(currentPhase);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Glow */}
      {showGlow && (
        <View
          style={{
            position: 'absolute',
            width: size * 1.8,
            height: size * 1.8,
            borderRadius: (size * 1.8) / 2,
            backgroundColor: CampfireColors.MOON_GLOW,
            opacity: 0.3 * illumination, // Brighter glow for fuller moon
          }}
        />
      )}

      {/* Full moon circle (always present as base) */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: CampfireColors.MOON,
          overflow: 'hidden',
        }}
      >
        {/* Shadow overlay for crescent/gibbous phases */}
        {currentPhase !== 'full' && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: isWaning ? 0 : undefined,
              right: isWaxing ? 0 : undefined,
              width: size * (1 - illumination), // Shadow width based on illumination
              backgroundColor: CampfireColors.SKY_TOP, // Match sky color
              borderRadius: size / 2,
            }}
          />
        )}

        {/* Additional shading for quarter moons */}
        {(currentPhase === 'first_quarter' || currentPhase === 'last_quarter') && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: currentPhase === 'last_quarter' ? 0 : undefined,
              right: currentPhase === 'first_quarter' ? 0 : undefined,
              width: size / 2,
              backgroundColor: CampfireColors.SKY_TOP,
            }}
          />
        )}
      </View>

      {/* Crater details (subtle texture) */}
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
        {/* Small crater top-left */}
        <View
          style={{
            position: 'absolute',
            top: size * 0.2,
            left: size * 0.25,
            width: size * 0.12,
            height: size * 0.12,
            borderRadius: size * 0.06,
            backgroundColor: CampfireColors.MOON,
            opacity: 0.4,
          }}
        />
        {/* Medium crater bottom-right */}
        <View
          style={{
            position: 'absolute',
            top: size * 0.6,
            left: size * 0.55,
            width: size * 0.18,
            height: size * 0.18,
            borderRadius: size * 0.09,
            backgroundColor: CampfireColors.MOON,
            opacity: 0.3,
          }}
        />
        {/* Tiny crater middle */}
        <View
          style={{
            position: 'absolute',
            top: size * 0.45,
            left: size * 0.35,
            width: size * 0.08,
            height: size * 0.08,
            borderRadius: size * 0.04,
            backgroundColor: CampfireColors.MOON,
            opacity: 0.35,
          }}
        />
      </View>
    </View>
  );
}

export default MoonPhases;
