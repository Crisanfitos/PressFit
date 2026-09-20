import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { usePlateSettingsController } from '../../../src/controllers/usePlateSettingsController';
import { PlateSettingsService, UserPlateSettings } from '../../../src/services/PlateSettingsService';
import { HapticService } from '../../../src/services/HapticService';

jest.mock('../../../src/services/HapticService', () => ({
  HapticService: {
    selection: jest.fn(),
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
  },
}));

jest.mock('../../../src/services/PlateSettingsService', () => ({
  PlateSettingsService: {
    getSettings: jest.fn(),
    saveSettings: jest.fn(),
    updateUnit: jest.fn(),
    updateBarWeight: jest.fn(),
    updatePlateItem: jest.fn(),
    resetToDefaults: jest.fn(),
  },
}));

describe('usePlateSettingsController (PF-384)', () => {
  const defaultMockSettings: UserPlateSettings = {
    unit: 'kg',
    defaultBarWeight: 20,
    customBarWeightKg: 20,
    customBarWeightLb: 45,
    platesKg: [
      { weight: 25, availablePairs: undefined, color: '#DC2626' },
      { weight: 20, availablePairs: undefined, color: '#2563EB' },
      { weight: 15, availablePairs: undefined, color: '#EAB308' },
      { weight: 10, availablePairs: undefined, color: '#16A34A' },
      { weight: 5, availablePairs: undefined, color: '#FFFFFF' },
    ],
    platesLb: [
      { weight: 45, availablePairs: undefined, color: '#2563EB' },
      { weight: 35, availablePairs: undefined, color: '#EAB308' },
      { weight: 25, availablePairs: undefined, color: '#16A34A' },
      { weight: 10, availablePairs: undefined, color: '#1F2937' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (PlateSettingsService.getSettings as jest.Mock).mockResolvedValue(
      JSON.parse(JSON.stringify(defaultMockSettings))
    );
    (PlateSettingsService.saveSettings as jest.Mock).mockResolvedValue(undefined);
    (PlateSettingsService.updateUnit as jest.Mock).mockImplementation(async (unit) => ({
      ...defaultMockSettings,
      unit,
      defaultBarWeight: unit === 'kg' ? 20 : 45,
    }));
    (PlateSettingsService.updateBarWeight as jest.Mock).mockImplementation(async (weight) => ({
      ...defaultMockSettings,
      defaultBarWeight: weight,
    }));
    (PlateSettingsService.updatePlateItem as jest.Mock).mockImplementation(
      async (unit, weight, updates) => {
        const updated = JSON.parse(JSON.stringify(defaultMockSettings));
        const plates = unit === 'kg' ? updated.platesKg : updated.platesLb;
        const idx = plates.findIndex((p: any) => p.weight === weight);
        if (idx !== -1) {
          plates[idx] = { ...plates[idx], ...updates };
        }
        return updated;
      }
    );
    (PlateSettingsService.resetToDefaults as jest.Mock).mockResolvedValue(
      JSON.parse(JSON.stringify(defaultMockSettings))
    );
  });

  it('initializes and loads settings correctly for preset bar', async () => {
    const { result } = await renderHook(() => usePlateSettingsController('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settings).toBeDefined();
    expect(result.current.settings?.unit).toBe('kg');
    expect(result.current.isCustomBar).toBe(false);
    expect(result.current.customBarText).toBe('20');
    expect(result.current.currentUnit).toBe('kg');
    expect(result.current.barPresets.length).toBe(3);
    expect(result.current.currentPlates.length).toBe(5);
    expect(result.current.previewCalculation).not.toBeNull();
  });

  it('detects custom bar weight on load if not matching presets', async () => {
    (PlateSettingsService.getSettings as jest.Mock).mockResolvedValueOnce({
      ...defaultMockSettings,
      defaultBarWeight: 17.5,
    });

    const { result } = await renderHook(() => usePlateSettingsController('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isCustomBar).toBe(true);
    expect(result.current.customBarText).toBe('17.5');
  });

  it('changes unit and updates settings with haptic feedback', async () => {
    const { result } = await renderHook(() => usePlateSettingsController('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleUnitChange('lb');
    });

    expect(PlateSettingsService.updateUnit).toHaveBeenCalledWith('lb', 'user-1');
    expect(HapticService.selection).toHaveBeenCalled();
    expect(result.current.currentUnit).toBe('lb');

    // No-op if unit is the same
    await act(async () => {
      await result.current.handleUnitChange('lb');
    });
    expect(PlateSettingsService.updateUnit).toHaveBeenCalledTimes(1);
  });

  it('selects a bar preset and resets custom bar state', async () => {
    const { result } = await renderHook(() => usePlateSettingsController('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      result.current.setIsCustomBar(true);
    });

    await waitFor(() => {
      expect(result.current.isCustomBar).toBe(true);
    });

    await act(async () => {
      await result.current.handleBarPresetSelect(15);
    });

    expect(PlateSettingsService.updateBarWeight).toHaveBeenCalledWith(15, 'kg', 'user-1');
    expect(HapticService.light).toHaveBeenCalled();
    expect(result.current.isCustomBar).toBe(false);
    expect(result.current.customBarText).toBe('15');
  });

  it('handles custom bar input changes', async () => {
    const { result } = await renderHook(() => usePlateSettingsController('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      result.current.handleCustomBarChange('18.5');
    });

    expect(result.current.customBarText).toBe('18.5');
    expect(PlateSettingsService.saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultBarWeight: 18.5,
        customBarWeightKg: 18.5,
      }),
      'user-1'
    );

    // Invalid input should only change text without saving
    await act(async () => {
      result.current.handleCustomBarChange('abc');
    });
    expect(result.current.customBarText).toBe('abc');
  });

  it('toggles plate activation (switch)', async () => {
    const { result } = await renderHook(() => usePlateSettingsController('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Disable 25 kg plate -> availablePairs: 0
    await act(async () => {
      await result.current.handleTogglePlate(25, false);
    });

    expect(PlateSettingsService.updatePlateItem).toHaveBeenCalledWith(
      'kg',
      25,
      { availablePairs: 0 },
      'user-1'
    );
    expect(HapticService.selection).toHaveBeenCalled();

    // Re-enable 25 kg plate -> availablePairs: undefined
    await act(async () => {
      await result.current.handleTogglePlate(25, true);
    });

    expect(PlateSettingsService.updatePlateItem).toHaveBeenCalledWith(
      'kg',
      25,
      { availablePairs: undefined },
      'user-1'
    );
  });

  it('adjusts plate pair count (decrement from unlimited, decrement to 0, increment beyond 20)', async () => {
    const { result } = await renderHook(() => usePlateSettingsController('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const unlimitedPlate = { weight: 20, availablePairs: undefined };
    // Decrement from unlimited -> 4 pairs
    await act(async () => {
      await result.current.handleAdjustPairs(unlimitedPlate, -1);
    });
    expect(PlateSettingsService.updatePlateItem).toHaveBeenCalledWith(
      'kg',
      20,
      { availablePairs: 4 },
      'user-1'
    );
    expect(HapticService.light).toHaveBeenCalled();

    // Decrement from 1 -> 0 (disabled)
    const singlePairPlate = { weight: 15, availablePairs: 1 };
    await act(async () => {
      await result.current.handleAdjustPairs(singlePairPlate, -1);
    });
    expect(PlateSettingsService.updatePlateItem).toHaveBeenCalledWith(
      'kg',
      15,
      { availablePairs: 0 },
      'user-1'
    );

    // Increment beyond 20 -> unlimited (undefined)
    const maxPairPlate = { weight: 10, availablePairs: 20 };
    await act(async () => {
      await result.current.handleAdjustPairs(maxPairPlate, 1);
    });
    expect(PlateSettingsService.updatePlateItem).toHaveBeenCalledWith(
      'kg',
      10,
      { availablePairs: undefined },
      'user-1'
    );

    // Normal increment: 5 -> 6
    const normalPlate = { weight: 5, availablePairs: 5 };
    await act(async () => {
      await result.current.handleAdjustPairs(normalPlate, 1);
    });
    expect(PlateSettingsService.updatePlateItem).toHaveBeenCalledWith(
      'kg',
      5,
      { availablePairs: 6 },
      'user-1'
    );
  });

  it('sets unlimited pairs via handleSetUnlimited', async () => {
    const { result } = await renderHook(() => usePlateSettingsController('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleSetUnlimited(20);
    });

    expect(PlateSettingsService.updatePlateItem).toHaveBeenCalledWith(
      'kg',
      20,
      { availablePairs: undefined },
      'user-1'
    );
    expect(HapticService.light).toHaveBeenCalled();
  });

  it('resets to defaults via resetToDefaults', async () => {
    const { result } = await renderHook(() => usePlateSettingsController('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.resetToDefaults();
    });

    expect(PlateSettingsService.resetToDefaults).toHaveBeenCalledWith('user-1');
    expect(HapticService.medium).toHaveBeenCalled();
    expect(result.current.isCustomBar).toBe(false);
  });

  it('triggers confirmation alert on handleResetDefaults and executes on confirm', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { result } = await renderHook(() => usePlateSettingsController('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      result.current.handleResetDefaults();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Restablecer Ajustes',
      expect.any(String),
      expect.any(Array)
    );

    const buttons = alertSpy.mock.calls[0][2];
    const confirmButton = buttons?.find((b) => b.style === 'destructive');
    expect(confirmButton).toBeDefined();

    await act(async () => {
      if (confirmButton?.onPress) {
        await confirmButton.onPress();
      }
    });

    expect(PlateSettingsService.resetToDefaults).toHaveBeenCalledWith('user-1');
  });

  it('handles explicit save with success state and error handling', async () => {
    const { result, unmount } = await renderHook(() => usePlateSettingsController('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(PlateSettingsService.saveSettings).toHaveBeenCalledWith(expect.any(Object), 'user-1');
    expect(HapticService.light).toHaveBeenCalled();
    expect(result.current.savedSuccess).toBe(true);

    // Save failure
    const alertSpy = jest.spyOn(Alert, 'alert');
    (PlateSettingsService.saveSettings as jest.Mock).mockRejectedValueOnce(
      new Error('Save failed')
    );

    await act(async () => {
      await result.current.handleSave();
    });

    expect(alertSpy).toHaveBeenCalledWith('Error', 'No se pudieron guardar los ajustes.');
    expect(result.current.saving).toBe(false);
    unmount();
  });
});
