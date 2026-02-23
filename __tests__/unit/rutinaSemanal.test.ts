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
        if (!rutinaNormal) throw new Error('No se encontró rutina normal de test');
    });

    describe('Tipos de Rutinas', () => {
        it('plantilla debe tener es_plantilla = true', () => {
            expect(template.es_plantilla).toBe(true);
        });

        it('rutina normal debe tener es_plantilla = false', () => {
            expect(rutinaNormal.es_plantilla).toBe(false);
        });

        it('plantilla NO debe tener fecha_inicio_semana', () => {
            expect(template.fecha_inicio_semana).toBeNull();
        });

        it('rutina normal DEBE tener fecha_inicio_semana', () => {
            expect(rutinaNormal.fecha_inicio_semana).not.toBeNull();
        });
    });

    describe('Nomenclatura de Plantillas', () => {
        it('nombre de plantilla debe empezar con "Plantilla_"', () => {
            expect(template.nombre.startsWith('Plantilla_')).toBe(true);
        });

        it('nombre de rutina normal NO debe empezar con "Plantilla_"', () => {
            expect(rutinaNormal.nombre.startsWith('Plantilla_')).toBe(false);
        });
    });

    describe('Campo copiada_de_id', () => {
        it('plantilla NO debe tener copiada_de_id', () => {
            expect(template.copiada_de_id).toBeNull();
        });

        it('rutina normal creada desde plantilla DEBE tener copiada_de_id', () => {
            expect(rutinaNormal.copiada_de_id).not.toBeNull();
        });

        it('copiada_de_id debe referenciar a la plantilla correcta', () => {
            expect(rutinaNormal.copiada_de_id).toBe(template.id);
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
            const fechaInicio = new Date(rutinaNormal.fecha_inicio_semana);
            expect(fechaInicio.getDay()).toBe(1); // 1 = Monday
        });
    });

    describe('Estructura de Días', () => {
        it('plantilla debe tener 7 días', () => {
            expect(template.rutinas_diarias.length).toBe(7);
        });

        it('rutina normal debe tener 7 días', () => {
            expect(rutinaNormal.rutinas_diarias.length).toBe(7);
        });

        it('días de plantilla deben tener fecha_dia = null', () => {
            template.rutinas_diarias.forEach((dia: any) => {
                expect(dia.fecha_dia).toBeNull();
            });
        });

        it('días de rutina normal deben tener fecha_dia definida', () => {
            rutinaNormal.rutinas_diarias.forEach((dia: any) => {
                expect(dia.fecha_dia).not.toBeNull();
            });
        });
    });

    describe('Obtener Rutina Completa', () => {
        it('debería cargar rutina semanal con toda su jerarquía', async () => {
            const completa = await getRutinaSemanalCompleta(template.id);

            expect(completa).toBeDefined();
            expect(completa.rutinas_diarias).toBeDefined();
            expect(completa.rutinas_diarias.length).toBe(7);

            // Al menos un día debería tener ejercicios
            const diaConEjercicios = completa.rutinas_diarias.find(
                (d: any) => d.ejercicios_programados?.length > 0
            );
            expect(diaConEjercicios).toBeDefined();

            // Cada ejercicio debería tener series
            diaConEjercicios.ejercicios_programados.forEach((ep: any) => {
                expect(ep.series).toBeDefined();
            });
        });
    });

    describe('Listado de Rutinas del Usuario', () => {
        it('debería obtener todas las rutinas del usuario de test', async () => {
            const rutinas = await getTestUserRoutines();

            expect(rutinas).toBeDefined();
            expect(rutinas.length).toBeGreaterThanOrEqual(2); // Al menos plantilla + normal
        });

        it('debería haber exactamente 1 plantilla y al menos 1 rutina normal', async () => {
            const rutinas = await getTestUserRoutines();

            const plantillas = rutinas.filter((r: any) => r.es_plantilla === true);
            const normales = rutinas.filter((r: any) => r.es_plantilla === false);

            expect(plantillas.length).toBe(1);
            expect(normales.length).toBeGreaterThanOrEqual(1);
        });
    });
});
