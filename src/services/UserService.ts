import { supabase } from '../lib/supabase';


interface UserMetrics {
    weight: number;
    height: number;
    bodyFatPercentage?: number;
    imc?: number;
}

interface ServiceResponse<T> {
    data: T | null;
    error: any | null;
}

export const UserService = {
    async createOrUpdateProfile(user: any): Promise<ServiceResponse<any>> {
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .upsert({
                    id: user.id,
                    email: user.email,
                    nombre: user.user_metadata?.full_name || '',
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error creating/updating profile:', error);
            return { data: null, error };
        }
    },

    async saveUserMetrics(userId: string, metrics: UserMetrics): Promise<ServiceResponse<any>> {
        try {
            const imc = metrics.imc ??
                (metrics.weight / Math.pow(metrics.height / 100, 2));

            const { data, error } = await supabase
                .from('usuarios')
                .update({
                    peso: metrics.weight,
                    altura: metrics.height / 100, // Convert CM to Meters for DB
                    grasa_corporal: metrics.bodyFatPercentage ?? null,
                    imc: parseFloat(imc.toFixed(1)),
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;

            // Insert weight into history for tracking over time
            if (metrics.weight) {
                await supabase
                    .from('historial_peso')
                    .insert({
                        usuario_id: userId,
                        peso: metrics.weight,
                    });
            }

            // Return data with height converted back to CM for app consistency
            if (data?.altura) {
                data.altura = data.altura * 100;
            }

            return { data, error: null };
        } catch (error) {
            console.error('Error saving user metrics:', error);
            return { data: null, error };
        }
    },

    async getUserMetrics(userId: string): Promise<ServiceResponse<any>> {
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('peso, altura, grasa_corporal, imc, updated_at')
                .eq('id', userId)
                .single();

            if (error && (error as any).code !== 'PGRST116') throw error;

            // Convert Meters to CM for the app
            if (data?.altura) {
                data.altura = data.altura * 100;
            }

            return { data, error: null };
        } catch (error) {
            console.error('Error fetching user metrics:', error);
            return { data: null, error };
        }
    },

    async uploadProfilePhoto(userId: string, photoUri: string): Promise<{ url: string | null; error: any | null }> {
        try {
            const fileExt = photoUri.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${userId}/${Date.now()}.${fileExt}`;

            // Use fetch to get the file as a blob (modern approach for Expo SDK 54+)
            const response = await fetch(photoUri);
            const blob = await response.blob();

            // Convert blob to ArrayBuffer for Supabase upload
            const arrayBuffer = await new Response(blob).arrayBuffer();

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('fotos-perfil')
                .upload(fileName, arrayBuffer, {
                    contentType: `image/${fileExt}`,
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('fotos-perfil')
                .getPublicUrl(fileName);

            const publicUrl = publicUrlData.publicUrl;

            // Update user metadata so it reflects in the app (AuthContext)
            const { error: authError } = await supabase.auth.updateUser({
                data: { custom_avatar_url: publicUrl },
            });

            if (authError) throw authError;

            // Also update `usuarios` table for consistency
            await supabase
                .from('usuarios')
                .update({ url_foto: publicUrl })
                .eq('id', userId);

            return { url: publicUrl, error: null };
        } catch (error) {
            console.error('Error uploading profile photo:', error);
            return { url: null, error };
        }
    },
};
