/**
 * Unit Tests: Rutinas Semanales
 *
 * Tests RoutineService weekly methods and date calculations with mocked Supabase.
 */

import { mockChain, resetMocks } from '../helpers/mockSupabase';
import { getMondayOfCurrentWeek, parseLocalDate, createMockRutinaSemanal } from '../helpers/testHelpers';

jest.mock('../../src/lib/supabase', () => ({
    supabase: require('../helpers/mockSupabase').mockSupabase,
}));

import { RoutineService } from '../../src/services/RoutineService';

describe('Rutinas Semanales', () => {
    beforeEach(() => { resetMocks(); });

    describe('Date Calculations', () => {
        it('getMondayOfCurrentWeek returns YYYY-MM-DD format', () => {
            const monday = getMondayOfCurrentWeek();
            expect(monday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('getMondayOfCurrentWeek returns a Monday (day 1)', () => {
            const monday = getMondayOfCurrentWeek();
            // Use parseLocalDate to avoid UTC midnight shift
            const date = parseLocalDate(monday);
            expect(date.getDay()).toBe(1);
        });

        it('RoutineService.getStartOfWeek returns valid ISO string', () => {
            const iso = RoutineService.getStartOfWeek();
            expect(new Date(iso).getTime()).toBeGreaterThan(0);
        });

        it('RoutineService.getMondayOfCurrentWeek returns YYYY-MM-DD', () => {
            const date = RoutineService.getMondayOfCurrentWeek();
            expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe('getUserRoutines', () => {
        it('should return user routines', async () => {
            mockChain.then.mockImplementationOnce((resolve: any) =>
                Promise.resolve({ data: [createMockRutinaSemanal()], error: null }).then(resolve)
            );
            const result = await RoutineService.getUserRoutines('user-1');
            expect(result.error).toBeNull();
            expect(result.data).toHaveLength(1);
        });

        it('should return error on failure', async () => {
            mockChain.then.mockImplementationOnce((resolve: any) =>
                Promise.resolve({ data: null, error: new Error('DB Error') }).then(resolve)
            );
            const result = await RoutineService.getUserRoutines('user-1');
            expect(result.error).toBeDefined();
        });
    });

    describe('createWeeklyRoutine', () => {
        it('should create routine and 7 days', async () => {
            // Insert routine
            mockChain.single.mockResolvedValueOnce({ data: { id: 'new-r' }, error: null });
            // Insert 7 days (thenable, no single)
            mockChain.then.mockImplementationOnce((resolve: any) =>
                Promise.resolve({ error: null }).then(resolve)
            );
            const result = await RoutineService.createWeeklyRoutine({ nombre: 'Push Pull Legs' });
            expect(result.error).toBeNull();
            expect(result.data!.id).toBe('new-r');
        });

        it('should return error if insert fails', async () => {
            mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Insert failed') });
            const result = await RoutineService.createWeeklyRoutine({ nombre: 'Test' });
            expect(result.error).toBeDefined();
        });
    });

    describe('updateWeeklyRoutine', () => {
        it('should update and return routine', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { id: 'r-1', activa: true }, error: null });
            const result = await RoutineService.updateWeeklyRoutine('r-1', { activa: true });
            expect(result.error).toBeNull();
            expect(result.data!.activa).toBe(true);
        });
    });

    describe('deleteWeeklyRoutine', () => {
        it('should delete without error', async () => {
            mockChain.then.mockImplementationOnce((resolve: any) =>
                Promise.resolve({ error: null }).then(resolve)
            );
            const result = await RoutineService.deleteWeeklyRoutine('r-1');
            expect(result.error).toBeNull();
        });
    });

    describe('getAllWeeklyRoutines', () => {
        it('should list all routines for user', async () => {
            mockChain.then.mockImplementationOnce((resolve: any) =>
                Promise.resolve({ data: [{ id: 'R1' }, { id: 'R2' }], error: null }).then(resolve)
            );
            const result = await RoutineService.getAllWeeklyRoutines('user-1');
            expect(result.data).toHaveLength(2);
        });
    });

    describe('getWeeklyRoutineWithDays', () => {
        it('should return routine with sorted exercises and series', async () => {
            const mockData = createMockRutinaSemanal({
                rutinas_diarias: [{
                    nombre_dia: 'Lunes',
                    ejercicios_programados: [
                        { id: 'ex-2', orden_ejecucion: 2, series: [{ numero_serie: 2 }, { numero_serie: 1 }] },
                        { id: 'ex-1', orden_ejecucion: 1, series: null },
                    ],
                }],
            });
            mockChain.single.mockResolvedValueOnce({ data: mockData, error: null });
            const res = await RoutineService.getWeeklyRoutineWithDays('routine-001');
            expect(res.error).toBeNull();
            expect(res.data?.rutinas_diarias?.[0].ejercicios_programados?.[0].id).toBe('ex-1');
        });
    });

    describe('setActiveRoutine', () => {
        it('should deactivate all then activate target', async () => {
            // Deactivate all (thenable)
            mockChain.then.mockImplementationOnce((resolve: any) =>
                Promise.resolve({ data: [], error: null }).then(resolve)
            );
            // Activate target
            mockChain.single.mockResolvedValueOnce({ data: { id: 'r-target', activa: true }, error: null });
            const result = await RoutineService.setActiveRoutine('user-1', 'r-target');
            expect(result.error).toBeNull();
            expect(result.data!.activa).toBe(true);
        });
    });

    describe('updateRoutineDayDescription', () => {
        it('should update description', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { id: 'd-1', descripcion: 'Día de pecho' }, error: null });
            const result = await RoutineService.updateRoutineDayDescription('d-1', 'Día de pecho');
            expect(result.data!.descripcion).toBe('Día de pecho');
        });
    });
});
