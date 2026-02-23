import { supabase } from '../lib/supabase';

interface Exercise {
    id: string;
    titulo: string;
    descripcion?: string;
    grupo_muscular?: string;
    url_video?: string;
    imagen_url?: string;
    [key: string]: any;
}

interface ServiceResponse<T> {
    data: T | null;
    error: any | null;
}

export const ExerciseService = {
    async getExercises(): Promise<ServiceResponse<Exercise[]>> {
        try {
            const { data, error } = await supabase
                .from('ejercicios')
                .select('*')
                .order('titulo');

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching exercises:', error);
            return { data: null, error };
        }
    },

    async getExerciseById(id: string): Promise<ServiceResponse<Exercise>> {
        try {
            const { data, error } = await supabase
                .from('ejercicios')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching exercise details:', error);
            return { data: null, error };
        }
    },

    async addExercisesToRoutineDay(
        userId: string,
        routineDayId: string,
        exerciseIds: string[]
    ): Promise<ServiceResponse<any[]>> {
        try {
            // 1. Get current max order index
            const { data: currentExercises } = await supabase
                .from('ejercicios_programados')
                .select('orden_ejecucion')
                .eq('rutina_diaria_id', routineDayId)
                .order('orden_ejecucion', { ascending: false })
                .limit(1);

            let nextIndex = (currentExercises?.[0]?.orden_ejecucion || 0) + 1;

            // 2. Prepare inserts
            const inserts = exerciseIds.map((exerciseId, i) => ({
                rutina_diaria_id: routineDayId,
                ejercicio_id: exerciseId,
                orden_ejecucion: nextIndex + i,
            }));

            const { data, error } = await supabase
                .from('ejercicios_programados')
                .insert(inserts)
                .select();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error adding exercises to routine:', error);
            return { data: null, error };
        }
    },

    async getPersonalNote(userId: string, exerciseId: string): Promise<ServiceResponse<string | null>> {
        try {
            const { data, error } = await supabase
                .from('notas_personales_ejercicios')
                .select('contenido_nota')
                .eq('usuario_id', userId)
                .eq('ejercicio_id', exerciseId)
                .single();

            // PGRST116 is "Row not found" which is fine
            if (error && error.code !== 'PGRST116') throw error;

            return { data: data?.contenido_nota || null, error: null };
        } catch (error) {
            console.error('Error fetching personal note:', error);
            return { data: null, error };
        }
    },

    async savePersonalNote(userId: string, exerciseId: string, content: string): Promise<ServiceResponse<any>> {
        try {
            const { data, error } = await supabase
                .from('notas_personales_ejercicios')
                .upsert({
                    usuario_id: userId,
                    ejercicio_id: exerciseId,
                    contenido_nota: content,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'usuario_id, ejercicio_id'
                })
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error saving personal note:', error);
            return { data: null, error };
        }
    },

    /**
     * Get exercises that the user has performed (has series data)
     */
    async getUserExercisesWithProgress(userId: string): Promise<ServiceResponse<Exercise[]>> {
        try {
            // Get all distinct exercises from user's routines that have series data
            const { data: seriesData, error: seriesError } = await supabase
                .from('series')
                .select(`
                    ejercicio_programado:ejercicios_programados!inner(
                        ejercicio_id,
                        rutina_diaria:rutinas_diarias!inner(
                            rutina_semanal:rutinas_semanales!inner(
                                usuario_id
                            )
                        )
                    )
                `)
                .not('peso_utilizado', 'is', null);

            if (seriesError) throw seriesError;

            // Extract unique exercise IDs from user's completed series
            const exerciseIds = new Set<string>();
            seriesData?.forEach((serie: any) => {
                const userId_from_data = serie.ejercicio_programado?.rutina_diaria?.rutina_semanal?.usuario_id;
                if (userId_from_data === userId && serie.ejercicio_programado?.ejercicio_id) {
                    exerciseIds.add(serie.ejercicio_programado.ejercicio_id);
                }
            });

            if (exerciseIds.size === 0) {
                return { data: [], error: null };
            }

            // Fetch exercise details for these IDs
            const { data: exercises, error: exercisesError } = await supabase
                .from('ejercicios')
                .select('*')
                .in('id', Array.from(exerciseIds))
                .order('titulo');

            if (exercisesError) throw exercisesError;
            return { data: exercises, error: null };
        } catch (error) {
            console.error('Error fetching user exercises with progress:', error);
            return { data: null, error };
        }
    },
};
