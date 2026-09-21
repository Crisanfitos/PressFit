import React from 'react';
import { render } from '@testing-library/react-native';
import { PresetMetricHighlightBar } from '../../src/components/routine/PresetMetricHighlightBar';

const mockColors = {
    background: '#09090B',
    surface: '#18181B',
    primary: '#10B981',
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    border: '#27272A',
    textOnPrimary: '#000000',
} as any;

describe('PresetMetricHighlightBar Component', () => {
    it('renders the 4 metric bento cards correctly', async () => {
        const { getByText } = await render(
            <PresetMetricHighlightBar totalPresets={16} colors={mockColors} />
        );

        expect(getByText('PROGRAMAS')).toBeTruthy();
        expect(getByText('16')).toBeTruthy();
        expect(getByText('Activas')).toBeTruthy();
        expect(getByText('COMUNIDAD')).toBeTruthy();
        expect(getByText('12.4k')).toBeTruthy();
        expect(getByText('atletas')).toBeTruthy();
        expect(getByText('TIEMPO MEDIO')).toBeTruthy();
        expect(getByText('52')).toBeTruthy();
        expect(getByText('min')).toBeTruthy();
        expect(getByText('VERIFICACIÓN')).toBeTruthy();
        expect(getByText('PressFit Lab')).toBeTruthy();
    });
});
