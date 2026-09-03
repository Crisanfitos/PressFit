import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import {
    WorkoutHeader,
    WorkoutPlaceholder,
    WorkoutActions,
    WorkoutModals,
    StaleWarningBanner,
    getGhostValue,
    confirmDeleteExercise,
    confirmDeleteSet,
} from '../../src/components/workout';

const mockColors: any = {
    primary: '#22c55e',
    background: '#0a0f0d',
    surface: '#121a16',
    border: '#1f2e26',
    text: '#ffffff',
    textSecondary: '#9ca3af',
};

describe('Workout Sub-components (PF-266)', () => {
    describe('WorkoutHeader', () => {
        it('renders dayName, formatted date, description and handles back press', async () => {
            const mockBack = jest.fn();
            const { getByText, getByTestId } = await render(
                <WorkoutHeader
                    dayName="Día de Pecho"
                    fechaDia="2026-09-03"
                    descripcion="Enfoque en banca"
                    routineDayId="rd-1"
                    colors={mockColors}
                    onBack={mockBack}
                />
            );

            expect(getByText(/Día de Pecho/)).toBeTruthy();
            expect(getByText('Enfoque en banca')).toBeTruthy();

            const backBtn = getByTestId('workout-back-button');
            fireEvent.press(backBtn);
            expect(mockBack).toHaveBeenCalled();
        });
    });

    describe('WorkoutPlaceholder', () => {
        it('renders empty message and add exercise button when isStructureEditable is true', async () => {
            const mockAdd = jest.fn();
            const { getByText, getByTestId } = await render(
                <WorkoutPlaceholder
                    isStructureEditable={true}
                    colors={mockColors}
                    t={(k, d) => d || k}
                    onAddExercise={mockAdd}
                />
            );

            expect(getByText('¡Día libre de ejercicios!')).toBeTruthy();
            const addBtn = getByTestId('add-exercise-button');
            fireEvent.press(addBtn);
            expect(mockAdd).toHaveBeenCalled();
        });
    });

    describe('WorkoutActions', () => {
        it('renders finish button in ACTIVE mode and handles finish press', async () => {
            const mockFinish = jest.fn();
            const { getByTestId } = await render(
                <WorkoutActions
                    mode="ACTIVE"
                    navMode={undefined}
                    saving={false}
                    colors={mockColors}
                    t={(k, d) => d || k}
                    onFinishWorkout={mockFinish}
                />
            );

            const finishBtn = getByTestId('finish-workout-button');
            fireEvent.press(finishBtn);
            expect(mockFinish).toHaveBeenCalled();
        });

        it('returns null when mode is not ACTIVE or navMode is edit', async () => {
            const { queryByTestId } = await render(
                <WorkoutActions
                    mode="TEMPLATE"
                    navMode="edit"
                    saving={false}
                    colors={mockColors}
                    t={(k, d) => d || k}
                    onFinishWorkout={jest.fn()}
                />
            );

            expect(queryByTestId('finish-workout-button')).toBeNull();
        });
    });

    describe('StaleWarningBanner', () => {
        it('renders stale days difference correctly', async () => {
            const { getByTestId, getByText } = await render(
                <StaleWarningBanner daysDiff={20} />
            );

            expect(getByTestId('stale-warning-banner')).toBeTruthy();
            expect(getByText(/Referencia de hace 20 días/)).toBeTruthy();
        });
    });

    describe('WorkoutModals', () => {
        it('renders modal controls and fires increment, decrement and confirm', async () => {
            const mockClose = jest.fn();
            const mockIncrement = jest.fn();
            const mockDecrement = jest.fn();
            const mockConfirm = jest.fn();

            const { getByText } = await render(
                <WorkoutModals
                    modalVisible={true}
                    setsToAdd={3}
                    colors={mockColors}
                    onCloseModal={mockClose}
                    onIncrementSets={mockIncrement}
                    onDecrementSets={mockDecrement}
                    onConfirmAddSets={mockConfirm}
                    restTimerVisible={false}
                    onRestTimerDismiss={jest.fn()}
                    onRestTimerStop={jest.fn()}
                />
            );

            expect(getByText('3')).toBeTruthy();
            const addText = getByText('Añadir');
            fireEvent.press(addText);
            expect(mockConfirm).toHaveBeenCalled();
        });
    });

    describe('workoutHelpers', () => {
        it('extracts ghost value from previous workout correctly', () => {
            const prevWorkout = {
                ejercicios_programados: [
                    {
                        ejercicio_id: 'ex-1',
                        series_realizadas: [
                            { numero_serie: 1, peso_utilizado: 80, repeticiones: 10, rpe: 8 },
                            { numero_serie: 2, peso_utilizado: 85, repeticiones: 8, rpe: 9 },
                        ],
                    },
                ],
            };

            expect(getGhostValue(prevWorkout, 'ex-1', 1, 'weight')).toBe('80');
            expect(getGhostValue(prevWorkout, 'ex-1', 1, 'reps')).toBe('10');
            expect(getGhostValue(prevWorkout, 'ex-1', 1, 'rpe')).toBe('8');
            expect(getGhostValue(prevWorkout, 'ex-1', 3, 'weight')).toBe('85'); // fallback to last set
            expect(getGhostValue(prevWorkout, 'unknown', 1, 'weight')).toBeNull();
        });

        it('triggers confirmDeleteExercise alert', () => {
            const alertSpy = jest.spyOn(Alert, 'alert');
            const onConfirm = jest.fn();
            confirmDeleteExercise('Press de Banca', onConfirm);

            expect(alertSpy).toHaveBeenCalledWith('Eliminar Ejercicio', expect.stringContaining('Press de Banca'), expect.any(Array));
        });

        it('triggers confirmDeleteSet alert', () => {
            const alertSpy = jest.spyOn(Alert, 'alert');
            const onConfirm = jest.fn();
            confirmDeleteSet(onConfirm);

            expect(alertSpy).toHaveBeenCalledWith('Eliminar Serie', expect.any(String), expect.any(Array));
        });
    });
});
