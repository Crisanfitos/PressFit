import { supabase } from '../lib/supabase';
import { isE2EMockEnabled, mockStore, e2eFixtures } from '../lib/e2eMockAdapter';
import { ServiceResponse, Exercise, CustomExerciseInput } from '../types/models';
import { LogService } from './LogService';

export { CustomExerciseInput, Exercise };

interface CatalogExerciseItem {
    id: string;
    nombre?: string;
    titulo?: string;
    grupo_muscular?: string;
    categoria?: string;
    musculos_primarios?: string;
    is_custom?: boolean;
    es_personalizado?: boolean;
    created_by?: string | null;
    user_id?: string | null;
    url_video?: string;
    video_url?: string;
    [key: string]: unknown;
}

export const enrichExerciseOwnership = (
    ex: Record<string, any>,
    currentUserId: string | null = null
): Exercise => {
    const creatorId = (ex.created_by || ex.user_id || null) as string | null;
    const isCustom = Boolean(
        ex.is_custom === true ||
        ex.es_custom === true ||
        ex.es_personalizado === true ||
        (creatorId !== null && creatorId !== '')
    );
    const isOficial = !isCustom;
    const isOwner = Boolean(currentUserId && creatorId && currentUserId === creatorId);
    const videoUrl = (ex.url_video || ex.video_url || '') as string;
    const name = (ex.nombre || ex.titulo || '') as string;
    const mainGroup = (ex.grupo_muscular || ex.categoria || ex.grupo_muscular_principal || 'General') as string;

    return {
        ...ex,
        id: ex.id,
        nombre: name,
        titulo: ex.titulo || name,
        grupo_muscular: mainGroup,
        grupo_muscular_principal: ex.grupo_muscular_principal || mainGroup,
        user_id: creatorId,
        created_by: creatorId,
        es_custom: isCustom,
        is_custom: isCustom,
        es_oficial: isOficial,
        es_propietario: isOwner,
        url_video: videoUrl,
        video_url: videoUrl,
    };
};

export const ExerciseService = {
    async getExercises(): Promise<ServiceResponse<Exercise[]>> {
        let currentUserId: string | null = null;
        try {
            const { data: authData } = await supabase.auth.getUser();
            currentUserId = authData?.user?.id || null;
        } catch {
            currentUserId = null;
        }

        if (isE2EMockEnabled()) {
            return {
                data: (mockStore.getCatalogExercises() as CatalogExerciseItem[]).map((ex) =>
                    enrichExerciseOwnership(ex, currentUserId)
                ),
                error: null,
            };
        }
        try {
            const { data, error } = await supabase
                .from('ejercicios')
                .select('*')
                .order('titulo');

            if (error) throw error;
            return {
                data: (data || []).map((ex) => enrichExerciseOwnership(ex, currentUserId)),
                error: null,
            };
        } catch (error) {
            LogService.error('Error fetching exercises:', error);
            return { data: null, error };
        }
    },

    async createCustomExercise(exerciseData: CustomExerciseInput): Promise<ServiceResponse<Exercise>> {
        let currentUserId: string | null = null;
        try {
            const { data: authData } = await supabase.auth.getUser();
            currentUserId = authData?.user?.id || null;
        } catch {
            currentUserId = null;
        }

        if (isE2EMockEnabled()) {
            const newEx = mockStore.addCustomExercise(exerciseData);
            return {
                data: enrichExerciseOwnership(
                    {
                        ...newEx,
                        created_by: currentUserId || 'mock-user-id',
                        user_id: currentUserId || 'mock-user-id',
                        is_custom: true,
                    },
                    currentUserId || 'mock-user-id'
                ),
                error: null,
            };
        }
        try {
            const videoUrl = exerciseData.url_video || exerciseData.video_url || '';
            const { data, error } = await supabase
                .from('ejercicios')
                .insert({
                    titulo: exerciseData.titulo,
                    description: exerciseData.descripcion || '',
                    categoria: exerciseData.grupo_muscular,
                    musculos_primarios: [exerciseData.musculos_primarios || exerciseData.grupo_muscular],
                    musculos_secundarios: exerciseData.musculos_secundarios || [],
                    dificultad: exerciseData.dificultad || 'intermediate',
                    url_video: videoUrl,
                    video_url: videoUrl,
                    is_custom: true,
                    created_by: currentUserId,
                    user_id: currentUserId,
                })
                .select()
                .single();

            if (error) throw error;
            return {
                data: data ? enrichExerciseOwnership(data, currentUserId) : null,
                error: null,
            };
        } catch (error) {
            LogService.error('Error creating custom exercise:', error);
            return { data: null, error };
        }
    },

    async updateCustomExercise(
        id: string,
        exerciseData: Partial<CustomExerciseInput>
    ): Promise<ServiceResponse<Exercise>> {
        let currentUserId: string | null = null;
        try {
            const { data: authData } = await supabase.auth.getUser();
            currentUserId = authData?.user?.id || null;
        } catch {
            currentUserId = null;
        }

        if (isE2EMockEnabled()) {
            const updated = mockStore.updateCustomExercise(id, exerciseData);
            return {
                data: updated ? enrichExerciseOwnership(updated, currentUserId) : null,
                error: updated ? null : new Error('Exercise not found'),
            };
        }
        try {
            // Check ownership and official status
            const { data: existing, error: checkError } = await supabase
                .from('ejercicios')
                .select('id, is_custom, created_by, user_id')
                .eq('id', id)
                .single();

            if (checkError || !existing) {
                return { data: null, error: checkError || new Error('Exercise not found') };
            }

            const isCustom = Boolean(existing.is_custom === true || existing.created_by || existing.user_id);
            if (!isCustom) {
                return { data: null, error: new Error('No se pueden modificar ejercicios oficiales de la aplicación') };
            }

            const creatorId = existing.created_by || existing.user_id;
            if (currentUserId && creatorId && creatorId !== currentUserId) {
                return { data: null, error: new Error('No tienes permisos para modificar este ejercicio') };
            }

            const updatePayload: Record<string, unknown> = {};
            if (exerciseData.titulo) updatePayload.titulo = exerciseData.titulo;
            if (exerciseData.descripcion !== undefined) updatePayload.description = exerciseData.descripcion;
            if (exerciseData.grupo_muscular) updatePayload.categoria = exerciseData.grupo_muscular;
            if (exerciseData.musculos_primarios || exerciseData.grupo_muscular) {
                updatePayload.musculos_primarios = [exerciseData.musculos_primarios || exerciseData.grupo_muscular];
            }
            if (exerciseData.musculos_secundarios) updatePayload.musculos_secundarios = exerciseData.musculos_secundarios;
            if (exerciseData.dificultad) updatePayload.dificultad = exerciseData.dificultad;
            const videoUrl = exerciseData.url_video !== undefined ? exerciseData.url_video : exerciseData.video_url;
            if (videoUrl !== undefined) {
                updatePayload.url_video = videoUrl;
                updatePayload.video_url = videoUrl;
            }

            const { data, error } = await supabase
                .from('ejercicios')
                .update(updatePayload)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return {
                data: data ? enrichExerciseOwnership(data, currentUserId) : null,
                error: null,
            };
        } catch (error) {
            LogService.error('Error updating custom exercise:', error);
            return { data: null, error };
        }
    },

    async deleteCustomExercise(id: string): Promise<ServiceResponse<boolean>> {
        let currentUserId: string | null = null;
        try {
            const { data: authData } = await supabase.auth.getUser();
            currentUserId = authData?.user?.id || null;
        } catch {
            currentUserId = null;
        }

        if (isE2EMockEnabled()) {
            const deleted = mockStore.deleteCustomExercise(id);
            return { data: deleted, error: null };
        }
        try {
            // Check ownership and official status
            const { data: existing, error: checkError } = await supabase
                .from('ejercicios')
                .select('id, is_custom, created_by, user_id')
                .eq('id', id)
                .single();

            if (checkError || !existing) {
                return { data: false, error: checkError || new Error('Exercise not found') };
            }

            const isCustom = Boolean(existing.is_custom === true || existing.created_by || existing.user_id);
            if (!isCustom) {
                return { data: false, error: new Error('No se pueden eliminar ejercicios oficiales de la aplicación') };
            }

            const creatorId = existing.created_by || existing.user_id;
            if (currentUserId && creatorId && creatorId !== currentUserId) {
                return { data: false, error: new Error('No tienes permisos para eliminar este ejercicio') };
            }

            const { error } = await supabase
                .from('ejercicios')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { data: true, error: null };
        } catch (error) {
            LogService.error('Error deleting custom exercise:', error);
            return { data: false, error };
        }
    },

    async getExerciseById(id: string): Promise<ServiceResponse<Exercise>> {
        let currentUserId: string | null = null;
        try {
            const { data: authData } = await supabase.auth.getUser();
            currentUserId = authData?.user?.id || null;
        } catch {
            currentUserId = null;
        }

        try {
            const { data, error } = await supabase
                .from('ejercicios')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return {
                data: data ? enrichExerciseOwnership(data, currentUserId) : null,
                error: null,
            };
        } catch (error) {
            LogService.error('Error fetching exercise details:', error);
            return { data: null, error };
        }
    },

    async addExercisesToRoutineDay(
        userId: string,
        routineDayId: string,
        exerciseIds: string[]
    ): Promise<ServiceResponse<unknown[]>> {
        if (isE2EMockEnabled()) {
            mockStore.addExercisesToRoutineDay(routineDayId, exerciseIds);
            return { data: [], error: null };
        }
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
            LogService.error('Error adding exercises to routine:', error);
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
            LogService.error('Error fetching personal note:', error);
            return { data: null, error };
        }
    },

    async savePersonalNote(userId: string, exerciseId: string, content: string): Promise<ServiceResponse<unknown>> {
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
            LogService.error('Error saving personal note:', error);
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
            seriesData?.forEach((serie) => {
                const ep = Array.isArray(serie.ejercicio_programado)
                    ? serie.ejercicio_programado[0]
                    : serie.ejercicio_programado;
                const rd = Array.isArray(ep?.rutina_diaria)
                    ? ep?.rutina_diaria[0]
                    : ep?.rutina_diaria;
                const rs = Array.isArray(rd?.rutina_semanal)
                    ? rd?.rutina_semanal[0]
                    : rd?.rutina_semanal;
                const userId_from_data = rs?.usuario_id;
                if (userId_from_data === userId && ep?.ejercicio_id) {
                    exerciseIds.add(ep.ejercicio_id);
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
            LogService.error('Error fetching user exercises with progress:', error);
            return { data: null, error };
        }
    },
};
