import React from 'react';
import { render, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';
import { Alert } from 'react-native';
import PlateSettingsScreen from '../../src/screens/PlateSettingsScreen';
import { PlateSettingsService } from '../../src/services/PlateSettingsService';

jest.mock('../../src/services/HapticService', () => ({
  HapticService: {
    selection: jest.fn(),
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
  },
}));

describe('PlateSettingsScreen Component Tests (PF-320)', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await PlateSettingsService.resetToDefaults();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders correctly with default settings (20 kg bar and kg unit)', async () => {
    const { getByTestId, getByText } = await render(
      <PlateSettingsScreen navigation={mockNavigation as any} />
    );

    await waitFor(() => {
      expect(getByTestId('plate-settings-screen')).toBeTruthy();
    });

    expect(getByText('Discos y Barras')).toBeTruthy();
    expect(getByTestId('unit-selector-kg')).toBeTruthy();
    expect(getByTestId('unit-selector-lb')).toBeTruthy();
    expect(getByTestId('bar-preset-20')).toBeTruthy();
    expect(getByTestId('bar-preset-15')).toBeTruthy();
    expect(getByTestId('bar-preset-10')).toBeTruthy();
    expect(getByTestId('plate-switch-25')).toBeTruthy();
    expect(getByTestId('plate-switch-20')).toBeTruthy();
  });

  it('navigates back when header back button is pressed', async () => {
    const { getByTestId } = await render(
      <PlateSettingsScreen navigation={mockNavigation as any} />
    );

    await waitFor(() => {
      expect(getByTestId('back-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('back-button'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('switches unit to lb and updates presets', async () => {
    const { getByTestId } = await render(
      <PlateSettingsScreen navigation={mockNavigation as any} />
    );

    await waitFor(() => {
      expect(getByTestId('unit-selector-lb')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('unit-selector-lb'));
    });

    await waitFor(() => {
      expect(getByTestId('bar-preset-45')).toBeTruthy();
      expect(getByTestId('plate-switch-45')).toBeTruthy();
    });

    const settings = await PlateSettingsService.getSettings();
    expect(settings.unit).toBe('lb');
  });

  it('selects a different bar preset (15 kg)', async () => {
    const { getByTestId } = await render(
      <PlateSettingsScreen navigation={mockNavigation as any} />
    );

    await waitFor(() => {
      expect(getByTestId('bar-preset-15')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('bar-preset-15'));
    });

    const settings = await PlateSettingsService.getSettings();
    expect(settings.defaultBarWeight).toBe(15);
  });

  it('allows entering a custom bar weight', async () => {
    const { getByTestId } = await render(
      <PlateSettingsScreen navigation={mockNavigation as any} />
    );

    await waitFor(() => {
      expect(getByTestId('bar-preset-custom')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('bar-preset-custom'));
    });

    await waitFor(() => {
      expect(getByTestId('custom-bar-input')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('custom-bar-input'), '12.5');
    });

    const settings = await PlateSettingsService.getSettings();
    expect(settings.defaultBarWeight).toBe(12.5);
  });

  it('toggles plate activation via switch', async () => {
    const { getByTestId } = await render(
      <PlateSettingsScreen navigation={mockNavigation as any} />
    );

    await waitFor(() => {
      expect(getByTestId('plate-switch-25')).toBeTruthy();
    });

    // Desactivar disco de 25 kg
    await act(async () => {
      fireEvent(getByTestId('plate-switch-25'), 'valueChange', false);
    });

    let settings = await PlateSettingsService.getSettings();
    const plate25 = settings.platesKg.find(p => p.weight === 25);
    expect(plate25?.availablePairs).toBe(0);

    // Reactivar disco de 25 kg
    await act(async () => {
      fireEvent(getByTestId('plate-switch-25'), 'valueChange', true);
    });

    settings = await PlateSettingsService.getSettings();
    const reactivatedPlate25 = settings.platesKg.find(p => p.weight === 25);
    expect(reactivatedPlate25?.availablePairs).toBeUndefined(); // vuelve a ilimitado
  });

  it('adjusts plate pair count with steppers and sets unlimited', async () => {
    const { getByTestId } = await render(
      <PlateSettingsScreen navigation={mockNavigation as any} />
    );

    await waitFor(() => {
      expect(getByTestId('plate-pair-decrement-20')).toBeTruthy();
    });

    // Decrementar desde ilimitado -> pasa a 4 pares
    await act(async () => {
      fireEvent.press(getByTestId('plate-pair-decrement-20'));
    });

    let settings = await PlateSettingsService.getSettings();
    let plate20 = settings.platesKg.find(p => p.weight === 20);
    expect(plate20?.availablePairs).toBe(4);

    // Incrementar 4 -> 5 pares
    await act(async () => {
      fireEvent.press(getByTestId('plate-pair-increment-20'));
    });

    settings = await PlateSettingsService.getSettings();
    plate20 = settings.platesKg.find(p => p.weight === 20);
    expect(plate20?.availablePairs).toBe(5);

    // Presionar botón de ilimitado (∞)
    await act(async () => {
      fireEvent.press(getByTestId('plate-unlimited-button-20'));
    });

    settings = await PlateSettingsService.getSettings();
    plate20 = settings.platesKg.find(p => p.weight === 20);
    expect(plate20?.availablePairs).toBeUndefined();
  });

  it('prompts confirmation and resets settings to default on reset button press', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');

    const { getByTestId } = await render(
      <PlateSettingsScreen navigation={mockNavigation as any} />
    );

    await waitFor(() => {
      expect(getByTestId('reset-defaults-button')).toBeTruthy();
    });

    // First modify something
    await act(async () => {
      fireEvent.press(getByTestId('bar-preset-10'));
    });

    fireEvent.press(getByTestId('reset-defaults-button'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Restablecer Ajustes',
      expect.any(String),
      expect.any(Array)
    );

    // Trigger confirm action in Alert buttons
    const buttons = alertSpy.mock.calls[0][2];
    const confirmBtn = buttons?.find(b => b.style === 'destructive');
    expect(confirmBtn).toBeDefined();

    await act(async () => {
      if (confirmBtn?.onPress) {
        await confirmBtn.onPress();
      }
    });

    const settings = await PlateSettingsService.getSettings();
    expect(settings.defaultBarWeight).toBe(20);
    alertSpy.mockRestore();
  });

  it('explicitly saves settings when clicking save button', async () => {
    const saveSpy = jest.spyOn(PlateSettingsService, 'saveSettings');

    const { getByTestId } = await render(
      <PlateSettingsScreen navigation={mockNavigation as any} />
    );

    await waitFor(() => {
      expect(getByTestId('save-settings-button')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('save-settings-button'));
    });

    expect(saveSpy).toHaveBeenCalled();
    saveSpy.mockRestore();
  });
});
