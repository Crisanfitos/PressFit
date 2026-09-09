import React from 'react';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PlateCalculatorModal from '../../src/components/workout/PlateCalculatorModal';
import { PlateSettingsService } from '../../src/services/PlateSettingsService';

jest.mock('../../src/services/HapticService', () => ({
  HapticService: {
    selection: jest.fn(),
    impact: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock('../../src/services/PlateSettingsService', () => {
  const defaultPlatesKg = [
    { weight: 25, availablePairs: undefined },
    { weight: 20, availablePairs: undefined },
    { weight: 15, availablePairs: undefined },
    { weight: 10, availablePairs: undefined },
    { weight: 5, availablePairs: undefined },
    { weight: 2.5, availablePairs: undefined },
    { weight: 1.25, availablePairs: undefined },
  ];
  const defaultPlatesLb = [
    { weight: 45, availablePairs: undefined },
    { weight: 35, availablePairs: undefined },
    { weight: 25, availablePairs: undefined },
    { weight: 10, availablePairs: undefined },
    { weight: 5, availablePairs: undefined },
    { weight: 2.5, availablePairs: undefined },
  ];

  return {
    PlateSettingsService: {
      getSettings: jest.fn().mockImplementation((userId?: string) => Promise.resolve({
        unit: 'kg',
        defaultBarWeight: 20,
        customBarWeightKg: 20,
        customBarWeightLb: 45,
        platesKg: defaultPlatesKg,
        platesLb: defaultPlatesLb,
      })),
      _clearMemoryCache: jest.fn(),
    },
  };
});

describe('PlateCalculatorModal Component (RNTL)', () => {
  const mockColors: any = {
    background: '#121212',
    surface: '#1E1E1E',
    surfaceHighlight: '#2A2A2A',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    primary: '#3B82F6',
    border: '#333333',
  };

  const mockOnClose = jest.fn();
  const mockOnApplyWeight = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    PlateSettingsService._clearMemoryCache();
    await AsyncStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders modal content correctly when visible is true', async () => {
    const { getByTestId, getByText, toJSON } = await render(
      <PlateCalculatorModal
        visible={true}
        onClose={mockOnClose}
        initialWeight={100}
        unit="kg"
        colors={mockColors}
        onApplyWeight={mockOnApplyWeight}
      />
    );

    expect(getByTestId('plate-calculator-modal')).toBeTruthy();
    expect(getByText('Calculadora de Discos')).toBeTruthy();
    expect(getByTestId('plate-calc-target-input')).toBeTruthy();
    expect(getByTestId('plate-visualizer')).toBeTruthy();
    expect(getByTestId('plate-summary-text')).toBeTruthy();
    expect(getByText('Por lado: 1x25kg, 1x15kg')).toBeTruthy();
  });

  it('adjusts target weight using stepper buttons', async () => {
    const { getByTestId, getByText, findByText } = await render(
      <PlateCalculatorModal
        visible={true}
        onClose={mockOnClose}
        initialWeight={60}
        unit="kg"
        colors={mockColors}
      />
    );

    // Initial 60kg: bar 20kg + 40kg (20kg per side -> 1x20kg)
    expect(getByText('Por lado: 1x20kg')).toBeTruthy();

    // Tap +5kg -> 65kg: 22.5kg per side -> 1x20kg, 1x2.5kg
    fireEvent.press(getByTestId('plate-calc-plus-5'));
    expect(await findByText('Por lado: 1x20kg, 1x2.5kg')).toBeTruthy();

    // Tap -2.5kg -> 62.5kg: 21.25kg per side -> 1x20kg, 1x1.25kg
    fireEvent.press(getByTestId('plate-calc-minus-2-5'));
    expect(await findByText('Por lado: 1x20kg, 1x1.25kg')).toBeTruthy();
  });

  it('switches bar weight preset and recalculates', async () => {
    const { getByTestId, getByText, findByText } = await render(
      <PlateCalculatorModal
        visible={true}
        onClose={mockOnClose}
        initialWeight={70}
        unit="kg"
        colors={mockColors}
      />
    );

    // With 20kg bar: 50kg plates -> 25kg per side (1x25kg)
    expect(getByText('Por lado: 1x25kg')).toBeTruthy();

    // Switch to 15kg bar: 55kg plates -> 27.5kg per side (1x25kg, 1x2.5kg)
    fireEvent.press(getByTestId('bar-preset-15'));
    expect(await findByText('Por lado: 1x25kg, 1x2.5kg')).toBeTruthy();
  });

  it('shows warning when target weight is below bar weight', async () => {
    const { getByTestId, getByText } = await render(
      <PlateCalculatorModal
        visible={true}
        onClose={mockOnClose}
        initialWeight={15}
        unit="kg"
        colors={mockColors}
      />
    );

    expect(getByTestId('plate-calc-warning')).toBeTruthy();
    expect(getByText(/menor que la barra/i)).toBeTruthy();
  });

  it('calls onApplyWeight and onClose when apply button is pressed', async () => {
    const { getByTestId } = await render(
      <PlateCalculatorModal
        visible={true}
        onClose={mockOnClose}
        initialWeight={80}
        unit="kg"
        colors={mockColors}
        onApplyWeight={mockOnApplyWeight}
      />
    );

    const applyBtn = getByTestId('apply-plate-calc-btn');
    fireEvent.press(applyBtn);

    expect(mockOnApplyWeight).toHaveBeenCalledWith(80);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when close icon button is pressed', async () => {
    const { getByTestId } = await render(
      <PlateCalculatorModal
        visible={true}
        onClose={mockOnClose}
        initialWeight={80}
        unit="kg"
        colors={mockColors}
      />
    );

    fireEvent.press(getByTestId('close-plate-calculator-btn'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel footer button is pressed', async () => {
    const { getByTestId } = await render(
      <PlateCalculatorModal
        visible={true}
        onClose={mockOnClose}
        initialWeight={80}
        unit="kg"
        colors={mockColors}
      />
    );

    fireEvent.press(getByTestId('cancel-plate-calc-btn'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('supports lb unit properly with default 45lb bar and lb bar presets', async () => {
    const { getByTestId, getByText } = await render(
      <PlateCalculatorModal
        visible={true}
        onClose={mockOnClose}
        initialWeight={135}
        unit="lb"
        colors={mockColors}
      />
    );

    expect(getByTestId('bar-preset-45')).toBeTruthy();
    expect(getByTestId('bar-preset-35')).toBeTruthy();
    expect(getByTestId('bar-preset-25')).toBeTruthy();
    expect(getByText('Por lado: 1x45lb')).toBeTruthy();
  });

  it('respects gym restrictions by excluding disabled plates (availablePairs: 0)', async () => {
    // 70kg target with 20kg bar requires 25kg per side.
    // By default it would use 1x25kg.
    // If 25kg plates are disabled in the user's gym, it should use 1x20kg, 1x5kg instead.
    const customPlates = [
      { weight: 25, availablePairs: 0 },
      { weight: 20, availablePairs: undefined },
      { weight: 15, availablePairs: undefined },
      { weight: 10, availablePairs: undefined },
      { weight: 5, availablePairs: undefined },
      { weight: 2.5, availablePairs: undefined },
      { weight: 1.25, availablePairs: undefined },
    ];

    const { getByTestId, queryByText } = await render(
      <PlateCalculatorModal
        visible={true}
        onClose={mockOnClose}
        initialWeight={70}
        unit="kg"
        colors={mockColors}
        customPlates={customPlates}
      />
    );

    expect(getByTestId('plate-summary-text').props.children).toBe('Por lado: 1x20kg, 1x5kg');
    expect(queryByText('Por lado: 1x25kg')).toBeNull();
  });

  it('renders native Modal without throwing when visible is false', async () => {
    const { queryByTestId } = await render(
      <PlateCalculatorModal
        visible={false}
        onClose={mockOnClose}
        initialWeight={60}
        unit="kg"
        colors={mockColors}
      />
    );

    expect(queryByTestId('plate-calculator-modal')).toBeNull();
  });
});
