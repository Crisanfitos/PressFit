import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PresetRoutineCard } from '../../src/components/PresetRoutineCard';
import { PresetRoutine } from '../../src/types/models';

const mockPreset: PresetRoutine = {
    id: 'preset-ppl-6d',
    nombre: 'Push / Pull / Legs (PPL) 6 Días',
    descripcion: 'Programa de alta frecuencia',
    categoria: 'Hipertrofia',
    dias_por_semana: 6,
    nivel: 'Intermedio',
    rutinas_diarias: [
        {
            nombre_dia: 'Empuje A',
            orden: 1,
            ejercicios: [
                {
                    nombre_ejercicio: 'Press de Banca',
                    grupo_muscular_principal: 'Pecho',
                    orden_ejecucion: 1,
                    tipo_peso: 'total',
                    series: [{ numero_serie: 1, repeticiones_objetivo: 8 }],
                },
            ],
        },
    ],
};

describe('PresetRoutineCard Component (RNTL)', () => {
    test('renders preset routine title, category badge, and days info correctly', async () => {
        const { getByText, getByTestId } = await render(
            <PresetRoutineCard preset={mockPreset} onPressSelect={jest.fn()} />
        );

        expect(getByText('Push / Pull / Legs (PPL) 6 Días')).toBeTruthy();
        expect(getByText('Hipertrofia')).toBeTruthy();
        expect(getByText('6 días/sem')).toBeTruthy();
        expect(getByText('Intermedio')).toBeTruthy();

        expect(getByTestId('preset-card-preset-ppl-6d')).toBeTruthy();
    });

    test('calls onPressSelect when card is pressed', async () => {
        const onPressMock = jest.fn();
        const { getByTestId } = await render(
            <PresetRoutineCard preset={mockPreset} onPressSelect={onPressMock} />
        );

        fireEvent.press(getByTestId('preset-card-preset-ppl-6d'));
        expect(onPressMock).toHaveBeenCalledWith(mockPreset);
    });
});

