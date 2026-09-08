import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ResumeWorkoutModal } from '../../src/components/workout/ResumeWorkoutModal';
import { RecoverySession } from '../../src/services/WorkoutRecoveryService';

const mockColors = {
  background: '#0a0a0a',
  surface: '#121212',
  surfaceHighlight: '#1e1e1e',
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  primary: '#10b981',
  border: '#2a2a2a',
};

const mockSession: RecoverySession = {
  workoutId: 'w-modal-1',
  routineDayId: 'rd-modal-1',
  dayName: 'Piernas y Abdomen',
  dayOfWeek: 3,
  startTime: '2026-09-08T07:30:00.000Z',
  elapsedMinutes: 32,
  exerciseCount: 5,
  completedSetsCount: 12,
  totalSetsCount: 20,
};

describe('ResumeWorkoutModal Component (PF-311)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');
  });

  it('renders nothing when visible is false', async () => {
    const { queryByTestId } = await render(
      <ResumeWorkoutModal
        visible={false}
        session={mockSession}
        onResume={jest.fn()}
        onDiscard={jest.fn()}
        colors={mockColors}
      />
    );

    expect(queryByTestId('resume-workout-modal')).toBeNull();
  });

  it('renders nothing when session is null', async () => {
    const { queryByTestId } = await render(
      <ResumeWorkoutModal
        visible={true}
        session={null}
        onResume={jest.fn()}
        onDiscard={jest.fn()}
        colors={mockColors}
      />
    );

    expect(queryByTestId('resume-workout-modal')).toBeNull();
  });

  it('renders session details and metrics correctly when visible', async () => {
    const { getByText, getByTestId } = await render(
      <ResumeWorkoutModal
        visible={true}
        session={mockSession}
        onResume={jest.fn()}
        onDiscard={jest.fn()}
        colors={mockColors}
      />
    );

    expect(getByTestId('resume-workout-modal')).toBeTruthy();
    expect(getByText('Entrenamiento en Curso')).toBeTruthy();
    expect(getByText(/Se detectó una sesión previa sin finalizar/i)).toBeTruthy();
    expect(getByText('Piernas y Abdomen')).toBeTruthy();
    expect(getByText('32 min transcurridos')).toBeTruthy();
    expect(getByText(/5 ejercicios · 12 series completadas/i)).toBeTruthy();
  });

  it('displays "Iniciado recientemente" when elapsedMinutes is 0', async () => {
    const zeroElapsedSession: RecoverySession = {
      ...mockSession,
      elapsedMinutes: 0,
    };

    const { getByText } = await render(
      <ResumeWorkoutModal
        visible={true}
        session={zeroElapsedSession}
        onResume={jest.fn()}
        onDiscard={jest.fn()}
        colors={mockColors}
      />
    );

    expect(getByText('Iniciado recientemente')).toBeTruthy();
  });

  it('calls onResume when "Reanudar Sesión" button is pressed', async () => {
    const mockOnResume = jest.fn();
    const { getByTestId } = await render(
      <ResumeWorkoutModal
        visible={true}
        session={mockSession}
        onResume={mockOnResume}
        onDiscard={jest.fn()}
        colors={mockColors}
      />
    );

    const resumeBtn = getByTestId('resume-workout-confirm-button');
    fireEvent.press(resumeBtn);

    expect(mockOnResume).toHaveBeenCalledTimes(1);
  });

  it('triggers confirmation Alert when "Descartar Sesión" button is pressed and calls onDiscard upon confirmation', async () => {
    const mockOnDiscard = jest.fn();
    const { getByTestId } = await render(
      <ResumeWorkoutModal
        visible={true}
        session={mockSession}
        onResume={jest.fn()}
        onDiscard={mockOnDiscard}
        colors={mockColors}
      />
    );

    const discardBtn = getByTestId('resume-workout-discard-button');
    fireEvent.press(discardBtn);

    expect(Alert.alert).toHaveBeenCalledWith(
      '¿Descartar entrenamiento?',
      '¿Estás seguro de que deseas descartar esta sesión activa? Esta acción no se puede deshacer.',
      expect.any(Array)
    );

    const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const discardAlertBtn = alertButtons.find((btn: any) => btn.text === 'Descartar');
    expect(discardAlertBtn).toBeDefined();

    // Trigger discard confirmation
    discardAlertBtn.onPress();
    expect(mockOnDiscard).toHaveBeenCalledTimes(1);
  });
});
