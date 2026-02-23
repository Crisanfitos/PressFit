/**
 * Integration Tests: startDailyWorkout with Template-Only Architecture
 * 
 * Tests the EXACT app flow:
 * 1. Find active routine
 * 2. Get template day by name (fecha_dia = null) 
 * 3. Call startDailyWorkout to create a new workout from template
 * 4. Verify the workout, exercises, and series exist in DB
 * 5. Clean up
 */

import { supabase } from '../../src/lib/supabase';
import { TEST_USER } from '../setup/testSetup';
import { RoutineService } from '../../src/services/RoutineService';

describe('startDailyWorkout - Template-Only Architecture', () => {

    beforeAll(async () => {
        const { resetAndInsert } = require('../setup/resetDB');
        await resetAndInsert();
    });

    it('Step 1: Find active routine and verify it is the template', async () => {
        const { data: routines } = await supabase
            .from('rutinas_semanales')
            .select('id, nombre, activa, es_plantilla')
            .eq('usuario_id', TEST_USER.id);

        console.log('All routines:', routines);

        expect(routines).toBeDefined();
        expect(routines!.length).toBe(1); // Only ONE routine exists

        const activeRoutine = routines!.find((r: any) => r.activa);
        expect(activeRoutine).toBeDefined();
        expect(activeRoutine!.es_plantilla).toBe(true); // Active routine IS the template
        console.log('✅ Active routine:', activeRoutine!.id, activeRoutine!.nombre);
    });

    it('Step 2: Find template day for Viernes (fecha_dia = null) with exercises', async () => {
        // Get the active routine
        const { data: routines } = await supabase
            .from('rutinas_semanales')
            .select('id')
            .eq('usuario_id', TEST_USER.id)
            .eq('activa', true)
            .single();

        expect(routines).toBeDefined();

        // Get template day by name
        const { data: templateDay } = await RoutineService.getRoutineDayByName(
            routines!.id,
            'Viernes'
        );

        expect(templateDay).toBeDefined();
        expect(templateDay!.fecha_dia).toBeNull(); // Template = no date
        expect(templateDay!.ejercicios_programados.length).toBeGreaterThan(0);

        const seriesCount = templateDay!.ejercicios_programados.reduce(
            (acc: number, ex: any) => acc + (ex.series?.length || 0), 0
        );

        console.log('✅ Template day:', templateDay!.nombre_dia);
        console.log('   Exercises:', templateDay!.ejercicios_programados.length);
        console.log('   Total series:', seriesCount);
        console.log('   rutina_semanal_id:', templateDay!.rutina_semanal_id);
    });

    it('Step 3: startDailyWorkout creates workout from template and persists', async () => {
        // Get active routine
        const { data: routine } = await supabase
            .from('rutinas_semanales')
            .select('id')
            .eq('usuario_id', TEST_USER.id)
            .eq('activa', true)
            .single();

        // Get template day
        const { data: templateDay } = await RoutineService.getRoutineDayByName(
            routine!.id,
            'Viernes'
        );

        expect(templateDay).toBeDefined();
        const templateDayId = templateDay!.id;
        const templateExCount = templateDay!.ejercicios_programados.length;
        const templateSeriesCount = templateDay!.ejercicios_programados.reduce(
            (acc: number, ex: any) => acc + (ex.series?.length || 0), 0
        );

        console.log('📋 Template:', templateDayId);
        console.log('   Exercises:', templateExCount, 'Series:', templateSeriesCount);

        // Call startDailyWorkout — this is EXACTLY what the app does
        const now = new Date();
        const { data: newWorkout, error } = await RoutineService.startDailyWorkout(
            templateDayId,
            now.toISOString(),
            now.toISOString()
        );

        console.log('📤 startDailyWorkout result:');
        console.log('   data:', newWorkout ? `ID=${newWorkout.id}` : 'NULL');
        console.log('   error:', error ? JSON.stringify(error) : 'NULL');

        // THE CRITICAL ASSERTIONS
        expect(error).toBeNull();
        expect(newWorkout).toBeDefined();
        expect(newWorkout!.id).toBeDefined();

        // VERIFY the workout exists in the database
        const { data: verified, error: verifyErr } = await supabase
            .from('rutinas_diarias')
            .select(`
                *,
                ejercicios_programados (
                    *,
                    series (*)
                )
            `)
            .eq('id', newWorkout!.id)
            .single();

        console.log('🔍 Verification:');
        console.log('   data:', verified ? `ID=${verified.id}` : 'NULL');
        console.log('   error:', verifyErr ? JSON.stringify(verifyErr) : 'NULL');

        expect(verifyErr).toBeNull();
        expect(verified).toBeDefined();
        expect(verified!.id).toBe(newWorkout!.id);
        expect(verified!.nombre_dia).toBe('Viernes');
        expect(verified!.fecha_dia).not.toBeNull(); // Has a date (today)
        expect(verified!.hora_inicio).not.toBeNull();
        expect(verified!.completada).toBe(false);

        // Verify exercises were copied
        expect(verified!.ejercicios_programados.length).toBe(templateExCount);

        // Verify series were copied
        const newSeriesCount = verified!.ejercicios_programados.reduce(
            (acc: number, ex: any) => acc + (ex.series?.length || 0), 0
        );
        expect(newSeriesCount).toBe(templateSeriesCount);

        console.log('✅ VERIFIED in DB:');
        console.log(`   Workout: ${verified!.id} (fecha: ${verified!.fecha_dia})`);
        console.log(`   Exercises: ${verified!.ejercicios_programados.length}`);
        console.log(`   Series: ${newSeriesCount}`);

        // CLEANUP: delete the created workout (CASCADE will delete exercises and series)
        const { error: delErr } = await supabase
            .from('rutinas_diarias')
            .delete()
            .eq('id', newWorkout!.id);

        expect(delErr).toBeNull();
        console.log('🧹 Cleanup: deleted workout', newWorkout!.id);

        // Verify template is untouched
        const { data: templateAfter } = await RoutineService.getRoutineDayByName(
            routine!.id,
            'Viernes'
        );
        expect(templateAfter!.ejercicios_programados.length).toBe(templateExCount);
        console.log('✅ Template untouched after cleanup');
    });
});
