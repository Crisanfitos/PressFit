import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PresetRoutineDetailModal } from '../../src/components/PresetRoutineDetailModal';
import { PresetRoutine } from '../../src/types/models';

const mockPreset: PresetRoutine = {
    id: 'preset-ppl-3d',
    nombre: 'Push / Pull / Legs 3 Días',
    descripcion: 'Versión condensada de 3 días',
    categoria: 'Hipertrofia',
    dias_por_semana: 3,
    nivel: 'Principiante',
    rutinas_diarias: [
        {
            nombre_dia: 'Día 1: Empuje',
            orden: 1,
            descripcion: 'Pecho, hombro y tríceps',
            ejercicios: [
                {
                    nombre_ejercicio: 'Press Militar con Barra',
                    grupo_muscular_principal: 'Hombros',
                    orden_ejecucion: 1,
                    tipo_peso: 'total',
                    series: [{ numero_serie: 1, repeticiones_objetivo: 10 }],
                },
            ],
        },
    ],
};

describe('PresetRoutineDetailModal Component (RNTL)', () => {
    test('renders null when preset is null', async () => {
        const { queryByText } = await render(
            <PresetRoutineDetailModal
                visible={true}
                preset={null}
                onClose={jest.fn()}
                onConfirmUse={jest.fn()}
            />
        );
        expect(queryByText('Push / Pull / Legs 3 Días')).toBeNull();
    });

    test('renders routine breakdown and exercises when visible', async () => {
        const { getByText, getByTestId } = await render(
            <PresetRoutineDetailModal
                visible={true}
                preset={mockPreset}
                onClose={jest.fn()}
                onConfirmUse={jest.fn()}
            />
        );

        expect(getByText('Push / Pull / Legs 3 Días')).toBeTruthy();
        expect(getByText('Día 1: Empuje')).toBeTruthy();
        expect(getByText('Press Militar con Barra')).toBeTruthy();
        expect(getByTestId('confirm-import-button')).toBeTruthy();
    });

    test('triggers onClose when close button is pressed', async () => {
        const onCloseMock = jest.fn();
        const { getByTestId } = await render(
            <PresetRoutineDetailModal
                visible={true}
                preset={mockPreset}
                onClose={onCloseMock}
                onConfirmUse={jest.fn()}
            />
        );

        fireEvent.press(getByTestId('modal-close-button'));
        expect(onCloseMock).toHaveBeenCalled();
    });

    test('triggers onConfirmUse when confirm CTA is pressed', async () => {
        const onConfirmMock = jest.fn();
        const { getByTestId } = await render(
            <PresetRoutineDetailModal
                visible={true}
                preset={mockPreset}
                onClose={jest.fn()}
                onConfirmUse={onConfirmMock}
            />
        );

        fireEvent.press(getByTestId('confirm-import-button'));
        expect(onConfirmMock).toHaveBeenCalledWith(mockPreset);
    });
});

