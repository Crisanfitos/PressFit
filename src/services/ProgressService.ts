import { supabase } from '../lib/supabase';
import { HistoryService } from './HistoryService';

interface ProgressPhoto {
    id: string;
    usuario_id: string;
    url_foto: string;
    comentario?: string;
    created_at: string;
    [key: string]: any;
}

interface ServiceResponse<T> {
    data: T | null;
    error: any | null;
}

export const ProgressService = {
    // History methods facade for backward compatibility
    async getDailyProgress(userId: string, date: Date) {
        return HistoryService.getDailyProgress(userId, date);
    },

    async getWeeklyProgress(userId: string) {
        return HistoryService.getWeeklyProgress(userId);
    },

    async getMonthlyProgress(userId: string, year: number | null = null, month: number | null = null) {
        return HistoryService.getMonthlyProgress(userId, year, month);
    },

    async getExerciseHistory(userId: string, exerciseId: string) {
        return HistoryService.getExerciseHistory(userId, exerciseId);
    },

    // Progress photo & anthropometric methods
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
};
