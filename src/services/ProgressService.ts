import { supabase } from '../lib/supabase';


interface ProgressPhoto {
    id: string;
    usuario_id: string;
    url_foto: string;
    comentario?: string;
    created_at: string;
    [key: string]: any;
}

interface WorkoutSession {
    id: string;
    hora_inicio?: string;
    hora_fin?: string;
    fecha_dia?: string;
    ejercicios_programados?: any[];
    [key: string]: any;
}

interface ServiceResponse<T> {
    data: T | null;
    error: any | null;
}

export const ProgressService = {
    async getDailyProgress(userId: string, date: Date): Promise<ServiceResponse<WorkoutSession[]>> {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const { data, error } = await supabase
                .from('rutinas_diarias')
                .select(`
          *,
          rutina_semanal:rutinas_semanales!inner(usuario_id),
          ejercicios_programados (
            *,
            ejercicio:ejercicios (*),
            series (*)
          )
        `)
                .eq('rutina_semanal.usuario_id', userId)
                .gte('hora_fin', startOfDay.toISOString())
                .lte('hora_fin', endOfDay.toISOString())
                .order('hora_fin', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching daily progress:', error);
            return { data: null, error };
        }
    },

    async getWeeklyProgress(userId: string): Promise<ServiceResponse<WorkoutSession[]>> {
        try {
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            const { data, error } = await supabase
                .from('rutinas_diarias')
                .select(`
          id,
          hora_inicio,
          hora_fin,
          rutina_semanal:rutinas_semanales!inner(usuario_id)
        `)
                .eq('rutina_semanal.usuario_id', userId)
                .gte('hora_fin', startOfWeek.toISOString())
                .not('hora_fin', 'is', null);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching weekly progress:', error);
            return { data: null, error };
        }
    },

    async getMonthlyProgress(
        userId: string,
        year: number | null = null,
        month: number | null = null
    ): Promise<ServiceResponse<WorkoutSession[]>> {
        try {
            const now = new Date();
            const targetYear = year ?? now.getFullYear();
            const targetMonth = month ?? now.getMonth();

            const startOfMonth = new Date(targetYear, targetMonth, 1);
            const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

            const { data, error } = await supabase
                .from('rutinas_diarias')
                .select(`
          id,
          hora_inicio,
          hora_fin,
          fecha_dia,
          rutina_semanal:rutinas_semanales!inner(usuario_id)
        `)
                .eq('rutina_semanal.usuario_id', userId)
                .gte('hora_fin', startOfMonth.toISOString())
                .lte('hora_fin', endOfMonth.toISOString())
                .not('hora_fin', 'is', null);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching monthly progress:', error);
            return { data: null, error };
        }
    },

    async getProgressPhotos(userId: string): Promise<ServiceResponse<ProgressPhoto[]>> {
        try {
            const { data, error } = await supabase
                .from('fotos_progreso')
                .select('*')
                .eq('usuario_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Generate signed URLs for private bucket
            const photosWithSignedUrls = await Promise.all(
                (data || []).map(async (photo) => {
                    try {
                        const path = photo.url_foto.split('/fotos-progreso/').pop();
                        if (!path) return photo;

                        const { data: signedData, error: signedError } = await supabase.storage
                            .from('fotos-progreso')
                            .createSignedUrl(path, 3600);

                        if (signedError || !signedData?.signedUrl) {
                            return photo;
                        }

                        return {
                            ...photo,
                            url_foto: signedData.signedUrl,
                        };
                    } catch {
                        return photo;
                    }
                })
            );

            return { data: photosWithSignedUrls, error: null };
        } catch (error) {
            console.error('Error fetching progress photos:', error);
            return { data: null, error };
        }
    },

    async uploadProgressPhoto(
        userId: string,
        photoUri: string,
        date: Date | null,
        comment: string
    ): Promise<ServiceResponse<ProgressPhoto>> {
        try {
            const fileExt = photoUri.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${userId}/${Date.now()}.${fileExt}`;

            // Use fetch to get the file as a blob (modern approach for Expo SDK 54+)
            const response = await fetch(photoUri);
            const blob = await response.blob();

            // Convert blob to ArrayBuffer for Supabase upload
            const arrayBuffer = await new Response(blob).arrayBuffer();

            const { error: uploadError } = await supabase.storage
                .from('fotos-progreso')
                .upload(fileName, arrayBuffer, {
                    contentType: `image/${fileExt}`,
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('fotos-progreso')
                .getPublicUrl(fileName);

            const { data: insertData, error: insertError } = await supabase
                .from('fotos_progreso')
                .insert({
                    usuario_id: userId,
                    url_foto: publicUrlData.publicUrl,
                    comentario: comment || '',
                    created_at: date ? date.toISOString() : new Date().toISOString(),
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Generate signed URL for immediate display
            const { data: signedData } = await supabase.storage
                .from('fotos-progreso')
                .createSignedUrl(fileName, 3600);

            if (signedData?.signedUrl) {
                insertData.url_foto = signedData.signedUrl;
            }

            return { data: insertData, error: null };
        } catch (error) {
            console.error('Error uploading progress photo:', error);
            return { data: null, error };
        }
    },

    async updateProgressPhoto(
        photoId: string,
        updates: { comentario?: string; created_at?: string }
    ): Promise<ServiceResponse<ProgressPhoto>> {
        try {
            const { data, error } = await supabase
                .from('fotos_progreso')
                .update(updates)
                .eq('id', photoId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error updating progress photo:', error);
            return { data: null, error };
        }
    },

    async deleteProgressPhotos(
        photoIds: string[]
    ): Promise<{ success: boolean; error: any | null }> {
        try {
            const { data: photos, error: fetchError } = await supabase
                .from('fotos_progreso')
                .select('id, url_foto')
                .in('id', photoIds);

            if (fetchError) throw fetchError;

            const filePaths = (photos || [])
                .map((photo) => photo.url_foto.split('/fotos-progreso/').pop())
                .filter((path): path is string => !!path);

            if (filePaths.length > 0) {
                const { error: storageError } = await supabase.storage
                    .from('fotos-progreso')
                    .remove(filePaths);

                if (storageError) {
                    console.warn('Error deleting from storage:', storageError);
                }
            }

            const { error: deleteError } = await supabase
                .from('fotos_progreso')
                .delete()
                .in('id', photoIds);

            if (deleteError) throw deleteError;

            return { success: true, error: null };
        } catch (error) {
            console.error('Error deleting progress photos:', error);
            return { success: false, error };
        }
    },

    async getExerciseHistory(userId: string, exerciseId: string): Promise<ServiceResponse<any[]>> {
        try {
            const { data, error } = await supabase
                .from('series')
                .select(`
          *,
          ejercicio_programado:ejercicios_programados!inner (
            id,
            ejercicio_id,
            rutina_diaria:rutinas_diarias!inner (
              hora_fin,
              rutina_semanal:rutinas_semanales!inner (
                usuario_id
              )
            )
          )
        `)
                .eq('ejercicio_programado.ejercicio_id', exerciseId)
                .eq('ejercicio_programado.rutina_diaria.rutina_semanal.usuario_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching exercise history:', error);
            return { data: null, error };
        }
    },
};
