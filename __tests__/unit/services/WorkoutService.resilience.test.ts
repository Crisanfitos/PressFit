/**
 * Unit Tests: WorkoutService Schema Resilience and Rollback Fallback (PF-332)
 *
 * Validates that WorkoutService gracefully recovers when the remote Supabase database
 * has not yet applied the tipo_serie migration or when a rollback was performed (PGRST204 / 42703).
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

import { WorkoutService, isSchemaColumnError } from '../../../src/services/WorkoutService';
import { NetworkService } from '../../../src/services/NetworkService';

describe('WorkoutService — Schema Resilience & Rollback Compatibility (PF-332)', () => {
  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
    (NetworkService.isOffline as jest.Mock).mockResolvedValue(false);
  });

  describe('isSchemaColumnError helper', () => {
    it('detects PGRST204 PostgREST schema cache errors', () => {
      const error = {
        code: 'PGRST204',
        message: "Could not find the 'tipo_serie' column of 'series' in the schema cache",
      };
      expect(isSchemaColumnError(error)).toBe(true);
    });

    it('detects PostgreSQL 42703 undefined_column errors', () => {
      const error = {
        code: '42703',
        message: 'column series.tipo_serie does not exist',
      };
      expect(isSchemaColumnError(error)).toBe(true);
    });

    it('detects error message mentioning tipo_serie even without exact code', () => {
      const error = {
        message: 'Unknown column tipo_serie in table series',
      };
      expect(isSchemaColumnError(error)).toBe(true);
    });

    it('returns false for unrelated errors (network, auth, foreign key)', () => {
      expect(isSchemaColumnError(null)).toBe(false);
      expect(isSchemaColumnError(undefined)).toBe(false);
      expect(isSchemaColumnError({ code: '23505', message: 'duplicate key value' })).toBe(false);
      expect(isSchemaColumnError({ code: 'PGRST301', message: 'JWT expired' })).toBe(false);
    });
  });

  describe('addSet fallback resilience', () => {
    it('catches PGRST204 on initial insert and succeeds via legacy fallback without tipo_serie', async () => {
      const mockScheduledEx = { id: 'ep-001' };
      const pgrst204Error = {
        code: 'PGRST204',
        message: "Could not find the 'tipo_serie' column of 'series' in the schema cache",
      };
      const legacyCreatedSet = {
        id: 'serie-legacy-1',
        ejercicio_programado_id: 'ep-001',
        numero_serie: 1,
        peso_utilizado: 60,
        repeticiones: 12,
        rpe: 8,
      };

      // 1. Finding scheduled exercise
      mockChain.single.mockResolvedValueOnce({ data: mockScheduledEx, error: null });
      // 2. Initial insert with tipo_serie fails with PGRST204
      mockChain.single.mockResolvedValueOnce({ data: null, error: pgrst204Error });
      // 3. Fallback insert without tipo_serie succeeds
      mockChain.single.mockResolvedValueOnce({ data: legacyCreatedSet, error: null });

      const result = await WorkoutService.addSet('workout-1', 'ex-1', 1, 60, 12, 'warmup');

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe('serie-legacy-1');
      // Must normalize tipo_serie in returned object to preserve frontend consistency
      expect(result.data!.tipo_serie).toBe('warmup');
    });

    it('catches PostgreSQL 42703 on initial insert and succeeds via legacy fallback', async () => {
      const mockScheduledEx = { id: 'ep-001' };
      const pg42703Error = {
        code: '42703',
        message: 'column series.tipo_serie does not exist',
      };
      const legacyCreatedSet = {
        id: 'serie-legacy-2',
        ejercicio_programado_id: 'ep-001',
        numero_serie: 2,
        peso_utilizado: 80,
        repeticiones: 8,
      };

      mockChain.single.mockResolvedValueOnce({ data: mockScheduledEx, error: null });
      mockChain.single.mockResolvedValueOnce({ data: null, error: pg42703Error });
      mockChain.single.mockResolvedValueOnce({ data: legacyCreatedSet, error: null });

      const result = await WorkoutService.addSet('workout-1', 'ex-1', 2, 80, 8, 'failure');

      expect(result.error).toBeNull();
      expect(result.data!.id).toBe('serie-legacy-2');
      expect(result.data!.tipo_serie).toBe('failure');
    });

    it('does not trigger fallback and returns error on genuine non-schema failure', async () => {
      const mockScheduledEx = { id: 'ep-001' };
      const authError = {
        code: 'PGRST301',
        message: 'JWT expired',
      };

      mockChain.single.mockResolvedValueOnce({ data: mockScheduledEx, error: null });
      mockChain.single.mockResolvedValueOnce({ data: null, error: authError });

      const result = await WorkoutService.addSet('workout-1', 'ex-1', 1, 60, 12);

      expect(result.data).toBeNull();
      expect(result.error).toEqual(authError);
    });
  });

  describe('updateSet fallback resilience', () => {
    it('catches PGRST204 when updating tipo_serie, strips column and succeeds', async () => {
      const pgrst204Error = {
        code: 'PGRST204',
        message: "Could not find the 'tipo_serie' column of 'series' in the schema cache",
      };
      const legacyUpdatedSet = {
        id: 'serie-update-1',
        peso_utilizado: 70,
        repeticiones: 10,
      };

      // 1. Initial update with tipo_serie fails with PGRST204
      mockChain.single.mockResolvedValueOnce({ data: null, error: pgrst204Error });
      // 2. Fallback update without tipo_serie succeeds
      mockChain.single.mockResolvedValueOnce({ data: legacyUpdatedSet, error: null });

      const result = await WorkoutService.updateSet('serie-update-1', {
        weight: 70,
        reps: 10,
        tipo_serie: 'drop',
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data!.tipo_serie).toBe('drop');
    });
  });

  describe('getSeriesForExercise normalization', () => {
    it('normalizes legacy series rows missing tipo_serie to "normal"', async () => {
      const mockScheduledEx = { id: 'ep-001' };
      const legacySeriesRows = [
        { id: 's1', numero_serie: 1, peso_utilizado: 50, repeticiones: 10 },
        { id: 's2', numero_serie: 2, peso_utilizado: 60, repeticiones: 8, tipo_serie: 'warmup' },
      ];

      mockChain.maybeSingle.mockResolvedValueOnce({ data: mockScheduledEx, error: null });
      mockChain.order.mockResolvedValueOnce({ data: legacySeriesRows, error: null });

      const result = await WorkoutService.getSeriesForExercise('workout-1', 'ex-1');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      expect(result.data![0].tipo_serie).toBe('normal');
      expect(result.data![1].tipo_serie).toBe('warmup');
    });
  });
});
