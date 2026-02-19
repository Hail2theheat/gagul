/**
 * useSeasonal - React hook for seasonal theming
 * DESIGN.md §15.3: Easy access to seasonal colors in components
 */

import { useMemo } from 'react';
import {
  getCurrentSeason,
  getSeasonalPalette,
  getHoliday,
  getHolidayAccent,
  Season,
  SeasonalPalette,
} from '../services/seasonalService';

interface UseSeasonalResult {
  season: Season;
  palette: SeasonalPalette;
  holiday: string | null;
  holidayAccent: string | null;
  isSeason: (s: Season) => boolean;
  isHoliday: (h: string) => boolean;
}

/**
 * Hook to access current season and palette
 * Recalculates daily to handle season transitions
 */
export function useSeasonal(): UseSeasonalResult {
  const result = useMemo(() => {
    const season = getCurrentSeason();
    const palette = getSeasonalPalette(season);
    const holiday = getHoliday();
    const holidayAccent = getHolidayAccent(holiday);

    return {
      season,
      palette,
      holiday,
      holidayAccent,
      isSeason: (s: Season) => season === s,
      isHoliday: (h: string) => holiday === h,
    };
  }, [
    // Recalculate daily
    Math.floor(Date.now() / (1000 * 60 * 60 * 24)),
  ]);

  return result;
}
