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

    describe('Obtener Rutina Diaria Completa', () => {
        it('debería cargar día con ejercicios y series, si existe rutina', async () => {
            if (!rutinaNormal || !rutinaNormal.rutinas_diarias || rutinaNormal.rutinas_diarias.length === 0) {
                console.warn('Skipping test due to missing normal routine');
                return;
            }

            const primerDia = rutinaNormal.rutinas_diarias[0];
            const diaCompleto = await getRutinaDiariaCompleta(primerDia.id);

            expect(diaCompleto).toBeDefined();
            expect(diaCompleto.ejercicios_programados).toBeDefined();

            if (diaCompleto.ejercicios_programados.length > 0) {
                // Cada ejercicio debería tener series
                diaCompleto.ejercicios_programados.forEach((ep: any) => {
                    expect(ep.series).toBeDefined();
                });
            }
        });

        it('ejercicios deberían estar ordenados por orden_ejecucion, si existen', async () => {
            if (!rutinaNormal || !rutinaNormal.rutinas_diarias || rutinaNormal.rutinas_diarias.length === 0) {
                console.warn('Skipping test due to missing normal routine');
                return;
            }

            const primerDia = rutinaNormal.rutinas_diarias[0];
            const diaCompleto = await getRutinaDiariaCompleta(primerDia.id);

            if (diaCompleto.ejercicios_programados && diaCompleto.ejercicios_programados.length > 0) {
                for (let i = 1; i < diaCompleto.ejercicios_programados.length; i++) {
                    const prev = diaCompleto.ejercicios_programados[i - 1].orden_ejecucion || 0;
                    const curr = diaCompleto.ejercicios_programados[i].orden_ejecucion || 0;
                    expect(curr).toBeGreaterThanOrEqual(prev);
                }
            }
        });
    });
});

