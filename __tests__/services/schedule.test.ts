import {
  getNowET,
  isPromptActive,
  getActivePromptDay,
  getFiresideState,
  shouldSendNudge,
  getFiresideLocalTime,
  SCHEDULE,
} from '../../lib/schedule';

/**
 * Convert an ET day/hour/minute to a UTC Date.
 *
 * Feb 2026 is EST (UTC-5). We use a known Monday (Feb 16, 2026) as anchor.
 * dayOfWeek: 0=Sun, 1=Mon, …, 6=Sat
 */
function etToUTC(dayOfWeek: number, hour: number, minute = 0): Date {
  // Feb 16, 2026 is a Monday (dayOfWeek=1)
  const mondayDate = 16;
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sun=6 days after Mon
  const day = mondayDate + daysFromMonday;
  // EST is UTC-5, so UTC hour = ET hour + 5
  const utcHour = hour + 5;
  return new Date(Date.UTC(2026, 1, day, utcHour, minute, 0)); // month 1 = Feb
}

describe('Schedule Module', () => {
  describe('getNowET', () => {
    it('returns correct ET time components', () => {
      // Mon Feb 16 2026, 10:30 AM ET = 15:30 UTC
      const et = getNowET(etToUTC(1, 10, 30));
      expect(et.dayOfWeek).toBe(1);
      expect(et.hour).toBe(10);
      expect(et.minute).toBe(30);
    });

    it('returns Sunday correctly', () => {
      const et = getNowET(etToUTC(0, 14, 0));
      expect(et.dayOfWeek).toBe(0);
      expect(et.hour).toBe(14);
    });
  });

  describe('isPromptActive', () => {
    it('active at Mon 2:00 AM ET', () => {
      expect(isPromptActive(etToUTC(1, 2, 0))).toBe(true);
    });

    it('NOT active at Mon 1:59 AM ET (no Sunday prompt to carry over)', () => {
      expect(isPromptActive(etToUTC(1, 1, 59))).toBe(false);
    });

    it('active at Sat 1:59 AM ET (Friday prompt still running)', () => {
      expect(isPromptActive(etToUTC(6, 1, 59))).toBe(true);
    });

    it('active at Sun 1:59 AM ET (Saturday prompt still running)', () => {
      expect(isPromptActive(etToUTC(0, 1, 59))).toBe(true);
    });

    it('NOT active at Sun 2:00 PM ET', () => {
      expect(isPromptActive(etToUTC(0, 14, 0))).toBe(false);
    });

    it('active at Wed 3:00 PM ET', () => {
      expect(isPromptActive(etToUTC(3, 15, 0))).toBe(true);
    });
  });

  describe('getActivePromptDay', () => {
    it('Mon 2 AM → day 1 (Monday)', () => {
      expect(getActivePromptDay(etToUTC(1, 2, 0))).toBe(1);
    });

    it('Mon 1:59 AM → null (prev is Sunday, not active)', () => {
      expect(getActivePromptDay(etToUTC(1, 1, 59))).toBeNull();
    });

    it('Tue 1:59 AM → day 1 (Monday prompt still running)', () => {
      expect(getActivePromptDay(etToUTC(2, 1, 59))).toBe(1);
    });

    it('Tue 2 AM → day 2 (Tuesday)', () => {
      expect(getActivePromptDay(etToUTC(2, 2, 0))).toBe(2);
    });

    it('Wed 10 AM → day 3 (Wednesday)', () => {
      expect(getActivePromptDay(etToUTC(3, 10, 0))).toBe(3);
    });

    it('Fri 23:59 → day 5 (Friday)', () => {
      expect(getActivePromptDay(etToUTC(5, 23, 59))).toBe(5);
    });

    it('Sat 1:59 AM → day 5 (Friday prompt still running)', () => {
      expect(getActivePromptDay(etToUTC(6, 1, 59))).toBe(5);
    });

    it('Sat 2 AM → day 6 (Saturday)', () => {
      expect(getActivePromptDay(etToUTC(6, 2, 0))).toBe(6);
    });

    it('Sun 1:59 AM → day 6 (Saturday prompt still running)', () => {
      expect(getActivePromptDay(etToUTC(0, 1, 59))).toBe(6);
    });

    it('Sun 2 AM → null (no Sunday prompt)', () => {
      expect(getActivePromptDay(etToUTC(0, 2, 0))).toBeNull();
    });

    it('Sun 14:00 → null', () => {
      expect(getActivePromptDay(etToUTC(0, 14, 0))).toBeNull();
    });
  });

  describe('getFiresideState', () => {
    it('HIDDEN on Monday 10 AM', () => {
      expect(getFiresideState(etToUTC(1, 10, 0))).toBe('HIDDEN');
    });

    it('HIDDEN on Wednesday 3 PM', () => {
      expect(getFiresideState(etToUTC(3, 15, 0))).toBe('HIDDEN');
    });

    it('HIDDEN on Saturday 11 PM', () => {
      expect(getFiresideState(etToUTC(6, 23, 0))).toBe('HIDDEN');
    });

    it('HIDDEN on Sunday 1:59 AM (before visible hour)', () => {
      expect(getFiresideState(etToUTC(0, 1, 59))).toBe('HIDDEN');
    });

    it('VISIBLE_LOCKED at Sunday 2:00 AM', () => {
      expect(getFiresideState(etToUTC(0, 2, 0))).toBe('VISIBLE_LOCKED');
    });

    it('VISIBLE_LOCKED at Sunday 11:00 AM', () => {
      expect(getFiresideState(etToUTC(0, 11, 0))).toBe('VISIBLE_LOCKED');
    });

    it('VISIBLE_LOCKED at Sunday 6:59 PM', () => {
      // hour=18, minute=59 → still < unlockHour(19)
      expect(getFiresideState(etToUTC(0, 18, 59))).toBe('VISIBLE_LOCKED');
    });

    it('UNLOCKED at Sunday 7:00 PM', () => {
      expect(getFiresideState(etToUTC(0, 19, 0))).toBe('UNLOCKED');
    });

    it('UNLOCKED at Sunday 11:59 PM', () => {
      expect(getFiresideState(etToUTC(0, 23, 59))).toBe('UNLOCKED');
    });

    it('UNLOCKED at Monday 1:59 AM', () => {
      expect(getFiresideState(etToUTC(1, 1, 59))).toBe('UNLOCKED');
    });

    it('HIDDEN at Monday 2:00 AM (new week starts)', () => {
      expect(getFiresideState(etToUTC(1, 2, 0))).toBe('HIDDEN');
    });
  });

  describe('shouldSendNudge', () => {
    it('Mon 7 PM → nudge non-responders', () => {
      const result = shouldSendNudge(etToUTC(1, 19, 0));
      expect(result.should).toBe(true);
      expect(result.targetAll).toBe(false);
    });

    it('Sat 7 PM → nudge non-responders', () => {
      const result = shouldSendNudge(etToUTC(6, 19, 0));
      expect(result.should).toBe(true);
      expect(result.targetAll).toBe(false);
    });

    it('Sun 6 PM → nudge ALL users (fireside reminder)', () => {
      const result = shouldSendNudge(etToUTC(0, 18, 0));
      expect(result.should).toBe(true);
      expect(result.targetAll).toBe(true);
    });

    it('Mon 10 AM → no nudge', () => {
      const result = shouldSendNudge(etToUTC(1, 10, 0));
      expect(result.should).toBe(false);
      expect(result.targetAll).toBe(false);
    });

    it('Sun 7 PM → no nudge (that is unlock hour, not nudge hour)', () => {
      const result = shouldSendNudge(etToUTC(0, 19, 0));
      expect(result.should).toBe(false);
      expect(result.targetAll).toBe(false);
    });

    it('Wed 6 PM → no nudge (nudge is at 7 PM)', () => {
      const result = shouldSendNudge(etToUTC(3, 18, 0));
      expect(result.should).toBe(false);
      expect(result.targetAll).toBe(false);
    });
  });

  describe('getFiresideLocalTime', () => {
    it('returns formatted time string with ET suffix', () => {
      const time = getFiresideLocalTime();
      expect(time).toBe('7:00 PM ET');
    });
  });

  describe('SCHEDULE config', () => {
    it('has correct timezone', () => {
      expect(SCHEDULE.timezone).toBe('America/New_York');
    });

    it('prompts start at 2 AM', () => {
      expect(SCHEDULE.prompt.startHour).toBe(2);
    });

    it('prompts active Mon-Sat', () => {
      expect(SCHEDULE.prompt.activeDays).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('fireside unlocks at 7 PM on Sunday', () => {
      expect(SCHEDULE.fireside.day).toBe(0);
      expect(SCHEDULE.fireside.unlockHour).toBe(19);
    });
  });
});
