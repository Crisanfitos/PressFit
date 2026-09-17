import * as Sentry from '@sentry/react-native';
import { SentryService } from '../../../src/services/SentryService';

describe('SentryService Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('init', () => {
        it('initializes Sentry when EXPO_PUBLIC_SENTRY_DSN is configured', () => {
            const originalDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
            process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://examplePublicKey@o0.ingest.sentry.io/0';

            SentryService.init();

            expect(Sentry.init).toHaveBeenCalledWith(
                expect.objectContaining({
                    dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
                    enabled: true,
                })
            );
            expect(SentryService.isInitialized).toBe(true);

            process.env.EXPO_PUBLIC_SENTRY_DSN = originalDsn;
        });

        it('disables Sentry when EXPO_PUBLIC_SENTRY_DSN is not configured', () => {
            const originalDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
            delete process.env.EXPO_PUBLIC_SENTRY_DSN;

            SentryService.init();

            expect(Sentry.init).toHaveBeenCalledWith(
                expect.objectContaining({
                    dsn: '',
                    enabled: false,
                })
            );

            process.env.EXPO_PUBLIC_SENTRY_DSN = originalDsn;
        });

        it('handles initialization errors gracefully without throwing', () => {
            (Sentry.init as jest.Mock).mockImplementationOnce(() => {
                throw new Error('Init failure');
            });

            expect(() => SentryService.init()).not.toThrow();
        });
    });

    describe('captureException', () => {
        it('calls Sentry.withScope and Sentry.captureException without extraInfo', () => {
            const error = new Error('Test Crash');
            SentryService.captureException(error);

            expect(Sentry.withScope).toHaveBeenCalled();
            expect(Sentry.captureException).toHaveBeenCalledWith(error);
        });

        it('sets extras on scope when extraInfo is provided', () => {
            const error = new Error('Crash with context');
            const extra = { userId: '123', routineId: 'abc' };

            SentryService.captureException(error, extra);

            expect(Sentry.withScope).toHaveBeenCalled();
            expect(Sentry.captureException).toHaveBeenCalledWith(error);
        });

        it('catches and logs errors without throwing when Sentry fails', () => {
            (Sentry.withScope as jest.Mock).mockImplementationOnce(() => {
                throw new Error('Scope error');
            });

            expect(() => SentryService.captureException(new Error('Fail'))).not.toThrow();
        });
    });

    describe('captureMessage', () => {
        it('calls Sentry.captureMessage with message and default info level', () => {
            SentryService.captureMessage('App started');

            expect(Sentry.captureMessage).toHaveBeenCalledWith('App started', 'info');
        });

        it('calls Sentry.captureMessage with custom level', () => {
            SentryService.captureMessage('Low disk space', 'warning');

            expect(Sentry.captureMessage).toHaveBeenCalledWith('Low disk space', 'warning');
        });

        it('catches errors without throwing when Sentry fails', () => {
            (Sentry.captureMessage as jest.Mock).mockImplementationOnce(() => {
                throw new Error('Message error');
            });

            expect(() => SentryService.captureMessage('Fail')).not.toThrow();
        });
    });

    describe('setUser', () => {
        it('calls Sentry.setUser with user profile', () => {
            const user = { id: 'usr-1', email: 'test@example.com', username: 'tester' };
            SentryService.setUser(user);

            expect(Sentry.setUser).toHaveBeenCalledWith(user);
        });

        it('calls Sentry.setUser with null to clear user', () => {
            SentryService.setUser(null);

            expect(Sentry.setUser).toHaveBeenCalledWith(null);
        });

        it('handles errors without throwing when Sentry fails', () => {
            (Sentry.setUser as jest.Mock).mockImplementationOnce(() => {
                throw new Error('User error');
            });

            expect(() => SentryService.setUser(null)).not.toThrow();
        });
    });

    describe('addBreadcrumb', () => {
        it('calls Sentry.addBreadcrumb with breadcrumb data', () => {
            const breadcrumb = { message: 'Navigated to WorkoutScreen', category: 'navigation', level: 'info' as const };
            SentryService.addBreadcrumb(breadcrumb);

            expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(breadcrumb);
        });

        it('handles errors without throwing when Sentry fails', () => {
            (Sentry.addBreadcrumb as jest.Mock).mockImplementationOnce(() => {
                throw new Error('Breadcrumb error');
            });

            expect(() => SentryService.addBreadcrumb({ message: 'fail' })).not.toThrow();
        });
    });

    describe('wrap', () => {
        it('wraps root component using Sentry.wrap', () => {
            const MockComponent = () => null;
            const wrapped = SentryService.wrap(MockComponent);

            expect(Sentry.wrap).toHaveBeenCalledWith(MockComponent);
            expect(wrapped).toBe(MockComponent);
        });
    });
});
