/**
 * Unit Tests: WorkoutService Reconciliation and Set Completion Persistence (PF-338)
 *
 * Verifies that is_completed and completada states are faithfully reconciled between
 * Supabase remote responses and OfflineStorageService cache, and correctly updated.
 */

import { mockChain, resetMocks } from '../../helpers/mockSupabase';

jest.mock('../../../src/lib/supabase', () => ({
  supabase: require('../../helpers/mockSupabase').mockSupabase,
}));

jest.mock('../../../src/services/NetworkService', () => ({
  NetworkService: {
    isOffline: jest.fn().mockResolvedValue(false),
  },
}));

const mockCachedWorkouts: any[] = [];
jest.mock('../../../src/services/OfflineStorageService', () => ({
  OfflineStorageService: {
    getCachedWorkouts: jest.fn().mockImplementation(async () => ({
      data: [...mockCachedWorkouts],
      error: null,
    })),
    saveWorkouts: jest.fn().mockImplementation(async (workouts: any[]) => {
      mockCachedWorkouts.length = 0;
      mockCachedWorkouts.push(...workouts);
      return { data: true, error: null };
    }),
  },
}));

jest.mock('../../../src/services/SyncService', () => ({
  SyncService: {
    enqueueOperation: jest.fn().mockResolvedValue({ error: null }),
  },
}));

import { WorkoutService } from '../../../src/services/WorkoutService';
import { NetworkService } from '../../../src/services/NetworkService';
import { OfflineStorageService } from '../../../src/services/OfflineStorageService';

describe('WorkoutService — Reconciliation of is_completed (PF-338)', () => {
  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
    mockCachedWorkouts.length = 0;
    (NetworkService.isOffline as jest.Mock).mockResolvedValue(false);
  });

  describe('getWorkoutDetails reconciliation', () => {
    it('restores is_completed: true from local cache when Supabase returns is_completed: false / null', async () => {
      const workoutId = 'w-active-1';
      // Pre-seed local cache with a set marked as completed
      mockCachedWorkouts.push({
        id: workoutId,
        ejercicios_programados: [
          {
            id: 'ep-1',
            orden_ejecucion: 1,
            series: [
              {
                id: 'set-101',
                numero_serie: 1,
                peso_utilizado: 80,
                repeticiones: 10,
                is_completed: true,
                completada: true,
              },
            ],
          },
        ],
      });

      // Remote Supabase response with is_completed: false
      const remoteWorkout = {
        id: workoutId,
        ejercicios_programados: [
          {
            id: 'ep-1',
            orden_ejecucion: 1,
            series: [
              {
                id: 'set-101',
                numero_serie: 1,
                peso_utilizado: 80,
                repeticiones: 10,
                is_completed: false,
              },
            ],
          },
        ],
      };

      mockChain.single.mockResolvedValueOnce({ data: remoteWorkout, error: null });

      const res = await WorkoutService.getWorkoutDetails(workoutId);

      expect(res.error).toBeNull();
      expect(res.data).toBeDefined();
      const series = res.data!.ejercicios_programados![0].series!;
      expect(series[0].is_completed).toBe(true);
      expect(series[0].completada).toBe(true);

      // Verify reconciled state was saved to OfflineStorageService
      expect(OfflineStorageService.saveWorkouts).toHaveBeenCalled();
      expect(mockCachedWorkouts[0].ejercicios_programados[0].series[0].is_completed).toBe(true);
    });

    it('preserves is_completed: true when returned directly by Supabase', async () => {
      const workoutId = 'w-remote-completed';
      const remoteWorkout = {
        id: workoutId,
        ejercicios_programados: [
          {
            id: 'ep-1',
            orden_ejecucion: 1,
            series: [
              {
                id: 'set-201',
                numero_serie: 1,
                peso_utilizado: 100,
                repeticiones: 5,
                is_completed: true,
              },
            ],
          },
        ],
      };

      mockChain.single.mockResolvedValueOnce({ data: remoteWorkout, error: null });

      const res = await WorkoutService.getWorkoutDetails(workoutId);

      expect(res.error).toBeNull();
      expect(res.data).toBeDefined();
      const series = res.data!.ejercicios_programados![0].series!;
      expect(series[0].is_completed).toBe(true);
      expect(series[0].completada).toBe(true);
    });

    it('correctly reports is_completed: false when both remote and cache are uncompleted', async () => {
      const workoutId = 'w-uncompleted';
      const remoteWorkout = {
        id: workoutId,
        ejercicios_programados: [
          {
            id: 'ep-1',
            orden_ejecucion: 1,
            series: [
              {
                id: 'set-301',
                numero_serie: 1,
                peso_utilizado: 60,
                repeticiones: 12,
                is_completed: false,
              },
            ],
          },
        ],
      };

      mockChain.single.mockResolvedValueOnce({ data: remoteWorkout, error: null });

      const res = await WorkoutService.getWorkoutDetails(workoutId);

      expect(res.error).toBeNull();
      expect(res.data).toBeDefined();
      const series = res.data!.ejercicios_programados![0].series!;
      expect(series[0].is_completed).toBe(false);
      expect(series[0].completada).toBe(false);
    });

    it('normalizes is_completed flags in offline fallback branch', async () => {
      (NetworkService.isOffline as jest.Mock).mockResolvedValue(true);

      const workoutId = 'w-offline-1';
      mockCachedWorkouts.push({
        id: workoutId,
        ejercicios_programados: [
          {
            id: 'ep-1',
            series: [
              {
                id: 'set-offline-1',
                numero_serie: 1,
                peso_utilizado: 70,
                repeticiones: 8,
                is_completed: true,
              },
            ],
          },
        ],
      });

      const res = await WorkoutService.getWorkoutDetails(workoutId);

      expect(res.error).toBeNull();
      expect(res.data).toBeDefined();
      const series = res.data!.ejercicios_programados![0].series!;
      expect(series[0].is_completed).toBe(true);
      expect(series[0].completada).toBe(true);
    });
  });

  describe('updateSet persistence and fallback', () => {
    it('persists is_completed to Supabase without sending non-existent completada column', async () => {
      const setId = 'set-persist-1';
      const updatedRow = {
        id: setId,
        peso_utilizado: 75,
        repeticiones: 10,
        is_completed: true,
      };

      mockChain.single.mockResolvedValueOnce({ data: updatedRow, error: null });

      const res = await WorkoutService.updateSet(setId, {
        weight: 75,
        reps: 10,
        is_completed: true,
        completada: true,
      });

      expect(res.error).toBeNull();
      expect(res.data).toBeDefined();
      expect(res.data!.is_completed).toBe(true);
      expect(res.data!.completada).toBe(true);

      // Verify supabase update payload did not contain completada
      expect(mockChain.update).toHaveBeenCalledWith(
        expect.not.objectContaining({ completada: expect.anything() })
      );
      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ is_completed: true })
      );
    });

    it('falls back gracefully if remote database reports is_completed missing in schema cache', async () => {
      const setId = 'set-fallback-1';
      const schemaError = {
        code: 'PGRST204',
        message: "Could not find the 'is_completed' column of 'series' in the schema cache",
      };
      const legacyUpdatedRow = {
        id: setId,
        peso_utilizado: 80,
        repeticiones: 8,
      };

      // 1. Initial update with is_completed fails
      mockChain.single.mockResolvedValueOnce({ data: null, error: schemaError });
      // 2. Fallback update succeeds
      mockChain.single.mockResolvedValueOnce({ data: legacyUpdatedRow, error: null });

      const res = await WorkoutService.updateSet(setId, {
        weight: 80,
        reps: 8,
        is_completed: true,
      });

      expect(res.error).toBeNull();
      expect(res.data).toBeDefined();
      // Client/local normalization maintains user intention
      expect(res.data!.is_completed).toBe(true);
      expect(res.data!.completada).toBe(true);
    });

    it('maintains is_completed state when updating offline', async () => {
      (NetworkService.isOffline as jest.Mock).mockResolvedValue(true);

      const setId = 'set-offline-persist';
      mockCachedWorkouts.push({
        id: 'w-1',
        ejercicios_programados: [
          {
            id: 'ep-1',
            series: [{ id: setId, numero_serie: 1, peso_utilizado: 60, repeticiones: 12 }],
          },
        ],
      });

      const res = await WorkoutService.updateSet(setId, {
        is_completed: true,
        completada: true,
      });

      expect(res.error).toBeNull();
      expect(res.data).toBeDefined();
      expect(res.data!.is_completed).toBe(true);
      expect(res.data!.completada).toBe(true);

      // Verify local cache reflects the update
      expect(mockCachedWorkouts[0].ejercicios_programados[0].series[0].is_completed).toBe(true);
    });
  });
});
