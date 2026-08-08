import { supabase } from '../lib/supabase';
import { formatLocalDateKey, getStartOfWeek as getStartOfWeekUtil } from "../utils/dateUtils";
import { DailyWorkoutService } from './DailyWorkoutService';
import { isE2EMockEnabled, mockStore } from '../lib/e2eMockAdapter';
import {
    RoutineDay,
    WeeklyRoutine,
    WorkoutStats,
    ScheduledExercise,
    Serie,
    ServiceResponse,
    WeeklyRoutineInsert,
    PostgrestError,
    SeriesInsert,
} from '../types/models';
import { PresetRoutineService } from './PresetRoutineService';


export const RoutineService = {
    async getWeeklyRoutineWithDays(routineId: string): Promise<ServiceResponse<WeeklyRoutine>> {
        if (isE2EMockEnabled()) {
            return { data: mockStore.getActiveRoutine() as any, error: null };
        }
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
                data.rutinas_diarias.forEach((day: RoutineDay) => {
                    if (day.ejercicios_programados) {
                        day.ejercicios_programados.sort((a: ScheduledExercise, b: ScheduledExercise) =>
                            (a.orden_ejecucion || 0) - (b.orden_ejecucion || 0)
                        );
                        day.ejercicios_programados.forEach((ex: ScheduledExercise) => {
                            if (ex.series) {
                                ex.series.sort((a: Serie, b: Serie) =>
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
        if (isE2EMockEnabled()) {
            return { data: [mockStore.getActiveRoutine() as any], error: null };
        }
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
        return DailyWorkoutService.getRoutineDayById(routineDayId);
    },

    // Get routine day by date and weekly routine ID (direct query)
    async getRoutineDayByDate(routineId: string, fechaDia: string): Promise<ServiceResponse<RoutineDay>> {
        return DailyWorkoutService.getRoutineDayByDate(routineId, fechaDia);
    },

    // Get routine day template by name (where fecha_dia is NULL)
    async getRoutineDayByName(routineId: string, nombreDia: string): Promise<ServiceResponse<RoutineDay>> {
        return DailyWorkoutService.getRoutineDayByName(routineId, nombreDia);
    },

    // Helper to get the start of the current week (Monday)
    getStartOfWeek(): string {
        return getStartOfWeekUtil(new Date()).toISOString();
    },

    // Helper to get Monday of current week as a date string (YYYY-MM-DD)
    // If today is Sunday, returns the Monday of this week (not next week)
    getMondayOfCurrentWeek(): string {
        return formatLocalDateKey(getStartOfWeekUtil(new Date()));
    },

    async getWorkoutStatsForRoutineDay(
        userId: string,
        routineDayId: string
    ): Promise<ServiceResponse<WorkoutStats>> {
        return DailyWorkoutService.getWorkoutStatsForRoutineDay(userId, routineDayId);
    },

    async getActiveWorkout(userId: string, routineDayId: string): Promise<ServiceResponse<RoutineDay>> {
        return DailyWorkoutService.getActiveWorkout(userId, routineDayId);
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
            const insertData: WeeklyRoutineInsert = {
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

    async deleteWeeklyRoutine(id: string): Promise<{ error: unknown }> {
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
        return DailyWorkoutService.startDailyWorkout(routineDayId, date, startTime);
    },

    // Get or create a routine day for a specific day of week
    async getOrCreateRoutineDay(userId: string, dayOfWeek: number): Promise<ServiceResponse<RoutineDay>> {
        return DailyWorkoutService.getOrCreateRoutineDay(userId, dayOfWeek);
    },

    // Batch fetch workouts for a date range (critical for calendar)
    async getWorkoutsForDateRange(
        routineWeeklyIds: string[],
        startDate: string,
        endDate: string
    ): Promise<ServiceResponse<RoutineDay[]>> {
        return DailyWorkoutService.getWorkoutsForDateRange(routineWeeklyIds, startDate, endDate);
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
        return DailyWorkoutService.getRoutineDayStatus(routineDay, workoutStats, dayOfWeek);
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
                    fecha_inicio_semana: formatLocalDateKey(getStartOfWeekUtil(new Date())),
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
                                    tipo_peso: exercise.tipo_peso || 'total',
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString(),
                                })
                                .select()
                                .single();

                            if (exError || !newExercise) continue;

                            // 5. Copy series for this exercise
                            if (exercise.series && exercise.series.length > 0) {
                                const seriesToInsert = exercise.series.map((serie: Serie) => ({
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

    async updateRoutineDayDescription(dayId: string, descripcion: string): Promise<ServiceResponse<RoutineDay>> {
        return DailyWorkoutService.updateRoutineDayDescription(dayId, descripcion);
    },

    /**
     * Imports/clones a pre-defined seed routine into the user's active weekly routine in Supabase.
     * @param userId The ID of the user importing the routine
     * @param presetRoutineId The ID of the preset routine (e.g. 'preset-ppl-6d')
     * @param setActive Whether to automatically set this routine as active (defaults to true)
     */
    async importPresetRoutine(
        userId: string,
        presetRoutineId: string,
        setActive: boolean = true
    ): Promise<ServiceResponse<WeeklyRoutine>> {
        if (isE2EMockEnabled()) {
            return { data: mockStore.getActiveRoutine() as any, error: null };
        }
        try {
            // 1. Fetch the preset routine template from local assets
            const { data: preset, error: presetError } = PresetRoutineService.getPresetById(presetRoutineId);
            if (presetError || !preset) {
                throw new Error(`Preset routine '${presetRoutineId}' not found`);
            }

            // 2. Fetch all exercises from catalog to map exercise names to UUIDs
            const { data: catalogExercises, error: catalogError } = await supabase
                .from('ejercicios')
                .select('id, titulo');

            if (catalogError) throw catalogError;

            // Helper to find or create an exercise ID by name
            const getExerciseIdByName = async (name: string, muscleGroup: string): Promise<string> => {
                const normalized = name.trim().toLowerCase();
                const matched = (catalogExercises || []).find(
                    (ex) => ex.titulo && ex.titulo.trim().toLowerCase() === normalized
                );

                if (matched) return matched.id;

                // Fallback: create a missing exercise entry in catalog
                const { data: newEx, error: newExError } = await supabase
                    .from('ejercicios')
                    .insert({
                        titulo: name,
                        categoria: muscleGroup,
                        musculos_primarios: [muscleGroup],
                        dificultad: 'intermediate',
                        is_custom: true,
                        created_by: userId,
                    })
                    .select('id')
                    .single();




                if (newExError || !newEx) throw newExError || new Error(`Failed to create exercise ${name}`);
                return newEx.id;
            };

            // 3. Create the new weekly routine
            const { data: newRoutine, error: routineError } = await supabase
                .from('rutinas_semanales')
                .insert({
                    usuario_id: userId,
                    nombre: preset.nombre,
                    objetivo: preset.categoria,
                    es_plantilla: true,
                    activa: false, // will activate via setActiveRoutine if setActive === true
                    fecha_inicio_semana: formatLocalDateKey(getStartOfWeekUtil(new Date())),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();


            if (routineError || !newRoutine) throw routineError || new Error('Failed to create weekly routine');

            // 4. Create daily routines and scheduled exercises
            if (preset.rutinas_diarias && preset.rutinas_diarias.length > 0) {
                for (const day of preset.rutinas_diarias) {
                    const { data: newDay, error: dayError } = await supabase
                        .from('rutinas_diarias')
                        .insert({
                            rutina_semanal_id: newRoutine.id,
                            nombre_dia: day.nombre_dia,
                            descripcion: day.descripcion || null,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        })
                        .select()
                        .single();

                    if (dayError || !newDay) {
                        if (dayError) throw dayError;
                        continue;
                    }

                    if (day.ejercicios && day.ejercicios.length > 0) {
                        for (const ex of day.ejercicios) {
                            const exerciseId = await getExerciseIdByName(
                                ex.nombre_ejercicio,
                                ex.grupo_muscular_principal
                            );

                            const { data: newScheduledEx, error: schError } = await supabase
                                .from('ejercicios_programados')
                                .insert({
                                    rutina_diaria_id: newDay.id,
                                    ejercicio_id: exerciseId,
                                    orden_ejecucion: ex.orden_ejecucion,
                                    tipo_peso: ex.tipo_peso || 'total',
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString(),
                                })
                                .select()
                                .single();

                            if (schError || !newScheduledEx) {
                                if (schError) throw schError;
                                continue;
                            }

                            if (ex.series && ex.series.length > 0) {
                                const seriesInserts = ex.series.map((s) => ({
                                    ejercicio_programado_id: newScheduledEx.id,
                                    numero_serie: s.numero_serie,
                                    repeticiones: s.repeticiones_objetivo || 0,
                                    peso_utilizado: s.peso_sugerido || 0,
                                    rpe: s.rpe_objetivo ? Math.round(s.rpe_objetivo) : null,
                                    descanso_segundos: s.descanso_segundos || null,
                                    created_at: new Date().toISOString(),
                                }));

                                const { error: seriesErr } = await supabase.from('series').insert(seriesInserts);
                                if (seriesErr) throw seriesErr;
                            }

                        }
                    }
                }
            }

            // 5. Activate routine if requested
            if (setActive) {
                const { error: activeErr } = await this.setActiveRoutine(userId, newRoutine.id);
                if (activeErr) throw activeErr;
                newRoutine.activa = true;
            }

            return { data: newRoutine, error: null };
        } catch (error) {
            console.error('Error importing preset routine:', error);
            return { data: null, error };
        }
    },
};


