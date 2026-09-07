import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../src/context/ThemeContext';
import {
    WorkoutDayHeader,
    WorkoutDayExerciseList,
    WorkoutDayActionButton,
} from '../../src/components/workoutDay';

describe('WorkoutDay Subcomponents', () => {
    describe('WorkoutDayHeader', () => {
        it('renders back button and triggers onBack', async () => {
            const onBackMock = jest.fn();
            const { getByTestId, getByText } = await render(
                <ThemeProvider>
                    <WorkoutDayHeader
                        dayData={{ nombre_dia: 'Día de Pecho', descripcion: 'Foco en press' }}
                        routineId="r-1"
                        selectedDate={new Date(2026, 7, 8)}
                        workoutStats={null}
                        activeWorkout={null}
                        formatDate={() => 'Sábado, 8 de Ago 2026'}
                        formatDuration={() => '01:00'}
                        onBack={onBackMock}
                    />
                </ThemeProvider>
            );

            expect(getByText('Día de Pecho')).toBeTruthy();
            expect(getByText('Foco en press')).toBeTruthy();
            const backBtn = getByTestId('workout-day-back-button');
            fireEvent.press(backBtn);
            expect(onBackMock).toHaveBeenCalled();
        });

        it('renders completed status badge and hero stats', async () => {
            const { getByTestId, getByText } = await render(
                <ThemeProvider>
                    <WorkoutDayHeader
                        dayData={{ nombre_dia: 'Completado' }}
                        routineId="r-1"
                        selectedDate={new Date(2026, 7, 8)}
                        workoutStats={{
                            exerciseCount: 4,
                            duration: 55,
                            isCompleted: true,
                            startTime: '2026-08-08T10:00:00Z',
                            endTime: '2026-08-08T10:55:00Z',
                        }}
                        activeWorkout={null}
                        formatDate={() => 'Sábado'}
                        formatDuration={() => '00:55'}
                        onBack={jest.fn()}
                    />
                </ThemeProvider>
            );

            expect(getByTestId('status-badge-completed')).toBeTruthy();
            expect(getByText(/4/)).toBeTruthy();
            expect(getByText('00:55')).toBeTruthy();
        });
    });

    describe('WorkoutDayExerciseList', () => {
        it('renders empty state when no exercises exist', async () => {
            const { getByText } = await render(
                <ThemeProvider>
                    <WorkoutDayExerciseList exercises={[]} workoutStats={null} />
                </ThemeProvider>
            );

            expect(getByText(/No hay ejercicios programados/i)).toBeTruthy();
        });

        it('renders completed exercise cards with detailed sets', async () => {
            const exercises = [
                {
                    id: 'ex-1',
                    ejercicio_id: 'e-1',
                    ejercicio: { titulo: 'Sentadilla Hack', grupo_muscular: 'Piernas' },
                    series: [
                        { id: 's-1', numero_serie: 1, peso_utilizado: 120, repeticiones: 8, rpe: 8, descanso_segundos: 90 },
                    ],
                },
            ];

            const { getByText } = await render(
                <ThemeProvider>
                    <WorkoutDayExerciseList
                        exercises={exercises}
                        workoutStats={{
                            exerciseCount: 1,
                            duration: 30,
                            isCompleted: true,
                            startTime: null,
                            endTime: null,
                        }}
                    />
                </ThemeProvider>
            );

            expect(getByText('Sentadilla Hack')).toBeTruthy();
            expect(getByText('120 kg × 8 reps')).toBeTruthy();
            expect(getByText('RPE 8')).toBeTruthy();
            expect(getByText('90s')).toBeTruthy();
        });
    });

    describe('WorkoutDayActionButton', () => {
        it('does not render when isToday is false', async () => {
            const { queryByTestId } = await render(
                <ThemeProvider>
                    <WorkoutDayActionButton
                        isToday={false}
                        hasContent={true}
                        workoutStats={null}
                        activeWorkout={null}
                        onPress={jest.fn()}
                    />
                </ThemeProvider>
            );

            expect(queryByTestId('start-workout-button')).toBeNull();
        });

        it('renders and responds to press when isToday is true', async () => {
            const onPressMock = jest.fn();
            const { getByTestId, getByText } = await render(
                <ThemeProvider>
                    <WorkoutDayActionButton
                        isToday={true}
                        hasContent={true}
                        workoutStats={null}
                        activeWorkout={null}
                        onPress={onPressMock}
                    />
                </ThemeProvider>
            );

            const btn = getByTestId('start-workout-button');
            expect(btn).toBeTruthy();
            expect(getByText(/(Iniciar|Empezar) Entrenamiento/i)).toBeTruthy();
            fireEvent.press(btn);
            expect(onPressMock).toHaveBeenCalled();
        });
    });
});
