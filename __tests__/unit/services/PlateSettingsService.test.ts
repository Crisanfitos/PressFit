import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PlateSettingsService,
  PLATE_SETTINGS_STORAGE_KEY,
  UserPlateSettings,
} from '../../../src/services/PlateSettingsService';
import {
  DEFAULT_BAR_WEIGHT_KG,
  DEFAULT_BAR_WEIGHT_LB,
} from '../../../src/utils/plateCalculator';

describe('PlateSettingsService Unit Tests', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    PlateSettingsService._clearMemoryCache();
    await AsyncStorage.clear();
  });

  it('returns default settings when storage is empty', async () => {
    const settings = await PlateSettingsService.getSettings();

    expect(settings).toBeDefined();
    expect(settings.defaultBarWeight).toBe(DEFAULT_BAR_WEIGHT_KG);
    expect(settings.unit).toBe('kg');
    expect(settings.platesKg.length).toBeGreaterThan(0);
    expect(settings.platesLb.length).toBeGreaterThan(0);
  });

  it('persists and retrieves user customized settings', async () => {
    const custom: UserPlateSettings = {
      defaultBarWeight: 15,
      unit: 'kg',
      platesKg: [{ weight: 20, availablePairs: 2, color: '#3B82F6' }],
      platesLb: [{ weight: 45, availablePairs: 2, color: '#3B82F6' }],
      customBarWeightKg: 15,
      customBarWeightLb: 35,
    };

    await PlateSettingsService.saveSettings(custom);
    PlateSettingsService._clearMemoryCache();

    const loaded = await PlateSettingsService.getSettings();
    expect(loaded.defaultBarWeight).toBe(15);
    expect(loaded.platesKg[0].weight).toBe(20);
    expect(loaded.platesKg[0].availablePairs).toBe(2);
  });

  it('updates default bar weight cleanly', async () => {
    await PlateSettingsService.updateBarWeight(10, 'kg');
    PlateSettingsService._clearMemoryCache();

    const loaded = await PlateSettingsService.getSettings();
    expect(loaded.defaultBarWeight).toBe(10);
    expect(loaded.customBarWeightKg).toBe(10);
  });

  it('switches unit and adapts the corresponding default bar weight', async () => {
    await PlateSettingsService.updateBarWeight(20, 'kg');
    await PlateSettingsService.updateUnit('lb');

    let loaded = await PlateSettingsService.getSettings();
    expect(loaded.unit).toBe('lb');
    expect(loaded.defaultBarWeight).toBe(DEFAULT_BAR_WEIGHT_LB);

    // Switch back to kg
    await PlateSettingsService.updateUnit('kg');
    loaded = await PlateSettingsService.getSettings();
    expect(loaded.unit).toBe('kg');
    expect(loaded.defaultBarWeight).toBe(20);
  });

  it('updates plate item pair limit and disabling', async () => {
    // Disable 25kg plate (availablePairs = 0)
    await PlateSettingsService.updatePlateItem('kg', 25, { enabled: false });

    let loaded = await PlateSettingsService.getSettings();
    const plate25 = loaded.platesKg.find(p => p.weight === 25);
    expect(plate25).toBeDefined();
    expect(plate25?.availablePairs).toBe(0);

    // Re-enable with 3 pairs
    await PlateSettingsService.updatePlateItem('kg', 25, { enabled: true, availablePairs: 3 });
    loaded = await PlateSettingsService.getSettings();
    const updated25 = loaded.platesKg.find(p => p.weight === 25);
    expect(updated25?.availablePairs).toBe(3);
  });

  it('resets to defaults cleanly', async () => {
    await PlateSettingsService.updateBarWeight(12.5, 'kg');
    await PlateSettingsService.updatePlateItem('kg', 20, { availablePairs: 1 });

    const reset = await PlateSettingsService.resetToDefaults();
    expect(reset.defaultBarWeight).toBe(DEFAULT_BAR_WEIGHT_KG);
    expect(reset.platesKg.find(p => p.weight === 20)?.availablePairs).toBeUndefined();

    PlateSettingsService._clearMemoryCache();
    const loaded = await PlateSettingsService.getSettings();
    expect(loaded.defaultBarWeight).toBe(DEFAULT_BAR_WEIGHT_KG);
  });

  it('recovers with defaults if stored JSON is corrupt', async () => {
    await AsyncStorage.setItem(PLATE_SETTINGS_STORAGE_KEY, '{ invalid JSON');

    const loaded = await PlateSettingsService.getSettings();
    expect(loaded).toBeDefined();
    expect(loaded.defaultBarWeight).toBe(DEFAULT_BAR_WEIGHT_KG);
  });
});
