import {
  formatWeight,
  formatVolume,
  calculateBMI,
  formatBMI,
  getBMICategory,
  calculateBodyFat,
} from '../../../src/utils/formatters';

describe('formatters utility module', () => {
  describe('formatWeight', () => {
    it('formats numeric weights with default kg unit', () => {
      expect(formatWeight(75)).toBe('75 kg');
      expect(formatWeight(75.5)).toBe('75.5 kg');
    });

    it('formats weight with custom unit', () => {
      expect(formatWeight(165, 'lbs')).toBe('165 lbs');
    });

    it('returns "-" for null, undefined, or NaN values', () => {
      expect(formatWeight(null)).toBe('-');
      expect(formatWeight(undefined)).toBe('-');
      expect(formatWeight(NaN)).toBe('-');
    });
  });

  describe('formatVolume', () => {
    it('formats non-zero volume with default kg unit', () => {
      expect(formatVolume(1250)).toMatch(/1.*250 kg/);
    });

    it('returns "0 kg" for 0, negative, null, or undefined', () => {
      expect(formatVolume(0)).toBe('0 kg');
      expect(formatVolume(-100)).toBe('0 kg');
      expect(formatVolume(null)).toBe('0 kg');
      expect(formatVolume(undefined)).toBe('0 kg');
    });
  });

  describe('calculateBMI', () => {
    it('calculates BMI correctly for valid weight and height', () => {
      // 70 kg, 175 cm -> 70 / (1.75 * 1.75) = 22.857... -> 22.9
      expect(calculateBMI(70, 175)).toBe(22.9);
      // 80 kg, 180 cm -> 80 / (1.8 * 1.8) = 24.69... -> 24.7
      expect(calculateBMI(80, 180)).toBe(24.7);
    });

    it('returns null for invalid or missing inputs', () => {
      expect(calculateBMI(0, 175)).toBeNull();
      expect(calculateBMI(70, 0)).toBeNull();
      expect(calculateBMI(null, 175)).toBeNull();
      expect(calculateBMI(70, undefined)).toBeNull();
      expect(calculateBMI(-70, 175)).toBeNull();
    });
  });

  describe('formatBMI', () => {
    it('formats BMI number to 1 decimal place', () => {
      expect(formatBMI(22.857)).toBe('22.9');
      expect(formatBMI(24)).toBe('24.0');
    });

    it('returns "N/A" for null, undefined, 0, or negative', () => {
      expect(formatBMI(null)).toBe('N/A');
      expect(formatBMI(undefined)).toBe('N/A');
      expect(formatBMI(0)).toBe('N/A');
    });
  });

  describe('getBMICategory', () => {
    it('classifies BMI correctly into WHO categories in Spanish', () => {
      expect(getBMICategory(17.5)).toBe('Bajo peso');
      expect(getBMICategory(22.0)).toBe('Normal');
      expect(getBMICategory(27.5)).toBe('Sobrepeso');
      expect(getBMICategory(32.0)).toBe('Obesidad');
    });

    it('returns "Desconocido" for invalid values', () => {
      expect(getBMICategory(null)).toBe('Desconocido');
      expect(getBMICategory(-5)).toBe('Desconocido');
    });
  });

  describe('calculateBodyFat', () => {
    it('returns recorded body fat percentage if provided', () => {
      expect(calculateBodyFat(70, 175, 15.5)).toBe('15.5');
    });

    it('estimates body fat from weight and height if no recorded fat is provided', () => {
      // 70kg, 175cm -> BMI = 22.9 -> 1.2 * 22.9 - 10.45 = 17.03 -> "17.0"
      expect(calculateBodyFat(70, 175)).toBe('17.0');
    });

    it('returns null if metrics are invalid and no recorded fat is provided', () => {
      expect(calculateBodyFat(null, 175)).toBeNull();
    });
  });
});
