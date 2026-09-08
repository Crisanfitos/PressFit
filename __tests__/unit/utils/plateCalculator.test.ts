import {
  calculatePlates,
  getDefaultPlates,
  getPlateColor,
  formatPlateSummary,
  DEFAULT_BAR_WEIGHT_KG,
  DEFAULT_BAR_WEIGHT_LB,
  DEFAULT_PLATES_KG,
  DEFAULT_PLATES_LB,
  PLATE_COLORS_KG,
  PLATE_COLORS_LB,
  PlateItem,
} from '../../../src/utils/plateCalculator';

describe('Plate Calculator Engine (PF-319)', () => {
  describe('calculatePlates - KG standard calculations', () => {
    it('calculates optimal plates for 100 kg on standard 20 kg bar (40 kg per side: 25 + 15)', () => {
      const result = calculatePlates({
        targetWeight: 100,
        barWeight: 20,
        unit: 'kg',
      });

      expect(result.targetWeight).toBe(100);
      expect(result.barWeight).toBe(20);
      expect(result.unit).toBe('kg');
      expect(result.isExact).toBe(true);
      expect(result.remainder).toBe(0);
      expect(result.weightPerSide).toBe(40);
      expect(result.totalPlateWeight).toBe(80);
      expect(result.totalWeight).toBe(100);
      expect(result.warning).toBeNull();
      expect(result.platesPerSide).toEqual([
        { weight: 25, count: 1, color: PLATE_COLORS_KG[25] },
        { weight: 15, count: 1, color: PLATE_COLORS_KG[15] },
      ]);
      expect(result.flatPlatesPerSide).toEqual([25, 15]);
      expect(result.summary).toBe('Por lado: 1x25kg, 1x15kg');
    });

    it('calculates optimal plates for 60 kg on default bar (20 kg per side: 1x20)', () => {
      const result = calculatePlates({
        targetWeight: 60,
      });

      expect(result.barWeight).toBe(DEFAULT_BAR_WEIGHT_KG);
      expect(result.weightPerSide).toBe(20);
      expect(result.platesPerSide).toEqual([
        { weight: 20, count: 1, color: PLATE_COLORS_KG[20] },
      ]);
      expect(result.flatPlatesPerSide).toEqual([20]);
      expect(result.isExact).toBe(true);
      expect(result.summary).toBe('Por lado: 1x20kg');
    });

    it('calculates multiple plates of the same denomination (e.g. 140 kg -> 60 kg/side: 2x25 + 1x10)', () => {
      const result = calculatePlates({
        targetWeight: 140,
        barWeight: 20,
      });

      expect(result.weightPerSide).toBe(60);
      expect(result.platesPerSide).toEqual([
        { weight: 25, count: 2, color: PLATE_COLORS_KG[25] },
        { weight: 10, count: 1, color: PLATE_COLORS_KG[10] },
      ]);
      expect(result.flatPlatesPerSide).toEqual([25, 25, 10]);
      expect(result.summary).toBe('Por lado: 2x25kg, 1x10kg');
      expect(result.isExact).toBe(true);
    });

    it('handles decimal targets with fractional plates correctly (e.g. 52.5 kg on 20 kg bar -> 16.25 kg/side: 15 + 1.25)', () => {
      const result = calculatePlates({
        targetWeight: 52.5,
        barWeight: 20,
      });

      expect(result.weightPerSide).toBe(16.25);
      expect(result.totalWeight).toBe(52.5);
      expect(result.isExact).toBe(true);
      expect(result.platesPerSide).toEqual([
        { weight: 15, count: 1, color: PLATE_COLORS_KG[15] },
        { weight: 1.25, count: 1, color: PLATE_COLORS_KG[1.25] },
      ]);
      expect(result.summary).toBe('Por lado: 1x15kg, 1x1.25kg');
    });

    it('supports custom fractional plates like 0.5 kg and 0.25 kg without floating point artifacts', () => {
      const result = calculatePlates({
        targetWeight: 21.5,
        barWeight: 20,
        availablePlates: [25, 20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25],
      });

      expect(result.weightPerSide).toBe(0.75);
      expect(result.totalWeight).toBe(21.5);
      expect(result.isExact).toBe(true);
      expect(result.platesPerSide).toEqual([
        { weight: 0.5, count: 1, color: PLATE_COLORS_KG[0.5] },
        { weight: 0.25, count: 1, color: PLATE_COLORS_KG[0.25] },
      ]);
      expect(result.remainder).toBe(0);
    });
  });

  describe('calculatePlates - LB standard calculations', () => {
    it('calculates optimal plates for 225 lb on standard 45 lb bar (90 lb per side: 2x45)', () => {
      const result = calculatePlates({
        targetWeight: 225,
        unit: 'lb',
      });

      expect(result.barWeight).toBe(DEFAULT_BAR_WEIGHT_LB);
      expect(result.weightPerSide).toBe(90);
      expect(result.platesPerSide).toEqual([
        { weight: 45, count: 2, color: PLATE_COLORS_LB[45] },
      ]);
      expect(result.flatPlatesPerSide).toEqual([45, 45]);
      expect(result.isExact).toBe(true);
      expect(result.summary).toBe('Por lado: 2x45lb');
    });

    it('calculates optimal plates for 135 lb on 45 lb bar (45 lb per side: 1x45)', () => {
      const result = calculatePlates({
        targetWeight: 135,
        barWeight: 45,
        unit: 'lb',
      });

      expect(result.weightPerSide).toBe(45);
      expect(result.platesPerSide).toEqual([
        { weight: 45, count: 1, color: PLATE_COLORS_LB[45] },
      ]);
      expect(result.isExact).toBe(true);
      expect(result.summary).toBe('Por lado: 1x45lb');
    });

    it('calculates multi-denomination combination in lb (185 lb on 45 lb bar -> 70 lb/side: 45 + 25)', () => {
      const result = calculatePlates({
        targetWeight: 185,
        barWeight: 45,
        unit: 'lb',
      });

      expect(result.weightPerSide).toBe(70);
      expect(result.platesPerSide).toEqual([
        { weight: 45, count: 1, color: PLATE_COLORS_LB[45] },
        { weight: 25, count: 1, color: PLATE_COLORS_LB[25] },
      ]);
      expect(result.summary).toBe('Por lado: 1x45lb, 1x25lb');
    });
  });

  describe('calculatePlates - Edge cases and boundaries', () => {
    it('returns empty plates and "Solo barra" when target weight equals bar weight', () => {
      const result = calculatePlates({
        targetWeight: 20,
        barWeight: 20,
        unit: 'kg',
      });

      expect(result.platesPerSide).toEqual([]);
      expect(result.flatPlatesPerSide).toEqual([]);
      expect(result.weightPerSide).toBe(0);
      expect(result.totalWeight).toBe(20);
      expect(result.remainder).toBe(0);
      expect(result.isExact).toBe(true);
      expect(result.summary).toBe('Solo barra (20 kg)');
      expect(result.warning).toBeNull();
    });

    it('handles target weight less than bar weight with TARGET_BELOW_BAR warning', () => {
      const result = calculatePlates({
        targetWeight: 15,
        barWeight: 20,
        unit: 'kg',
      });

      expect(result.platesPerSide).toEqual([]);
      expect(result.totalWeight).toBe(20);
      expect(result.remainder).toBe(-5);
      expect(result.isExact).toBe(false);
      expect(result.warning).toBe('TARGET_BELOW_BAR');
      expect(result.summary).toBe('Solo barra (20 kg)');
    });

    it('handles zero or negative target weight defensively', () => {
      const zeroResult = calculatePlates({ targetWeight: 0, barWeight: 20 });
      expect(zeroResult.totalWeight).toBe(0);
      expect(zeroResult.platesPerSide).toEqual([]);
      expect(zeroResult.summary).toBe('0 kg');

      const negResult = calculatePlates({ targetWeight: -20 });
      expect(negResult.totalWeight).toBe(0);
      expect(negResult.platesPerSide).toEqual([]);
      expect(negResult.summary).toBe('0 kg');

      const nanResult = calculatePlates({ targetWeight: NaN });
      expect(nanResult.totalWeight).toBe(0);
      expect(nanResult.platesPerSide).toEqual([]);
    });

    it('identifies unachievable fractional remainders and sets FRACTIONAL_REMAINDER warning', () => {
      // 61 kg on 20 kg bar requires 41 kg total (20.5 kg per side).
      // Standard plates can do 20 kg per side (total 60 kg), leaving 1 kg remainder.
      const result = calculatePlates({
        targetWeight: 61,
        barWeight: 20,
        unit: 'kg',
      });

      expect(result.weightPerSide).toBe(20);
      expect(result.totalWeight).toBe(60);
      expect(result.remainder).toBe(1);
      expect(result.isExact).toBe(false);
      expect(result.warning).toBe('FRACTIONAL_REMAINDER');
      expect(result.platesPerSide).toEqual([
        { weight: 20, count: 1, color: PLATE_COLORS_KG[20] },
      ]);
    });
  });

  describe('calculatePlates - Inventory constraints and limits', () => {
    it('respects availablePairs limit and falls back to smaller denominations', () => {
      // Target: 100 kg on 20 kg bar (40 kg/side).
      // Normally uses 1x25 + 1x15. But user only has 0 pairs of 25 and 1 pair of 20.
      const inventory = [
        { weight: 25, availablePairs: 0 },
        { weight: 20, availablePairs: 1 },
        { weight: 15, availablePairs: 2 },
        { weight: 10, availablePairs: 2 },
        { weight: 5, availablePairs: 2 },
      ];

      const result = calculatePlates({
        targetWeight: 100,
        barWeight: 20,
        availablePlates: inventory,
      });

      // 40 kg/side needed -> 1x20 (max 1 pair) -> 20 kg remaining -> 1x15 -> 5 kg remaining -> 1x5
      expect(result.weightPerSide).toBe(40);
      expect(result.totalWeight).toBe(100);
      expect(result.isExact).toBe(true);
      expect(result.platesPerSide).toEqual([
        { weight: 20, count: 1, color: PLATE_COLORS_KG[20] },
        { weight: 15, count: 1, color: PLATE_COLORS_KG[15] },
        { weight: 5, count: 1, color: PLATE_COLORS_KG[5] },
      ]);
      expect(result.summary).toBe('Por lado: 1x20kg, 1x15kg, 1x5kg');
    });

    it('sets INSUFFICIENT_PLATES warning when inventory limits prevent reaching target weight', () => {
      // Target 100 kg on 20 kg bar (40 kg/side).
      // Only 1 pair of 10 kg available.
      const inventory = [
        { weight: 20, availablePairs: 0 },
        { weight: 10, availablePairs: 1 },
      ];

      const result = calculatePlates({
        targetWeight: 100,
        barWeight: 20,
        availablePlates: inventory,
      });

      expect(result.weightPerSide).toBe(10);
      expect(result.totalWeight).toBe(40);
      expect(result.remainder).toBe(60);
      expect(result.isExact).toBe(false);
      expect(result.warning).toBe('INSUFFICIENT_PLATES');
    });

    it('accepts a simple array of numbers as availablePlates', () => {
      const result = calculatePlates({
        targetWeight: 60,
        barWeight: 20,
        availablePlates: [10, 5],
      });

      // 20 kg/side needed -> 2x10
      expect(result.weightPerSide).toBe(20);
      expect(result.platesPerSide).toEqual([
        { weight: 10, count: 2, color: PLATE_COLORS_KG[10] },
      ]);
      expect(result.isExact).toBe(true);
    });
  });

  describe('Utility functions and constants', () => {
    it('provides standard default inventories for KG and LB', () => {
      const kgPlates = getDefaultPlates('kg');
      expect(kgPlates).toHaveLength(DEFAULT_PLATES_KG.length);
      expect(kgPlates[0].weight).toBe(25);

      const lbPlates = getDefaultPlates('lb');
      expect(lbPlates).toHaveLength(DEFAULT_PLATES_LB.length);
      expect(lbPlates[0].weight).toBe(45);
    });

    it('maps official IPF / gym colors correctly with fallback for custom weights', () => {
      expect(getPlateColor(25, 'kg')).toBe('#EF4444');
      expect(getPlateColor(20, 'kg')).toBe('#3B82F6');
      expect(getPlateColor(15, 'kg')).toBe('#EAB308');
      expect(getPlateColor(10, 'kg')).toBe('#22C55E');
      expect(getPlateColor(45, 'lb')).toBe('#3B82F6');
      expect(getPlateColor(7.5, 'kg')).toBe('#6B7280'); // Fallback neutro
    });

    it('formats plate summaries with or without bar context', () => {
      const plates: PlateItem[] = [
        { weight: 20, count: 1, color: '#3B82F6' },
        { weight: 5, count: 2, color: '#F3F4F6' },
      ];

      expect(formatPlateSummary(plates, 'kg')).toBe('Por lado: 1x20kg, 2x5kg');
      expect(formatPlateSummary([], 'kg', 20)).toBe('Solo barra (20 kg)');
      expect(formatPlateSummary([], 'kg')).toBe('Sin discos');
    });
  });
});
