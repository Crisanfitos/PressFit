import { PresetRoutineService } from '../../src/services/PresetRoutineService';
import presetData from '../../src/assets/data/presetRoutines.json';

describe('PresetRoutineService Unit Tests', () => {
    describe('JSON Seed Data Integrity', () => {
        test('contains at least 7 preset routines', () => {
            expect(presetData.length).toBeGreaterThanOrEqual(7);
        });

        test('all routines have valid required fields and at least one workout day', () => {
            presetData.forEach((routine) => {
                expect(routine.id).toBeDefined();
                expect(typeof routine.id).toBe('string');
                expect(routine.nombre).toBeDefined();
                expect(routine.descripcion).toBeDefined();
                expect(routine.categoria).toBeDefined();
                expect(typeof routine.dias_por_semana).toBe('number');
                expect(routine.rutinas_diarias.length).toBeGreaterThan(0);

                routine.rutinas_diarias.forEach((day) => {
                    expect(day.nombre_dia).toBeDefined();
                    expect(typeof day.orden).toBe('number');
                    expect(day.ejercicios.length).toBeGreaterThan(0);

                    day.ejercicios.forEach((ex) => {
                        expect(ex.nombre_ejercicio).toBeDefined();
                        expect(ex.grupo_muscular_principal).toBeDefined();
                        expect(ex.series.length).toBeGreaterThan(0);
                    });
                });
            });
        });
    });

    describe('getAllPresets', () => {
        test('returns all preset routines without error', () => {
            const res = PresetRoutineService.getAllPresets();
            expect(res.error).toBeNull();
            expect(res.data).not.toBeNull();
            expect(res.data?.length).toBe(presetData.length);
        });
    });

    describe('getPresetById', () => {
        test('returns correct preset routine for valid ID', () => {
            const res = PresetRoutineService.getPresetById('preset-ppl-6d');
            expect(res.error).toBeNull();
            expect(res.data).not.toBeNull();
            expect(res.data?.id).toBe('preset-ppl-6d');
            expect(res.data?.nombre).toContain('Push / Pull / Legs');
        });

        test('returns null for non-existent ID', () => {
            const res = PresetRoutineService.getPresetById('invalid-preset-id');
            expect(res.error).toBeNull();
            expect(res.data).toBeNull();
        });
    });

    describe('filterPresets', () => {
        test('filters by category correctly', () => {
            const res = PresetRoutineService.filterPresets({ categoria: 'Hipertrofia' });
            expect(res.error).toBeNull();
            expect(res.data).not.toBeNull();
            expect(res.data?.every((r) => r.categoria === 'Hipertrofia')).toBe(true);
            expect(res.data?.length).toBeGreaterThanOrEqual(2);
        });

        test('filters by days per week correctly', () => {
            const res = PresetRoutineService.filterPresets({ dias_por_semana: 4 });
            expect(res.error).toBeNull();
            expect(res.data).not.toBeNull();
            expect(res.data?.every((r) => r.dias_por_semana === 4)).toBe(true);
            expect(res.data?.length).toBe(3); // Torso/Pierna, PHUL, Glúteo 4D
        });

        test('filters by level correctly', () => {
            const res = PresetRoutineService.filterPresets({ nivel: 'Principiante' });
            expect(res.error).toBeNull();
            expect(res.data).not.toBeNull();
            expect(res.data?.every((r) => r.nivel === 'Principiante')).toBe(true);
        });

        test('combines multiple filter criteria', () => {
            const res = PresetRoutineService.filterPresets({
                categoria: 'Fuerza',
                dias_por_semana: 4,
                nivel: 'Avanzado',
            });
            expect(res.error).toBeNull();
            expect(res.data).not.toBeNull();
            expect(res.data?.length).toBe(1);
            expect(res.data?.[0].id).toBe('preset-phul-4d');
        });

        test('returns empty array when no presets match criteria', () => {
            const res = PresetRoutineService.filterPresets({
                categoria: 'NonExistentCategory',
            });
            expect(res.error).toBeNull();
            expect(res.data).toEqual([]);
        });
    });
});
