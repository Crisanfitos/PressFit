import { supabase } from '../lib/supabase';
import { isE2EMockEnabled, mockStore } from '../lib/e2eMockAdapter';

export const AuthService = {
    async signInWithEmail(email: string, password: string) {
        if (isE2EMockEnabled()) {
            mockStore.resetStore();
        }
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
        if (isE2EMockEnabled()) {
            mockStore.resetStore();
        }
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

export function mapAuthError(err: any): string {
    if (!err) return 'Authentication failed. Please try again later.';
    const msg = typeof err === 'string' ? err : err.message || '';
    const lowerMsg = msg.toLowerCase();

    if (lowerMsg.includes('invalid login credentials') || lowerMsg.includes('invalid_credentials')) {
        return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (lowerMsg.includes('user not found') || lowerMsg.includes('email not found')) {
        return 'No account found with this email.';
    }
    if (lowerMsg.includes('network') || lowerMsg.includes('fetch failed')) {
        return 'Network error. Please check your internet connection.';
    }
    if (lowerMsg.includes('google') && (lowerMsg.includes('cancel') || lowerMsg.includes('dismiss'))) {
        return 'Google sign-in was canceled or failed. Please try again.';
    }
    if (msg.trim().length > 0 && !lowerMsg.includes('error xx') && !lowerMsg.includes('codigo error')) {
        if (/^[A-Za-z0-9\s.,!?'-]+$/.test(msg) && msg.length < 100) {
            return msg;
        }
    }
    return 'Authentication failed. Please try again later.';
}

