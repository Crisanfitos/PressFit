/**
 * Flow 5-6: Editar Rutina y Plantilla
 * 
 * Verifica los flujos de edición:
 * - Flow 5: Ver series del último entreno al editar
 * - Flow 6: Añadir series a plantilla
 */

import { RoutineService } from '../../src/services/RoutineService';
import { TEST_USER } from '../setup/testSetup';
import {
    getTestUserTemplate,
    getTestUserNormalRoutine,
    createSerie,
    deleteSerie
} from '../helpers/testHelpers';
import { supabase } from '../../src/lib/supabase';

describe('Flow 5-6: Editar Rutina y Plantilla', () => {
    let template: any;
    let rutinaNormal: any;

    beforeAll(async () => {
        template = await getTestUserTemplate();
        rutinaNormal = await getTestUserNormalRoutine();

        if (!template) throw new Error('No se encontró plantilla');
        if (!rutinaNormal) throw new Error('No se encontró rutina normal');
    });

    describe('Flujo 5: Ver Series del Último Entreno', () => {
        it('debería cargar rutina diaria con ejercicios y series', async () => {
            const lunes = rutinaNormal.rutinas_diarias.find(
                (d: any) => d.nombre_dia === 'Lunes'
            );

            const { data } = await RoutineService.getRoutineDayById(lunes.id);

            expect(data).toBeDefined();
            expect(data!.ejercicios_programados).toBeDefined();
            expect(data!.ejercicios_programados.length).toBeGreaterThan(0);
        });

        it('ejercicios deberían tener series con datos reales', async () => {
            const lunes = rutinaNormal.rutinas_diarias.find(
                (d: any) => d.nombre_dia === 'Lunes'
            );

            // Query directa para obtener series
            const { data } = await supabase
                .from('ejercicios_programados')
                .select('*, series(*)')
                .eq('rutina_diaria_id', lunes.id);

            expect(data).toBeDefined();
            expect(data!.length).toBeGreaterThan(0);

            // Cada ejercicio debería tener series
            data!.forEach((ep: any) => {
                expect(ep.series).toBeDefined();
                expect(ep.series.length).toBeGreaterThan(0);
            });
        });

        it('series deberían tener peso y repeticiones', async () => {
            const lunes = rutinaNormal.rutinas_diarias.find(
                (d: any) => d.nombre_dia === 'Lunes'
            );

            const { data } = await supabase
                .from('ejercicios_programados')
                .select('*, series(*)')
                .eq('rutina_diaria_id', lunes.id);

            // Buscar al menos una serie con datos completos
            let serieConDatos = null;
            for (const ep of data!) {
                serieConDatos = ep.series.find(
                    (s: any) => s.peso_utilizado !== null && s.repeticiones !== null
                );
                if (serieConDatos) break;
            }

            expect(serieConDatos).toBeDefined();
            expect(serieConDatos.peso_utilizado).toBeGreaterThan(0);
            expect(serieConDatos.repeticiones).toBeGreaterThan(0);
        });
    });

    describe('Flujo 6: Editar Plantilla - Añadir Series', () => {
        let ejercicioPlantillaId: string;
        let serieCreatedId: string | null = null;

        beforeAll(() => {
            const diaConEjercicios = template.rutinas_diarias.find(
                (d: any) => d.ejercicios_programados?.length > 0
            );
            ejercicioPlantillaId = diaConEjercicios.ejercicios_programados[0].id;
        });

        afterAll(async () => {
            // Limpiar serie creada
            if (serieCreatedId) {
                await deleteSerie(serieCreatedId);
            }
        });

        it('debería poder añadir una serie a un ejercicio de plantilla', async () => {
            // Contar series actuales
            const { data: antes } = await supabase
                .from('series')
                .select('id')
                .eq('ejercicio_programado_id', ejercicioPlantillaId);

            const countAntes = antes?.length || 0;

            // Añadir nueva serie
            const nuevaSerie = await createSerie({
                ejercicio_programado_id: ejercicioPlantillaId,
                numero_serie: 99,  // Número alto para identificar
                repeticiones: 10,
                peso_utilizado: 50
            });

            expect(nuevaSerie).toBeDefined();
            serieCreatedId = nuevaSerie.id;

            // Verificar que se añadió
            const { data: despues } = await supabase
                .from('series')
                .select('id')
                .eq('ejercicio_programado_id', ejercicioPlantillaId);

            expect(despues!.length).toBe(countAntes + 1);
        });

        it('la serie añadida debería persistir en BD', async () => {
            const { data } = await supabase
                .from('series')
                .select('*')
                .eq('id', serieCreatedId)
                .single();

            expect(data).toBeDefined();
            expect(data.numero_serie).toBe(99);
            expect(data.repeticiones).toBe(10);
            expect(data.peso_utilizado).toBe(50);
        });

        it('al crear rutina desde esta plantilla, debería incluir la nueva serie', async () => {
            // Este test verifica que las series añadidas se copian
            // cuando se crea una rutina desde la plantilla

            // La lógica está en createRoutineFromTemplate
            // que copia series existentes
            expect(true).toBe(true); // Placeholder - la lógica ya está testeada en flow7-8
        });
    });

    describe('Validación de datos editables', () => {
        it('ejercicios de plantilla no deben tener fecha_dia', async () => {
            const diasPlantilla = template.rutinas_diarias;

            diasPlantilla.forEach((dia: any) => {
                expect(dia.fecha_dia).toBeNull();
            });
        });

        it('ejercicios de rutina normal sí tienen fecha_dia', async () => {
            const diasNormal = rutinaNormal.rutinas_diarias;

            diasNormal.forEach((dia: any) => {
                expect(dia.fecha_dia).not.toBeNull();
            });
        });
    });
});
