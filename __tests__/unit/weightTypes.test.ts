/**
 * Weight Types Tests
 *
 * Tests for the tipo_peso column in ejercicios_programados.
 * Verifies CRUD operations with weight type support.
 */

import { supabase } from '../../src/lib/supabase';
import { TEST_USER } from '../setup/testSetup';
import {
  getTestUserTemplate,
  getEjercicioProgramadoWithSeries,
} from '../helpers/testHelpers';

describe('Weight Types (tipo_peso)', () => {
  let templateRoutine: any;
  let testExerciseId: string;
  let testRoutineDayId: string;

  beforeAll(async () => {
    // Reset DB to a clean state
    const { resetAndInsert } = require('../setup/resetDB');
    await resetAndInsert();

    // Get the template routine for the test user
    templateRoutine = await getTestUserTemplate();
    expect(templateRoutine).toBeTruthy();

    // Find a day with at least one exercise
    const dayWithExercises = templateRoutine.rutinas_diarias?.find(
      (d: any) => d.ejercicios_programados && d.ejercicios_programados.length > 0
    );
    expect(dayWithExercises).toBeTruthy();

    testRoutineDayId = dayWithExercises.id;
    testExerciseId = dayWithExercises.ejercicios_programados[0].ejercicio_id;
  });

  describe('Default values', () => {
    it('should default to "total" for existing ejercicios_programados', async () => {
      const dayWithExercises = templateRoutine.rutinas_diarias?.find(
        (d: any) => d.ejercicios_programados && d.ejercicios_programados.length > 0
      );

      const ep = dayWithExercises.ejercicios_programados[0];
      const { data, error } = await supabase
        .from('ejercicios_programados')
        .select('tipo_peso')
        .eq('id', ep.id)
        .single();

      expect(error).toBeNull();
      expect(data?.tipo_peso).toBe('total');
    });
  });

  describe('CRUD operations', () => {
    let createdEpId: string;

    it('should create ejercicio_programado with tipo_peso = total (default)', async () => {
      const { data, error } = await supabase
        .from('ejercicios_programados')
        .insert({
          rutina_diaria_id: testRoutineDayId,
          ejercicio_id: testExerciseId,
          orden_ejecucion: 99,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.tipo_peso).toBe('total');
      createdEpId = data.id;
    });

    it('should create ejercicio_programado with tipo_peso = por_lado', async () => {
      const { data, error } = await supabase
        .from('ejercicios_programados')
        .insert({
          rutina_diaria_id: testRoutineDayId,
          ejercicio_id: testExerciseId,
          orden_ejecucion: 100,
          tipo_peso: 'por_lado',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.tipo_peso).toBe('por_lado');

      // Cleanup
      await supabase.from('ejercicios_programados').delete().eq('id', data.id);
    });

    it('should create ejercicio_programado with tipo_peso = corporal', async () => {
      const { data, error } = await supabase
        .from('ejercicios_programados')
        .insert({
          rutina_diaria_id: testRoutineDayId,
          ejercicio_id: testExerciseId,
          orden_ejecucion: 101,
          tipo_peso: 'corporal',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.tipo_peso).toBe('corporal');

      // Cleanup
      await supabase.from('ejercicios_programados').delete().eq('id', data.id);
    });

    it('should update tipo_peso from total to por_lado', async () => {
      const { data, error } = await supabase
        .from('ejercicios_programados')
        .update({ tipo_peso: 'por_lado' })
        .eq('id', createdEpId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.tipo_peso).toBe('por_lado');
    });

    it('should update tipo_peso from por_lado to corporal', async () => {
      const { data, error } = await supabase
        .from('ejercicios_programados')
        .update({ tipo_peso: 'corporal' })
        .eq('id', createdEpId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.tipo_peso).toBe('corporal');
    });

    it('should reject invalid tipo_peso values', async () => {
      const { error } = await supabase
        .from('ejercicios_programados')
        .update({ tipo_peso: 'invalid_value' })
        .eq('id', createdEpId)
        .select()
        .single();

      expect(error).toBeTruthy();
    });

    afterAll(async () => {
      // Cleanup test data
      if (createdEpId) {
        await supabase.from('ejercicios_programados').delete().eq('id', createdEpId);
      }
    });
  });

  describe('WorkoutService.updateWeightType', () => {
    let createdEpId: string;

    beforeAll(async () => {
      const { data } = await supabase
        .from('ejercicios_programados')
        .insert({
          rutina_diaria_id: testRoutineDayId,
          ejercicio_id: testExerciseId,
          orden_ejecucion: 98,
        })
        .select()
        .single();

      createdEpId = data!.id;
    });

    it('should update weight type via WorkoutService', async () => {
      const { WorkoutService } = require('../../src/services/WorkoutService');
      const result = await WorkoutService.updateWeightType(createdEpId, 'por_lado');

      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(result.data.tipo_peso).toBe('por_lado');
    });

    afterAll(async () => {
      if (createdEpId) {
        await supabase.from('ejercicios_programados').delete().eq('id', createdEpId);
      }
    });
  });

  describe('tipo_peso in queries', () => {
    it('should include tipo_peso in getWorkoutDetails response', async () => {
      const { WorkoutService } = require('../../src/services/WorkoutService');

      // Find a workout (rutina_diaria with fecha_dia not null)
      const { data: workouts } = await supabase
        .from('rutinas_diarias')
        .select('id')
        .eq('rutina_semanal_id', templateRoutine.id)
        .not('fecha_dia', 'is', null)
        .limit(1);

      if (workouts && workouts.length > 0) {
        const result = await WorkoutService.getWorkoutDetails(workouts[0].id);
        if (result.data?.ejercicios_programados?.length > 0) {
          const ep = result.data.ejercicios_programados[0];
          expect(ep).toHaveProperty('tipo_peso');
          expect(['total', 'por_lado', 'corporal']).toContain(ep.tipo_peso);
        }
      }
    });

    it('should include tipo_peso in getExerciseHistory response', async () => {
      const { WorkoutService } = require('../../src/services/WorkoutService');

      const result = await WorkoutService.getExerciseHistory(TEST_USER.id, testExerciseId);

      if (result.data && result.data.length > 0) {
        result.data.forEach((entry: any) => {
          expect(entry).toHaveProperty('tipo_peso');
          expect(['total', 'por_lado', 'corporal']).toContain(entry.tipo_peso);
        });
      }
    });
  });
});
