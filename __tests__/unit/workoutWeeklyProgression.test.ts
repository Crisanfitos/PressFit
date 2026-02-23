/**
 * Nivel 5: Progresión Semanal de Entrenamientos
 * 
 * Template-Only Architecture:
 * - Single routine (es_plantilla=true, activa=true)
 * - Template days (fecha_dia=null) hold exercise definitions with target series
 * - Workout days (fecha_dia=date) are created when user starts training
 * - startDailyWorkout copies template exercises+series into a new workout day
 * 
 * Test flow:
 * 1. Find a template day with exercises
 * 2. Create a workout from template (simulating "last week")
 * 3. Add real data (weight/reps) to the workout
 * 4. Complete the workout
 * 5. Create another workout from same template (simulating "this week")
 *    → Should have exercises copied from template
 * 6. Cleanup
 */

import { supabase } from '../../src/lib/supabase';
import { TEST_USER } from '../setup/testSetup';
import { RoutineService } from '../../src/services/RoutineService';
import { WorkoutService } from '../../src/services/WorkoutService';

describe('Nivel 5: Progresión Semanal de Entrenamientos', () => {
    let routineId: string;
    let templateDayId: string;
    let workout1Id: string;
    let workout2Id: string;
    let exerciseId: string;

    beforeAll(async () => {
        const { resetAndInsert } = require('../setup/resetDB');
        await resetAndInsert();

        // Find the single active routine
        const { data } = await supabase
            .from('rutinas_semanales')
            .select('id')
            .eq('usuario_id', TEST_USER.id)
            .eq('activa', true)
            .single();

        if (!data) throw new Error('No se encontró rutina activa');
        routineId = data.id;

        // Find a template day with exercises (e.g., Viernes)
        const { data: tmplDay } = await RoutineService.getRoutineDayByName(routineId, 'Viernes');
        if (!tmplDay || !tmplDay.ejercicios_programados?.length) {
            throw new Error('No se encontró día de plantilla con ejercicios');
        }
        templateDayId = tmplDay.id;
        exerciseId = tmplDay.ejercicios_programados[0].ejercicio_id;

        console.log('Setup: routineId=', routineId, 'templateDayId=', templateDayId);
    });

    it('Fase 1: Crear entrenamiento desde plantilla (simulando semana pasada)', async () => {
        // Create workout from template
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastWeekStr = lastWeek.toISOString();

        const { data: workout, error } = await RoutineService.startDailyWorkout(
            templateDayId,
            lastWeekStr,
            lastWeekStr
        );

        expect(error).toBeNull();
        expect(workout).toBeDefined();
        workout1Id = workout!.id;

        // Verify exercises were copied
        const { data: details } = await WorkoutService.getWorkoutDetails(workout1Id);
        expect(details?.ejercicios_programados?.length).toBeGreaterThan(0);

        console.log('✅ Fase 1: Workout created:', workout1Id, 'with',
            details?.ejercicios_programados?.length, 'exercises');
    });

    it('Fase 2: Añadir datos reales al entrenamiento de Semana 1', async () => {
        // Clear the copied template series (start fresh with real data)
        const { data: workout } = await WorkoutService.getWorkoutDetails(workout1Id);
        for (const ep of workout?.ejercicios_programados || []) {
            for (const s of ep.series || []) {
                await supabase.from('series').delete().eq('id', s.id);
            }
        }

        // Add real sets with weight and reps
        const { data: set1 } = await WorkoutService.addSet(workout1Id, exerciseId, 1, 100, 10);
        expect(set1).toBeDefined();
        expect(set1?.peso_utilizado).toBe(100);
        expect(set1?.repeticiones).toBe(10);

        const { data: set2 } = await WorkoutService.addSet(workout1Id, exerciseId, 2, 105, 8);
        expect(set2).toBeDefined();
        expect(set2?.peso_utilizado).toBe(105);

        console.log('✅ Fase 2: Added 2 real sets');
    });

    it('Fase 3: Completar el entrenamiento de Semana 1', async () => {
        const { data: completed } = await WorkoutService.completeWorkout(workout1Id, 60);

        expect(completed).toBeDefined();
        expect(completed?.completada).toBe(true);
        expect(completed?.hora_fin).not.toBeNull();

        console.log('✅ Fase 3: Workout completed');
    });

    it('Fase 4: Crear entrenamiento de Semana 2 desde la misma plantilla', async () => {
        const now = new Date();
        const { data: workout, error } = await RoutineService.startDailyWorkout(
            templateDayId,
            now.toISOString(),
            now.toISOString()
        );

        expect(error).toBeNull();
        expect(workout).toBeDefined();
        expect(workout!.id).not.toBe(workout1Id); // Different workout

        workout2Id = workout!.id;

        // Verify exercises were copied from TEMPLATE (not from last week's workout)
        const { data: details } = await WorkoutService.getWorkoutDetails(workout2Id);
        expect(details?.ejercicios_programados?.length).toBeGreaterThan(0);

        // Series should be copied from template (3 series with target reps)
        const firstEx = details?.ejercicios_programados?.[0];
        expect(firstEx?.series?.length).toBe(3); // 3 template series

        console.log('✅ Fase 4: Week 2 workout created:', workout2Id);
        console.log('   Exercises:', details?.ejercicios_programados?.length);
        console.log('   Series:', firstEx?.series?.length);
    });

    it('Fase 5: Cleanup', async () => {
        // Delete both test workouts
        if (workout1Id) {
            await supabase.from('rutinas_diarias').delete().eq('id', workout1Id);
        }
        if (workout2Id) {
            await supabase.from('rutinas_diarias').delete().eq('id', workout2Id);
        }

        // Verify template is untouched
        const { data: tmpl } = await RoutineService.getRoutineDayByName(routineId, 'Viernes');
        expect(tmpl?.ejercicios_programados?.length).toBeGreaterThan(0);

        console.log('✅ Fase 5: Cleanup done, template intact');
    });
});
