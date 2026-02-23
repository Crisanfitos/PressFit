/**
 * Tests Nivel 1: Series
 * 
 * Operaciones CRUD básicas sobre la tabla series.
 * Estos tests son los bloques fundamentales para tests de nivel superior.
 */

import { supabase } from '../../src/lib/supabase';
import { TEST_USER } from '../setup/testSetup';
import {
    createSerie,
    getSerieById,
    updateSerie,
    deleteSerie,
    getTestUserTemplate
} from '../helpers/testHelpers';

describe('Nivel 1: Series', () => {
    let ejercicioProgramadoId: string;
    let serieCreatedId: string;

    beforeAll(async () => {
        // Obtener un ejercicio programado del dataset de test
        const template = await getTestUserTemplate();

        if (!template || !template.rutinas_diarias?.length) {
            throw new Error('No se encontró plantilla de test. Ejecuta TEST_USER_INSERT.sql');
        }

        const diaConEjercicios = template.rutinas_diarias.find(
            (d: any) => d.ejercicios_programados?.length > 0
        );

        if (!diaConEjercicios) {
            throw new Error('No hay días con ejercicios en la plantilla de test');
        }

        ejercicioProgramadoId = diaConEjercicios.ejercicios_programados[0].id;
    });

    describe('Crear Serie', () => {
        it('debería crear una serie con peso y repeticiones', async () => {
            const serie = await createSerie({
                ejercicio_programado_id: ejercicioProgramadoId,
                numero_serie: 99, // Número alto para identificar en tests
                repeticiones: 10,
                peso_utilizado: 50.00,
                rpe: 8
            });

            expect(serie).toBeDefined();
            expect(serie.id).toBeDefined();
            expect(serie.numero_serie).toBe(99);
            expect(serie.repeticiones).toBe(10);
            expect(serie.peso_utilizado).toBe(50.00);
            expect(serie.rpe).toBe(8);

            serieCreatedId = serie.id;
        });

        it('debería crear una serie vacía (sin datos)', async () => {
            const serie = await createSerie({
                ejercicio_programado_id: ejercicioProgramadoId,
                numero_serie: 98,
                repeticiones: null,
                peso_utilizado: null
            });

            expect(serie).toBeDefined();
            expect(serie.repeticiones).toBeNull();
            expect(serie.peso_utilizado).toBeNull();

            // Limpiar
            await deleteSerie(serie.id);
        });
    });

    describe('Leer Serie', () => {
        it('debería obtener una serie por ID', async () => {
            const serie = await getSerieById(serieCreatedId);

            expect(serie).toBeDefined();
            expect(serie.id).toBe(serieCreatedId);
            expect(serie.numero_serie).toBe(99);
        });
    });

    describe('Actualizar Serie', () => {
        it('debería actualizar peso y repeticiones', async () => {
            const updated = await updateSerie(serieCreatedId, {
                repeticiones: 12,
                peso_utilizado: 55.00,
                rpe: 9
            });

            expect(updated.repeticiones).toBe(12);
            expect(updated.peso_utilizado).toBe(55.00);
            expect(updated.rpe).toBe(9);
        });

        it('debería permitir actualizar a valores null', async () => {
            const updated = await updateSerie(serieCreatedId, {
                repeticiones: null,
                peso_utilizado: null
            });

            expect(updated.repeticiones).toBeNull();
            expect(updated.peso_utilizado).toBeNull();
        });
    });

    describe('Eliminar Serie', () => {
        it('debería eliminar una serie existente', async () => {
            const result = await deleteSerie(serieCreatedId);
            expect(result).toBe(true);

            // Verificar que ya no existe
            const { data } = await supabase
                .from('series')
                .select('id')
                .eq('id', serieCreatedId)
                .single();

            expect(data).toBeNull();
        });
    });
});
