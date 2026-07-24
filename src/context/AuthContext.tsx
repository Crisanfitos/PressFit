import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { AuthService } from '../services/AuthService';
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
            const minDelayPromise = new Promise(resolve => setTimeout(resolve, 3000));
            const sessionPromise = AuthService.getSession();

            try {
                const [_, session] = await Promise.all([minDelayPromise, sessionPromise]);
                setSession(session);
                setUser(session?.user ?? null);
            } catch (error) {
                console.error('Error initializing auth:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = AuthService.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
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
                    // Extract the params from the URL manually since URL() can fail on custom schemes
                    const urlStr = result.url;
                    const queryStr = urlStr.includes('?') ? urlStr.split('?')[1].split('#')[0] : '';
                    const hashStr = urlStr.includes('#') ? urlStr.split('#')[1] : '';

                    const getParams = (str: string) => {
                        const params: Record<string, string> = {};
                        if (!str) return params;
                        str.split('&').forEach(pair => {
                            const [key, value] = pair.split('=');
                            if (key && value) {
                                params[key] = decodeURIComponent(value);
                            }
                        });
                        return params;
                    };

                    const queryParams = getParams(queryStr);
                    const hashParams = getParams(hashStr);

                    const code = queryParams.code || hashParams.code;
                    const accessToken = queryParams.access_token || hashParams.access_token;
                    const refreshToken = queryParams.refresh_token || hashParams.refresh_token;
                    const errorDesc = queryParams.error_description || hashParams.error_description || queryParams.error || hashParams.error;

                    if (errorDesc) {
                        throw new Error(errorDesc);
                    }

                    if (code) {
                        // PKCE Flow
                        const { data, error } = await AuthService.exchangeCodeForSession(code);
                        if (error) throw error;
                        return data.session;
                    } else if (accessToken && refreshToken) {
                        // Implicit Flow
                        const { data: sessionData, error: sessionError } = await AuthService.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
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
