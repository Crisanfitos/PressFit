/**
 * Flow 1: Ver Día en Calendario (WorkoutDayScreen)
 * 
 * Verifica los estados posibles de un día en el calendario:
 * - PLANTILLA: fecha_dia = null
 * - PENDIENTE: tiene fecha pero no hora_inicio
 * - EN_PROGRESO: hora_inicio existe pero no hora_fin
 * - COMPLETADO: hora_inicio Y hora_fin existen
 */

import { RoutineService } from '../../src/services/RoutineService';
import { TEST_USER } from '../setup/testSetup';
import {
    getRutinaDiariaEstado,
    calcularDuracionMinutos,
    getTestUserTemplate,
    getTestUserNormalRoutine
} from '../helpers/testHelpers';

describe('Flow 1: Ver Día en Calendario', () => {
    let template: any;
    let rutinaNormal: any;

    beforeAll(async () => {
        template = await getTestUserTemplate();
        rutinaNormal = await getTestUserNormalRoutine();

        if (!template) throw new Error('No se encontró plantilla');
        if (!rutinaNormal) throw new Error('No se encontró rutina normal');
    });

    describe('Buscar Rutina por Fecha', () => {
        it('debería encontrar rutina diaria por fecha específica', async () => {
            const lunes = rutinaNormal.rutinas_diarias.find(
                (d: any) => d.nombre_dia === 'Lunes'
            );

            const { data } = await RoutineService.getRoutineDayByDate(
                rutinaNormal.id,
                lunes.fecha_dia
            );

            expect(data).toBeDefined();
            expect(data!.id).toBe(lunes.id);
        });

        it('debería retornar null si no existe rutina para esa fecha', async () => {
            const { data } = await RoutineService.getRoutineDayByDate(
                rutinaNormal.id,
                '2099-12-31'  // Fecha futura inexistente
            );

            expect(data).toBeNull();
        });
    });

    describe('Buscar Rutina por Nombre de Día (Plantilla)', () => {
        it('debería encontrar plantilla por nombre de día', async () => {
            const { data } = await RoutineService.getRoutineDayByName(
                template.id,
                'Lunes'
            );

            expect(data).toBeDefined();
            expect(data!.nombre_dia).toBe('Lunes');
            expect(data!.fecha_dia).toBeNull();  // Es plantilla
        });
    });

    describe('Estados de Visualización', () => {
        it('Lunes completado: estado COMPLETADA con duración', () => {
            const lunes = rutinaNormal.rutinas_diarias.find(
                (d: any) => d.nombre_dia === 'Lunes'
            );

            const estado = getRutinaDiariaEstado(lunes);
            expect(estado).toBe('COMPLETADA');

            // Debería poder calcular duración
            const duracion = calcularDuracionMinutos(lunes.hora_inicio, lunes.hora_fin);
            expect(duracion).toBeGreaterThan(0);
        });

        it('Miércoles en progreso: estado EN_PROGRESO sin duración aún', () => {
            const miercoles = rutinaNormal.rutinas_diarias.find(
                (d: any) => d.nombre_dia === 'Miércoles'
            );

            const estado = getRutinaDiariaEstado(miercoles);
            expect(estado).toBe('EN_PROGRESO');

            // No debería tener hora_fin
            expect(miercoles.hora_fin).toBeNull();
        });

        it('Viernes pendiente: estado PENDIENTE', () => {
            const viernes = rutinaNormal.rutinas_diarias.find(
                (d: any) => d.nombre_dia === 'Viernes'
            );

            const estado = getRutinaDiariaEstado(viernes);
            expect(estado).toBe('PENDIENTE');

            // No debería tener hora_inicio ni hora_fin
            expect(viernes.hora_inicio).toBeNull();
            expect(viernes.hora_fin).toBeNull();
        });
    });

    describe('Cálculo de Duración (Solo con hora_inicio Y hora_fin)', () => {
        it('debería calcular duración correctamente', () => {
            const lunes = rutinaNormal.rutinas_diarias.find(
                (d: any) => d.nombre_dia === 'Lunes'
            );

            // Solo si AMBOS campos existen
            if (lunes.hora_inicio && lunes.hora_fin) {
                const duracion = calcularDuracionMinutos(lunes.hora_inicio, lunes.hora_fin);
                expect(duracion).toBeGreaterThan(0);
                expect(duracion).toBeLessThan(300); // Menos de 5 horas = razonable
            }
        });

        it('NO debería requerir campo completada para calcular duración', () => {
            // La duración se calcula con hora_inicio y hora_fin
            // NO con el campo completada
            const lunes = rutinaNormal.rutinas_diarias.find(
                (d: any) => d.nombre_dia === 'Lunes'
            );

            // Simular que completada es false pero tenemos tiempos
            const mockDia = {
                ...lunes,
                completada: false // Ignorado en el cálculo de duración
            };

            if (mockDia.hora_inicio && mockDia.hora_fin) {
                const duracion = calcularDuracionMinutos(mockDia.hora_inicio, mockDia.hora_fin);
                expect(duracion).toBeGreaterThan(0);
            }
        });
    });

    describe('Ejercicios y Series por Día', () => {
        it('día completado debería tener ejercicios con series', async () => {
            const lunes = rutinaNormal.rutinas_diarias.find(
                (d: any) => d.nombre_dia === 'Lunes'
            );

            const { data } = await RoutineService.getRoutineDayById(lunes.id);

            expect(data).toBeDefined();
            expect(data!.ejercicios_programados).toBeDefined();
            expect(data!.ejercicios_programados.length).toBeGreaterThan(0);
        });
    });
});
