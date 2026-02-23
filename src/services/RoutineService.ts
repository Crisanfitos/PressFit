import { supabase } from '../lib/supabase';

interface RoutineDay {
    id: string;
    rutina_semanal_id: string;
    nombre_dia: string;
    fecha_dia: string | null;
    hora_inicio?: string;
    hora_fin?: string;
    completada?: boolean;
    ejercicios_programados?: any[];
    [key: string]: any;
}

interface WeeklyRoutine {
    id: string;
    usuario_id: string;
    nombre: string;
    es_plantilla: boolean;
    activa: boolean;
    rutinas_diarias?: RoutineDay[];
    [key: string]: any;
}

interface WorkoutStats {
    exerciseCount: number;
    duration: number | null;
    isCompleted: boolean;
    startTime?: string | null;
    endTime?: string | null;
}

interface ServiceResponse<T> {
    data: T | null;
    error: any | null;
}

export const RoutineService = {
    async getWeeklyRoutineWithDays(routineId: string): Promise<ServiceResponse<WeeklyRoutine>> {
        try {
            const { data, error } = await supabase
                .from('rutinas_semanales')
                .select(`
          *,
          rutinas_diarias (
            *,
            ejercicios_programados (
              *,
              ejercicio:ejercicios (*),
              series (*)
            )
          )
        `)
                .eq('id', routineId)
                .single();

            if (error) throw error;

            // Sort exercises and series
            if (data?.rutinas_diarias) {
                data.rutinas_diarias.forEach((day: any) => {
                    if (day.ejercicios_programados) {
                        day.ejercicios_programados.sort((a: any, b: any) =>
                            (a.orden_ejecucion || 0) - (b.orden_ejecucion || 0)
                        );
                        day.ejercicios_programados.forEach((ex: any) => {
                            if (ex.series) {
                                ex.series.sort((a: any, b: any) =>
                                    (a.numero_serie || 0) - (b.numero_serie || 0)
                                );
                            }
                        });
                    }
                });
            }

            return { data, error: null };
        } catch (error) {
            console.error('Error fetching weekly routine details:', error);
            return { data: null, error };
        }
    },

    async getUserRoutines(userId: string): Promise<ServiceResponse<WeeklyRoutine[]>> {
        try {
            const { data, error } = await supabase
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

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching routines:', error);
            return { data: null, error };
        }
    },

    async getRoutineDayById(routineDayId: string): Promise<ServiceResponse<RoutineDay>> {
        try {
            const { data, error } = await supabase
                .from('rutinas_diarias')
                .select(`
          *,
          ejercicios_programados (
            id,
            ejercicio_id,
            orden_ejecucion,
            ejercicio:ejercicios (*),
            series (*)
          )
        `)
                .eq('id', routineDayId)
                .single();

            if (error) throw error;

            // Sort exercises by order if available
            if (data?.ejercicios_programados) {
                data.ejercicios_programados.sort((a: any, b: any) =>
                    (a.orden_ejecucion || 0) - (b.orden_ejecucion || 0)
                );
            }

            return { data, error: null };
        } catch (error) {
            console.error('Error fetching routine day:', error);
            return { data: null, error };
        }
    },

    // Get routine day by date and weekly routine ID (direct query)
    async getRoutineDayByDate(routineId: string, fechaDia: string): Promise<ServiceResponse<RoutineDay>> {
        try {
            const { data, error } = await supabase
                .from('rutinas_diarias')
                .select(`
                    *,
                    ejercicios_programados (
                        id,
                        ejercicio_id,
                        orden_ejecucion,
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
                data.ejercicios_programados.sort((a: any, b: any) =>
                    (a.orden_ejecucion || 0) - (b.orden_ejecucion || 0)
                );
                data.ejercicios_programados.forEach((ex: any) => {
                    if (ex.series) {
                        ex.series.sort((a: any, b: any) =>
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
        try {
            const { data, error } = await supabase
                .from('rutinas_diarias')
                .select(`
                    *,
                    ejercicios_programados (
                        id,
                        ejercicio_id,
                        orden_ejecucion,
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
                data.ejercicios_programados.sort((a: any, b: any) =>
                    (a.orden_ejecucion || 0) - (b.orden_ejecucion || 0)
                );
                data.ejercicios_programados.forEach((ex: any) => {
                    if (ex.series) {
                        ex.series.sort((a: any, b: any) =>
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

    // Helper to get the start of the current week (Monday)
    getStartOfWeek(): string {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);
        return monday.toISOString();
    },

    // Helper to get Monday of current week as a date string (YYYY-MM-DD)
    // If today is Sunday, returns the Monday of this week (not next week)
    getMondayOfCurrentWeek(): string {
        const now = new Date();
        const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        // Calculate days to subtract to get to Monday
        // If Sunday (0), go back 6 days; otherwise go back (day - 1) days
        const daysToSubtract = day === 0 ? 6 : day - 1;
        const monday = new Date(now);
        monday.setDate(now.getDate() - daysToSubtract);
        monday.setHours(0, 0, 0, 0);
        return monday.toISOString().split('T')[0];
    },

    async getWorkoutStatsForRoutineDay(
        userId: string,
        routineDayId: string
    ): Promise<ServiceResponse<WorkoutStats>> {
        try {
            const startOfWeek = this.getStartOfWeek();

            const { data: templateDay } = await this.getRoutineDayById(routineDayId);
            if (!templateDay) return { data: null, error: 'Template not found' };

            const startOfWeekDate = startOfWeek.split('T')[0];

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
                data.ejercicios_programados?.map((set: any) => set.ejercicio_id) || []
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

    async getActiveWorkout(userId: string, routineDayId: string): Promise<ServiceResponse<any>> {
        try {
            const { data: templateDay } = await this.getRoutineDayById(routineDayId);
            if (!templateDay) return { data: null, error: 'Template not found' };

            const startOfWeek = this.getStartOfWeek().split('T')[0];

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

            if (error && (error as any).code !== 'PGRST116') throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error getting active workout:', error);
            return { data: null, error };
        }
    },

    async getAllWeeklyRoutines(userId: string): Promise<ServiceResponse<WeeklyRoutine[]>> {
        try {
            const { data, error } = await supabase
                .from('rutinas_semanales')
                .select('*')
                .eq('usuario_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching all weekly routines:', error);
            return { data: null, error };
        }
    },

    async createWeeklyRoutine(routineData: Partial<WeeklyRoutine>): Promise<ServiceResponse<WeeklyRoutine>> {
        try {
            // For non-template routines, set fecha_inicio_semana to Monday of current week
            const insertData: any = {
                ...routineData,
                updated_at: new Date().toISOString(),
            };



            const { data: routine, error } = await supabase
                .from('rutinas_semanales')
                .insert(insertData)
                .select()
                .single();

            if (error) throw error;

            const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

            const dailyRoutinesData = daysOfWeek.map((dayName) => ({
                rutina_semanal_id: routine.id,
                nombre_dia: dayName,
                fecha_dia: null,
            }));

            const { error: daysError } = await supabase
                .from('rutinas_diarias')
                .insert(dailyRoutinesData);

            if (daysError) throw daysError;

            return { data: routine, error: null };
        } catch (error) {
            console.error('Error creating weekly routine:', error);
            return { data: null, error };
        }
    },

    async updateWeeklyRoutine(id: string, updates: Partial<WeeklyRoutine>): Promise<ServiceResponse<WeeklyRoutine>> {
        try {
            const { data, error } = await supabase
                .from('rutinas_semanales')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error updating weekly routine:', error);
            return { data: null, error };
        }
    },

    async deleteWeeklyRoutine(id: string): Promise<{ error: any | null }> {
        try {
            const { error } = await supabase
                .from('rutinas_semanales')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Error deleting weekly routine:', error);
            return { error };
        }
    },

    async startDailyWorkout(
        routineDayId: string,
        date: string,
        startTime: string
    ): Promise<ServiceResponse<RoutineDay>> {
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

            const fechaDia = new Date(date).toISOString().split('T')[0];

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
                        })
                        .select('id')
                        .single();

                    if (exError || !newEx) continue;

                    const templateSeries = templateEx.series || [];
                    if (templateSeries.length > 0) {
                        const seriesToInsert = templateSeries.map((serie: any) => ({
                            ejercicio_programado_id: newEx.id,
                            numero_serie: serie.numero_serie,
                            repeticiones: serie.repeticiones || 0,
                            peso_utilizado: serie.peso_utilizado || 0,
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

            // First, try to find an existing routine day
            const { data: existingRoutines } = await this.getUserRoutines(userId);

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
            const startDateStr = startDate.split('T')[0];
            const endDateStr = endDate.split('T')[0];

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

    // Start weekly session - sets the start date for a routine
    async startWeeklySession(routineId: string, startDate: string): Promise<ServiceResponse<WeeklyRoutine>> {
        try {
            const { data, error } = await supabase
                .from('rutinas_semanales')
                .update({
                    activa: true,
                    fecha_inicio_semana: startDate,
                    updated_at: new Date().toISOString()
                })
                .eq('id', routineId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error starting weekly session:', error);
            return { data: null, error };
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

    // Set a routine as active (deactivates all others for the user)
    async setActiveRoutine(userId: string, routineId: string): Promise<ServiceResponse<WeeklyRoutine>> {
        try {
            // Deactivate ALL routines for this user
            await supabase
                .from('rutinas_semanales')
                .update({ activa: false, updated_at: new Date().toISOString() })
                .eq('usuario_id', userId);

            // Then, activate the selected routine
            const { data, error } = await supabase
                .from('rutinas_semanales')
                .update({
                    activa: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', routineId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error setting active routine:', error);
            return { data: null, error };
        }
    },

    // Create a new routine from a template (copies days and exercises)
    async createRoutineFromTemplate(
        userId: string,
        templateId: string,
        newName: string,
        objetivo?: string
    ): Promise<ServiceResponse<WeeklyRoutine>> {
        try {
            // 1. Get the template with all its days and exercises
            const { data: template, error: templateError } = await this.getWeeklyRoutineWithDays(templateId);
            if (templateError || !template) {
                throw new Error('Template not found');
            }

            // 2. Create the new weekly routine (non-template)
            // Set copiada_de_id to track which template this was created from
            // Set fecha_inicio_semana to the Monday of current week
            const { data: newRoutine, error: routineError } = await supabase
                .from('rutinas_semanales')
                .insert({
                    usuario_id: userId,
                    nombre: newName,
                    objetivo: objetivo || template.objetivo,
                    es_plantilla: true,
                    activa: false,
                    copiada_de_id: templateId,
                    fecha_inicio_semana: this.getMondayOfCurrentWeek(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (routineError || !newRoutine) throw routineError;

            // 3. Copy each rutina_diaria (template days)
            if (template.rutinas_diarias && template.rutinas_diarias.length > 0) {
                for (const day of template.rutinas_diarias) {
                    // Create the daily routine
                    const { data: newDay, error: dayError } = await supabase
                        .from('rutinas_diarias')
                        .insert({
                            rutina_semanal_id: newRoutine.id,
                            nombre_dia: day.nombre_dia,
                            descripcion: day.descripcion,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        })
                        .select()
                        .single();

                    if (dayError || !newDay) continue;

                    // 4. Copy ejercicios_programados for this day
                    if (day.ejercicios_programados && day.ejercicios_programados.length > 0) {
                        for (const exercise of day.ejercicios_programados) {
                            const { data: newExercise, error: exError } = await supabase
                                .from('ejercicios_programados')
                                .insert({
                                    rutina_diaria_id: newDay.id,
                                    ejercicio_id: exercise.ejercicio_id,
                                    orden_ejecucion: exercise.orden_ejecucion,
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString(),
                                })
                                .select()
                                .single();

                            if (exError || !newExercise) continue;

                            // 5. Copy series for this exercise
                            if (exercise.series && exercise.series.length > 0) {
                                const seriesToInsert = exercise.series.map((serie: any) => ({
                                    ejercicio_programado_id: newExercise.id,
                                    numero_serie: serie.numero_serie,
                                    repeticiones: serie.repeticiones,
                                    peso_utilizado: serie.peso_utilizado || null,
                                    // descanso_segundos removed as it's not in DB schema
                                    created_at: new Date().toISOString(),
                                }));

                                await supabase.from('series').insert(seriesToInsert);
                            } else {
                                // Create 3 empty series by default if template has no series
                                const defaultSeries = [1, 2, 3].map(num => ({
                                    ejercicio_programado_id: newExercise.id,
                                    numero_serie: num,
                                    repeticiones: null,
                                    peso_utilizado: null,
                                    created_at: new Date().toISOString(),
                                }));

                                await supabase.from('series').insert(defaultSeries);
                            }
                        }
                    }
                }
            }

            return { data: newRoutine, error: null };
        } catch (error) {
            console.error('Error creating routine from template:', error);
            return { data: null, error };
        }
    },
};
