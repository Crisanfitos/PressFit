import { WorkoutService } from '../../../src/services/WorkoutService';
import { WorkoutMutationService } from '../../../src/services/WorkoutMutationService';
import { WorkoutOfflineService } from '../../../src/services/WorkoutOfflineService';
import { supabase } from '../../../src/lib/supabase';

jest.mock('../../../src/lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
    },
}));

describe('WorkoutService - Manual Finish Pending Workouts (PF-376)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('passes customEndTime to supabase update when online', async () => {
        const customEndTime = '2026-09-17T19:30:00.000Z';
        const workoutId = 'w-123';
        const durationMinutes = 90;

        jest.spyOn(WorkoutOfflineService, 'checkIsOffline').mockResolvedValue(false);
        const updateCachedSpy = jest.spyOn(WorkoutOfflineService, 'updateCachedWorkoutOnComplete').mockResolvedValue(undefined);

        const singleMock = jest.fn().mockResolvedValue({
            data: { id: workoutId, completada: true, hora_fin: customEndTime },
            error: null,
        });
        const selectMock = jest.fn().mockReturnValue({ single: singleMock });
        const eqMock = jest.fn().mockReturnValue({ select: selectMock });
        const updateMock = jest.fn().mockReturnValue({ eq: eqMock });

        (supabase.from as jest.Mock).mockReturnValue({
            update: updateMock,
        });

        const res = await WorkoutService.completeWorkout(workoutId, durationMinutes, customEndTime);

        expect(updateMock).toHaveBeenCalledWith({
            completada: true,
            hora_fin: customEndTime,
        });
        expect(eqMock).toHaveBeenCalledWith('id', workoutId);
        expect(res.data?.completada).toBe(true);
        expect(res.data?.hora_fin).toBe(customEndTime);
        expect(updateCachedSpy).toHaveBeenCalledWith(workoutId, customEndTime);
    });

    it('delegates to WorkoutOfflineService with customEndTime when offline', async () => {
        const customEndTime = '2026-09-17T19:30:00.000Z';
        const workoutId = 'w-123';
        const durationMinutes = 90;

        jest.spyOn(WorkoutOfflineService, 'checkIsOffline').mockResolvedValue(true);
        const enqueueSpy = jest.spyOn(WorkoutOfflineService, 'enqueueAndCacheCompleteWorkout').mockResolvedValue({
            data: { id: workoutId, completada: true, hora_fin: customEndTime } as any,
            error: null,
        });

        const res = await WorkoutService.completeWorkout(workoutId, durationMinutes, customEndTime);

        expect(enqueueSpy).toHaveBeenCalledWith(workoutId, durationMinutes, customEndTime);
        expect(res.data?.completada).toBe(true);
        expect(res.data?.hora_fin).toBe(customEndTime);
    });
});
