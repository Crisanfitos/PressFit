/**
 * Tests Nivel 3: Rutinas Diarias
 * 
 * Tests sobre estados de rutinas diarias, cálculo de duración, etc.
 * Usa funciones de Niveles 1-2.
 */

import { TEST_USER } from '../setup/testSetup';
import {
    getRutinaDiariaEstado,
    calcularDuracionMinutos,
    getRutinaDiariaCompleta,
    getTestUserNormalRoutine
} from '../helpers/testHelpers';

describe('Nivel 3: Rutinas Diarias', () => {
    let rutinaNormal: any;

    beforeAll(async () => {
        rutinaNormal = await getTestUserNormalRoutine();
        if (!rutinaNormal) {
            throw new Error('No se encontró rutina normal de test');
        }
    });

    describe('Estados de Rutina Diaria', () => {
        it('estado PLANTILLA: fecha_dia = null', () => {
            const estado = getRutinaDiariaEstado({
                fecha_dia: null,
                hora_inicio: null,
                hora_fin: null
            });
            expect(estado).toBe('PLANTILLA');
        });

        it('estado PENDIENTE: tiene fecha pero no hora_inicio', () => {
            const estado = getRutinaDiariaEstado({
                fecha_dia: '2026-01-20',
                hora_inicio: null,
                hora_fin: null
            });
            expect(estado).toBe('PENDIENTE');
        });

        it('estado EN_PROGRESO: tiene hora_inicio pero no hora_fin', () => {
            const estado = getRutinaDiariaEstado({
                fecha_dia: '2026-01-20',
                hora_inicio: '2026-01-20T10:00:00Z',
                hora_fin: null
            });
            expect(estado).toBe('EN_PROGRESO');
        });

        it('estado COMPLETADA: tiene hora_inicio Y hora_fin', () => {
            const estado = getRutinaDiariaEstado({
                fecha_dia: '2026-01-20',
                hora_inicio: '2026-01-20T10:00:00Z',
                hora_fin: '2026-01-20T11:15:00Z'
            });
            expect(estado).toBe('COMPLETADA');
        });
    });

    describe('Cálculo de Duración', () => {
        it('debería calcular duración correctamente (75 minutos)', () => {
            const duracion = calcularDuracionMinutos(
                '2026-01-20T10:00:00Z',
                '2026-01-20T11:15:00Z'
            );
            expect(duracion).toBe(75);
        });

        it('debería calcular duraciones cortas (30 minutos)', () => {
            const duracion = calcularDuracionMinutos(
                '2026-01-20T10:00:00Z',
                '2026-01-20T10:30:00Z'
            );
            expect(duracion).toBe(30);
        });

        it('debería manejar duraciones largas (120 minutos)', () => {
            const duracion = calcularDuracionMinutos(
                '2026-01-20T10:00:00Z',
                '2026-01-20T12:00:00Z'
            );
            expect(duracion).toBe(120);
        });
    });

    describe('Días de Rutina Normal con Estados Reales', () => {
        it('debería tener un día COMPLETADO (Lunes)', () => {
            const lunes = rutinaNormal.rutinas_diarias.find(
                (d: any) => d.nombre_dia === 'Lunes'
            );

            expect(lunes).toBeDefined();
            const estado = getRutinaDiariaEstado(lunes);
            expect(estado).toBe('COMPLETADA');
            expect(lunes.completada).toBe(true);
        });

        it('debería tener un día EN_PROGRESO (Miércoles)', () => {
            const miercoles = rutinaNormal.rutinas_diarias.find(
                (d: any) => d.nombre_dia === 'Miércoles'
            );

            expect(miercoles).toBeDefined();
            const estado = getRutinaDiariaEstado(miercoles);
            expect(estado).toBe('EN_PROGRESO');
            expect(miercoles.hora_inicio).not.toBeNull();
            expect(miercoles.hora_fin).toBeNull();
        });

        it('debería tener un día PENDIENTE (Viernes)', () => {
            const viernes = rutinaNormal.rutinas_diarias.find(
                (d: any) => d.nombre_dia === 'Viernes'
            );

            expect(viernes).toBeDefined();
            const estado = getRutinaDiariaEstado(viernes);
            expect(estado).toBe('PENDIENTE');
            expect(viernes.hora_inicio).toBeNull();
        });
    });

    describe('Obtener Rutina Diaria Completa', () => {
        it('debería cargar día con ejercicios y series', async () => {
            const lunes = rutinaNormal.rutinas_diarias.find(
                (d: any) => d.nombre_dia === 'Lunes'
            );

            const diaCompleto = await getRutinaDiariaCompleta(lunes.id);

            expect(diaCompleto).toBeDefined();
            expect(diaCompleto.ejercicios_programados).toBeDefined();
            expect(diaCompleto.ejercicios_programados.length).toBeGreaterThan(0);

            // Cada ejercicio debería tener series
            diaCompleto.ejercicios_programados.forEach((ep: any) => {
                expect(ep.series).toBeDefined();
                expect(ep.series.length).toBeGreaterThan(0);
            });
        });

        it('ejercicios deberían estar ordenados por orden_ejecucion', async () => {
            const lunes = rutinaNormal.rutinas_diarias.find(
                (d: any) => d.nombre_dia === 'Lunes'
            );

            const diaCompleto = await getRutinaDiariaCompleta(lunes.id);

            for (let i = 1; i < diaCompleto.ejercicios_programados.length; i++) {
                const prev = diaCompleto.ejercicios_programados[i - 1].orden_ejecucion || 0;
                const curr = diaCompleto.ejercicios_programados[i].orden_ejecucion || 0;
                expect(curr).toBeGreaterThanOrEqual(prev);
            }
        });
    });
});
