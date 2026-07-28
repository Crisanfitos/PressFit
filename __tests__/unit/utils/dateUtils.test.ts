import {
  formatLocalDateKey,
  parseDateKeyAsLocalDate,
  getStartOfWeek,
  getEndOfWeek,
  formatTime,
  formatDuration,
  isDateOlderThanDays,
} from '../../../src/utils/dateUtils';

describe('dateUtils utility module', () => {
  describe('formatLocalDateKey & parseDateKeyAsLocalDate', () => {
    it('formats date as YYYY-MM-DD local string', () => {
      const date = new Date(2026, 6, 28); // 2026-07-28
      expect(formatLocalDateKey(date)).toBe('2026-07-28');
    });

    it('parses YYYY-MM-DD as local date object', () => {
      const parsed = parseDateKeyAsLocalDate('2026-07-28');
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(6); // 0-indexed July
      expect(parsed.getDate()).toBe(28);
    });

    it('remains symmetric between formatting and parsing', () => {
      const originalStr = '2026-12-31';
      const parsed = parseDateKeyAsLocalDate(originalStr);
      expect(formatLocalDateKey(parsed)).toBe(originalStr);
    });
  });

  describe('getStartOfWeek & getEndOfWeek', () => {
    it('returns Monday 00:00:00 as start of week', () => {
      // 2026-07-28 is Tuesday
      const tuesday = new Date(2026, 6, 28);
      const start = getStartOfWeek(tuesday);
      expect(start.getDay()).toBe(1); // Monday
      expect(start.getDate()).toBe(27); // Monday July 27, 2026
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
    });

    it('returns Sunday 23:59:59 as end of week', () => {
      const tuesday = new Date(2026, 6, 28);
      const end = getEndOfWeek(tuesday);
      expect(end.getDay()).toBe(0); // Sunday
      expect(end.getDate()).toBe(2); // Sunday Aug 2, 2026
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
    });
  });

  describe('formatTime', () => {
    it('formats seconds into MM:SS format', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(65)).toBe('01:05');
      expect(formatTime(330)).toBe('05:30');
    });

    it('handles negative or invalid seconds safely', () => {
      expect(formatTime(-10)).toBe('00:00');
      expect(formatTime(NaN)).toBe('00:00');
    });
  });

  describe('formatDuration', () => {
    it('formats duration in minutes into HH:MM format', () => {
      expect(formatDuration(45)).toBe('00:45');
      expect(formatDuration(90)).toBe('01:30');
      expect(formatDuration(125)).toBe('02:05');
    });

    it('returns "00:00" for null, undefined, or negative minutes', () => {
      expect(formatDuration(null)).toBe('00:00');
      expect(formatDuration(undefined)).toBe('00:00');
      expect(formatDuration(-5)).toBe('00:00');
    });
  });

  describe('isDateOlderThanDays', () => {
    it('returns true if date is older than threshold', () => {
      const ref = new Date(2026, 6, 28); // July 28, 2026
      const oldDate = new Date(2026, 6, 10); // July 10, 2026 (18 days ago)
      expect(isDateOlderThanDays(oldDate, 14, ref)).toBe(true);
      expect(isDateOlderThanDays('2026-07-10', 14, ref)).toBe(true);
    });

    it('returns false if date is within threshold', () => {
      const ref = new Date(2026, 6, 28); // July 28, 2026
      const recentDate = new Date(2026, 6, 20); // July 20, 2026 (8 days ago)
      expect(isDateOlderThanDays(recentDate, 14, ref)).toBe(false);
      expect(isDateOlderThanDays('2026-07-20', 14, ref)).toBe(false);
    });
  });
});
