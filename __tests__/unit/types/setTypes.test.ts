import {
  SET_TYPES,
  SET_TYPE_LABELS,
  SET_TYPE_SHORT_LABELS,
  SET_TYPE_CODES,
  SET_TYPE_COLORS,
  SET_TYPE_DESCRIPTIONS,
  isSetType,
  SetType,
} from '../../../src/types/setTypes';

describe('Set Types & Configurations (PF-313)', () => {
  describe('SET_TYPES enumeration', () => {
    it('contains all 5 expected set types', () => {
      expect(SET_TYPES).toEqual(['normal', 'warmup', 'feeder', 'failure', 'drop']);
      expect(SET_TYPES).toHaveLength(5);
    });
  });

  describe('SET_TYPE_LABELS', () => {
    it('provides human-readable Spanish labels for all set types', () => {
      expect(SET_TYPE_LABELS.normal).toBe('Normal');
      expect(SET_TYPE_LABELS.warmup).toBe('Calentamiento');
      expect(SET_TYPE_LABELS.feeder).toBe('Aproximación');
      expect(SET_TYPE_LABELS.failure).toBe('Fallo');
      expect(SET_TYPE_LABELS.drop).toBe('Drop Set');
    });

    it('covers every item in SET_TYPES', () => {
      SET_TYPES.forEach((type) => {
        expect(typeof SET_TYPE_LABELS[type]).toBe('string');
        expect(SET_TYPE_LABELS[type].length).toBeGreaterThan(0);
      });
    });
  });

  describe('SET_TYPE_SHORT_LABELS and SET_TYPE_CODES', () => {
    it('provides the expected single-letter codes N, W, A, F, D', () => {
      expect(SET_TYPE_SHORT_LABELS.normal).toBe('N');
      expect(SET_TYPE_SHORT_LABELS.warmup).toBe('W');
      expect(SET_TYPE_SHORT_LABELS.feeder).toBe('A');
      expect(SET_TYPE_SHORT_LABELS.failure).toBe('F');
      expect(SET_TYPE_SHORT_LABELS.drop).toBe('D');
    });

    it('exposes SET_TYPE_CODES identical to SET_TYPE_SHORT_LABELS', () => {
      expect(SET_TYPE_CODES).toEqual(SET_TYPE_SHORT_LABELS);
    });
  });

  describe('SET_TYPE_COLORS', () => {
    it('defines complete visual configuration for each set type', () => {
      SET_TYPES.forEach((type) => {
        const config = SET_TYPE_COLORS[type];
        expect(config).toBeDefined();
        expect(config.badgeBg).toBeDefined();
        expect(config.badgeText).toBeDefined();
        expect(config.border).toBeDefined();
        expect(config.accent).toBeDefined();
        expect(config.label).toBe(SET_TYPE_LABELS[type]);
        expect(config.shortLabel).toBe(SET_TYPE_SHORT_LABELS[type]);
      });
    });

    it('has distinct styling attributes for each type', () => {
      expect(SET_TYPE_COLORS.warmup.border).not.toEqual(SET_TYPE_COLORS.failure.border);
      expect(SET_TYPE_COLORS.feeder.badgeText).not.toEqual(SET_TYPE_COLORS.drop.badgeText);
    });
  });

  describe('SET_TYPE_DESCRIPTIONS', () => {
    it('provides meaningful descriptions for each set type', () => {
      SET_TYPES.forEach((type) => {
        expect(typeof SET_TYPE_DESCRIPTIONS[type]).toBe('string');
        expect(SET_TYPE_DESCRIPTIONS[type].length).toBeGreaterThan(10);
      });
    });
  });

  describe('isSetType guard', () => {
    it('returns true for all valid SetType strings', () => {
      expect(isSetType('normal')).toBe(true);
      expect(isSetType('warmup')).toBe(true);
      expect(isSetType('feeder')).toBe(true);
      expect(isSetType('failure')).toBe(true);
      expect(isSetType('drop')).toBe(true);
    });

    it('returns false for invalid strings, empty values and non-strings', () => {
      expect(isSetType('')).toBe(false);
      expect(isSetType('unknown')).toBe(false);
      expect(isSetType('NORMAL')).toBe(false);
      expect(isSetType('dropset')).toBe(false);
      expect(isSetType(null)).toBe(false);
      expect(isSetType(undefined)).toBe(false);
      expect(isSetType(123)).toBe(false);
      expect(isSetType({})).toBe(false);
      expect(isSetType(['normal'])).toBe(false);
    });
  });
});
