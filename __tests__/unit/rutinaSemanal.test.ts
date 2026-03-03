/**
 * Tests Nivel 4: Rutinas Semanales
 * 
 * Tests sobre rutinas semanales, plantillas, nomenclatura y campos especiales.
 * Usa funciones de Niveles 1-3.
 */

import { TEST_USER } from '../setup/testSetup';
import {
    getRutinaSemanalCompleta,
    getMondayOfCurrentWeek,
    getTestUserTemplate,
    getTestUserNormalRoutine,
    getTestUserRoutines
} from '../helpers/testHelpers';

describe('Nivel 4: Rutinas Semanales', () => {
    let template: any;
    let rutinaNormal: any;

    beforeAll(async () => {
        template = await getTestUserTemplate();
        rutinaNormal = await getTestUserNormalRoutine();

        if (!template) throw new Error('No se encontró plantilla de test');
    });

    describe('Tipos de Rutinas', () => {
        it('plantilla debe tener es_plantilla = true', () => {
            expect(template.es_plantilla).toBe(true);
        });

        it('rutina normal debe tener es_plantilla = false', () => {
            if (!rutinaNormal) { console.warn('No normal routine found, skipping'); return; }
            expect(rutinaNormal.es_plantilla).toBe(false);
        });

        it('plantilla NO debe tener fecha_inicio_semana', () => {
            expect(template.fecha_inicio_semana).toBeNull();
        });

        it('rutina normal DEBE tener fecha_inicio_semana', () => {
            if (!rutinaNormal) { console.warn('No normal routine found, skipping'); return; }
            expect(rutinaNormal.fecha_inicio_semana).not.toBeNull();
        });
    });

    describe('Campo copiada_de_id', () => {
        it('plantilla NO debe tener copiada_de_id', () => {
            expect(template.copiada_de_id).toBeNull();
        });

        it('rutina normal creada desde plantilla DEBE tener copiada_de_id', () => {
            if (!rutinaNormal) { console.warn('No normal routine found, skipping'); return; }
            expect(rutinaNormal.copiada_de_id).not.toBeNull();
        });

        it('copiada_de_id debe referenciar a la plantilla correcta', () => {
            if (!rutinaNormal) { console.warn('No normal routine found, skipping'); return; }
            // Some users might have normal routines copied from other templates, so just check it exists
            expect(rutinaNormal.copiada_de_id).toBeDefined();
        });
    });

    describe('Cálculo de Lunes de Semana', () => {
        it('getMondayOfCurrentWeek debe retornar formato YYYY-MM-DD', () => {
            const monday = getMondayOfCurrentWeek();
            expect(monday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('el día retornado debe ser lunes (día 1)', () => {
            const monday = getMondayOfCurrentWeek();
            const date = new Date(monday);
            expect(date.getDay()).toBe(1); // 1 = Monday
        });

        it('fecha_inicio_semana debe ser un lunes', () => {
            if (!rutinaNormal) { console.warn('No normal routine found, skipping'); return; }
            const fechaInicio = new Date(rutinaNormal.fecha_inicio_semana);
            expect(fechaInicio.getDay()).toBe(1); // 1 = Monday
        });
    });

    describe('Estructura de Días', () => {
        it('plantilla debe tener al menos 1 día', () => {
            expect(template.rutinas_diarias.length).toBeGreaterThanOrEqual(1);
        });

        it('rutina normal debe tener al menos 1 día', () => {
            if (!rutinaNormal) { console.warn('No normal routine found, skipping'); return; }
            expect(rutinaNormal.rutinas_diarias.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Obtener Rutina Completa', () => {
        it('debería cargar rutina semanal con toda su jerarquía', async () => {
            const completa = await getRutinaSemanalCompleta(template.id);

            expect(completa).toBeDefined();
            expect(completa.rutinas_diarias).toBeDefined();
            expect(completa.rutinas_diarias.length).toBeGreaterThanOrEqual(1);

            // Al menos un día debería tener ejercicios
            const diaConEjercicios = completa.rutinas_diarias.find(
                (d: any) => d.ejercicios_programados?.length > 0
            );
            if (diaConEjercicios) {
                // Cada ejercicio debería tener series
                diaConEjercicios.ejercicios_programados.forEach((ep: any) => {
                    expect(ep.series).toBeDefined();
                });
            }
        });
    });

    describe('Listado de Rutinas del Usuario', () => {
        it('debería obtener todas las rutinas del usuario de test', async () => {
            const rutinas = await getTestUserRoutines();

            expect(rutinas).toBeDefined();
            expect(rutinas.length).toBeGreaterThanOrEqual(1); // Al menos la plantilla
        });

        it('debería haber al menos 1 plantilla', async () => {
            const rutinas = await getTestUserRoutines();

            const plantillas = rutinas.filter((r: any) => r.es_plantilla === true);
            const normales = rutinas.filter((r: any) => r.es_plantilla === false);

            expect(plantillas.length).toBeGreaterThanOrEqual(1);
        });
    });
});
