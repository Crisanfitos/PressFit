/**
 * Tests Nivel 2: Ejercicios Programados
 * 
 * Tests sobre ejercicios_programados con sus series asociadas.
 * Usa funciones del Nivel 1.
 */

import { TEST_USER } from '../setup/testSetup';
import {
    getEjercicioProgramadoWithSeries,
    getTestUserTemplate,
    getTestUserNormalRoutine
} from '../helpers/testHelpers';

describe('Nivel 2: Ejercicios Programados', () => {
    let templateEjercicioId: string;
    let normalEjercicioId: string;

    beforeAll(async () => {
        // Obtener ejercicios del dataset de test
        const template = await getTestUserTemplate();
        const normal = await getTestUserNormalRoutine();

        if (!template) throw new Error('No se encontró plantilla de test');
        if (!normal) throw new Error('No se encontró rutina normal de test');

        const templateDia = template.rutinas_diarias.find(
            (d: any) => d.ejercicios_programados?.length > 0
        );
        const normalDia = normal.rutinas_diarias.find(
            (d: any) => d.ejercicios_programados?.length > 0
        );

        templateEjercicioId = templateDia?.ejercicios_programados[0].id;
        normalEjercicioId = normalDia?.ejercicios_programados[0].id;
    });

    describe('Obtener Ejercicio con Series', () => {
        it('debería obtener ejercicio de plantilla con sus series', async () => {
            const ep = await getEjercicioProgramadoWithSeries(templateEjercicioId);

            expect(ep).toBeDefined();
            expect(ep.id).toBe(templateEjercicioId);
            expect(ep.ejercicio).toBeDefined();
            expect(ep.ejercicio.titulo).toBeDefined();
            expect(ep.series).toBeDefined();
            expect(Array.isArray(ep.series)).toBe(true);
            expect(ep.series.length).toBeGreaterThan(0);
        });

        it('las series deberían estar ordenadas por numero_serie', async () => {
            const ep = await getEjercicioProgramadoWithSeries(templateEjercicioId);

            for (let i = 1; i < ep.series.length; i++) {
                expect(ep.series[i].numero_serie).toBeGreaterThan(
                    ep.series[i - 1].numero_serie
                );
            }
        });

        it('debería incluir datos de peso y repeticiones', async () => {
            const ep = await getEjercicioProgramadoWithSeries(templateEjercicioId);

            // Al menos una serie debería tener datos
            const serieConDatos = ep.series.find(
                (s: any) => s.peso_utilizado !== null && s.repeticiones !== null
            );

            expect(serieConDatos).toBeDefined();
            expect(typeof serieConDatos.peso_utilizado).toBe('number');
            expect(typeof serieConDatos.repeticiones).toBe('number');
        });
    });

    describe('Ejercicio de Rutina Normal vs Plantilla', () => {
        it('ejercicio de rutina normal debería tener datos reales', async () => {
            const ep = await getEjercicioProgramadoWithSeries(normalEjercicioId);

            expect(ep).toBeDefined();
            expect(ep.series.length).toBeGreaterThan(0);

            // El primer ejercicio de la rutina normal tiene datos reales
            const serieConDatos = ep.series.find(
                (s: any) => s.peso_utilizado !== null
            );
            expect(serieConDatos).toBeDefined();
        });

        it('datos de ejercicio normal deberían diferir de plantilla', async () => {
            const epTemplate = await getEjercicioProgramadoWithSeries(templateEjercicioId);
            const epNormal = await getEjercicioProgramadoWithSeries(normalEjercicioId);

            // Los IDs deberían ser diferentes
            expect(epTemplate.id).not.toBe(epNormal.id);

            // Pero ambos tienen series
            expect(epTemplate.series.length).toBeGreaterThan(0);
            expect(epNormal.series.length).toBeGreaterThan(0);
        });
    });
});
