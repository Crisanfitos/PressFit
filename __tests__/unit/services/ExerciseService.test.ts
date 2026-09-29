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
    it('should return exercises from supabase when online with ownership flags', async () => {
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: { id: 'u-123' } },
        error: null,
      } as any);

      const mockData = [
        { id: 'ex-1', titulo: 'Press de Banca', grupo_muscular: 'Pecho', is_custom: false },
        { id: 'ex-2', titulo: 'Mi Press Especial', grupo_muscular: 'Pecho', is_custom: true, created_by: 'u-123', url_video: 'https://youtu.be/123' },
        { id: 'ex-3', titulo: 'Press Comunidad', grupo_muscular: 'Pecho', is_custom: true, created_by: 'u-999' },
      ];
      mockChain.order.mockResolvedValueOnce({ data: mockData, error: null });

      const res = await ExerciseService.getExercises();
      expect(res.error).toBeNull();
      expect(res.data).toHaveLength(3);

      // ex-1: Oficial
      expect(res.data?.[0].es_oficial).toBe(true);
      expect(res.data?.[0].es_custom).toBe(false);
      expect(res.data?.[0].es_propietario).toBe(false);

      // ex-2: Propio
      expect(res.data?.[1].es_oficial).toBe(false);
      expect(res.data?.[1].es_custom).toBe(true);
      expect(res.data?.[1].es_propietario).toBe(true);
      expect(res.data?.[1].video_url).toBe('https://youtu.be/123');
      expect(res.data?.[1].user_id).toBe('u-123');

      // ex-3: Comunidad (otro usuario)
      expect(res.data?.[2].es_oficial).toBe(false);
      expect(res.data?.[2].es_custom).toBe(true);
      expect(res.data?.[2].es_propietario).toBe(false);
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

      const insertedEx = {
        id: 'custom-1',
        titulo: 'Sentadilla Bulgara',
        is_custom: true,
        created_by: 'u-123',
      };
      mockChain.single.mockResolvedValueOnce({ data: insertedEx, error: null });

      const res = await ExerciseService.createCustomExercise({
        titulo: 'Sentadilla Bulgara',
        grupo_muscular: 'Piernas',
        descripcion: 'Con mancuernas',
      });

      expect(res.error).toBeNull();
      expect(res.data?.id).toEqual('custom-1');
      expect(res.data?.es_propietario).toBe(true);
      expect(res.data?.es_custom).toBe(true);
      expect(res.data?.es_oficial).toBe(false);
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
    it('should fetch exercise by ID successfully and enrich ownership', async () => {
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: { id: 'u-123' } },
        error: null,
      } as any);

      const mockEx = { id: 'e-1', titulo: 'Dominadas', is_custom: true, created_by: 'u-123' };
      mockChain.single.mockResolvedValueOnce({ data: mockEx, error: null });

      const res = await ExerciseService.getExerciseById('e-1');
      expect(res.error).toBeNull();
      expect(res.data?.id).toEqual('e-1');
      expect(res.data?.es_propietario).toBe(true);
      expect(res.data?.es_custom).toBe(true);
      expect(res.data?.es_oficial).toBe(false);
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

  describe('updateCustomExercise (PF-247, PF-289)', () => {
    it('should reject updating an official exercise (PF-247)', async () => {
      mockChain.single.mockResolvedValueOnce({
        data: { id: 'official-1', is_custom: false, created_by: null, user_id: null },
        error: null,
      });

      const res = await ExerciseService.updateCustomExercise('official-1', {
        titulo: 'Intento Hack',
      });

      expect(res.data).toBeNull();
      expect(res.error).toBeDefined();
      expect((res.error as Error).message).toMatch(/oficial/i);
    });

    it('should reject updating an exercise owned by another user (PF-247)', async () => {
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: { id: 'user-me' } },
        error: null,
      } as any);

      mockChain.single.mockResolvedValueOnce({
        data: { id: 'custom-other', is_custom: true, created_by: 'user-other' },
        error: null,
      });

      const res = await ExerciseService.updateCustomExercise('custom-other', {
        titulo: 'Intento Hack',
      });

      expect(res.data).toBeNull();
      expect(res.error).toBeDefined();
      expect((res.error as Error).message).toMatch(/permisos/i);
    });

    it('should update custom exercise when user is the owner (PF-247)', async () => {
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: { id: 'user-me' } },
        error: null,
      } as any);

      // Check query returns user's custom exercise
      mockChain.single.mockResolvedValueOnce({
        data: { id: 'custom-1', is_custom: true, created_by: 'user-me' },
        error: null,
      });
      // Update query returns updated exercise
      const updatedEx = { id: 'custom-1', titulo: 'Sentadilla Editada', is_custom: true, created_by: 'user-me' };
      mockChain.single.mockResolvedValueOnce({ data: updatedEx, error: null });

      const res = await ExerciseService.updateCustomExercise('custom-1', {
        titulo: 'Sentadilla Editada',
      });

      expect(res.error).toBeNull();
      expect(res.data?.titulo).toEqual('Sentadilla Editada');
      expect(res.data?.es_propietario).toBe(true);
    });

    it('should handle error when update fails', async () => {
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: { id: 'user-me' } },
        error: null,
      } as any);

      // Check query succeeds
      mockChain.single.mockResolvedValueOnce({
        data: { id: 'custom-1', is_custom: true, created_by: 'user-me' },
        error: null,
      });
      // Update query fails
      mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Update error') });

      const res = await ExerciseService.updateCustomExercise('custom-1', {
        titulo: 'Fail',
      });

      expect(res.data).toBeNull();
      expect(res.error).toBeDefined();
    });

    it('should update mock custom exercise when E2E mock is enabled', async () => {
      jest.spyOn(mockAdapter, 'isE2EMockEnabled').mockReturnValueOnce(true);
      const res = await ExerciseService.updateCustomExercise('ex-001', {
        titulo: 'Mock Edited',
      });

      expect(res.error).toBeNull();
      expect(res.data?.titulo).toBe('Mock Edited');
    });
  });

  describe('deleteCustomExercise (PF-247, PF-289)', () => {
    it('should reject deleting an official exercise (PF-247)', async () => {
      mockChain.single.mockResolvedValueOnce({
        data: { id: 'official-1', is_custom: false, created_by: null },
        error: null,
      });

      const res = await ExerciseService.deleteCustomExercise('official-1');
      expect(res.data).toBe(false);
      expect(res.error).toBeDefined();
      expect((res.error as Error).message).toMatch(/oficial/i);
    });

    it('should reject deleting an exercise owned by another user (PF-247)', async () => {
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: { id: 'user-me' } },
        error: null,
      } as any);

      mockChain.single.mockResolvedValueOnce({
        data: { id: 'custom-other', is_custom: true, created_by: 'user-other' },
        error: null,
      });

      const res = await ExerciseService.deleteCustomExercise('custom-other');
      expect(res.data).toBe(false);
      expect(res.error).toBeDefined();
      expect((res.error as Error).message).toMatch(/permisos/i);
    });

    it('should delete custom exercise from Supabase when user is the owner (PF-247)', async () => {
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: { id: 'user-me' } },
        error: null,
      } as any);

      // Check query returns user's custom exercise
      mockChain.single.mockResolvedValueOnce({
        data: { id: 'custom-1', is_custom: true, created_by: 'user-me' },
        error: null,
      });

      const res = await ExerciseService.deleteCustomExercise('custom-1');
      expect(res.error).toBeNull();
      expect(res.data).toBe(true);
    });

    it('should handle error when deletion fails', async () => {
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: { id: 'user-me' } },
        error: null,
      } as any);

      // Check query succeeds
      mockChain.single.mockResolvedValueOnce({
        data: { id: 'custom-1', is_custom: true, created_by: 'user-me' },
        error: null,
      });
      // Delete query fails
      mockChain.then.mockImplementationOnce((resolve: any) => Promise.resolve({ error: new Error('Delete error') }).then(resolve));

      const res = await ExerciseService.deleteCustomExercise('custom-1');
      expect(res.data).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('should delete mock custom exercise when E2E mock is enabled', async () => {
      jest.spyOn(mockAdapter, 'isE2EMockEnabled').mockReturnValueOnce(true);
      const res = await ExerciseService.deleteCustomExercise('ex-001');
      expect(res.error).toBeNull();
      expect(res.data).toBe(true);
    });
  });
});

