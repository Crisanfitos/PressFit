import React from 'react';
import { render, cleanup } from '@testing-library/react-native';
import PlateVisualizer from '../../src/components/workout/PlateVisualizer';
import { PLATE_COLORS_KG, PLATE_COLORS_LB } from '../../src/utils/plateCalculator';

describe('PlateVisualizer Component (RNTL)', () => {
  const mockColors = {
    background: '#121212',
    surface: '#1E1E1E',
    surfaceHighlight: '#2A2A2A',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    primary: '#3B82F6',
    border: '#333333',
  };

  afterEach(() => {
    cleanup();
  });

  it('renders barbell sleeve and collar correctly', async () => {
    const { getByTestId } = await render(
      <PlateVisualizer
        platesPerSide={[]}
        colors={mockColors}
      />
    );

    expect(getByTestId('plate-visualizer')).toBeTruthy();
    expect(getByTestId('plate-sleeve')).toBeTruthy();
    expect(getByTestId('plate-collar')).toBeTruthy();
  });

  it('renders empty sleeve label when there are no plates', async () => {
    const { getByTestId, getByText } = await render(
      <PlateVisualizer
        platesPerSide={[]}
        barWeight={20}
        unit="kg"
        colors={mockColors}
      />
    );

    expect(getByTestId('plate-visualizer-empty')).toBeTruthy();
    expect(getByText('Solo barra (20 kg)')).toBeTruthy();
  });

  it('renders loaded plates with correct testIDs and colors for kg', async () => {
    const plates = [
      { weight: 20, count: 1, color: PLATE_COLORS_KG[20] },
      { weight: 10, count: 1, color: PLATE_COLORS_KG[10] },
      { weight: 2.5, count: 1, color: PLATE_COLORS_KG[2.5] },
    ];

    const { getByTestId, getByText } = await render(
      <PlateVisualizer
        platesPerSide={plates}
        unit="kg"
        barWeight={20}
        colors={mockColors}
      />
    );

    expect(getByTestId('plate-item-20-0')).toBeTruthy();
    expect(getByTestId('plate-item-10-1')).toBeTruthy();
    expect(getByTestId('plate-item-2.5-2')).toBeTruthy();
    expect(getByTestId('plate-outer-clamp')).toBeTruthy();

    expect(getByText('20')).toBeTruthy();
    expect(getByText('10')).toBeTruthy();
  });

  it('renders multiple plates when count > 1 (e.g. 2x20kg)', async () => {
    const plates = [
      { weight: 20, count: 2, color: PLATE_COLORS_KG[20] },
    ];

    const { getByTestId } = await render(
      <PlateVisualizer
        platesPerSide={plates}
        unit="kg"
        colors={mockColors}
      />
    );

    expect(getByTestId('plate-item-20-0')).toBeTruthy();
    expect(getByTestId('plate-item-20-1')).toBeTruthy();
  });

  it('renders fractional and white plates with high contrast border', async () => {
    const plates = [
      { weight: 5, count: 1, color: PLATE_COLORS_KG[5] },
      { weight: 1.25, count: 1, color: PLATE_COLORS_KG[1.25] },
      { weight: 0.5, count: 1, color: PLATE_COLORS_KG[0.5] },
    ];

    const { getByTestId } = await render(
      <PlateVisualizer
        platesPerSide={plates}
        unit="kg"
        colors={mockColors}
      />
    );

    expect(getByTestId('plate-item-5-0')).toBeTruthy();
    expect(getByTestId('plate-item-1.25-1')).toBeTruthy();
    expect(getByTestId('plate-item-0.5-2')).toBeTruthy();
  });

  it('renders lb plates correctly', async () => {
    const plates = [
      { weight: 45, count: 1, color: PLATE_COLORS_LB[45] },
      { weight: 25, count: 1, color: PLATE_COLORS_LB[25] },
    ];

    const { getByTestId, getByText } = await render(
      <PlateVisualizer
        platesPerSide={plates}
        unit="lb"
        barWeight={45}
        colors={mockColors}
      />
    );

    expect(getByTestId('plate-item-45-0')).toBeTruthy();
    expect(getByTestId('plate-item-25-1')).toBeTruthy();
    expect(getByText('45')).toBeTruthy();
    expect(getByText('25')).toBeTruthy();
  });
});
