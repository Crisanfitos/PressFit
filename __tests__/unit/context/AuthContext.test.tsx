import React from 'react';
import { renderHook, act, cleanup, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '../../../src/context/AuthContext';
import { AuthService } from '../../../src/services/AuthService';

// --- Mocks ---
jest.mock('../../../src/services/AuthService');
jest.mock('../../../src/lib/supabase', () => ({
    supabase: {
        auth: {
            signInWithPassword: jest.fn(),
            signUp: jest.fn(),
            signOut: jest.fn(),
            getSession: jest.fn(),
            onAuthStateChange: jest.fn(),
            signInWithOAuth: jest.fn(),
            exchangeCodeForSession: jest.fn(),
            setSession: jest.fn(),
            startAutoRefresh: jest.fn(),
            stopAutoRefresh: jest.fn(),
        },
    },
}));
jest.mock('expo-web-browser', () => ({
    maybeCompleteAuthSession: jest.fn(),
    openAuthSessionAsync: jest.fn(),
}));
jest.mock('expo-auth-session', () => ({
    makeRedirectUri: jest.fn().mockReturnValue('pressfit://auth/callback'),
}));
jest.mock('../../../src/utils/parseOAuthCallbackUrl', () => ({
    parseOAuthCallbackUrl: jest.fn(),
}));

// Lazy imports for mocked modules
const getWebBrowser = () => require('expo-web-browser') as { openAuthSessionAsync: jest.Mock };
const getAuthSession = () => require('expo-auth-session') as { makeRedirectUri: jest.Mock };
const getParseOAuthCallbackUrl = () =>
    require('../../../src/utils/parseOAuthCallbackUrl') as { parseOAuthCallbackUrl: jest.Mock };

// --- Helpers ---
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AuthProvider>{children}</AuthProvider>
);

// Helper ErrorBoundary to swallow component errors in React 19 without corrupting test renderer
class TestErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
    state = { error: null };
    static getDerivedStateFromError(error: Error) {
        return { error };
    }
    render() {
        if (this.state.error) {
            return <Text>{(this.state.error as Error).message}</Text>;
        }
        return this.props.children;
    }
}

describe('AuthContext & AuthProvider', () => {
    let authStateCallback: ((event: string, session: any) => void) | null = null;
    const mockUnsubscribe = jest.fn();

    const getMockSession = () => ({
        access_token: 'valid_access_token',
        refresh_token: 'valid_refresh_token',
        user: { id: 'user_123', email: 'test@example.com' },
    }) as any;

    beforeEach(() => {
        cleanup();
        jest.clearAllMocks();
        authStateCallback = null;

        const { openAuthSessionAsync } = getWebBrowser();
        const { makeRedirectUri } = getAuthSession();
        const { parseOAuthCallbackUrl } = getParseOAuthCallbackUrl();

        (openAuthSessionAsync as jest.Mock).mockReset();
        (makeRedirectUri as jest.Mock).mockReset().mockReturnValue('pressfit://auth/callback');
        (parseOAuthCallbackUrl as jest.Mock).mockReset();

        (AuthService.signInWithEmail as jest.Mock).mockReset();
        (AuthService.signUpWithEmail as jest.Mock).mockReset();
        (AuthService.signOut as jest.Mock).mockReset();
        (AuthService.signInWithOAuth as jest.Mock).mockReset();
        (AuthService.exchangeCodeForSession as jest.Mock).mockReset();
        (AuthService.setSession as jest.Mock).mockReset();

        (AuthService.onAuthStateChange as jest.Mock).mockImplementation((cb) => {
            authStateCallback = cb;
            return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
        });

        (AuthService.getSession as jest.Mock).mockReset();
        (AuthService.getSession as jest.Mock).mockResolvedValue(null);
    });

    afterEach(() => {
        cleanup();
    });

    const renderAndWait = async () => {
        const hook = await renderHook(() => useAuth(), { wrapper: AuthWrapper });
        await waitFor(() => {
            expect(hook.result.current.isLoading).toBe(false);
        });
        return hook;
    };

    // useAuth hook guard
    // ----------------------------------------------------------------
    describe('useAuth hook', () => {
        it('should throw an error when used outside of AuthProvider', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await expect(renderHook(() => useAuth())).rejects.toThrow('useAuth must be used within an AuthProvider');

            consoleSpy.mockRestore();
        });
    });

    // ----------------------------------------------------------------
    // AuthProvider initialization
    // ----------------------------------------------------------------
    describe('AuthProvider initialization', () => {
        it('should start in loading state before getSession resolves', async () => {
            (AuthService.getSession as jest.Mock).mockReturnValueOnce(new Promise(() => {}));

            const hook = await renderHook(() => useAuth(), { wrapper: AuthWrapper });

            expect(hook.result.current.isLoading).toBe(true);
            hook.unmount();
        });

        it('should initialize with session and user when session exists', async () => {
            const mockSession = getMockSession();
            (AuthService.getSession as jest.Mock).mockResolvedValue(mockSession);

            const { result } = await renderAndWait();

            expect(result.current.isLoading).toBe(false);
            expect(result.current.session).toEqual(mockSession);
            expect(result.current.user).toEqual(mockSession.user);
            expect(result.current.isAuthenticated).toBe(true);
        });

        it('should initialize without session when no session exists', async () => {
            (AuthService.getSession as jest.Mock).mockResolvedValue(null);

            const { result } = await renderAndWait();

            expect(result.current.isLoading).toBe(false);
            expect(result.current.session).toBeNull();
            expect(result.current.user).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
        });

        it('should handle getSession error gracefully during initialization', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            (AuthService.getSession as jest.Mock).mockRejectedValue(new Error('Network error'));

            const { result } = await renderAndWait();

            expect(result.current.isLoading).toBe(false);
            expect(result.current.session).toBeNull();
            expect(result.current.user).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
            consoleSpy.mockRestore();
        });
    });

    // ----------------------------------------------------------------
    // Auth state change listener
    // ----------------------------------------------------------------
    describe('Auth state change listener', () => {
        it('should register an auth state change listener on mount', async () => {
            await renderAndWait();
            expect(AuthService.onAuthStateChange).toHaveBeenCalledTimes(1);
        });

        it('should update user and session when auth state changes to SIGNED_IN', async () => {
            const mockSession = getMockSession();
            const { result } = await renderAndWait();

            expect(result.current.user).toBeNull();

            await act(async () => {
                authStateCallback?.('SIGNED_IN', mockSession);
            });

            await waitFor(() => {
                expect(result.current.session).toEqual(mockSession);
                expect(result.current.user).toEqual(mockSession.user);
                expect(result.current.isAuthenticated).toBe(true);
            });
        });

        it('should clear user and session when auth state changes to SIGNED_OUT', async () => {
            const mockSession = getMockSession();
            (AuthService.getSession as jest.Mock).mockResolvedValue(mockSession);
            const { result } = await renderAndWait();

            expect(result.current.isAuthenticated).toBe(true);

            await act(async () => {
                authStateCallback?.('SIGNED_OUT', null);
            });

            await waitFor(() => {
                expect(result.current.session).toBeNull();
                expect(result.current.user).toBeNull();
                expect(result.current.isAuthenticated).toBe(false);
            });
        });

        it('should unsubscribe on unmount', async () => {
            const { unmount } = await renderAndWait();

            await act(async () => {
                await unmount();
            });

            expect(mockUnsubscribe).toHaveBeenCalled();
        });
    });

    // ----------------------------------------------------------------
    // Auth methods delegation
    // ----------------------------------------------------------------
    describe('Auth methods delegation', () => {
        it('should delegate signInWithEmail to AuthService', async () => {
            const mockSession = getMockSession();
            (AuthService.signInWithEmail as jest.Mock).mockResolvedValue({ user: mockSession.user });

            const { result } = await renderAndWait();

            const res = await result.current.signInWithEmail('test@example.com', 'pass123');

            expect(AuthService.signInWithEmail).toHaveBeenCalledWith('test@example.com', 'pass123');
            expect(res).toEqual({ user: mockSession.user });
        });

        it('should delegate signUpWithEmail to AuthService', async () => {
            const mockSession = getMockSession();
            (AuthService.signUpWithEmail as jest.Mock).mockResolvedValue({ user: mockSession.user });

            const { result } = await renderAndWait();

            const res = await result.current.signUpWithEmail('test@example.com', 'pass123', 'John Doe');

            expect(AuthService.signUpWithEmail).toHaveBeenCalledWith('test@example.com', 'pass123', 'John Doe');
            expect(res).toEqual({ user: mockSession.user });
        });

        it('should delegate signOut to AuthService', async () => {
            (AuthService.signOut as jest.Mock).mockResolvedValue(undefined);

            const { result } = await renderAndWait();

            await result.current.signOut();

            expect(AuthService.signOut).toHaveBeenCalled();
        });
    });

    // ----------------------------------------------------------------
    // signInWithGoogle OAuth flow
    // ----------------------------------------------------------------
    describe('signInWithGoogle OAuth flow', () => {
        it('should handle PKCE flow successfully', async () => {
            const mockSession = getMockSession();
            const { parseOAuthCallbackUrl } = getParseOAuthCallbackUrl();
            (parseOAuthCallbackUrl as jest.Mock).mockReturnValue({ code: 'pkce_code_789' });

            (AuthService.signInWithOAuth as jest.Mock).mockResolvedValue({
                data: { url: 'https://supabase.co/auth/v1/authorize?provider=google' },
                error: null,
            });
            getWebBrowser().openAuthSessionAsync.mockResolvedValue({
                type: 'success',
                url: 'pressfit://auth/callback?code=pkce_code_789',
            });
            (AuthService.exchangeCodeForSession as jest.Mock).mockResolvedValue({
                data: { session: mockSession },
                error: null,
            });

            const { result } = await renderAndWait();

            const session = await result.current.signInWithGoogle();

            expect(getAuthSession().makeRedirectUri).toHaveBeenCalledWith({
                scheme: 'pressfit',
                path: 'auth/callback',
            });
            expect(AuthService.signInWithOAuth).toHaveBeenCalledWith('google', {
                redirectTo: 'pressfit://auth/callback',
                skipBrowserRedirect: true,
            });
            expect(getWebBrowser().openAuthSessionAsync).toHaveBeenCalledWith(
                'https://supabase.co/auth/v1/authorize?provider=google',
                'pressfit://auth/callback'
            );
            expect(AuthService.exchangeCodeForSession).toHaveBeenCalledWith('pkce_code_789');
            expect(session).toEqual(mockSession);
        });

        it('should handle Implicit flow successfully', async () => {
            const mockSession = getMockSession();
            const { parseOAuthCallbackUrl } = getParseOAuthCallbackUrl();
            (parseOAuthCallbackUrl as jest.Mock).mockReturnValue({
                accessToken: 'acc_token_123',
                refreshToken: 'ref_token_123',
            });

            (AuthService.signInWithOAuth as jest.Mock).mockResolvedValue({
                data: { url: 'https://supabase.co/auth/v1/authorize?provider=google' },
                error: null,
            });
            getWebBrowser().openAuthSessionAsync.mockResolvedValue({
                type: 'success',
                url: 'pressfit://auth/callback#access_token=acc_token_123&refresh_token=ref_token_123',
            });
            (AuthService.setSession as jest.Mock).mockResolvedValue({
                data: mockSession,
                error: null,
            });

            const { result } = await renderAndWait();

            const session = await result.current.signInWithGoogle();

            expect(AuthService.setSession).toHaveBeenCalledWith({
                access_token: 'acc_token_123',
                refresh_token: 'ref_token_123',
            });
            expect(session).toEqual(mockSession);
        });

        it('should throw error when signInWithOAuth returns error', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            (AuthService.signInWithOAuth as jest.Mock).mockResolvedValue({
                data: null,
                error: new Error('OAuth init error'),
            });

            const { result } = await renderAndWait();

            await expect(result.current.signInWithGoogle()).rejects.toThrow('OAuth init error');
            consoleSpy.mockRestore();
        });

        it('should throw error when callback URL contains error parameter', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const { parseOAuthCallbackUrl } = getParseOAuthCallbackUrl();
            (parseOAuthCallbackUrl as jest.Mock).mockReturnValue({ error: 'user_cancelled' });

            (AuthService.signInWithOAuth as jest.Mock).mockResolvedValue({
                data: { url: 'https://supabase.co/auth/v1/authorize?provider=google' },
                error: null,
            });
            getWebBrowser().openAuthSessionAsync.mockResolvedValue({
                type: 'success',
                url: 'pressfit://auth/callback?error=user_cancelled',
            });

            const { result } = await renderAndWait();

            await expect(result.current.signInWithGoogle()).rejects.toThrow('user_cancelled');
            consoleSpy.mockRestore();
        });

        it('should throw error when browser session fails or is cancelled', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            (AuthService.signInWithOAuth as jest.Mock).mockResolvedValue({
                data: { url: 'https://supabase.co/auth/v1/authorize?provider=google' },
                error: null,
            });
            getWebBrowser().openAuthSessionAsync.mockResolvedValue({
                type: 'cancel',
            });

            const { result } = await renderAndWait();

            await expect(result.current.signInWithGoogle()).rejects.toThrow('OAuth flow failed');
            consoleSpy.mockRestore();
        });
    });
});
