import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PresetHeroCard } from '../../src/components/routine/PresetHeroCard';
import { PresetRoutine } from '../../src/types/models';

const mockColors = {
    background: '#09090B',
    surface: '#18181B',
    primary: '#10B981',
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    border: '#27272A',
    textOnPrimary: '#000000',
} as any;

const mockPreset: PresetRoutine = {
    id: 'preset-ppl-6d',
    nombre: 'Push / Pull / Legs (PPL) 6 Días',
    descripcion: 'Diseño optimizado para máxima congestión y sobrecarga progresiva.',
    categoria: 'Hipertrofia',
    dias_por_semana: 6,
    nivel: 'Intermedio',
    rutinas_diarias: [
        {
            nombre_dia: 'Empuje A',
            orden: 1,
            ejercicios: [
                {
                    nombre_ejercicio: 'Press Banca',
                    grupo_muscular_principal: 'Pecho',
                    orden_ejecucion: 1,
                    tipo_peso: 'total',
                    series: [{ numero_serie: 1, repeticiones_objetivo: 8 }],
                },
            ],
        },
        {
            nombre_dia: 'Tirón A',
            orden: 2,
            ejercicios: [],
        },
    ],
};

describe('PresetHeroCard Component', () => {
    it('renders hero title, badges, and breakdown days', async () => {
        const { getByText, getByTestId } = await render(
            <PresetHeroCard
                preset={mockPreset}
                onPressSelect={jest.fn()}
                onPressUse={jest.fn()}
                colors={mockColors}
            />
        );

        expect(getByText('Push / Pull / Legs (PPL) 6 Días')).toBeTruthy();
        expect(getByText('MÁS POPULAR')).toBeTruthy();
        expect(getByText('Intermedio')).toBeTruthy();
        expect(getByText('Empuje A')).toBeTruthy();
        expect(getByText('Tirón A')).toBeTruthy();
        expect(getByTestId('preset-hero-import-button')).toBeTruthy();
        expect(getByTestId('preset-hero-preview-button')).toBeTruthy();
    });

    it('triggers onPressUse when Usar Programa is pressed', async () => {
        const onUseMock = jest.fn();
        const { getByTestId } = await render(
            <PresetHeroCard
                preset={mockPreset}
                onPressSelect={jest.fn()}
                onPressUse={onUseMock}
                colors={mockColors}
            />
        );

        fireEvent.press(getByTestId('preset-hero-import-button'));
        expect(onUseMock).toHaveBeenCalledWith(mockPreset);
    });

    it('triggers onPressSelect when Ver Detalle is pressed', async () => {
        const onSelectMock = jest.fn();
        const { getByTestId } = await render(
            <PresetHeroCard
                preset={mockPreset}
                onPressSelect={onSelectMock}
                onPressUse={jest.fn()}
                colors={mockColors}
            />
        );

        fireEvent.press(getByTestId('preset-hero-preview-button'));
        expect(onSelectMock).toHaveBeenCalledWith(mockPreset);
    });
});
