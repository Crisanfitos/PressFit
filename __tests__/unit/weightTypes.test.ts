/**
 * Unit Tests: Weight Types (tipo_peso)
 *
 * Tests TipoPeso type definitions and WorkoutService weight type methods.
 */

import { mockChain, resetMocks } from '../helpers/mockSupabase';

jest.mock('../../src/lib/supabase', () => ({
    supabase: require('../helpers/mockSupabase').mockSupabase,
}));

import { TipoPeso, TIPO_PESO_LABELS, TIPO_PESO_SHORT_LABELS, TIPO_PESO_ICONS } from '../../src/types/setTypes';
import { WorkoutService } from '../../src/services/WorkoutService';

describe('Weight Types (tipo_peso)', () => {
    beforeEach(() => { resetMocks(); });

    describe('Type definitions', () => {
        it('TIPO_PESO_LABELS should have all 3 types', () => {
            expect(TIPO_PESO_LABELS.total).toBe('Peso Total');
            expect(TIPO_PESO_LABELS.por_lado).toBe('Por Lado');
            expect(TIPO_PESO_LABELS.corporal).toBe('Peso Corporal');
        });

        it('TIPO_PESO_SHORT_LABELS should have short labels', () => {
            expect(TIPO_PESO_SHORT_LABELS.total).toBe('KG');
            expect(TIPO_PESO_SHORT_LABELS.por_lado).toBe('KG/lado');
            expect(TIPO_PESO_SHORT_LABELS.corporal).toBe('BW');
        });

        it('TIPO_PESO_ICONS should have icon names', () => {
            expect(TIPO_PESO_ICONS.total).toBe('fitness-center');
            expect(TIPO_PESO_ICONS.por_lado).toBe('sync-alt');
            expect(TIPO_PESO_ICONS.corporal).toBe('accessibility-new');
        });

        it('all maps should have exactly 3 keys', () => {
            expect(Object.keys(TIPO_PESO_LABELS)).toHaveLength(3);
            expect(Object.keys(TIPO_PESO_SHORT_LABELS)).toHaveLength(3);
            expect(Object.keys(TIPO_PESO_ICONS)).toHaveLength(3);
        });
    });

    describe('WorkoutService.updateWeightType', () => {
        it('should update to por_lado', async () => {
            mockChain.single.mockResolvedValueOnce({
                data: { id: 'ep-1', tipo_peso: 'por_lado' },
                error: null,
            });
            const result = await WorkoutService.updateWeightType('ep-1', 'por_lado');
            expect(result.error).toBeNull();
            expect(result.data!.tipo_peso).toBe('por_lado');
        });

        it('should update to corporal', async () => {
            mockChain.single.mockResolvedValueOnce({
                data: { id: 'ep-1', tipo_peso: 'corporal' },
                error: null,
            });
            const result = await WorkoutService.updateWeightType('ep-1', 'corporal');
            expect(result.error).toBeNull();
            expect(result.data!.tipo_peso).toBe('corporal');
        });

        it('should update to total', async () => {
            mockChain.single.mockResolvedValueOnce({
                data: { id: 'ep-1', tipo_peso: 'total' },
                error: null,
            });
            const result = await WorkoutService.updateWeightType('ep-1', 'total');
            expect(result.error).toBeNull();
            expect(result.data!.tipo_peso).toBe('total');
        });

        it('should return error on failure', async () => {
            mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Update failed') });
            const result = await WorkoutService.updateWeightType('ep-1', 'total');
            expect(result.error).toBeDefined();
        });
    });

    describe('tipo_peso in getWorkoutDetails', () => {
        it('should include tipo_peso in exercise data', async () => {
            mockChain.single.mockResolvedValueOnce({
                data: {
                    id: 'workout-1',
                    ejercicios_programados: [
                        { id: 'ep-1', tipo_peso: 'total', orden_ejecucion: 1, series: [] },
                        { id: 'ep-2', tipo_peso: 'por_lado', orden_ejecucion: 2, series: [] },
                    ],
                },
                error: null,
            });
            const result = await WorkoutService.getWorkoutDetails('workout-1');
            expect(result.error).toBeNull();
            expect(result.data!.ejercicios_programados![0].tipo_peso).toBe('total');
            expect(result.data!.ejercicios_programados![1].tipo_peso).toBe('por_lado');
        });
    });

    describe('tipo_peso in getExerciseHistory', () => {
        it('should include tipo_peso in history entries', async () => {
            mockChain.then.mockImplementationOnce((resolve: any) =>
                Promise.resolve({
                    data: [
                        {
                            id: 's1', numero_serie: 1, peso_utilizado: 60, repeticiones: 10, rpe: 7,
                            ejercicios_programados: {
                                tipo_peso: 'por_lado',
                                rutinas_diarias: { fecha_dia: '2026-05-01', id: 'rd-1', rutinas_semanales: { usuario_id: 'user-1' } },
                            },
                        },
                    ],
                    error: null,
                }).then(resolve)
            );
            const result = await WorkoutService.getExerciseHistory('user-1', 'ex-1');
            expect(result.error).toBeNull();
            expect(result.data![0].tipo_peso).toBe('por_lado');
        });
    });
});
