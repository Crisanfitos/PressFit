import { supabase } from '../lib/supabase';

interface SetData {
    id: string;
    numero_serie: number;
    peso_utilizado: number;
    repeticiones: number;
    rpe?: number;
    [key: string]: any;
}

interface ScheduledExercise {
    id: string;
    rutina_diaria_id: string;
    ejercicio_id: string;
    orden_ejecucion: number;
    ejercicio?: any;
    series?: SetData[];
    [key: string]: any;
}

interface WorkoutDetails {
    id: string;
    nombre_dia: string;
    fecha_dia: string;
    hora_inicio?: string;
    hora_fin?: string;
    completada: boolean;
    descripcion?: string;
    ejercicios_programados?: ScheduledExercise[];
    [key: string]: any;
}

interface ServiceResponse<T> {
    data: T | null;
    error: any | null;
}

export const WorkoutService = {
    async getWorkoutDetails(workoutId: string): Promise<ServiceResponse<WorkoutDetails>> {
        try {
            const { data, error } = await supabase
                .from('rutinas_diarias')
                .select(`
          *,
          ejercicios_programados (
            *,
            ejercicio:ejercicios (*),
            series (*)
          )
        `)
                .eq('id', workoutId)
                .single();

            if (error) throw error;

            // Sort exercises by order
            if (data?.ejercicios_programados) {
                data.ejercicios_programados.sort(
                    (a: any, b: any) => (a.orden_ejecucion || 0) - (b.orden_ejecucion || 0)
                );

                // Sort sets by number
                data.ejercicios_programados.forEach((ex: any) => {
                    if (ex.series) {
                        ex.series.sort(
                            (a: any, b: any) => (a.numero_serie || 0) - (b.numero_serie || 0)
                        );
                    }
                });
            }

            return { data, error: null };
        } catch (error) {
            console.error('Error fetching workout details:', error);
            return { data: null, error };
        }
    },

    async createWorkout(userId: string, routineDayId: string): Promise<ServiceResponse<any>> {
        try {
            const { data: templateDay, error: templateError } = await supabase
                .from('rutinas_diarias')
                .select(`*, ejercicios_programados (*)`)
                .eq('id', routineDayId)
                .single();

            if (templateError) throw templateError;

            const { data: newWorkout, error: createError } = await supabase
                .from('rutinas_diarias')
                .insert({
                    rutina_semanal_id: templateDay.rutina_semanal_id,
                    nombre_dia: templateDay.nombre_dia,
                    fecha_dia: new Date().toISOString().split('T')[0],
                    hora_inicio: new Date().toISOString(),
                    completada: false,
                })
                .select()
                .single();

            if (createError) throw createError;

            if (templateDay.ejercicios_programados?.length > 0) {
                const exercisesToInsert = templateDay.ejercicios_programados.map((ex: any) => ({
                    rutina_diaria_id: newWorkout.id,
                    ejercicio_id: ex.ejercicio_id,
                    orden_ejecucion: ex.orden_ejecucion,
                    notas_sesion: ex.notas_sesion,
                }));

                const { data: insertedExercises, error: exercisesError } = await supabase
                    .from('ejercicios_programados')
                    .insert(exercisesToInsert)
                    .select('id, ejercicio_id');

                if (exercisesError) throw exercisesError;

                // Try to copy series from last week's workout for the same day
                try {
                    const today = new Date();
                    const oneWeekAgo = new Date(today);
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                    const weekAgoStr = oneWeekAgo.toISOString().split('T')[0];
                    const todayStr = today.toISOString().split('T')[0];

                    // Find last week's completed workout for the same day name
                    const { data: lastWeekWorkouts } = await supabase
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
                        .gte('fecha_dia', weekAgoStr)
                        .lt('fecha_dia', todayStr)
                        .eq('completada', true)
                        .order('fecha_dia', { ascending: false })
                        .limit(1);

                    if (lastWeekWorkouts?.[0]?.ejercicios_programados && insertedExercises) {
                        // Map exercise_id -> new ejercicio_programado_id
                        const newExerciseMap = new Map<string, string>();
                        insertedExercises.forEach((ex: any) => {
                            newExerciseMap.set(ex.ejercicio_id, ex.id);
                        });

                        // Copy series for each matching exercise
                        const seriesToInsert: any[] = [];
                        for (const lastExercise of lastWeekWorkouts[0].ejercicios_programados) {
                            const newExerciseId = newExerciseMap.get(lastExercise.ejercicio_id);
                            if (newExerciseId && lastExercise.series?.length > 0) {
                                for (const serie of lastExercise.series) {
                                    seriesToInsert.push({
                                        ejercicio_programado_id: newExerciseId,
                                        numero_serie: serie.numero_serie,
                                        peso_utilizado: serie.peso_utilizado,
                                        repeticiones: null,  // Reps come as placeholder from previousWorkout
                                        rpe: serie.rpe,
                                    });
                                }
                            }
                        }

                        if (seriesToInsert.length > 0) {
                            await supabase.from('series').insert(seriesToInsert);
                        }
                    }
                } catch (copyError) {
                    console.warn('Could not copy series from last week:', copyError);
                    // Continue even if copying fails - workout is still created
                }
            }

            // Reload workout with all related data (including copied series) before returning
            const { data: completeWorkout } = await this.getWorkoutDetails(newWorkout.id);
            return { data: completeWorkout || newWorkout, error: null };
        } catch (error) {
            console.error('Error creating workout:', error);
            return { data: null, error };
        }
    },

    async completeWorkout(workoutId: string, durationMinutes?: number): Promise<ServiceResponse<any>> {
        try {
            const { data, error } = await supabase
                .from('rutinas_diarias')
                .update({
                    completada: true,
                    hora_fin: new Date().toISOString(),
                })
                .eq('id', workoutId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error completing workout:', error);
            return { data: null, error };
        }
    },

    // Get all series for a specific exercise within a specific workout
    async getSeriesForExercise(
        workoutId: string,
        exerciseId: string
    ): Promise<ServiceResponse<SetData[]>> {
        try {
            // Find the ejercicio_programado linking this exercise to this workout
            const { data: scheduledExercise, error: findError } = await supabase
                .from('ejercicios_programados')
                .select('id')
                .eq('rutina_diaria_id', workoutId)
                .eq('ejercicio_id', exerciseId)
                .maybeSingle();

            if (findError) throw findError;
            if (!scheduledExercise) return { data: [], error: null };

            // Fetch all series for this scheduled exercise
            const { data: series, error: seriesError } = await supabase
                .from('series')
                .select('*')
                .eq('ejercicio_programado_id', scheduledExercise.id)
                .order('numero_serie', { ascending: true });

            if (seriesError) throw seriesError;
            return { data: series || [], error: null };
        } catch (error) {
            console.error('Error fetching series for exercise:', error);
            return { data: null, error };
        }
    },

    async addSet(
        workoutId: string,
        exerciseId: string,
        setNumber: number,
        weight: number,
        reps: number
    ): Promise<ServiceResponse<SetData>> {
        try {
            let { data: scheduledExercise, error: findError } = await supabase
                .from('ejercicios_programados')
                .select('id')
                .eq('rutina_diaria_id', workoutId)
                .eq('ejercicio_id', exerciseId)
                .single();

            if (findError && (findError as any).code !== 'PGRST116') throw findError;

            if (!scheduledExercise) {
                const { data: maxOrderData } = await supabase
                    .from('ejercicios_programados')
                    .select('orden_ejecucion')
                    .eq('rutina_diaria_id', workoutId)
                    .order('orden_ejecucion', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                const nextOrder = (maxOrderData?.orden_ejecucion || 0) + 1;

                const { data: newEx, error: createExError } = await supabase
                    .from('ejercicios_programados')
                    .insert({
                        rutina_diaria_id: workoutId,
                        ejercicio_id: exerciseId,
                        orden_ejecucion: nextOrder,
                    })
                    .select()
                    .single();

                if (createExError) throw createExError;
                scheduledExercise = newEx;
            }

            const { data, error } = await supabase
                .from('series')
                .insert({
                    ejercicio_programado_id: scheduledExercise!.id,
                    numero_serie: setNumber,
                    peso_utilizado: weight || 0,
                    repeticiones: reps || 0,
                })
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error adding set:', error);
            return { data: null, error };
        }
    },

    async updateSet(
        setId: string,
        updates: { weight?: number; reps?: number; rpe?: number; descanso_segundos?: number }
    ): Promise<ServiceResponse<SetData>> {
        try {
            const dbUpdates: any = {};
            if (updates.weight !== undefined) dbUpdates.peso_utilizado = updates.weight;
            if (updates.reps !== undefined) dbUpdates.repeticiones = updates.reps;
            if (updates.rpe !== undefined) dbUpdates.rpe = updates.rpe;
            if (updates.descanso_segundos !== undefined) dbUpdates.descanso_segundos = updates.descanso_segundos;

            const { data, error } = await supabase
                .from('series')
                .update(dbUpdates)
                .eq('id', setId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error updating set:', error);
            return { data: null, error };
        }
    },

    async deleteSet(setId: string): Promise<{ error: any | null }> {
        try {
            const { error } = await supabase.from('series').delete().eq('id', setId);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Error deleting set:', error);
            return { error };
        }
    },

    async removeExerciseFromRoutine(routineExerciseId: string): Promise<{ error: any | null }> {
        try {
            const { error } = await supabase
                .from('ejercicios_programados')
                .delete()
                .eq('id', routineExerciseId);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Error removing exercise from routine:', error);
            return { error };
        }
    },

    async getLastCompletedWorkoutForDay(
        userId: string,
        routineDayId: string
    ): Promise<ServiceResponse<WorkoutDetails>> {
        try {
            const { data: templateDay } = await supabase
                .from('rutinas_diarias')
                .select('nombre_dia, rutina_semanal_id')
                .eq('id', routineDayId)
                .single();

            if (!templateDay) return { data: null, error: 'Template not found' };

            const { data, error } = await supabase
                .from('rutinas_diarias')
                .select(`
          *,
          ejercicios_programados (
            *,
            ejercicio:ejercicios (*),
            series (*)
          )
        `)
                .eq('rutina_semanal_id', templateDay.rutina_semanal_id)
                .eq('nombre_dia', templateDay.nombre_dia)
                .eq('completada', true)
                .not('fecha_dia', 'is', null)
                .order('hora_fin', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching last completed workout:', error);
            return { data: null, error };
        }
    },

    async addExerciseToWorkout(
        workoutId: string,
        exerciseId: string
    ): Promise<ServiceResponse<ScheduledExercise>> {
        try {
            const { data: maxOrderData } = await supabase
                .from('ejercicios_programados')
                .select('orden_ejecucion')
                .eq('rutina_diaria_id', workoutId)
                .order('orden_ejecucion', { ascending: false })
                .limit(1)
                .maybeSingle();

            const nextOrder = (maxOrderData?.orden_ejecucion || 0) + 1;

            const { data, error } = await supabase
                .from('ejercicios_programados')
                .insert({
                    rutina_diaria_id: workoutId,
                    ejercicio_id: exerciseId,
                    orden_ejecucion: nextOrder,
                })
                .select(`*, ejercicio:ejercicios (*)`)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error adding exercise to workout:', error);
            return { data: null, error };
        }
    },

    async removeExerciseFromWorkout(
        workoutId: string,
        exerciseId: string
    ): Promise<{ error: any | null }> {
        try {
            const { error } = await supabase
                .from('ejercicios_programados')
                .delete()
                .eq('rutina_diaria_id', workoutId)
                .eq('ejercicio_id', exerciseId);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Error removing exercise from workout:', error);
            return { error };
        }
    },

    async getExerciseHistory(
        userId: string,
        exerciseId: string
    ): Promise<ServiceResponse<any[]>> {
        try {
            // Join series with ejercicios_programados and rutinas_diarias to get the date
            // Ordered by rutinas_diarias.fecha_dia
            const { data, error } = await supabase
                .from('series')
                .select(`
                    id,
                    numero_serie,
                    peso_utilizado,
                    repeticiones,
                    rpe,
                    ejercicios_programados!inner(
                        ejercicio_id,
                        rutinas_diarias!inner(
                            id,
                            fecha_dia,
                            rutinas_semanales!inner(usuario_id)
                        )
                    )
                `)
                .eq('ejercicios_programados.ejercicio_id', exerciseId)
                .eq('ejercicios_programados.rutinas_diarias.rutinas_semanales.usuario_id', userId)
                .not('ejercicios_programados.rutinas_diarias.fecha_dia', 'is', null)
                .not('peso_utilizado', 'is', null)
                .order('ejercicios_programados(rutinas_diarias(fecha_dia))', { ascending: true }); // Note: PostgREST ordering on joined tables has syntax limitations, we will sort in JS to be safe.

            if (error) throw error;

            // Flatten and sort the data in JS to ensure correctness
            const history = (data || []).map((row: any) => ({
                id: row.id,
                numero_serie: row.numero_serie,
                peso_utilizado: row.peso_utilizado,
                repeticiones: row.repeticiones,
                rpe: row.rpe,
                fecha: row.ejercicios_programados?.rutinas_diarias?.fecha_dia,
                rutina_id: row.ejercicios_programados?.rutinas_diarias?.id,
            }))
                .filter((item) => item.fecha)
                .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

            return { data: history, error: null };
        } catch (error) {
            console.error('Error fetching exercise history:', error);
            return { data: null, error };
        }
    },
};
