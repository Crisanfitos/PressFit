import { ExerciseService } from '../../../src/services/ExerciseService';
import { supabase } from '../../../src/lib/supabase';
import * as mockAdapter from '../../../src/lib/e2eMockAdapter';

const mockChain: any = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  not: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
};
mockChain.then = jest.fn((resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve));

jest.spyOn(supabase, 'from').mockReturnValue(mockChain);

describe('ExerciseService Unit Tests (PF-245)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getExercises', () => {
    it('should return exercises from supabase when online', async () => {
      const mockData = [{ id: 'ex-1', titulo: 'Press de Banca', grupo_muscular: 'Pecho' }];
      mockChain.order.mockResolvedValueOnce({ data: mockData, error: null });

      const res = await ExerciseService.getExercises();
      expect(res.error).toBeNull();
      expect(res.data).toEqual(mockData);
    });

    it('should handle error when supabase fails', async () => {
      mockChain.order.mockResolvedValueOnce({ data: null, error: new Error('DB Error') });

      const res = await ExerciseService.getExercises();
      expect(res.data).toBeNull();
      expect(res.error).toBeDefined();
    });

    it('should return mock exercises when E2E mock is enabled', async () => {
      jest.spyOn(mockAdapter, 'isE2EMockEnabled').mockReturnValueOnce(true);
      const res = await ExerciseService.getExercises();
      expect(res.error).toBeNull();
      expect(res.data).toBeDefined();
    });
  });

  describe('createCustomExercise', () => {
    it('should insert custom exercise in Supabase', async () => {
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: { id: 'u-123' } },
        error: null,
      } as any);

      const insertedEx = { id: 'custom-1', titulo: 'Sentadilla Bulgara' };
      mockChain.single.mockResolvedValueOnce({ data: insertedEx, error: null });

      const res = await ExerciseService.createCustomExercise({
        titulo: 'Sentadilla Bulgara',
        grupo_muscular: 'Piernas',
        descripcion: 'Con mancuernas',
      });

      expect(res.error).toBeNull();
      expect(res.data).toEqual(insertedEx);
    });

    it('should handle error when creation fails', async () => {
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: null },
        error: null,
      } as any);

      mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Insert error') });

      const res = await ExerciseService.createCustomExercise({
        titulo: 'Exercise Fail',
        grupo_muscular: 'Brazos',
      });

      expect(res.data).toBeNull();
      expect(res.error).toBeDefined();
    });

    it('should return mock custom exercise when E2E mock is enabled', async () => {
      jest.spyOn(mockAdapter, 'isE2EMockEnabled').mockReturnValueOnce(true);
      const res = await ExerciseService.createCustomExercise({
        titulo: 'Mock Exercise',
        grupo_muscular: 'Espalda',
      });

      expect(res.error).toBeNull();
      expect(res.data).toBeDefined();
    });
  });

  describe('getExerciseById', () => {
    it('should fetch exercise by ID successfully', async () => {
      const mockEx = { id: 'e-1', titulo: 'Dominadas' };
      mockChain.single.mockResolvedValueOnce({ data: mockEx, error: null });

      const res = await ExerciseService.getExerciseById('e-1');
      expect(res.error).toBeNull();
      expect(res.data).toEqual(mockEx);
    });

    it('should handle error when exercise not found', async () => {
      mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Not found') });

      const res = await ExerciseService.getExerciseById('e-bad');
      expect(res.data).toBeNull();
      expect(res.error).toBeDefined();
    });
  });

  describe('addExercisesToRoutineDay', () => {
    it('should append exercises to routine day with calculated order index', async () => {
      const inserted = [
        { id: 'sp-1', rutina_diaria_id: 'rd-1', ejercicio_id: 'e-1', orden_ejecucion: 4 },
      ];

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              order: jest.fn().mockReturnValueOnce({
                limit: jest.fn().mockResolvedValueOnce({ data: [{ orden_ejecucion: 3 }] }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValueOnce({
            select: jest.fn().mockResolvedValueOnce({ data: inserted, error: null }),
          }),
        });

      const res = await ExerciseService.addExercisesToRoutineDay('u-1', 'rd-1', ['e-1']);
      expect(res.error).toBeNull();
      expect(res.data).toEqual(inserted);
    });

    it('should handle error when adding exercises to routine day fails', async () => {
      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              order: jest.fn().mockReturnValueOnce({
                limit: jest.fn().mockResolvedValueOnce({ data: [] }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValueOnce({
            select: jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Insert Error') }),
          }),
        });

      const res = await ExerciseService.addExercisesToRoutineDay('u-1', 'rd-1', ['e-1']);
      expect(res.data).toBeNull();
      expect(res.error).toBeDefined();
    });

    it('should return mock result when E2E mock is enabled', async () => {
      jest.spyOn(mockAdapter, 'isE2EMockEnabled').mockReturnValueOnce(true);
      const res = await ExerciseService.addExercisesToRoutineDay('u-1', 'rd-1', ['e-1']);
      expect(res.error).toBeNull();
      expect(res.data).toEqual([]);
    });
  });

  describe('getPersonalNote and savePersonalNote', () => {
    it('should fetch personal note content', async () => {
      mockChain.single.mockResolvedValueOnce({ data: { contenido_nota: 'Cuidar postura' }, error: null });

      const res = await ExerciseService.getPersonalNote('u-1', 'e-1');
      expect(res.error).toBeNull();
      expect(res.data).toBe('Cuidar postura');
    });

    it('should return null note when row not found (PGRST116)', async () => {
      mockChain.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      const res = await ExerciseService.getPersonalNote('u-1', 'e-1');
      expect(res.error).toBeNull();
      expect(res.data).toBeNull();
    });

    it('should return error when fetch note fails with non-PGRST116 error', async () => {
      mockChain.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST500' } });

      const res = await ExerciseService.getPersonalNote('u-1', 'e-1');
      expect(res.data).toBeNull();
      expect(res.error).toBeDefined();
    });

    it('should save personal note successfully', async () => {
      mockChain.single.mockResolvedValueOnce({ data: { id: 'pn-1' }, error: null });

      const res = await ExerciseService.savePersonalNote('u-1', 'e-1', 'Nueva nota');
      expect(res.error).toBeNull();
      expect(res.data).toEqual({ id: 'pn-1' });
    });

    it('should handle error saving personal note', async () => {
      mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Save error') });

      const res = await ExerciseService.savePersonalNote('u-1', 'e-1', 'Err nota');
      expect(res.data).toBeNull();
      expect(res.error).toBeDefined();
    });
  });

  describe('getUserExercisesWithProgress', () => {
    it('should return exercises user has performed in completed series', async () => {
      const mockSeriesData = [
        {
          ejercicio_programado: {
            ejercicio_id: 'ex-10',
            rutina_diaria: {
              rutina_semanal: {
                usuario_id: 'user-1',
              },
            },
          },
        },
      ];

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            not: jest.fn().mockResolvedValueOnce({ data: mockSeriesData, error: null }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            in: jest.fn().mockReturnValueOnce({
              order: jest.fn().mockResolvedValueOnce({ data: [{ id: 'ex-10', titulo: 'Press Militar' }], error: null }),
            }),
          }),
        });

      const res = await ExerciseService.getUserExercisesWithProgress('user-1');
      expect(res.error).toBeNull();
      expect(res.data).toEqual([{ id: 'ex-10', titulo: 'Press Militar' }]);
    });

    it('should return empty array if no series found for user', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          not: jest.fn().mockResolvedValueOnce({ data: [], error: null }),
        }),
      });

      const res = await ExerciseService.getUserExercisesWithProgress('user-1');
      expect(res.error).toBeNull();
      expect(res.data).toEqual([]);
    });

    it('should handle error when series fetch fails', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          not: jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Series error') }),
        }),
      });

      const res = await ExerciseService.getUserExercisesWithProgress('user-1');
      expect(res.data).toBeNull();
      expect(res.error).toBeDefined();
    });
  });
});
