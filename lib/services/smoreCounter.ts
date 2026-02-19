/**
 * S'more Counter Service
 * DESIGN.md §15.2: Track how many s'mores have been cooked over the campfire
 *
 * Persistent counter using AsyncStorage
 * Increments each time the cooking easter egg shows a marshmallow/s'more
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const SMORE_COUNT_KEY = '@stokie:smore_count';

/**
 * Get the current s'more count
 */
export async function getSmoreCount(): Promise<number> {
  try {
    const value = await AsyncStorage.getItem(SMORE_COUNT_KEY);
    return value ? parseInt(value, 10) : 0;
  } catch (error) {
    console.error('Failed to load s\'more count:', error);
    return 0;
  }
}

/**
 * Increment the s'more count by 1
 * Returns the new count
 */
export async function incrementSmoreCount(): Promise<number> {
  try {
    const current = await getSmoreCount();
    const newCount = current + 1;
    await AsyncStorage.setItem(SMORE_COUNT_KEY, String(newCount));
    return newCount;
  } catch (error) {
    console.error('Failed to increment s\'more count:', error);
    return 0;
  }
}

/**
 * Check if we've hit milestone counts (10, 50, 100, 500, etc.)
 * Returns true if this is a milestone
 */
export function isSmoreCountMilestone(count: number): boolean {
  const milestones = [1, 10, 25, 50, 100, 250, 500, 1000];
  return milestones.includes(count);
}

/**
 * Get a celebratory message for milestone counts
 */
export function getSmoreCountMilestone(count: number): string | null {
  switch (count) {
    case 1:
      return '🔥 First s\'more!';
    case 10:
      return '✨ 10 s\'mores cooked!';
    case 25:
      return '🎉 Quarter century of s\'mores!';
    case 50:
      return '🌟 50 s\'mores! Half a hundred!';
    case 100:
      return '💯 100 s\'mores! S\'more master!';
    case 250:
      return '👑 250 s\'mores! Campfire legend!';
    case 500:
      return '🏆 500 s\'mores! Unbelievable!';
    case 1000:
      return '🎊 1000 s\'mores! You\'ve transcended!';
    default:
      return null;
  }
}
