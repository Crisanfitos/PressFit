import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import WorkoutDayScreen from '../../src/screens/WorkoutDayScreen';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { AuthContext } from '../../src/context/AuthContext';
import { RoutineService } from '../../src/services/RoutineService';
import { Alert } from 'react-native';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockAuthContext = {
  user: { id: 'u-123', email: 'test@pressfit.com' },
  session: {} as any,
  loading: false,
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
            ejercicio: { titulo: 'Press de Banca', grupo_muscular: 'Pecho' },
            series: [{ id: 's-1', numero_serie: 1, peso_utilizado: 80, repeticiones: 10 }],
          },
        ],
      },
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
            ejercicio: { titulo: 'Sentadilla', grupo_muscular: 'Cuádriceps' },
            series: [],
          },
        ],
      },
      error: null,
    });

    jest.spyOn(RoutineService, 'startDailyWorkout').mockResolvedValue({
      data: { id: 'w-new-55', rutina_diaria_id: 'rd-2' } as any,
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
      expect(getByText('Pierna Hypertrophy')).toBeTruthy();
    });

    const startBtn = getByText(/Empezar Entrenamiento/i);
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
        hora_fin: null,
        ejercicios_programados: [
          {
            id: 'ep-3',
            ejercicio_id: 'e-3',
            ejercicio: { titulo: 'Dominadas', grupo_muscular: 'Espalda' },
            series: [],
          },
        ],
      },
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
            ejercicio: { titulo: 'Press Militar', grupo_muscular: 'Deltoides' },
            series: [],
          },
        ],
      },
      error: null,
    });

    jest.spyOn(RoutineService, 'startDailyWorkout').mockResolvedValue({
      data: null,
      error: new Error('Cannot create workout'),
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
      expect(getByText('Hombros')).toBeTruthy();
    });

    const startBtn = getByText(/Empezar Entrenamiento/i);
    fireEvent.press(startBtn);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'No se pudo crear el entrenamiento');
    });
  });
});
