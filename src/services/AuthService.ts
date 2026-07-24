import { supabase } from '../lib/supabase';

export const AuthService = {
    async signInWithEmail(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    },

    async signUpWithEmail(email: string, password: string, fullName: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });
        if (error) throw error;
        return data;
    },

    async signOut() {
        await supabase.auth.signOut();
    },

    async getSession() {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data.session;
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
        return supabase.auth.onAuthStateChange(callback);
    },

    async signInWithOAuth(provider: any, options?: any) {
        return await supabase.auth.signInWithOAuth({
            provider,
            options,
        });
    },

    async exchangeCodeForSession(code: string) {
        return await supabase.auth.exchangeCodeForSession(code);
    },

    async setSession(sessionData: { access_token: string; refresh_token: string }) {
        return await supabase.auth.setSession(sessionData);
    }
};
