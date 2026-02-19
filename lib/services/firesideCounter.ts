/**
 * Fireside Counter Service
 * DESIGN.md §15.2: Track Fireside attendance for milestone celebrations
 *
 * Tracks how many Firesides the user has attended
 * Special celebration on 100th Fireside (and other milestones)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRESIDE_COUNT_KEY = '@stokie:fireside_count';
const LAST_FIRESIDE_DATE_KEY = '@stokie:last_fireside_date';

/**
 * Get the current Fireside attendance count
 */
export async function getFiresideCount(): Promise<number> {
  try {
    const value = await AsyncStorage.getItem(FIRESIDE_COUNT_KEY);
    return value ? parseInt(value, 10) : 0;
  } catch (error) {
    console.error('Failed to load Fireside count:', error);
    return 0;
  }
}

/**
 * Increment Fireside count
 * Only increments once per week (prevents double-counting)
 * Returns the new count and whether it was incremented
 */
export async function incrementFiresideCount(weekOf: string): Promise<{ count: number; incremented: boolean }> {
  try {
    const lastDate = await AsyncStorage.getItem(LAST_FIRESIDE_DATE_KEY);

    // Check if already counted for this week
    if (lastDate === weekOf) {
      const current = await getFiresideCount();
      return { count: current, incremented: false };
    }

    // Increment count
    const current = await getFiresideCount();
    const newCount = current + 1;

    await AsyncStorage.multiSet([
      [FIRESIDE_COUNT_KEY, String(newCount)],
      [LAST_FIRESIDE_DATE_KEY, weekOf],
    ]);

    return { count: newCount, incremented: true };
  } catch (error) {
    console.error('Failed to increment Fireside count:', error);
    const current = await getFiresideCount();
    return { count: current, incremented: false };
  }
}

/**
 * Check if count is a milestone (10, 25, 50, 100, etc.)
 */
export function isFiresideMilestone(count: number): boolean {
  const milestones = [1, 10, 25, 50, 75, 100, 150, 200, 250, 500, 1000];
  return milestones.includes(count);
}

/**
 * Get celebration message for milestone
 */
export function getFiresideMilestone(count: number): string | null {
  switch (count) {
    case 1:
      return '🔥 Your first Fireside!';
    case 10:
      return '🎉 10 Firesides! You\'re a regular!';
    case 25:
      return '✨ 25 Firesides! Campfire veteran!';
    case 50:
      return '🌟 50 Firesides! Half a century!';
    case 75:
      return '👑 75 Firesides! Legend status!';
    case 100:
      return '🎆 100 FIRESIDES! CENTURY CLUB! 🎆';
    case 150:
      return '🏆 150 Firesides! Unstoppable!';
    case 200:
      return '💎 200 Firesides! Diamond status!';
    case 250:
      return '🎊 250 Firesides! Quarter millennium!';
    case 500:
      return '👏 500 Firesides! Incredible dedication!';
    case 1000:
      return '🌌 1000 FIRESIDES! YOU ARE ETERNAL! 🌌';
    default:
      return null;
  }
}

/**
 * Special celebration type for specific milestones
 */
export function getFiresideCelebrationType(count: number): 'fireworks' | 'confetti' | null {
  if (count === 100) return 'fireworks'; // Big celebration
  if (count === 50 || count === 250 || count === 500) return 'confetti';
  return null;
}
