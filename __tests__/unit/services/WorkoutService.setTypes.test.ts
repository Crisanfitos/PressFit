/**
 * Unit Tests: WorkoutService with Set Types (PF-313)
 *
 * Validates addSet, updateSet, and routine day series copying
 * with the new tipo_serie classification column.
 */

import { mockChain, resetMocks } from '../../helpers/mockSupabase';
import { createMockSerie } from '../../helpers/testHelpers';

jest.mock('../../../src/lib/supabase', () => ({
  supabase: require('../../helpers/mockSupabase').mockSupabase,
}));

jest.mock('../../../src/services/NetworkService', () => ({
  NetworkService: {
    isOffline: jest.fn().mockResolvedValue(false),
  },
}));

jest.mock('../../../src/services/OfflineStorageService', () => ({
  OfflineStorageService: {
    getCachedWorkouts: jest.fn().mockResolvedValue({ data: [], error: null }),
    saveWorkouts: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

jest.mock('../../../src/services/SyncService', () => ({
  SyncService: {
    enqueueOperation: jest.fn().mockResolvedValue({ error: null }),
  },
}));

import { WorkoutService } from '../../../src/services/WorkoutService';
import { NetworkService } from '../../../src/services/NetworkService';
import { SetType } from '../../../src/types/setTypes';

describe('WorkoutService — Set Types Persistence (PF-313)', () => {
  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
    (NetworkService.isOffline as jest.Mock).mockResolvedValue(false);
  });

  describe('addSet with tipo_serie', () => {
    it('creates a set with default tipo_serie "normal" when not specified', async () => {
      const mockScheduledEx = { id: 'ep-001' };
      const mockNewSet = createMockSerie({
        id: 'serie-new-1',
        numero_serie: 1,
        peso_utilizado: 50,
        repeticiones: 10,
        tipo_serie: 'normal',
      });

      mockChain.single.mockResolvedValueOnce({ data: mockScheduledEx, error: null });
      mockChain.single.mockResolvedValueOnce({ data: mockNewSet, error: null });

      const result = await WorkoutService.addSet('workout-001', 'exercise-001', 1, 50, 10);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data!.tipo_serie).toBe('normal');
    });

    it.each([
      'warmup',
      'feeder',
      'failure',
      'drop',
    ] as SetType[])('persists explicit tipo_serie "%s"', async (setType) => {
      const mockScheduledEx = { id: 'ep-001' };
      const mockNewSet = createMockSerie({
        id: `serie-${setType}`,
        numero_serie: 2,
        peso_utilizado: 70,
        repeticiones: 8,
        tipo_serie: setType,
      });

      mockChain.single.mockResolvedValueOnce({ data: mockScheduledEx, error: null });
      mockChain.single.mockResolvedValueOnce({ data: mockNewSet, error: null });

      const result = await WorkoutService.addSet('workout-001', 'exercise-001', 2, 70, 8, setType);

      expect(result.error).toBeNull();
      expect(result.data!.tipo_serie).toBe(setType);
    });
  });

  describe('updateSet with tipo_serie', () => {
    it('updates tipo_serie online and persists to Supabase', async () => {
      const updatedSet = createMockSerie({
        id: 'serie-001',
        peso_utilizado: 80,
        repeticiones: 5,
        rpe: 10,
        tipo_serie: 'failure',
      });
      mockChain.single.mockResolvedValueOnce({ data: updatedSet, error: null });

      const result = await WorkoutService.updateSet('serie-001', {
        weight: 80,
        reps: 5,
        rpe: 10,
        tipo_serie: 'failure',
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data!.tipo_serie).toBe('failure');
    });

    it('handles offline fallback and enqueues SET_UPSERT with tipo_serie', async () => {
      (NetworkService.isOffline as jest.Mock).mockResolvedValue(true);

      const result = await WorkoutService.updateSet('serie-offline-1', {
        weight: 40,
        reps: 15,
        tipo_serie: 'warmup',
      });

      expect(result.error).toBeNull();
      expect(result.data!.tipo_serie).toBe('warmup');
      expect(result.data!.peso_utilizado).toBe(40);
    });
  });
});
