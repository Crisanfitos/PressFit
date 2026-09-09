import React from 'react';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react-native';
import PlateCalculatorModal from '../../src/components/workout/PlateCalculatorModal';

jest.mock('../../src/services/HapticService', () => ({
  HapticService: {
    selection: jest.fn(),
    impact: jest.fn(),
    warning: jest.fn(),
  },
}));

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders modal content correctly when visible is true', async () => {
    const { getByTestId, getByText } = await render(
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

  it('calls onClose when close icon or cancel button is pressed', async () => {
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

    fireEvent.press(getByTestId('cancel-plate-calc-btn'));
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });

  it('supports lb unit properly with default 45lb bar and lb bar presets', async () => {
    const { findByTestId, findByText } = await render(
      <PlateCalculatorModal
        visible={true}
        onClose={mockOnClose}
        initialWeight={135}
        unit="lb"
        colors={mockColors}
      />
    );

    expect(await findByTestId('bar-preset-45')).toBeTruthy();
    expect(await findByTestId('bar-preset-35')).toBeTruthy();
    expect(await findByTestId('bar-preset-25')).toBeTruthy();
    expect(await findByText('Por lado: 1x45lb')).toBeTruthy();
  });
});
