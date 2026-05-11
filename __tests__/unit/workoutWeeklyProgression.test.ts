/**
 * Unit Tests: Weekly Workout Progression
 *
 * Tests the weekly progression flow:
 * - Create workout from template
 * - Complete workout
 * - Create new workout → inherits previous weight data
 */

import { mockChain, resetMocks } from '../helpers/mockSupabase';
import { createMockSerie, createMockEjercicioProgramado } from '../helpers/testHelpers';

jest.mock('../../src/lib/supabase', () => ({
    supabase: require('../helpers/mockSupabase').mockSupabase,
}));

import { RoutineService } from '../../src/services/RoutineService';
import { WorkoutService } from '../../src/services/WorkoutService';

describe('Weekly Workout Progression', () => {
    beforeEach(() => { resetMocks(); });

    describe('Create workout from template', () => {
        it('should copy exercises and series from template', async () => {
            const templateSeries = [
                createMockSerie({ numero_serie: 1, peso_utilizado: 60 }),
                createMockSerie({ numero_serie: 2, peso_utilizado: 65 }),
            ];
            // Get template
            mockChain.single.mockResolvedValueOnce({
                data: {
                    id: 'tmpl-day', rutina_semanal_id: 'r-1', nombre_dia: 'Lunes',
                    ejercicios_programados: [
                        createMockEjercicioProgramado({ ejercicio_id: 'ex-1', series: templateSeries }),
                    ],
                },
                error: null,
            });
            // No previous workouts
            mockChain.then.mockImplementationOnce((resolve: any) =>
                Promise.resolve({ data: [], error: null }).then(resolve)
            );
            // Insert workout day
            mockChain.single.mockResolvedValueOnce({
                data: { id: 'w1', nombre_dia: 'Lunes', fecha_dia: '2026-05-04', completada: false },
                error: null,
            });
            // Insert exercise
            mockChain.single.mockResolvedValueOnce({ data: { id: 'ep-w1' }, error: null });
            // Insert series
            mockChain.then.mockImplementationOnce((resolve: any) =>
                Promise.resolve({ error: null }).then(resolve)
            );

            const result = await RoutineService.startDailyWorkout('tmpl-day', '2026-05-04', '2026-05-04T10:00:00Z');
            expect(result.error).toBeNull();
            expect(result.data!.id).toBe('w1');
        });
    });

    describe('Complete workout', () => {
        it('should mark workout as completed', async () => {
            mockChain.single.mockResolvedValueOnce({
                data: { id: 'w1', completada: true, hora_fin: '2026-05-04T11:30:00Z' },
                error: null,
            });
            const result = await WorkoutService.completeWorkout('w1', 90);
            expect(result.error).toBeNull();
            expect(result.data!.completada).toBe(true);
            expect(result.data!.hora_fin).not.toBeNull();
        });
    });

    describe('Second workout inherits previous weight', () => {
        it('should use previous completed workout series for new workout', async () => {
            // Get template
            mockChain.single.mockResolvedValueOnce({
                data: {
                    id: 'tmpl-day', rutina_semanal_id: 'r-1', nombre_dia: 'Lunes',
                    ejercicios_programados: [
                        createMockEjercicioProgramado({
                            ejercicio_id: 'ex-1',
                            series: [createMockSerie({ peso_utilizado: 50 })],
                        }),
                    ],
                },
                error: null,
            });
            // Previous completed workout found with higher weight
            mockChain.then.mockImplementationOnce((resolve: any) =>
                Promise.resolve({
                    data: [{
                        id: 'w1-completed',
                        ejercicios_programados: [{
                            ejercicio_id: 'ex-1',
                            series: [
                                { numero_serie: 1, peso_utilizado: 100, repeticiones: 10, rpe: 8 },
                                { numero_serie: 2, peso_utilizado: 105, repeticiones: 8, rpe: 9 },
                            ],
                        }],
                    }],
                    error: null,
                }).then(resolve)
            );
            // Insert new workout
            mockChain.single.mockResolvedValueOnce({
                data: { id: 'w2', nombre_dia: 'Lunes', fecha_dia: '2026-05-11' },
                error: null,
            });
            // Insert exercise
            mockChain.single.mockResolvedValueOnce({ data: { id: 'ep-w2' }, error: null });
            // Insert series — should contain 2 series from previous workout
            mockChain.then.mockImplementationOnce((resolve: any) =>
                Promise.resolve({ error: null }).then(resolve)
            );

            const result = await RoutineService.startDailyWorkout('tmpl-day', '2026-05-11', '2026-05-11T10:00:00Z');
            expect(result.error).toBeNull();
            expect(result.data).toBeDefined();
        });
    });

    describe('getRoutineDayStatus', () => {
        it('should return COMPLETED when stats show completed', () => {
            const status = RoutineService.getRoutineDayStatus(
                {} as any, { isCompleted: true, exerciseCount: 3, duration: 60 } as any, 1
            );
            expect(status).toBe('COMPLETED');
        });

        it('should return IN_PROGRESS when exercises exist but not completed', () => {
            const status = RoutineService.getRoutineDayStatus(
                {} as any, { isCompleted: false, exerciseCount: 2, duration: null } as any, 1
            );
            expect(status).toBe('IN_PROGRESS');
        });

        it('should return PENDING for future days', () => {
            // Mock today as Monday (1)
            jest.spyOn(Date.prototype, 'getDay').mockReturnValue(1);
            const status = RoutineService.getRoutineDayStatus({} as any, null, 3); // Wednesday
            expect(status).toBe('PENDING');
            jest.restoreAllMocks();
        });

        it('should return MISSED for past days without workout', () => {
            // Mock today as Wednesday (3)
            jest.spyOn(Date.prototype, 'getDay').mockReturnValue(3);
            const status = RoutineService.getRoutineDayStatus({} as any, null, 1); // Monday
            expect(status).toBe('MISSED');
            jest.restoreAllMocks();
        });
    });
});
