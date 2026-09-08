import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useWorkoutRecovery } from '../../../src/hooks/useWorkoutRecovery';
import { WorkoutRecoveryService, RecoverySession } from '../../../src/services/WorkoutRecoveryService';

jest.mock('../../../src/services/WorkoutRecoveryService');

const mockRecoveryService = WorkoutRecoveryService as jest.Mocked<typeof WorkoutRecoveryService>;

const mockSession: RecoverySession = {
  workoutId: 'w-recovery-1',
  routineDayId: 'rd-1',
  dayName: 'Pecho y Tríceps',
  dayOfWeek: 1,
  startTime: '2026-09-08T08:00:00.000Z',
  elapsedMinutes: 45,
  exerciseCount: 4,
  completedSetsCount: 10,
  totalSetsCount: 16,
};

describe('useWorkoutRecovery Hook (PF-311)', () => {
  let mockNavigation: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigation = {
      navigate: jest.fn(),
    };
    mockRecoveryService.checkPendingWorkoutSession.mockResolvedValue(null);
    mockRecoveryService.discardRecoverySession.mockResolvedValue(undefined);
  });

  it('checks for pending workout session on mount and sets pendingSession to null when none exists', async () => {
    let hookResult: any = null;

    await act(async () => {
      TestRenderer.create(
        React.createElement(() => {
          hookResult = useWorkoutRecovery(mockNavigation);
          return null;
        })
      );
    });

    expect(mockRecoveryService.checkPendingWorkoutSession).toHaveBeenCalledTimes(1);
    expect(hookResult.pendingSession).toBeNull();
    expect(hookResult.isLoading).toBe(false);
  });

  it('populates pendingSession when a pending workout is detected', async () => {
    mockRecoveryService.checkPendingWorkoutSession.mockResolvedValue(mockSession);
    let hookResult: any = null;

    await act(async () => {
      TestRenderer.create(
        React.createElement(() => {
          hookResult = useWorkoutRecovery(mockNavigation);
          return null;
        })
      );
    });

    expect(mockRecoveryService.checkPendingWorkoutSession).toHaveBeenCalledTimes(1);
    expect(hookResult.pendingSession).toEqual(mockSession);
    expect(hookResult.isLoading).toBe(false);
  });

  it('handleResume navigates to Semana -> Workout and resets pendingSession', async () => {
    mockRecoveryService.checkPendingWorkoutSession.mockResolvedValue(mockSession);
    let hookResult: any = null;

    await act(async () => {
      TestRenderer.create(
        React.createElement(() => {
          hookResult = useWorkoutRecovery(mockNavigation);
          return null;
        })
      );
    });

    expect(hookResult.pendingSession).toEqual(mockSession);

    await act(async () => {
      hookResult.handleResume();
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Semana', {
      screen: 'Workout',
      params: {
        workoutId: 'w-recovery-1',
        routineDayId: 'rd-1',
        dayName: 'Pecho y Tríceps',
        dayOfWeek: 1,
        mode: 'ACTIVE',
      },
    });
    expect(hookResult.pendingSession).toBeNull();
  });

  it('handleDiscard resets pendingSession and calls WorkoutRecoveryService.discardRecoverySession', async () => {
    mockRecoveryService.checkPendingWorkoutSession.mockResolvedValue(mockSession);
    let hookResult: any = null;

    await act(async () => {
      TestRenderer.create(
        React.createElement(() => {
          hookResult = useWorkoutRecovery(mockNavigation);
          return null;
        })
      );
    });

    expect(hookResult.pendingSession).toEqual(mockSession);

    await act(async () => {
      await hookResult.handleDiscard();
    });

    expect(mockRecoveryService.discardRecoverySession).toHaveBeenCalledTimes(1);
    expect(hookResult.pendingSession).toBeNull();
  });

  it('handles service errors gracefully without throwing', async () => {
    mockRecoveryService.checkPendingWorkoutSession.mockRejectedValue(new Error('Storage failure'));
    let hookResult: any = null;

    await act(async () => {
      TestRenderer.create(
        React.createElement(() => {
          hookResult = useWorkoutRecovery(mockNavigation);
          return null;
        })
      );
    });

    expect(hookResult.pendingSession).toBeNull();
    expect(hookResult.isLoading).toBe(false);
  });
});
