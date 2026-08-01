import { supabase } from '../lib/supabase';
import { formatLocalDateKey, getStartOfWeek as getStartOfWeekUtil } from "../utils/dateUtils";
import { isE2EMockEnabled, mockStore } from '../lib/e2eMockAdapter';
import {
    RoutineDay,
    WorkoutStats,
    ScheduledExercise,
    Serie,
    ServiceResponse,
    PostgrestError,
} from '../types/models';

export const DailyWorkoutService = {
    async getRoutineDayById(routineDayId: string): Promise<ServiceResponse<RoutineDay>> {
        if (isE2EMockEnabled()) {
            return { data: mockStore.getMockRoutineDay(routineDayId) as any, error: null };
        }
        try {
            const { data, error } = await supabase
                .from('rutinas_diarias')
                .select(`
          *,
          ejercicios_programados (
            id,
            ejercicio_id,
            orden_ejecucion,
            tipo_peso,
            ejercicio:ejercicios (*),
            series (*)
          )
        `)
                .eq('id', routineDayId)
                .single();

            if (error) throw error;

            // Sort exercises by order if available
            if (data?.ejercicios_programados) {
                data.ejercicios_programados.sort((a: ScheduledExercise, b: ScheduledExercise) =>
                    (a.orden_ejecucion || 0) - (b.orden_ejecucion || 0)
                );
                data.ejercicios_programados.forEach((ex: ScheduledExercise) => {
                    if (ex.series) {
                        ex.series.sort((a: Serie, b: Serie) =>
                            (a.numero_serie || 0) - (b.numero_serie || 0)
                        );
                    }
                });
            }

            return { data, error: null };
        } catch (error) {
            console.error('Error fetching routine day:', error);
            return { data: null, error };
        }
    },

    // Get routine day by date and weekly routine ID (direct query)
    async getRoutineDayByDate(routineId: string, fechaDia: string): Promise<ServiceResponse<RoutineDay>> {
        if (isE2EMockEnabled()) {
            return { data: mockStore.getMockRoutineDay(fechaDia) as any, error: null };
        }
        try {
            const { data, error } = await supabase
                .from('rutinas_diarias')
                .select(`
                    *,
                    ejercicios_programados (
                        id,
                        ejercicio_id,
                        orden_ejecucion,
                        tipo_peso,
                        ejercicio:ejercicios (*),
                        series (*)
                    )
                `)
                .eq('rutina_semanal_id', routineId)
                .eq('fecha_dia', fechaDia)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found

            // Sort exercises and series if data found
            if (data?.ejercicios_programados) {
                data.ejercicios_programados.sort((a: ScheduledExercise, b: ScheduledExercise) =>
                    (a.orden_ejecucion || 0) - (b.orden_ejecucion || 0)
                );
                data.ejercicios_programados.forEach((ex: ScheduledExercise) => {
                    if (ex.series) {
                        ex.series.sort((a: Serie, b: Serie) =>
                            (a.numero_serie || 0) - (b.numero_serie || 0)
                        );
                    }
                });
            }

            return { data: data || null, error: null };
        } catch (error) {
            console.error('Error fetching routine day by date:', error);
            return { data: null, error };
        }
    },

    // Get routine day template by name (where fecha_dia is NULL)
    async getRoutineDayByName(routineId: string, nombreDia: string): Promise<ServiceResponse<RoutineDay>> {
        if (isE2EMockEnabled()) {
            return { data: mockStore.getMockRoutineDay(nombreDia) as any, error: null };
        }
        try {
            const { data, error } = await supabase
                .from('rutinas_diarias')
                .select(`
                    *,
                    ejercicios_programados (
                        id,
                        ejercicio_id,
                        orden_ejecucion,
                        tipo_peso,
                        ejercicio:ejercicios (*),
                        series (*)
                    )
                `)
                .eq('rutina_semanal_id', routineId)
                .eq('nombre_dia', nombreDia)
                .is('fecha_dia', null)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            // Sort exercises and series if data found
            if (data?.ejercicios_programados) {
                data.ejercicios_programados.sort((a: ScheduledExercise, b: ScheduledExercise) =>
                    (a.orden_ejecucion || 0) - (b.orden_ejecucion || 0)
                );
                data.ejercicios_programados.forEach((ex: ScheduledExercise) => {
                    if (ex.series) {
                        ex.series.sort((a: Serie, b: Serie) =>
                            (a.numero_serie || 0) - (b.numero_serie || 0)
                        );
                    }
                });
            }

            return { data: data || null, error: null };
        } catch (error) {
            console.error('Error fetching routine day by name:', error);
            return { data: null, error };
        }
    },

    async getWorkoutStatsForRoutineDay(
        userId: string,
        routineDayId: string
    ): Promise<ServiceResponse<WorkoutStats>> {
        if (isE2EMockEnabled()) {
            return { data: mockStore.getMockWorkoutStats(routineDayId), error: null };
        }
        try {
            const startOfWeek = getStartOfWeekUtil(new Date());

            const { data: templateDay } = await this.getRoutineDayById(routineDayId);
            if (!templateDay) return { data: null, error: 'Template not found' };

            const startOfWeekDate = formatLocalDateKey(startOfWeek);

            const { data, error } = await supabase
                .from('rutinas_diarias')
                .select(`
          *,
          ejercicios_programados (
            *,
            ejercicio:ejercicios(*)
          )
        `)
                .eq('nombre_dia', templateDay.nombre_dia)
                .not('fecha_dia', 'is', null)
                .gte('fecha_dia', startOfWeekDate)
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                return { data: { exerciseCount: 0, duration: null, isCompleted: false }, error: null };
            }

            const uniqueExercises = new Set(
                data.ejercicios_programados?.map((set: ScheduledExercise) => set.ejercicio_id) || []
            );
            const exerciseCount = uniqueExercises.size;

            let duration: number | null = null;
            if (data.completada && data.hora_inicio && data.hora_fin) {
                const start = new Date(data.hora_inicio);
                const end = new Date(data.hora_fin);
                const durationMs = end.getTime() - start.getTime();
                const durationMinutes = Math.round(durationMs / 1000 / 60);

                if (durationMinutes >= 5) {
                    duration = durationMinutes;
                }
            }

            return {
                data: {
                    exerciseCount,
                    duration,
                    isCompleted: !!data.completada,
                    startTime: data?.hora_inicio || null,
                    endTime: data?.hora_fin || null,
                },
                error: null,
            };
        } catch (error) {
            console.error('Error getting workout stats:', error);
            return { data: { exerciseCount: 0, duration: null, isCompleted: false }, error };
        }
    },

    async getActiveWorkout(userId: string, routineDayId: string): Promise<ServiceResponse<RoutineDay>> {
        try {
            if (isE2EMockEnabled()) {
                const stats = mockStore.getMockWorkoutStats(routineDayId);
                const dayData = mockStore.getMockRoutineDay(routineDayId);
                if (stats.startTime && !stats.isCompleted) {
                    return { data: dayData as any, error: null };
                }
                return { data: null, error: null };
            }

            const { data: templateDay } = await this.getRoutineDayById(routineDayId);
            if (!templateDay) return { data: null, error: 'Template not found' };

            const startOfWeek = formatLocalDateKey(getStartOfWeekUtil(new Date()));

            const { data, error } = await supabase
                .from('rutinas_diarias')
                .select('id, hora_inicio, hora_fin, completada')
                .eq('rutina_semanal_id', templateDay.rutina_semanal_id)
                .eq('nombre_dia', templateDay.nombre_dia)
                .not('fecha_dia', 'is', null)
                .gte('fecha_dia', startOfWeek)
                .not('hora_inicio', 'is', null)
                .eq('completada', false)
                .maybeSingle();

            if (error && (error as PostgrestError).code !== 'PGRST116') throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error getting active workout:', error);
            return { data: null, error };
        }
    },

    async startDailyWorkout(
        routineDayId: string,
        date: string,
        startTime: string
    ): Promise<ServiceResponse<RoutineDay>> {
        if (isE2EMockEnabled()) {
            return { data: mockStore.startWorkout(routineDayId) as any, error: null };
        }
        try {
            const { data: templateDay, error: templateError } = await supabase
                .from('rutinas_diarias')
                .select(`
                    *,
                    ejercicios_programados (
                        *,
                        series (*)
                    )
                `)
                .eq('id', routineDayId)
                .single();

            if (templateError || !templateDay) {
                return { data: null, error: templateError || 'Template not found' };
            }

            // Look for the most recent completed workout for the same day name
            // to use its series data (weight) instead of template values
            let prevSeriesMap = new Map<string, Serie[]>();
            try {
                const { data: prevWorkouts } = await supabase
                    .from('rutinas_diarias')
                    .select(`
                        id,
                        ejercicios_programados (
                            ejercicio_id,
                            series (numero_serie, peso_utilizado, repeticiones, rpe)
                        )
                    `)
                    .eq('rutina_semanal_id', templateDay.rutina_semanal_id)
                    .eq('nombre_dia', templateDay.nombre_dia)
                    .eq('completada', true)
                    .not('fecha_dia', 'is', null)
                    .order('fecha_dia', { ascending: false })
                    .limit(1);

                if (prevWorkouts?.[0]?.ejercicios_programados) {
                    for (const ex of prevWorkouts[0].ejercicios_programados) {
                        if (ex.series && ex.series.length > 0) {
                            prevSeriesMap.set(ex.ejercicio_id, ex.series);
                        }
                    }
                }
            } catch {
                // If lookup fails, continue with template data
            }

            const fechaDia = date; // date is already expected to be YYYY-MM-DD

            const { data: newWorkout, error: createError } = await supabase
                .from('rutinas_diarias')
                .insert({
                    rutina_semanal_id: templateDay.rutina_semanal_id,
                    nombre_dia: templateDay.nombre_dia,
                    fecha_dia: fechaDia,
                    hora_inicio: startTime,
                    completada: false,
                })
                .select()
                .single();

            if (createError) return { data: null, error: createError };
            if (!newWorkout) return { data: null, error: 'No workout data returned from insert' };

            const templateExercises = templateDay.ejercicios_programados || [];
            for (const templateEx of templateExercises) {
                try {
                    const { data: newEx, error: exError } = await supabase
                        .from('ejercicios_programados')
                        .insert({
                            rutina_diaria_id: newWorkout.id,
                            ejercicio_id: templateEx.ejercicio_id,
                            orden_ejecucion: templateEx.orden_ejecucion,
                            notas_sesion: templateEx.notas_sesion || null,
                            tipo_peso: templateEx.tipo_peso || 'total',
                        })
                        .select('id')
                        .single();

                    if (exError || !newEx) continue;

                    // Use previous workout series if available, otherwise template series
                    const prevSeries = prevSeriesMap.get(templateEx.ejercicio_id);
                    const sourceSeries = (prevSeries && prevSeries.length > 0)
                        ? prevSeries
                        : (templateEx.series || []);

                    if (sourceSeries.length > 0) {
                        const seriesToInsert = sourceSeries.map((serie: Serie) => ({
                            ejercicio_programado_id: newEx.id,
                            numero_serie: serie.numero_serie,
                            peso_utilizado: serie.peso_utilizado || 0,
                            repeticiones: 0,
                        }));

                        await supabase.from('series').insert(seriesToInsert);
                    }
                } catch { /* skip failed exercise copy */ }
            }

            return { data: newWorkout, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    // Get or create a routine day for a specific day of week
    async getOrCreateRoutineDay(userId: string, dayOfWeek: number): Promise<ServiceResponse<RoutineDay>> {
        try {
            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const targetDayName = dayNames[dayOfWeek];

            // First, try to find an existing routine day by querying rutinas_semanales
            const { data: existingRoutines, error: userRoutinesError } = await supabase
                .from('rutinas_semanales')
                .select(`
          *,
          rutinas_diarias!inner (
            *,
            ejercicios_programados (
              *,
              ejercicio:ejercicios (*)
            )
          )
        `)
                .eq('usuario_id', userId)
                .eq('es_plantilla', true)
                .is('rutinas_diarias.fecha_dia', null)
                .order('created_at', { ascending: false });

            if (userRoutinesError) throw userRoutinesError;

            if (existingRoutines && existingRoutines.length > 0) {
                for (const routine of existingRoutines) {
                    if (routine.rutinas_diarias) {
                        const routineDay = routine.rutinas_diarias.find((rd: RoutineDay) => rd.nombre_dia === targetDayName);
                        if (routineDay) {
                            return { data: routineDay, error: null };
                        }
                    }
                }
            }

            // If no routine day exists, create a default routine and routine day
            let routineId: string;
            if (!existingRoutines || existingRoutines.length === 0) {
                const { data: newRoutine, error: routineError } = await supabase
                    .from('rutinas_semanales')
                    .insert({
                        usuario_id: userId,
                        nombre: 'Mi Rutina',
                        objetivo: 'Rutina personalizada',
                        es_plantilla: true,
                        activa: true
                    })
                    .select()
                    .single();

                if (routineError) throw routineError;
                routineId = newRoutine.id;
            } else {
                routineId = existingRoutines[0].id;
            }

            const { data: newRoutineDay, error: dayError } = await supabase
                .from('rutinas_diarias')
                .insert({
                    rutina_semanal_id: routineId,
                    nombre_dia: targetDayName,
                    fecha_dia: null,
                })
                .select(`
                    *,
                    ejercicios_programados (
                        *,
                        ejercicio:ejercicios (*)
                    )
                `)
                .single();

            if (dayError) throw dayError;
            return { data: newRoutineDay, error: null };
        } catch (error) {
            console.error('Error getting or creating routine day:', error);
            return { data: null, error };
        }
    },

    // Batch fetch workouts for a date range (critical for calendar)
    async getWorkoutsForDateRange(
        routineWeeklyIds: string[],
        startDate: string,
        endDate: string
    ): Promise<ServiceResponse<RoutineDay[]>> {
        try {
            const startDateStr = startDate; // startDate is already expected to be YYYY-MM-DD
            const endDateStr = endDate;     // endDate is already expected to be YYYY-MM-DD

            const { data, error } = await supabase
                .from('rutinas_diarias')
                .select(`
                    id,
                    rutina_semanal_id,
                    nombre_dia,
                    fecha_dia,
                    hora_inicio,
                    hora_fin,
                    completada,
                    ejercicios_programados (
                        id,
                        ejercicio_id
                    )
                `)
                .in('rutina_semanal_id', routineWeeklyIds)
                .not('fecha_dia', 'is', null)
                .gte('fecha_dia', startDateStr)
                .lte('fecha_dia', endDateStr)
                .order('fecha_dia', { ascending: true });

            if (error) throw error;
            return { data: data || [], error: null };
        } catch (error) {
            console.error('Error fetching batch workouts:', error);
            return { data: [], error };
        }
    },

    getRoutineDayStatus(
        routineDay: RoutineDay | null,
        workoutStats: WorkoutStats | null,
        dayOfWeek: number
    ): 'COMPLETED' | 'IN_PROGRESS' | 'MISSED' | 'PENDING' {
        if (workoutStats?.isCompleted) return 'COMPLETED';
        if (workoutStats?.exerciseCount && workoutStats.exerciseCount > 0 && !workoutStats.isCompleted) {
            return 'IN_PROGRESS';
        }

        const today = new Date().getDay();
        const adjustDay = (d: number) => (d === 0 ? 6 : d - 1);
        const currentDayAdjusted = adjustDay(today);
        const targetDayAdjusted = adjustDay(dayOfWeek);

        if (targetDayAdjusted < currentDayAdjusted) {
            return 'MISSED';
        }

        return 'PENDING';
    },

    async updateRoutineDayDescription(dayId: string, descripcion: string): Promise<ServiceResponse<RoutineDay>> {
        if (isE2EMockEnabled()) {
            return { data: mockStore.updateDayDescription(dayId, descripcion) as any, error: null };
        }
        try {
            const { data, error } = await supabase
                .from('rutinas_diarias')
                .update({ descripcion })
                .eq('id', dayId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error updating routine day description:', error);
            return { data: null, error };
        }
    },
};
