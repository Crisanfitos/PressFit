import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import WorkoutScreen from '../../src/screens/WorkoutScreen';
import { useWorkoutController } from '../../src/controllers/useWorkoutController';
import { Alert } from 'react-native';

jest.mock('../../src/controllers/useWorkoutController');

const mockUseWorkoutController = useWorkoutController as jest.MockedFunction<typeof useWorkoutController>;

describe('WorkoutScreen Component (RNTL)', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
  } as any;

  const activeRoute = {
    params: {
      routineDayId: 'day-1',
      dayName: 'Pecho y Tríceps',
      dayOfWeek: 1,
    },
  } as any;

  const editRoute = {
    params: {
      routineDayId: 'day-1',
      dayName: 'Pecho y Tríceps',
      mode: 'edit',
    },
  } as any;

  const mockFinishWorkout = jest.fn().mockResolvedValue(true);
  const mockAddSet = jest.fn();
  const mockUpdateSet = jest.fn();
  const mockRemoveExercise = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkoutController.mockReturnValue({
      workout: { id: 'w-101', fecha_dia: '2026-08-08', descripcion: 'Día de Pecho' },
      exercises: [
        {
          id: 'ex-item-1',
          titulo: 'Press de Banca',
          tipo_peso: 'total',
          routine_exercise_id: 're-1',
          series: [{ id: 's1', numero_serie: 1, peso_utilizado: 80, repeticiones: 8, tipo_peso: 'total' }],
        },
      ],
      loading: false,
      mode: 'ACTIVE',
      previousWorkout: null,
      startWorkout: jest.fn(),
      addSet: mockAddSet,
      addSets: jest.fn(),
      updateSet: mockUpdateSet,
      deleteSet: jest.fn(),
      removeExercise: mockRemoveExercise,
      finishWorkout: mockFinishWorkout,
      updateWeightType: jest.fn(),
      loadSeriesForExercise: jest.fn(),
      reloadExercises: jest.fn(),
    } as any);
  });

  it('renders workout screen title, exercise name and description', async () => {
    const { getByText } = await render(
      <WorkoutScreen navigation={mockNavigation} route={activeRoute} />
    );

    expect(getByText(/Pecho y Tríceps/)).toBeTruthy();
    expect(getByText('Día de Pecho')).toBeTruthy();
    expect(getByText('Press de Banca')).toBeTruthy();
  });

  it('displays finalizar entrenamiento button and handles finish workout confirmation alert', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByTestId } = await render(
      <WorkoutScreen navigation={mockNavigation} route={activeRoute} />
    );

    const finishBtn = getByTestId('finish-workout-button');
    fireEvent.press(finishBtn);

    expect(alertSpy).toHaveBeenCalledWith('Finalizar Entrenamiento', expect.any(String), expect.any(Array));

    // Simulate pressing 'Finalizar' in the Alert
    const alertButtons = alertSpy.mock.calls[0][2];
    const confirmAlertBtn = alertButtons?.find((b: any) => b.text === 'Finalizar');
    confirmAlertBtn?.onPress();

    await waitFor(() => {
      expect(mockFinishWorkout).toHaveBeenCalled();
    });
  });

  it('renders empty exercise message when exercises array is empty', async () => {
    mockUseWorkoutController.mockReturnValue({
      workout: { id: 'w-101' },
      exercises: [],
      loading: false,
      mode: 'ACTIVE',
      finishWorkout: mockFinishWorkout,
      reloadExercises: jest.fn(),
    } as any);

    const { getByText } = await render(
      <WorkoutScreen navigation={mockNavigation} route={activeRoute} />
    );

    expect(getByText('¡Día libre de ejercicios!')).toBeTruthy();
  });

  it('navigates to exercise library when add exercise button in empty state is pressed', async () => {
    mockUseWorkoutController.mockReturnValue({
      workout: { id: 'w-101' },
      exercises: [],
      loading: false,
      mode: 'ACTIVE',
      finishWorkout: mockFinishWorkout,
      reloadExercises: jest.fn(),
    } as any);

    const { getByTestId } = await render(
      <WorkoutScreen navigation={mockNavigation} route={editRoute} />
    );

    const addExBtn = getByTestId('add-exercise-button');
    fireEvent.press(addExBtn);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('ExerciseLibrary', expect.any(Object));
  });

  it('triggers delete exercise alert in edit mode', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByTestId } = await render(
      <WorkoutScreen navigation={mockNavigation} route={editRoute} />
    );

    const deleteBtn = getByTestId('delete-exercise-button-0');
    fireEvent.press(deleteBtn);

    expect(alertSpy).toHaveBeenCalledWith('Eliminar Ejercicio', expect.any(String), expect.any(Array));
  });
});
