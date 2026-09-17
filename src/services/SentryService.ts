import * as Sentry from '@sentry/react-native';

export const SentryService = {
    isInitialized: false,

    init() {
        const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
        try {
            Sentry.init({
                dsn: dsn || '',
                enabled: !!dsn,
                debug: __DEV__,
                tracesSampleRate: 1.0,
            });
            this.isInitialized = true;
            if (!dsn) {
                console.log('[SentryService] EXPO_PUBLIC_SENTRY_DSN not configured. Crash reporting disabled in this environment.');
            } else {
                console.log('[SentryService] Sentry initialized successfully.');
            }
        } catch (error) {
            console.error('Failed to initialize Sentry:', error);
        }
    },

    captureException(error: any, extraInfo?: Record<string, any>) {
        console.error('[SentryService Exception]', error, extraInfo);
        try {
            Sentry.withScope((scope: any) => {
                if (extraInfo) {
                    scope.setExtras(extraInfo);
                }
                Sentry.captureException(error);
            });
        } catch (e) {
            console.error('Failed to capture exception in Sentry:', e);
        }
    },

    captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
        console.log(`[SentryService Message - ${level}]`, message);
        try {
            Sentry.captureMessage(message, level);
        } catch (e) {
            console.error('Failed to capture message in Sentry:', e);
        }
    },

    setUser(user: { id: string; email?: string; username?: string } | null) {
        try {
            Sentry.setUser(user);
        } catch (e) {
            console.error('Failed to set user in Sentry:', e);
        }
    },

    addBreadcrumb(breadcrumb: { message: string; category?: string; level?: 'info' | 'warning' | 'error'; data?: Record<string, any> }) {
        try {
            Sentry.addBreadcrumb(breadcrumb);
        } catch (e) {
            console.error('Failed to add breadcrumb in Sentry:', e);
        }
    },

    wrap<T>(component: T): T {
        if (typeof Sentry.wrap === 'function') {
            return Sentry.wrap(component);
        }
        return component;
    }
};
