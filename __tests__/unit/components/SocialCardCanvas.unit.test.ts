/**
 * Unit tests for SocialCardCanvas style utilities.
 *
 * Tests formatDuration, formatVolume, and CARD_DIMENSIONS.
 * PF-162
 */

import {
  formatDuration,
  formatVolume,
  CARD_DIMENSIONS,
} from '../../../src/components/social/SocialCardCanvas.styles';

describe('SocialCardCanvas utilities (PF-162)', () => {
  // ─── formatDuration ──────────────────────────────────────────
  describe('formatDuration', () => {
    it('returns "--" for null input', () => {
      expect(formatDuration(null)).toBe('--');
    });

    it('returns "--" for undefined input', () => {
      expect(formatDuration(undefined)).toBe('--');
    });

    it('returns "--" for zero minutes', () => {
      expect(formatDuration(0)).toBe('--');
    });

    it('returns "--" for negative minutes', () => {
      expect(formatDuration(-5)).toBe('--');
    });

    it('formats minutes under 60 as "Xm"', () => {
      expect(formatDuration(45)).toBe('45m');
    });

    it('formats 1 minute correctly', () => {
      expect(formatDuration(1)).toBe('1m');
    });

    it('formats exactly 60 minutes as "1h"', () => {
      expect(formatDuration(60)).toBe('1h');
    });

    it('formats 65 minutes as "1h 05m"', () => {
      expect(formatDuration(65)).toBe('1h 05m');
    });

    it('formats 120 minutes as "2h"', () => {
      expect(formatDuration(120)).toBe('2h');
    });

    it('formats 90 minutes as "1h 30m"', () => {
      expect(formatDuration(90)).toBe('1h 30m');
    });

    it('rounds fractional minutes', () => {
      expect(formatDuration(45.7)).toBe('46m');
    });
  });

  // ─── formatVolume ────────────────────────────────────────────
  describe('formatVolume', () => {
    it('returns "0 kg" for zero', () => {
      expect(formatVolume(0)).toBe('0 kg');
    });

    it('returns "0 kg" for negative volume', () => {
      expect(formatVolume(-100)).toBe('0 kg');
    });

    it('formats small volume without separator', () => {
      expect(formatVolume(500)).toMatch(/500/);
      expect(formatVolume(500)).toMatch(/kg/);
    });

    it('formats volume with thousands separator', () => {
      const result = formatVolume(12345);
      expect(result).toMatch(/12/);
      expect(result).toMatch(/345/);
      expect(result).toMatch(/kg/);
    });

    it('includes "kg" suffix', () => {
      expect(formatVolume(1)).toContain('kg');
    });
  });

  // ─── CARD_DIMENSIONS ────────────────────────────────────────
  describe('CARD_DIMENSIONS', () => {
    it('has 9:16 ratio with width < height', () => {
      const dims = CARD_DIMENSIONS['9:16'];
      expect(dims.width).toBeGreaterThan(0);
      expect(dims.height).toBeGreaterThan(dims.width);
    });

    it('has 1:1 ratio with equal width and height', () => {
      const dims = CARD_DIMENSIONS['1:1'];
      expect(dims.width).toBeGreaterThan(0);
      expect(dims.width).toBe(dims.height);
    });
  });
});
