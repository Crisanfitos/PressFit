import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { AuthService } from '../services/AuthService';
import { parseOAuthCallbackUrl } from '../utils/parseOAuthCallbackUrl';
import { Session, User } from '@supabase/supabase-js';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signInWithGoogle: () => Promise<any>;
    signInWithEmail: (email: string, password: string) => Promise<any>;
    signUpWithEmail: (email: string, password: string, fullName: string) => Promise<any>;
    signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
            const MIN_SPLASH_MS = isTestEnv ? 0 : 800;
            const start = Date.now();

            try {
                const session = await AuthService.getSession();
                setSession(session);
                setUser(session?.user ?? null);
            } catch (error) {
                console.error('Error initializing auth:', error);
            } finally {
                const elapsed = Date.now() - start;
                const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
                if (remaining > 0) {
                    await new Promise(resolve => setTimeout(resolve, remaining));
                }
                setIsLoading(false);
            }
        };

        initializeAuth();

        const authListener = AuthService.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
        });

        return () => authListener?.data?.subscription?.unsubscribe?.();
    }, []);

    const signInWithGoogle = async () => {
        try {
            // Create the redirect URL for Expo
            const redirectUrl = AuthSession.makeRedirectUri({
                scheme: 'pressfit',
                path: 'auth/callback',
            });

            // Start OAuth flow with Supabase
            const { data, error } = await AuthService.signInWithOAuth('google', {
                redirectTo: redirectUrl,
                skipBrowserRedirect: true,
            });

            if (error) throw error;

            if (data.url) {
                // Open the OAuth URL in the browser
                const result = await WebBrowser.openAuthSessionAsync(
                    data.url,
                    redirectUrl
                );

                if (result.type === 'success') {
                    const params = parseOAuthCallbackUrl(result.url);

                    if (params.error) {
                        throw new Error(params.error);
                    }

                    if (params.code) {
                        // PKCE Flow
                        const { data, error } = await AuthService.exchangeCodeForSession(params.code);
                        if (error) throw error;
                        return data.session;
                    } else if (params.accessToken && params.refreshToken) {
                        // Implicit Flow
                        const { data: sessionData, error: sessionError } = await AuthService.setSession({
                            access_token: params.accessToken,
                            refresh_token: params.refreshToken,
                        });

                        if (sessionError) throw sessionError;
                        return sessionData;
                    }
                }
            }

            throw new Error('OAuth flow failed');
        } catch (error) {
            console.error('Google sign-in error:', error);
            throw error;
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        return await AuthService.signInWithEmail(email, password);
    };

    const signUpWithEmail = async (email: string, password: string, fullName: string) => {
        return await AuthService.signUpWithEmail(email, password, fullName);
    };

    const signOut = async () => {
        await AuthService.signOut();
    };

    const value: AuthContextType = {
        user,
        session,
        isLoading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
