/**
 * Flow 2-4: Empezar, Cargar y Finalizar Entrenamiento
 * 
 * Verifica el ciclo completo de un entrenamiento:
 * - Flow 2: Empezar entrenamiento (crear rutina diaria con fecha y hora)
 * - Flow 3: Cargar datos del workout (ejercicios y series)
 * - Flow 4: Finalizar entrenamiento (marcar como completado)
 */

import { RoutineService } from '../../src/services/RoutineService';
import { TEST_USER } from '../setup/testSetup';
import {
    getRutinaDiariaEstado,
    calcularDuracionMinutos,
    getTestUserTemplate
} from '../helpers/testHelpers';
import { supabase } from '../../src/lib/supabase';

describe('Flow 2-4: Ciclo de Entrenamiento', () => {
    let template: any;
    let templateDayId: string;
    let createdWorkoutId: string | null = null;

    beforeAll(async () => {
        template = await getTestUserTemplate();
        if (!template) throw new Error('No se encontró plantilla');

        // Encontrar un día de plantilla con ejercicios
        const diaConEjercicios = template.rutinas_diarias.find(
            (d: any) => d.ejercicios_programados?.length > 0
        );

        if (!diaConEjercicios) {
            throw new Error('No hay días con ejercicios en la plantilla');
        }

        templateDayId = diaConEjercicios.id;
    });

    afterAll(async () => {
        // Limpiar workout creado durante el test
        if (createdWorkoutId) {
            await supabase
                .from('rutinas_diarias')
                .delete()
                .eq('id', createdWorkoutId);
        }
    });

    describe('Flujo 2: Empezar Entrenamiento', () => {
        it('debería crear rutina diaria con fecha y hora_inicio', async () => {
            const today = new Date().toISOString().split('T')[0];
            const now = new Date().toISOString();

            const { data, error } = await RoutineService.startDailyWorkout(
                templateDayId,
                today,
                now
            );

            expect(error).toBeNull();
            expect(data).toBeDefined();

            createdWorkoutId = data!.id;

            // Verificar campos
            expect(data!.fecha_dia).toBe(today);
            expect(data!.hora_inicio).not.toBeNull();
            expect(data!.completada).toBe(false);
        });

        it('el nuevo workout debería estar EN_PROGRESO', async () => {
            const { data } = await supabase
                .from('rutinas_diarias')
                .select('*')
                .eq('id', createdWorkoutId)
                .single();

            const estado = getRutinaDiariaEstado(data);
            expect(estado).toBe('EN_PROGRESO');
        });
    });

    describe('Flujo 3: Cargar Datos del Workout', () => {
        it('debería copiar ejercicios de la plantilla', async () => {
            const { data } = await RoutineService.getRoutineDayById(createdWorkoutId!);

            expect(data).toBeDefined();
            expect(data!.ejercicios_programados).toBeDefined();
            expect(data!.ejercicios_programados.length).toBeGreaterThan(0);
        });

        it('ejercicios deberían tener datos del catálogo', async () => {
            const { data } = await RoutineService.getRoutineDayById(createdWorkoutId!);

            data!.ejercicios_programados.forEach((ep: any) => {
                expect(ep.ejercicio).toBeDefined();
                expect(ep.ejercicio.titulo).toBeDefined();
            });
        });

        it('debería copiar series de la plantilla', async () => {
            const { data: workout } = await supabase
                .from('rutinas_diarias')
                .select(`
                    *,
                    ejercicios_programados(
                        *,
                        series(*)
                    )
                `)
                .eq('id', createdWorkoutId)
                .single();

            expect(workout).toBeDefined();

            // Al menos un ejercicio debería tener series
            const ejercicioConSeries = workout.ejercicios_programados.find(
                (ep: any) => ep.series?.length > 0
            );
            expect(ejercicioConSeries).toBeDefined();
        });
    });

    describe('Flujo 4: Finalizar Entrenamiento', () => {
        it('debería marcar como completado con hora_fin', async () => {
            const hora_fin = new Date().toISOString();

            const { data, error } = await supabase
                .from('rutinas_diarias')
                .update({
                    completada: true,
                    hora_fin: hora_fin
                })
                .eq('id', createdWorkoutId)
                .select()
                .single();

            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(data.completada).toBe(true);
            expect(data.hora_fin).not.toBeNull();
        });

        it('el workout finalizado debería estar COMPLETADA', async () => {
            const { data } = await supabase
                .from('rutinas_diarias')
                .select('*')
                .eq('id', createdWorkoutId)
                .single();

            const estado = getRutinaDiariaEstado(data);
            expect(estado).toBe('COMPLETADA');
        });

        it('debería poder calcular duración del entrenamiento', async () => {
            const { data } = await supabase
                .from('rutinas_diarias')
                .select('hora_inicio, hora_fin')
                .eq('id', createdWorkoutId)
                .single();

            const duracion = calcularDuracionMinutos(data.hora_inicio, data.hora_fin);

            // Debería ser un número positivo (aunque pequeño para test)
            expect(duracion).toBeGreaterThanOrEqual(0);
        });
    });
});
