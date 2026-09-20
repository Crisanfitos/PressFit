import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import WorkoutDayScreen from '../../src/screens/WorkoutDayScreen';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { AuthContext } from '../../src/context/AuthContext';
import { RoutineService } from '../../src/services/RoutineService';
import { WorkoutService } from '../../src/services/WorkoutService';
import { Alert } from 'react-native';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockAuthContext: any = {
  user: { id: 'u-123', email: 'test@pressfit.com' },
  session: {} as any,
  loading: false,
  isLoading: false,
  isAuthenticated: true,
  signInWithEmail: jest.fn(),
  signUpWithEmail: jest.fn(),
  signOut: jest.fn(),
  signInWithGoogle: jest.fn(),
};

describe('WorkoutDayScreen Component (RNTL)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders workout day status text and info when day data exists', async () => {
    jest.spyOn(RoutineService, 'getRoutineDayByDate').mockResolvedValue({
      data: {
        id: 'rd-1',
        nombre_dia: 'Torso Fuerza',
        descripcion: 'Enfoque en pectoral y dorsal',
        completada: true,
        hora_inicio: '2026-08-08T10:00:00Z',
        hora_fin: '2026-08-08T11:00:00Z',
        ejercicios_programados: [
          {
            id: 'ep-1',
            ejercicio_id: 'e-1',
            ejercicio: { id: 'e-1', nombre: 'Press de Banca', titulo: 'Press de Banca', grupo_muscular_principal: 'Pecho', grupo_muscular: 'Pecho' } as any,
            series: [{ id: 's-1', ejercicio_programado_id: 'ep-1', numero_serie: 1, peso_utilizado: 80, repeticiones: 10 }],
          } as any,
        ],
      } as any,
      error: null,
    });

    const route = {
      params: { date: '2026-08-08', routineId: 'r-100', isToday: true },
    };

    const { getByText } = await render(
      <AuthContext.Provider value={mockAuthContext}>
        <ThemeProvider>
          <WorkoutDayScreen navigation={mockNavigation} route={route} />
        </ThemeProvider>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(getByText('Torso Fuerza')).toBeTruthy();
      expect(getByText('Enfoque en pectoral y dorsal')).toBeTruthy();
      expect(getByText('Completado')).toBeTruthy();
      expect(getByText('Press de Banca')).toBeTruthy();
    });
  });

  it('handles starting new workout when start workout button is pressed', async () => {
    jest.spyOn(RoutineService, 'getRoutineDayByDate').mockResolvedValue({
      data: {
        id: 'rd-2',
        nombre_dia: 'Pierna Hypertrophy',
        completada: false,
        ejercicios_programados: [
          {
            id: 'ep-2',
            ejercicio_id: 'e-2',
            ejercicio: { id: 'e-2', nombre: 'Sentadilla', titulo: 'Sentadilla', grupo_muscular_principal: 'Cuádriceps', grupo_muscular: 'Cuádriceps' } as any,
            series: [],
          } as any,
        ],
      } as any,
      error: null,
    });

    jest.spyOn(RoutineService, 'startDailyWorkout').mockResolvedValue({
      data: { id: 'w-new-55', rutina_diaria_id: 'rd-2' } as any,
      error: null,
    });

    const route = {
      params: { date: '2026-08-08', routineId: 'r-100', isToday: true },
    };

    const { getByText, getByTestId } = await render(
      <AuthContext.Provider value={mockAuthContext}>
        <ThemeProvider>
          <WorkoutDayScreen navigation={mockNavigation} route={route} />
        </ThemeProvider>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(getByText('Pierna Hypertrophy')).toBeTruthy();
    });

    const startBtn = getByTestId('start-workout-button');
    fireEvent.press(startBtn);

    await waitFor(() => {
      expect(RoutineService.startDailyWorkout).toHaveBeenCalled();
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Workout', expect.objectContaining({
        workoutId: 'w-new-55',
      }));
    });
  });

  it('handles active workout in progress and continues workout', async () => {
    jest.spyOn(RoutineService, 'getRoutineDayByDate').mockResolvedValue({
      data: {
        id: 'rd-3',
        nombre_dia: 'Espalda y Biceps',
        completada: false,
        hora_inicio: '2026-08-08T10:00:00Z',
        hora_fin: undefined,
        ejercicios_programados: [
          {
            id: 'ep-3',
            ejercicio_id: 'e-3',
            ejercicio: { id: 'e-3', nombre: 'Dominadas', titulo: 'Dominadas', grupo_muscular_principal: 'Espalda', grupo_muscular: 'Espalda' } as any,
            series: [],
          } as any,
        ],
      } as any,
      error: null,
    });

    const route = {
      params: { date: '2026-08-08', routineId: 'r-100', isToday: true },
    };

    const { getByText } = await render(
      <AuthContext.Provider value={mockAuthContext}>
        <ThemeProvider>
          <WorkoutDayScreen navigation={mockNavigation} route={route} />
        </ThemeProvider>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(getByText('En Progreso')).toBeTruthy();
    });

    const continueBtn = getByText(/Continuar Entrenamiento/i);
    fireEvent.press(continueBtn);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Workout', expect.objectContaining({
      workoutId: 'rd-3',
    }));
  });

  it('handles error when starting workout fails', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    jest.spyOn(RoutineService, 'getRoutineDayByDate').mockResolvedValue({
      data: {
        id: 'rd-4',
        nombre_dia: 'Hombros',
        completada: false,
        ejercicios_programados: [
          {
            id: 'ep-4',
            ejercicio_id: 'e-4',
            ejercicio: { id: 'e-4', nombre: 'Press Militar', titulo: 'Press Militar', grupo_muscular_principal: 'Deltoides', grupo_muscular: 'Deltoides' } as any,
            series: [],
          } as any,
        ],
      } as any,
      error: null,
    });

    jest.spyOn(RoutineService, 'startDailyWorkout').mockResolvedValue({
      data: null,
      error: new Error('Cannot create workout'),
    });

    const route = {
      params: { date: '2026-08-08', routineId: 'r-100', isToday: true },
    };

    const { getByText, getByTestId } = await render(
      <AuthContext.Provider value={mockAuthContext}>
        <ThemeProvider>
          <WorkoutDayScreen navigation={mockNavigation} route={route} />
        </ThemeProvider>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(getByText('Hombros')).toBeTruthy();
    });

    const startBtn = getByTestId('start-workout-button');
    fireEvent.press(startBtn);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'No se pudo crear el entrenamiento');
    });
  });

  it('detects pending workout from previous day and allows manual finish via modal (PF-376)', async () => {
    jest.spyOn(RoutineService, 'getRoutineDayByDate').mockResolvedValue({
      data: {
        id: 'rd-pending',
        nombre_dia: 'Espalda y Bíceps',
        descripcion: 'Sesión anterior incompleta',
        completada: false,
        hora_inicio: '2026-09-17T18:00:00.000Z',
        hora_fin: undefined,
        ejercicios_programados: [
          {
            id: 'ep-5',
            ejercicio_id: 'e-5',
            ejercicio: { id: 'e-5', nombre: 'Dominadas', titulo: 'Dominadas', grupo_muscular_principal: 'Espalda', grupo_muscular: 'Espalda' } as any,
            series: [{ id: 's-5', ejercicio_programado_id: 'ep-5', numero_serie: 1, peso_utilizado: 0, repeticiones: 8 }],
          } as any,
        ],
      } as any,
      error: null,
    });

    const completeWorkoutSpy = jest.spyOn(WorkoutService, 'completeWorkout').mockResolvedValue({
      data: {
        id: 'rd-pending',
        completada: true,
        hora_fin: '2026-09-17T19:00:00.000Z',
      } as any,
      error: null,
    });

    const route = {
      params: { date: '2026-09-17', routineId: 'r-100', isToday: false },
    };

    const { getByText, getByTestId } = await render(
      <AuthContext.Provider value={mockAuthContext}>
        <ThemeProvider>
          <WorkoutDayScreen navigation={mockNavigation} route={route} />
        </ThemeProvider>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(getByText('Espalda y Bíceps')).toBeTruthy();
      expect(getByTestId('status-badge-pending-finish')).toBeTruthy();
      expect(getByTestId('pending-workout-banner')).toBeTruthy();
      expect(getByTestId('manual-finish-workout-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('manual-finish-workout-button'));

    await waitFor(() => {
      expect(getByTestId('manual-finish-modal')).toBeTruthy();
    });

    fireEvent.press(getByTestId('manual-finish-confirm-button'));

    await waitFor(() => {
      expect(completeWorkoutSpy).toHaveBeenCalled();
      expect(getByTestId('status-badge-completed')).toBeTruthy();
    });
  });
});
