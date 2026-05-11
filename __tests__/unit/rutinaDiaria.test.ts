/**
 * Unit Tests: Rutinas Diarias
 *
 * Tests pure state logic, duration calculation, and
 * RoutineService day methods with mocked Supabase.
 */

import { mockChain, resetMocks } from '../helpers/mockSupabase';
import {
    getRutinaDiariaEstado,
    calcularDuracionMinutos,
    createMockRutinaDiaria,
    createMockEjercicioProgramado,
} from '../helpers/testHelpers';

jest.mock('../../src/lib/supabase', () => ({
    supabase: require('../helpers/mockSupabase').mockSupabase,
}));

import { RoutineService } from '../../src/services/RoutineService';

describe('Rutinas Diarias', () => {
    beforeEach(() => { resetMocks(); });

    describe('getRutinaDiariaEstado (pure)', () => {
        it('PLANTILLA: fecha_dia = null', () => {
            expect(getRutinaDiariaEstado({ fecha_dia: null, hora_inicio: null, hora_fin: null })).toBe('PLANTILLA');
        });
        it('PENDIENTE: tiene fecha pero no hora_inicio', () => {
            expect(getRutinaDiariaEstado({ fecha_dia: '2026-01-20', hora_inicio: null, hora_fin: null })).toBe('PENDIENTE');
        });
        it('EN_PROGRESO: tiene hora_inicio pero no hora_fin', () => {
            expect(getRutinaDiariaEstado({ fecha_dia: '2026-01-20', hora_inicio: '2026-01-20T10:00:00Z', hora_fin: null })).toBe('EN_PROGRESO');
        });
        it('COMPLETADA: tiene ambas horas', () => {
            expect(getRutinaDiariaEstado({ fecha_dia: '2026-01-20', hora_inicio: '2026-01-20T10:00:00Z', hora_fin: '2026-01-20T11:15:00Z' })).toBe('COMPLETADA');
        });
    });

    describe('calcularDuracionMinutos (pure)', () => {
        it('75 min', () => { expect(calcularDuracionMinutos('2026-01-20T10:00:00Z', '2026-01-20T11:15:00Z')).toBe(75); });
        it('30 min', () => { expect(calcularDuracionMinutos('2026-01-20T10:00:00Z', '2026-01-20T10:30:00Z')).toBe(30); });
        it('120 min', () => { expect(calcularDuracionMinutos('2026-01-20T10:00:00Z', '2026-01-20T12:00:00Z')).toBe(120); });
        it('0 min', () => { expect(calcularDuracionMinutos('2026-01-20T10:00:00Z', '2026-01-20T10:00:00Z')).toBe(0); });
    });

    describe('getRoutineDayById', () => {
        it('should sort exercises by orden_ejecucion', async () => {
            const mockDay = createMockRutinaDiaria({
                ejercicios_programados: [
                    createMockEjercicioProgramado({ id: 'ep-2', orden_ejecucion: 2 }),
                    createMockEjercicioProgramado({ id: 'ep-1', orden_ejecucion: 1 }),
                ],
            });
            mockChain.single.mockResolvedValueOnce({ data: mockDay, error: null });
            const result = await RoutineService.getRoutineDayById('day-001');
            expect(result.error).toBeNull();
            expect(result.data!.ejercicios_programados![0].orden_ejecucion).toBe(1);
        });

        it('should return error on failure', async () => {
            mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Not found') });
            const result = await RoutineService.getRoutineDayById('bad-id');
            expect(result.error).toBeDefined();
            expect(result.data).toBeNull();
        });
    });

    describe('getRoutineDayByDate', () => {
        it('should return day matching date', async () => {
            mockChain.single.mockResolvedValueOnce({ data: createMockRutinaDiaria({ fecha_dia: '2026-01-20' }), error: null });
            const result = await RoutineService.getRoutineDayByDate('routine-001', '2026-01-20');
            expect(result.error).toBeNull();
            expect(result.data).toBeDefined();
        });

        it('should return null for PGRST116', async () => {
            mockChain.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
            const result = await RoutineService.getRoutineDayByDate('routine-001', '2099-12-31');
            expect(result.error).toBeNull();
            expect(result.data).toBeNull();
        });
    });

    describe('getRoutineDayByName', () => {
        it('should return template day by name', async () => {
            mockChain.single.mockResolvedValueOnce({ data: createMockRutinaDiaria({ nombre_dia: 'Lunes', fecha_dia: null }), error: null });
            const result = await RoutineService.getRoutineDayByName('routine-001', 'Lunes');
            expect(result.error).toBeNull();
            expect(result.data!.nombre_dia).toBe('Lunes');
            expect(result.data!.fecha_dia).toBeNull();
        });
    });
});
