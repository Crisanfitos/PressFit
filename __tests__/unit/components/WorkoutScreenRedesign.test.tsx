import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WorkoutHeader } from '../../../src/components/workout/WorkoutHeader';
import { ExerciseCard } from '../../../src/components/workout/ExerciseCard';
import WorkoutSetRow from '../../../src/components/WorkoutSetRow';
import { WorkoutActions } from '../../../src/components/workout/WorkoutActions';
import { ThemeProvider } from '../../../src/context/ThemeContext';

describe('WorkoutScreen M3 Redesign (PF-390)', () => {
    const mockColors = {
        background: '#131316',
        surface: '#131316',
        surfaceHighlight: '#1f1f22',
        surfaceContainerLowest: '#0e0e11',
        surfaceContainerLow: '#1b1b1e',
        surfaceContainer: '#1f1f22',
        surfaceContainerHigh: '#2a2a2d',
        surfaceContainerHighest: '#353438',
        text: '#e4e1e6',
        textSecondary: '#bacbb8',
        onSurface: '#e4e1e6',
        onSurfaceVariant: '#bacbb8',
        primary: '#9fffac',
        primaryContainer: '#13ec6d',
        onPrimaryContainer: '#00652a',
        secondaryContainer: '#384b3f',
        outline: '#859583',
        outlineVariant: '#3b4b3c',
        border: '#3b4b3c',
        inputBackground: '#0e0e11',
    };

    describe('WorkoutHeader with Stitch Active Session Specs', () => {
        it('renders elapsed timer formatted as MM:SS and pulse dot', async () => {
            const onBackMock = jest.fn();
            const { getByText, getByTestId } = await render(
                <ThemeProvider>
                    <WorkoutHeader
                        dayName="Empuje: Pecho & Hombros"
                        routineDayId="rd-1"
                        colors={mockColors as any}
                        onBack={onBackMock}
                        timer={1965} // 32 mins, 45 secs -> 32:45
                        mode="ACTIVE"
                    />
                </ThemeProvider>
            );

            expect(getByText('Empuje: Pecho & Hombros')).toBeTruthy();
            expect(getByText('32:45')).toBeTruthy();
            expect(getByTestId('workout-active-pulse-dot')).toBeTruthy();
            expect(getByTestId('workout-back-button')).toBeTruthy();
        });

        it('renders prominent header finish button when mode is ACTIVE and triggers onFinish', async () => {
            const onFinishMock = jest.fn();
            const { getByTestId, getByText } = await render(
                <ThemeProvider>
                    <WorkoutHeader
                        dayName="Empuje"
                        routineDayId="rd-1"
                        colors={mockColors as any}
                        onBack={jest.fn()}
                        mode="ACTIVE"
                        onFinish={onFinishMock}
                    />
                </ThemeProvider>
            );

            const finishBtn = getByTestId('header-finish-button');
            expect(finishBtn).toBeTruthy();
            expect(getByText('Terminar')).toBeTruthy();

            fireEvent.press(finishBtn);
            expect(onFinishMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('ExerciseCard with Stitch Table Columns & Index Badge', () => {
        const mockExercise = {
            id: 'ex-1',
            titulo: 'Press de Banca Plano',
            tipo_peso: 'total' as const,
            routine_exercise_id: 're-1',
            sets: [
                { id: 's1', numero_serie: 1, peso_utilizado: 80, repeticiones: 10, rpe: 8 },
            ],
        };

        it('renders exercise index badge and column headers', async () => {
            const { getByText, getAllByText, getByTestId } = await render(
                <ThemeProvider>
                    <ExerciseCard
                        exercise={mockExercise}
                        index={0}
                        isCollapsed={false}
                        isInputEditable={true}
                        isStructureEditable={true}
                        mode="ACTIVE"
                        colors={mockColors as any}
                        previousWorkout={null}
                        lastCompletedSetId={null}
                        restTimerVisible={false}
                        savedTimerSetIds={new Set()}
                        onToggleCollapse={jest.fn()}
                        onUpdateWeightType={jest.fn()}
                        onNavigateDetail={jest.fn()}
                        onDeleteExercise={jest.fn()}
                        onSetChange={jest.fn()}
                        onDeleteSet={jest.fn()}
                        onStartRestTimer={jest.fn()}
                        onAddSet={jest.fn()}
                        getGhostValue={() => null}
                    />
                </ThemeProvider>
            );

            // Index badge "1" and set number "1"
            expect(getAllByText('1').length).toBeGreaterThanOrEqual(2);
            expect(getByText('Press de Banca Plano')).toBeTruthy();

            // Table column headers
            expect(getByText('SERIE')).toBeTruthy();
            expect(getAllByText('KG').length).toBeGreaterThanOrEqual(1);
            expect(getByText('REPS')).toBeTruthy();
            expect(getByText('RPE')).toBeTruthy();
            expect(getByText('ESTADO')).toBeTruthy();

            // Add set button
            expect(getByTestId('add-set-button-0')).toBeTruthy();
            expect(getByText('Añadir Series')).toBeTruthy();
        });
    });

    describe('WorkoutSetRow M3 States', () => {
        it('renders pending set with inputs and complete checkbox', async () => {
            const set = {
                id: 's-1',
                numero_serie: 1,
                peso_utilizado: 82.5,
                repeticiones: 8,
                rpe: 8.5,
            };

            const onSetChange = jest.fn();
            const onToggleCompleteSet = jest.fn();

            const { getByTestId, getByText } = await render(
                <WorkoutSetRow
                    set={set}
                    setIndex={0}
                    exerciseId="ex-1"
                    tipoPeso="total"
                    isInputEditable={true}
                    isStructureEditable={false}
                    colors={mockColors as any}
                    onSetChange={onSetChange}
                    onToggleCompleteSet={onToggleCompleteSet}
                />
            );

            expect(getByTestId('set-row-0')).toBeTruthy();
            expect(getByTestId('set-weight-input-0')).toBeTruthy();
            expect(getByTestId('set-reps-input-0')).toBeTruthy();
            expect(getByTestId('set-rpe-input-0')).toBeTruthy();
            expect(getByTestId('set-complete-checkbox-0')).toBeTruthy();
            expect(getByTestId('set-uncompleted-icon-0')).toBeTruthy();
        });

        it('renders completed set with locked inputs and edit unlock button', async () => {
            const set = {
                id: 's-1',
                numero_serie: 1,
                peso_utilizado: 82.5,
                repeticiones: 8,
                rpe: 8.5,
                is_completed: true,
            };

            const { getByTestId } = await render(
                <WorkoutSetRow
                    set={set}
                    setIndex={0}
                    exerciseId="ex-1"
                    tipoPeso="total"
                    isInputEditable={true}
                    isStructureEditable={false}
                    colors={mockColors as any}
                    onSetChange={jest.fn()}
                />
            );

            expect(getByTestId('set-completed-icon-0')).toBeTruthy();
            expect(getByTestId('edit-set-button-0')).toBeTruthy();
        });
    });

    describe('WorkoutActions with M3 Primary Container Styling', () => {
        it('renders finish workout CTA in ACTIVE mode', async () => {
            const onFinishMock = jest.fn();
            const { getByTestId, getByText } = await render(
                <WorkoutActions
                    mode="ACTIVE"
                    saving={false}
                    colors={mockColors as any}
                    t={(k, def) => def || k}
                    onFinishWorkout={onFinishMock}
                />
            );

            const btn = getByTestId('finish-workout-button');
            expect(btn).toBeTruthy();
            expect(getByText('Finalizar Entrenamiento')).toBeTruthy();

            fireEvent.press(btn);
            expect(onFinishMock).toHaveBeenCalledTimes(1);
        });
    });
});
