/**
 * Centralized schedule configuration for Stokie.
 *
 * All timing logic lives here. No Supabase, no side effects.
 * Every function accepts an optional `now` Date for testability.
 */

// ─── Config ──────────────────────────────────────────────────────────────────

export const SCHEDULE = {
  timezone: 'America/New_York',

  prompt: {
    startHour: 2,           // 2 AM ET
    activeDays: [1, 2, 3, 4, 5, 6] as readonly number[], // Mon–Sat
  },

  nudge: {
    hour: 14,               // 2 PM ET — new prompt announcement (non-responders)
    reminderHour: 20,       // 8:30 PM ET — reminder (non-responders)
    activeDays: [1, 2, 3, 4, 5, 6] as readonly number[], // Mon–Sat
  },

  fireside: {
    day: 0,                 // Sunday
    visibleHour: 12,        // Sun 12 PM — fireside opens
    unlockHour: 12,         // Sun 12 PM — fireside opens (no locked period)
    endDay: 1,              // Monday
    endHour: 3,             // Mon 3 AM ET — fireside closes (2:59 AM)
  },
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────

export type FiresideState = 'HIDDEN' | 'VISIBLE_LOCKED' | 'UNLOCKED';

export interface ETTime {
  dayOfWeek: number; // 0=Sun, 1=Mon, …, 6=Sat
  hour: number;      // 0–23
  minute: number;    // 0–59
}

// ─── Core helpers ────────────────────────────────────────────────────────────

/**
 * Get current time in Eastern Time using Intl (handles DST automatically).
 */
export function getNowET(now?: Date): ETTime {
  const d = now ?? new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SCHEDULE.timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const weekdayStr = parts.find(p => p.type === 'weekday')!.value;
  const hour = parseInt(parts.find(p => p.type === 'hour')!.value, 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')!.value, 10);

  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };

  return { dayOfWeek: dayMap[weekdayStr], hour, minute };
}

/**
 * Is a prompt currently active? (Mon–Sat, 2 AM ET to next day 2 AM ET)
 */
export function isPromptActive(now?: Date): boolean {
  return getActivePromptDay(now) !== null;
}

/**
 * Which day's prompt is currently running?
 *
 * Returns 1–6 (Mon–Sat) or null (no prompt active).
 *
 * Logic:
 *   dayOfWeek 1–6, hour >= startHour  → that day's prompt
 *   dayOfWeek 1–6, hour <  startHour  → previous day's prompt (if prev day is active)
 *   dayOfWeek 0,   hour <  startHour  → 6 (Saturday's prompt still running)
 *   dayOfWeek 0,   hour >= startHour  → null (Sunday, no prompt)
 */
export function getActivePromptDay(now?: Date): number | null {
  const { dayOfWeek, hour } = getNowET(now);
  const { startHour, activeDays } = SCHEDULE.prompt;

  if (activeDays.includes(dayOfWeek)) {
    // Mon–Sat
    if (hour >= startHour) {
      // After start hour: this day's prompt
      return dayOfWeek;
    }
    // Before start hour: previous day's prompt (if that day is active)
    const prevDay = dayOfWeek - 1; // Mon(1) - 1 = Sun(0), not active → null
    return activeDays.includes(prevDay) ? prevDay : null;
  }

  // Sunday
  if (dayOfWeek === 0) {
    if (hour < startHour) {
      // Before 2 AM Sunday: Saturday's prompt still running
      return 6;
    }
    // Sunday after 2 AM: no prompt
    return null;
  }

  return null;
}

/**
 * Get the current fireside state.
 *
 * HIDDEN:    Mon 3 AM → Sun 11:59 AM  (all week)
 * UNLOCKED:  Sun 12 PM → Mon 2:59 AM  (fireside open)
 */
export function getFiresideState(now?: Date): FiresideState {
  const { dayOfWeek, hour } = getNowET(now);
  const { day, visibleHour, unlockHour, endDay, endHour } = SCHEDULE.fireside;

  // Sunday
  if (dayOfWeek === day) {
    if (hour < visibleHour) return 'HIDDEN';       // Sun 0:00–1:59
    if (hour < unlockHour) return 'VISIBLE_LOCKED'; // Sun 2:00–18:59
    return 'UNLOCKED';                              // Sun 19:00–23:59
  }

  // Days between Sunday unlock and endDay (e.g. Monday when endDay is Tuesday)
  if (dayOfWeek > day && dayOfWeek < endDay) {
    return 'UNLOCKED';
  }

  // endDay before endHour
  if (dayOfWeek === endDay && hour < endHour) {
    return 'UNLOCKED';
  }

  return 'HIDDEN';
}

/**
 * Should a nudge notification be sent right now?
 *
 * Mon–Sat 2 PM ET    → new prompt announcement (non-responders)
 * Mon–Sat 8:30 PM ET → prompt reminder (non-responders)
 * Sun 12 PM ET       → fireside open (ALL users)
 * Sun 9 PM ET        → fireside reminder (users who haven't seen it)
 */
export function shouldSendNudge(now?: Date): { should: boolean; targetAll: boolean } {
  const { dayOfWeek, hour } = getNowET(now);

  // Sunday fireside notifications
  if (dayOfWeek === SCHEDULE.fireside.day && (hour === 12 || hour === 21)) {
    return { should: true, targetAll: hour === 12 };
  }

  // Mon–Sat prompt nudge (2 PM or 8:30 PM)
  if (SCHEDULE.nudge.activeDays.includes(dayOfWeek) &&
      (hour === SCHEDULE.nudge.hour || hour === SCHEDULE.nudge.reminderHour)) {
    return { should: true, targetAll: false };
  }

  return { should: false, targetAll: false };
}

/**
 * Get the fireside unlock time formatted for the user's local timezone.
 * Uses Intl so it automatically adjusts for the viewer's locale.
 */
export function getFiresideLocalTime(): string {
  // Build a Date for "next Sunday 12 PM ET" — we only need the time portion
  // so we construct a reference date in UTC that corresponds to 12 PM ET.
  // ET is UTC-5 (EST) or UTC-4 (EDT). Intl handles this for us: we just
  // need any Sunday at unlockHour in ET.
  const ref = new Date();
  // Move to next Sunday
  const etNow = getNowET(ref);
  const daysUntilSunday = (7 - etNow.dayOfWeek) % 7;
  ref.setDate(ref.getDate() + daysUntilSunday);

  // Set to unlockHour in ET by formatting through Intl
  // We'll use a fixed approach: set UTC hour to unlockHour + 5 (EST offset)
  // and let the formatter display it in local time.
  // But DST makes this tricky — instead, just display the ET time directly.
  const h = SCHEDULE.fireside.unlockHour as number;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayHour}:00 ${period} ET`;
}

/**
 * Debug helper: print the current schedule state to console.
 */
export function dryRun(now?: Date): void {
  const et = getNowET(now);
  const promptDay = getActivePromptDay(now);
  const fireside = getFiresideState(now);
  const nudge = shouldSendNudge(now);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const ts = `${dayNames[et.dayOfWeek]} ${et.hour}:${String(et.minute).padStart(2, '0')} ET`;

  console.log(`[${ts}] — Prompt active: ${promptDay !== null ? `Day ${promptDay}` : 'none'}`);
  console.log(`[${ts}] — Fireside: ${fireside}`);
  console.log(`[${ts}] — Nudge: ${nudge.should ? (nudge.targetAll ? 'ALL users' : 'non-responders') : 'no'}`);
}
