/**
 * Seasonal Service
 * DESIGN.md §15.3: Seasonal environment shifts
 *
 * Detects current season and provides themed color palettes
 * for sky, ground, and scenery elements
 */

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SeasonalPalette {
  season: Season;

  // Sky colors
  skyTop: string;
  skyMid: string;
  skyLow: string;

  // Ground colors
  groundDark: string;
  groundGrass: string;
  groundMoss: string;

  // Tree/forest colors (for pine needles)
  treeLight: string;
  treeMid: string;
  treeDark: string;

  // Accent colors (flowers, special elements)
  accent1: string;
  accent2: string;
  accent3: string;

  // Atmosphere
  cloudTint: string;
  starIntensity: number; // 0-1 multiplier for star brightness
  moonTint: string;
}

/**
 * Get current season based on hemisphere and date
 * @param date - Optional date (defaults to now)
 * @param hemisphere - 'north' or 'south' (defaults to north)
 */
export function getCurrentSeason(
  date: Date = new Date(),
  hemisphere: 'north' | 'south' = 'north'
): Season {
  const month = date.getMonth(); // 0-11

  // Northern hemisphere seasons
  let season: Season;
  if (month >= 2 && month <= 4) {
    season = 'spring'; // March, April, May
  } else if (month >= 5 && month <= 7) {
    season = 'summer'; // June, July, August
  } else if (month >= 8 && month <= 10) {
    season = 'autumn'; // September, October, November
  } else {
    season = 'winter'; // December, January, February
  }

  // Flip seasons for southern hemisphere
  if (hemisphere === 'south') {
    const flip: Record<Season, Season> = {
      spring: 'autumn',
      summer: 'winter',
      autumn: 'spring',
      winter: 'summer',
    };
    season = flip[season];
  }

  return season;
}

/**
 * Get seasonal color palette for current season
 */
export function getSeasonalPalette(season?: Season): SeasonalPalette {
  const currentSeason = season || getCurrentSeason();

  switch (currentSeason) {
    case 'spring':
      return {
        season: 'spring',
        // Lighter, fresher sky tones
        skyTop: '#0A0F1C',
        skyMid: '#0E1830',
        skyLow: '#142340',
        // Fresh green ground
        groundDark: '#1C3820',
        groundGrass: '#2A5A28',
        groundMoss: '#254A24',
        // Vibrant green trees
        treeLight: '#3A7A35',
        treeMid: '#2D6028',
        treeDark: '#1F4520',
        // Spring blooms
        accent1: '#FFB3D9', // Pink blossoms
        accent2: '#FFE88A', // Yellow flowers
        accent3: '#B3E5FF', // Light blue sky accent
        cloudTint: '#F0F0F8',
        starIntensity: 0.9,
        moonTint: '#FFFEF5',
      };

    case 'summer':
      return {
        season: 'summer',
        // Warmer, deeper blue sky
        skyTop: '#060B18',
        skyMid: '#0C1428',
        skyLow: '#111D35',
        // Lush green ground
        groundDark: '#1A3018',
        groundGrass: '#254A22',
        groundMoss: '#1F3D1C',
        // Deep green trees
        treeLight: '#2D6B28',
        treeMid: '#1F5020',
        treeDark: '#153818',
        // Summer colors
        accent1: '#FFD93D', // Sunflowers
        accent2: '#FF6B9D', // Summer blooms
        accent3: '#4ADE80', // Bright green
        cloudTint: '#E8E8F0',
        starIntensity: 1.0, // Brightest stars
        moonTint: '#FFFACD',
      };

    case 'autumn':
      return {
        season: 'autumn',
        // Cooler, purple-tinted sky
        skyTop: '#08060F',
        skyMid: '#0F0C1A',
        skyLow: '#1A1530',
        // Brown/orange ground
        groundDark: '#2A1F10',
        groundGrass: '#3A2818',
        groundMoss: '#332214',
        // Autumn-tinted trees (still evergreen but with hints)
        treeLight: '#3A4A30',
        treeMid: '#2A3820',
        treeDark: '#1A2815',
        // Fall colors
        accent1: '#FF6B35', // Orange leaves
        accent2: '#D4A040', // Golden leaves
        accent3: '#8B4513', // Brown
        cloudTint: '#D8D0C8',
        starIntensity: 0.95,
        moonTint: '#FFE8C8', // Harvest moon
      };

    case 'winter':
      return {
        season: 'winter',
        // Cold, crisp blue-white sky
        skyTop: '#040810',
        skyMid: '#0A1020',
        skyLow: '#0F1828',
        // Snow-dusted ground
        groundDark: '#1A1F28',
        groundGrass: '#202832',
        groundMoss: '#1C2228',
        // Frosted trees
        treeLight: '#2A3840',
        treeMid: '#1F2830',
        treeDark: '#151C24',
        // Winter accents
        accent1: '#B3E5FF', // Ice blue
        accent2: '#E8F0FF', // Snow white
        accent3: '#7B9CFF', // Cold blue
        cloudTint: '#F8FCFF',
        starIntensity: 1.1, // Clearest, brightest stars
        moonTint: '#F0F8FF', // Cold moon
      };
  }
}

/**
 * Check if a specific date is a holiday
 * Returns holiday name or null
 */
export function getHoliday(date: Date = new Date()): string | null {
  const month = date.getMonth(); // 0-11
  const day = date.getDate(); // 1-31

  // Major holidays (subtle touches only)
  if (month === 11 && day === 25) return 'Christmas';
  if (month === 11 && day === 31) return 'New Year\'s Eve';
  if (month === 0 && day === 1) return 'New Year\'s Day';
  if (month === 9 && day === 31) return 'Halloween';
  if (month === 1 && day === 14) return 'Valentine\'s Day';
  if (month === 2 && day === 17) return 'St. Patrick\'s Day';
  if (month === 6 && day === 4) return 'Independence Day'; // US

  return null;
}

/**
 * Get holiday accent color (subtle touch)
 */
export function getHolidayAccent(holiday?: string): string | null {
  const currentHoliday = holiday || getHoliday();
  if (!currentHoliday) return null;

  switch (currentHoliday) {
    case 'Christmas':
      return '#FF4444'; // Red
    case 'Halloween':
      return '#FF6B35'; // Orange
    case 'Valentine\'s Day':
      return '#FF6B9D'; // Pink
    case 'St. Patrick\'s Day':
      return '#4ADE80'; // Green
    case 'Independence Day':
      return '#4A90E2'; // Blue
    case 'New Year\'s Eve':
    case 'New Year\'s Day':
      return '#FFD700'; // Gold
    default:
      return null;
  }
}
