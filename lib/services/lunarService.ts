/**
 * Lunar Service
 * DESIGN.md §15.3: Moon phases matching lunar calendar
 *
 * Calculates current moon phase for accurate night sky rendering
 * Uses astronomical calculations for real lunar cycle
 */

export type MoonPhase =
  | 'new'          // 0% illuminated
  | 'waxing_crescent'  // 1-49% illuminated, growing
  | 'first_quarter'    // 50% illuminated, right half
  | 'waxing_gibbous'   // 51-99% illuminated, growing
  | 'full'         // 100% illuminated
  | 'waning_gibbous'   // 99-51% illuminated, shrinking
  | 'last_quarter'     // 50% illuminated, left half
  | 'waning_crescent'; // 49-1% illuminated, shrinking

interface MoonPhaseData {
  phase: MoonPhase;
  illumination: number; // 0-1 (0% to 100%)
  age: number; // Days since new moon (0-29.53)
}

/**
 * Calculate current moon phase
 * Based on astronomical formula using known new moon reference
 * @param date - Optional date to calculate phase for (defaults to now)
 * @returns Moon phase data
 */
export function getCurrentMoonPhase(date: Date = new Date()): MoonPhaseData {
  // Known new moon: January 6, 2000, 18:14 UTC
  const knownNewMoon = new Date('2000-01-06T18:14:00Z');
  const lunarCycle = 29.530588853; // Average lunar month in days

  // Calculate days since known new moon
  const daysSinceKnown = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);

  // Calculate current position in lunar cycle
  const age = daysSinceKnown % lunarCycle;

  // Calculate illumination (0-1)
  const illumination = (1 - Math.cos((age / lunarCycle) * 2 * Math.PI)) / 2;

  // Determine phase name based on age
  let phase: MoonPhase;
  if (age < 1.84566) {
    phase = 'new';
  } else if (age < 7.38264) {
    phase = 'waxing_crescent';
  } else if (age < 9.22830) {
    phase = 'first_quarter';
  } else if (age < 14.76528) {
    phase = 'waxing_gibbous';
  } else if (age < 16.61094) {
    phase = 'full';
  } else if (age < 22.14792) {
    phase = 'waning_gibbous';
  } else if (age < 24.99358) {
    phase = 'last_quarter';
  } else {
    phase = 'waning_crescent';
  }

  return { phase, illumination, age };
}

/**
 * Get moon emoji for current phase (for debugging/UI)
 */
export function getMoonEmoji(phase: MoonPhase): string {
  switch (phase) {
    case 'new':
      return '🌑';
    case 'waxing_crescent':
      return '🌒';
    case 'first_quarter':
      return '🌓';
    case 'waxing_gibbous':
      return '🌔';
    case 'full':
      return '🌕';
    case 'waning_gibbous':
      return '🌖';
    case 'last_quarter':
      return '🌗';
    case 'waning_crescent':
      return '🌘';
  }
}

/**
 * Check if moon should be visible (not during new moon)
 */
export function isMoonVisible(): boolean {
  const { illumination } = getCurrentMoonPhase();
  return illumination > 0.05; // Show moon if >5% illuminated
}
