import { AuthService } from '../../../src/services/AuthService';
import { supabase } from '../../../src/lib/supabase';

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
        },
    },
}));

describe('AuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('signInWithEmail', () => {
        it('should call signInWithPassword and return data on success', async () => {
            const mockData = { user: { id: '123' }, session: { access_token: 'abc' } };
            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: mockData,
                error: null,
            });

            const result = await AuthService.signInWithEmail('test@example.com', 'password123');
            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            });
            expect(result).toEqual(mockData);
        });

        it('should throw error on failure', async () => {
            const mockError = new Error('Invalid credentials');
            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: null,
                error: mockError,
            });

            await expect(AuthService.signInWithEmail('test@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
        });
    });

    describe('signUpWithEmail', () => {
        it('should call signUp with email, password, and fullName', async () => {
            const mockData = { user: { id: '456' }, session: null };
            (supabase.auth.signUp as jest.Mock).mockResolvedValue({
                data: mockData,
                error: null,
            });

            const result = await AuthService.signUpWithEmail('new@example.com', 'pass123', 'John Doe');
            expect(supabase.auth.signUp).toHaveBeenCalledWith({
                email: 'new@example.com',
                password: 'pass123',
                options: {
                    data: {
                        full_name: 'John Doe',
                    },
                },
            });
            expect(result).toEqual(mockData);
        });

        it('should throw error on signup failure', async () => {
            (supabase.auth.signUp as jest.Mock).mockResolvedValue({
                data: null,
                error: new Error('User already registered'),
            });

            await expect(AuthService.signUpWithEmail('dup@example.com', 'pass', 'Name')).rejects.toThrow('User already registered');
        });
    });

    describe('signOut', () => {
        it('should call signOut', async () => {
            (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

            await AuthService.signOut();
            expect(supabase.auth.signOut).toHaveBeenCalled();
        });
    });

    describe('getSession', () => {
        it('should return session data when available', async () => {
            const mockSession = { access_token: 'token123', user: { id: 'user1' } };
            (supabase.auth.getSession as jest.Mock).mockResolvedValue({
                data: { session: mockSession },
                error: null,
            });

            const session = await AuthService.getSession();
            expect(supabase.auth.getSession).toHaveBeenCalled();
            expect(session).toEqual(mockSession);
        });

        it('should throw error when getSession fails', async () => {
            (supabase.auth.getSession as jest.Mock).mockResolvedValue({
                data: { session: null },
                error: new Error('Session error'),
            });

            await expect(AuthService.getSession()).rejects.toThrow('Session error');
        });
    });

    describe('onAuthStateChange', () => {
        it('should subscribe callback to auth state changes', () => {
            const mockCallback = jest.fn();
            const mockSubscription = { unsubscribe: jest.fn() };
            (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
                data: { subscription: mockSubscription },
            });

            const result = AuthService.onAuthStateChange(mockCallback);
            expect(supabase.auth.onAuthStateChange).toHaveBeenCalledWith(mockCallback);
            expect(result).toEqual({ data: { subscription: mockSubscription } });
        });
    });

    describe('signInWithOAuth', () => {
        it('should call signInWithOAuth with provider and options', async () => {
            const mockResult = { data: { url: 'https://oauth.url' }, error: null };
            (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue(mockResult);

            const result = await AuthService.signInWithOAuth('google', { redirectTo: 'pressfit://auth/callback' });
            expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
                provider: 'google',
                options: { redirectTo: 'pressfit://auth/callback' },
            });
            expect(result).toEqual(mockResult);
        });
    });

    describe('exchangeCodeForSession', () => {
        it('should call exchangeCodeForSession with code', async () => {
            const mockResult = { data: { session: { access_token: 'tok' } }, error: null };
            (supabase.auth.exchangeCodeForSession as jest.Mock).mockResolvedValue(mockResult);

            const result = await AuthService.exchangeCodeForSession('auth_code_123');
            expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('auth_code_123');
            expect(result).toEqual(mockResult);
        });
    });

    describe('setSession', () => {
        it('should call setSession with access and refresh tokens', async () => {
            const mockSessionData = { access_token: 'acc', refresh_token: 'ref' };
            const mockResult = { data: { session: { access_token: 'acc' } }, error: null };
            (supabase.auth.setSession as jest.Mock).mockResolvedValue(mockResult);

            const result = await AuthService.setSession(mockSessionData);
            expect(supabase.auth.setSession).toHaveBeenCalledWith(mockSessionData);
            expect(result).toEqual(mockResult);
        });
    });
});
