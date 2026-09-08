import { WorkoutRecoveryService } from '../../../src/services/WorkoutRecoveryService';
import {
    getActiveWorkoutParams,
    clearActiveWorkoutParams,
    cancelTimerNotification,
} from '../../../src/services/TimerNotificationService';
import { WorkoutService } from '../../../src/services/WorkoutService';

jest.mock('../../../src/services/TimerNotificationService', () => ({
    getActiveWorkoutParams: jest.fn(),
    clearActiveWorkoutParams: jest.fn(),
    cancelTimerNotification: jest.fn(),
}));

jest.mock('../../../src/services/WorkoutService', () => ({
    WorkoutService: {
        getWorkoutDetails: jest.fn(),
    },
}));

describe('WorkoutRecoveryService (PF-311)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('checkPendingWorkoutSession', () => {
        it('returns null if getActiveWorkoutParams returns null', async () => {
            (getActiveWorkoutParams as jest.Mock).mockResolvedValue(null);

            const session = await WorkoutRecoveryService.checkPendingWorkoutSession();
            expect(session).toBeNull();
            expect(WorkoutService.getWorkoutDetails).not.toHaveBeenCalled();
        });

        it('returns null if params has no workoutId', async () => {
            (getActiveWorkoutParams as jest.Mock).mockResolvedValue({ routineDayId: 'rd-1' });

            const session = await WorkoutRecoveryService.checkPendingWorkoutSession();
            expect(session).toBeNull();
            expect(WorkoutService.getWorkoutDetails).not.toHaveBeenCalled();
        });

        it('returns null if params mode is not ACTIVE (e.g. PREVIEW or VIEW)', async () => {
            (getActiveWorkoutParams as jest.Mock).mockResolvedValue({
                workoutId: 'w-1',
                mode: 'PREVIEW',
            });

            const session = await WorkoutRecoveryService.checkPendingWorkoutSession();
            expect(session).toBeNull();
            expect(WorkoutService.getWorkoutDetails).not.toHaveBeenCalled();
        });

        it('returns null and clears params if workout details not found or workout already completed', async () => {
            (getActiveWorkoutParams as jest.Mock).mockResolvedValue({
                workoutId: 'w-completed',
                mode: 'ACTIVE',
            });
            (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
                data: { id: 'w-completed', completada: true },
                error: null,
            });

            const session = await WorkoutRecoveryService.checkPendingWorkoutSession();
            expect(session).toBeNull();
            expect(clearActiveWorkoutParams).toHaveBeenCalled();
        });

        it('returns null and clears params if workout started more than 12 hours ago (>43200s)', async () => {
            const oldStartTime = new Date(Date.now() - 50000 * 1000).toISOString();
            (getActiveWorkoutParams as jest.Mock).mockResolvedValue({
                workoutId: 'w-stale',
                mode: 'ACTIVE',
            });
            (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
                data: {
                    id: 'w-stale',
                    completada: false,
                    hora_inicio: oldStartTime,
                },
                error: null,
            });

            const session = await WorkoutRecoveryService.checkPendingWorkoutSession();
            expect(session).toBeNull();
            expect(clearActiveWorkoutParams).toHaveBeenCalled();
        });

        it('returns valid RecoverySession with elapsed minutes, exercises count and completed sets', async () => {
            const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
            (getActiveWorkoutParams as jest.Mock).mockResolvedValue({
                workoutId: 'w-1',
                routineDayId: 'rd-1',
                dayName: 'Miércoles (Pierna)',
                dayOfWeek: 3,
                mode: 'ACTIVE',
            });
            (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
                data: {
                    id: 'w-1',
                    rutina_diaria_id: 'rd-1',
                    nombre_dia: 'Miércoles (Pierna)',
                    hora_inicio: thirtyMinsAgo,
                    completada: false,
                    ejercicios_programados: [
                        {
                            id: 'ep-1',
                            series: [
                                { id: 's-1', repeticiones: 10, peso_utilizado: 80 },
                                { id: 's-2', repeticiones: 0, peso_utilizado: 0 },
                            ],
                        },
                        {
                            id: 'ep-2',
                            series: [
                                { id: 's-3', repeticiones: 12, peso_utilizado: 50 },
                            ],
                        },
                    ],
                },
                error: null,
            });

            const session = await WorkoutRecoveryService.checkPendingWorkoutSession();
            expect(session).not.toBeNull();
            expect(session?.workoutId).toBe('w-1');
            expect(session?.routineDayId).toBe('rd-1');
            expect(session?.dayName).toBe('Miércoles (Pierna)');
            expect(session?.dayOfWeek).toBe(3);
            expect(session?.exerciseCount).toBe(2);
            expect(session?.completedSetsCount).toBe(2); // s-1 and s-3
            expect(session?.totalSetsCount).toBe(3);
            expect(session?.elapsedMinutes).toBeGreaterThanOrEqual(29);
            expect(session?.elapsedMinutes).toBeLessThanOrEqual(31);
        });

        it('catches and logs error returning null if checking throws', async () => {
            (getActiveWorkoutParams as jest.Mock).mockRejectedValue(new Error('AsyncStorage disk failure'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const session = await WorkoutRecoveryService.checkPendingWorkoutSession();
            expect(session).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('Error checking pending workout session:', expect.any(Error));

            consoleSpy.mockRestore();
        });
    });

    describe('discardRecoverySession', () => {
        it('clears active workout params and cancels timer notifications', async () => {
            await WorkoutRecoveryService.discardRecoverySession();

            expect(clearActiveWorkoutParams).toHaveBeenCalled();
            expect(cancelTimerNotification).toHaveBeenCalled();
        });

        it('handles error gracefully when discarding fails', async () => {
            (clearActiveWorkoutParams as jest.Mock).mockRejectedValue(new Error('Clear fail'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await WorkoutRecoveryService.discardRecoverySession();

            expect(consoleSpy).toHaveBeenCalledWith('Error discarding recovery session:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });
});
