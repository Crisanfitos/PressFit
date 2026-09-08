import React from 'react';
import { render, cleanup } from '@testing-library/react-native';
import ExerciseCard, { areExerciseCardPropsEqual, ExerciseCardProps } from '../../src/components/workout/ExerciseCard';

describe('ExerciseCard & areExerciseCardPropsEqual (RNTL)', () => {
    const mockColors: any = {
        background: '#121212',
        surface: '#1E1E1E',
        surfaceHighlight: '#2A2A2A',
        text: '#FFFFFF',
        textSecondary: '#A0A0A0',
        primary: '#3B82F6',
        border: '#333333',
        inputBackground: '#242424',
    };

    const mockExercise = {
        id: 'ex-1',
        titulo: 'Bench Press',
        tipo_peso: 'total' as const,
        routine_exercise_id: 're-1',
        sets: [
            { id: 'set-1', numero_serie: 1, peso_utilizado: 80, repeticiones: 10, rpe: 8, descanso_segundos: 90 },
            { id: 'set-2', numero_serie: 2, peso_utilizado: 80, repeticiones: 10, rpe: 8, descanso_segundos: 90 },
        ],
    };

    const baseProps: ExerciseCardProps = {
        exercise: mockExercise,
        index: 0,
        isCollapsed: false,
        isInputEditable: true,
        isStructureEditable: true,
        mode: 'ACTIVE',
        navMode: 'DEFAULT',
        colors: mockColors,
        previousWorkout: null,
        lastCompletedSetId: null,
        restTimerVisible: false,
        savedTimerSetIds: new Set<string>(),
        onToggleCollapse: jest.fn(),
        onUpdateWeightType: jest.fn(),
        onNavigateDetail: jest.fn(),
        onDeleteExercise: jest.fn(),
        onSetChange: jest.fn(),
        onDeleteSet: jest.fn(),
        onStartRestTimer: jest.fn(),
        onAddSet: jest.fn(),
        getGhostValue: jest.fn(() => null),
    };

    afterEach(() => {
        cleanup();
    });

    it('renders exercise title and sets correctly', async () => {
        const { getByText, getByTestId } = await render(<ExerciseCard {...baseProps} />);
        expect(getByText('Bench Press')).toBeTruthy();
        expect(getByTestId('exercise-card-0')).toBeTruthy();
    });

    describe('areExerciseCardPropsEqual memoization comparator', () => {
        it('returns true when non-tracked callbacks change reference', () => {
            const nextProps = {
                ...baseProps,
                onSetChange: jest.fn(),
                onAddSet: jest.fn(),
                onNavigateDetail: jest.fn(),
            };
            expect(areExerciseCardPropsEqual(baseProps, nextProps)).toBe(true);
        });

        it('returns false when collapsed status changes', () => {
            const nextProps = { ...baseProps, isCollapsed: true };
            expect(areExerciseCardPropsEqual(baseProps, nextProps)).toBe(false);
        });

        it('returns false when a set value changes within this exercise', () => {
            const nextProps = {
                ...baseProps,
                exercise: {
                    ...mockExercise,
                    sets: [
                        { ...mockExercise.sets[0], peso_utilizado: 85 },
                        mockExercise.sets[1],
                    ],
                },
            };
            expect(areExerciseCardPropsEqual(baseProps, nextProps)).toBe(false);
        });

        it('returns true when a different exercise has set changes (another exercise card)', () => {
            // simulating a new object reference from setExercises immutability but identical set data
            const nextProps = {
                ...baseProps,
                exercise: {
                    ...mockExercise,
                    sets: [...mockExercise.sets],
                },
            };
            expect(areExerciseCardPropsEqual(baseProps, nextProps)).toBe(true);
        });

        it('isolates rest timer completions: returns true if lastCompletedSetId belongs to another exercise', () => {
            const nextProps = {
                ...baseProps,
                lastCompletedSetId: 'set-from-another-exercise-999',
                restTimerVisible: true,
            };
            expect(areExerciseCardPropsEqual(baseProps, nextProps)).toBe(true);
        });

        it('invalidates memoization when lastCompletedSetId belongs to this exercise', () => {
            const nextProps = {
                ...baseProps,
                lastCompletedSetId: 'set-1',
                restTimerVisible: true,
            };
            expect(areExerciseCardPropsEqual(baseProps, nextProps)).toBe(false);
        });
    });
});
