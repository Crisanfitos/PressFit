/**
 * Test Helpers
 * 
 * Funciones auxiliares reutilizables para los tests.
 * Organizadas de menor a mayor nivel de abstracción.
 */

import { supabase } from '../../src/lib/supabase';
import { TEST_USER } from '../setup/testSetup';

// ==============================================================================
// NIVEL 1: SERIES
// ==============================================================================

export interface SerieTestData {
    ejercicio_programado_id: string;
    numero_serie: number;
    repeticiones?: number | null;
    peso_utilizado?: number | null;
    rpe?: number | null;
}

/**
 * Crea una serie en la BD
 */
export const createSerie = async (data: SerieTestData) => {
    const { data: serie, error } = await supabase
        .from('series')
        .insert({
            ...data,
            created_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) throw error;
    return serie;
};

/**
 * Obtiene una serie por ID
 */
export const getSerieById = async (id: string) => {
    const { data, error } = await supabase
        .from('series')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

/**
 * Actualiza una serie
 */
export const updateSerie = async (id: string, updates: Partial<SerieTestData>) => {
    const { data, error } = await supabase
        .from('series')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Elimina una serie
 */
export const deleteSerie = async (id: string) => {
    const { error } = await supabase
        .from('series')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};

// ==============================================================================
// NIVEL 2: EJERCICIOS PROGRAMADOS
// ==============================================================================

/**
 * Obtiene ejercicio programado con sus series
 */
export const getEjercicioProgramadoWithSeries = async (id: string) => {
    const { data, error } = await supabase
        .from('ejercicios_programados')
        .select(`
            *,
            ejercicio:ejercicios(*),
            series(*)
        `)
        .eq('id', id)
        .single();

    if (error) throw error;

    // Ordenar series por numero_serie
    if (data?.series) {
        data.series.sort((a: any, b: any) => a.numero_serie - b.numero_serie);
    }

    return data;
};

/**
 * Crea un ejercicio programado con series
 */
export const createEjercicioProgramadoWithSeries = async (
    rutina_diaria_id: string,
    ejercicio_id: string,
    orden_ejecucion: number,
    numSeries: number = 3
) => {
    const { data: ep, error } = await supabase
        .from('ejercicios_programados')
        .insert({
            rutina_diaria_id,
            ejercicio_id,
            orden_ejecucion,
            created_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) throw error;

    // Crear series vacías
    const series = [];
    for (let i = 1; i <= numSeries; i++) {
        const serie = await createSerie({
            ejercicio_programado_id: ep.id,
            numero_serie: i,
            repeticiones: null,
            peso_utilizado: null
        });
        series.push(serie);
    }

    return { ...ep, series };
};

// ==============================================================================
// NIVEL 3: RUTINAS DIARIAS
// ==============================================================================

export type RutinaDiariaEstado = 'PLANTILLA' | 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA';

/**
 * Obtiene el estado de una rutina diaria
 */
export const getRutinaDiariaEstado = (rutinaDiaria: any): RutinaDiariaEstado => {
    if (rutinaDiaria.fecha_dia === null) {
        return 'PLANTILLA';
    }
    if (rutinaDiaria.hora_fin !== null) {
        return 'COMPLETADA';
    }
    if (rutinaDiaria.hora_inicio !== null && rutinaDiaria.hora_fin === null) {
        return 'EN_PROGRESO';
    }
    return 'PENDIENTE';
};

/**
 * Calcula la duración de un entrenamiento en minutos
 */
export const calcularDuracionMinutos = (hora_inicio: string, hora_fin: string): number => {
    const inicio = new Date(hora_inicio);
    const fin = new Date(hora_fin);
    const diffMs = fin.getTime() - inicio.getTime();
    return Math.round(diffMs / 1000 / 60);
};

/**
 * Obtiene rutina diaria completa con ejercicios y series
 */
export const getRutinaDiariaCompleta = async (id: string) => {
    const { data, error } = await supabase
        .from('rutinas_diarias')
        .select(`
            *,
            ejercicios_programados(
                *,
                ejercicio:ejercicios(*),
                series(*)
            )
        `)
        .eq('id', id)
        .single();

    if (error) throw error;

    // Ordenar ejercicios y series
    if (data?.ejercicios_programados) {
        data.ejercicios_programados.sort((a: any, b: any) =>
            (a.orden_ejecucion || 0) - (b.orden_ejecucion || 0)
        );
        data.ejercicios_programados.forEach((ep: any) => {
            if (ep.series) {
                ep.series.sort((a: any, b: any) => a.numero_serie - b.numero_serie);
            }
        });
    }

    return data;
};

// ==============================================================================
// NIVEL 4: RUTINAS SEMANALES
// ==============================================================================

/**
 * Obtiene rutina semanal con todos sus días
 */
export const getRutinaSemanalCompleta = async (id: string) => {
    const { data, error } = await supabase
        .from('rutinas_semanales')
        .select(`
            *,
            rutinas_diarias(
                *,
                ejercicios_programados(
                    *,
                    ejercicio:ejercicios(*),
                    series(*)
                )
            )
        `)
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

/**
 * Calcula el lunes de la semana actual
 */
export const getMondayOfCurrentWeek = (): string => {
    const now = new Date();
    const day = now.getDay();
    const daysToSubtract = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToSubtract);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
};

// ==============================================================================
// QUERIES DE TEST
// ==============================================================================

/**
 * Obtiene todas las rutinas del usuario de test
 */
export const getTestUserRoutines = async () => {
    const { data, error } = await supabase
        .from('rutinas_semanales')
        .select('*')
        .eq('usuario_id', TEST_USER.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

/**
 * Obtiene la plantilla del usuario de test
 */
export const getTestUserTemplate = async () => {
    const { data, error } = await supabase
        .from('rutinas_semanales')
        .select(`
            *,
            rutinas_diarias(
                *,
                ejercicios_programados(*, series(*))
            )
        `)
        .eq('usuario_id', TEST_USER.id)
        .eq('es_plantilla', true)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

/**
 * Obtiene la rutina normal (no plantilla) del usuario de test
 */
export const getTestUserNormalRoutine = async () => {
    const { data, error } = await supabase
        .from('rutinas_semanales')
        .select(`
            *,
            rutinas_diarias(
                *,
                ejercicios_programados(*, series(*))
            )
        `)
        .eq('usuario_id', TEST_USER.id)
        .eq('es_plantilla', false)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
};
