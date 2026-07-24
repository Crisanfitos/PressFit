let Sentry: any = null;
try {
    Sentry = require('@sentry/react-native');
} catch (e) {
    // Sentry not installed or not loaded
}

export const SentryService = {
    init() {
        if (Sentry) {
            try {
                Sentry.init({
                    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
                    enableInExponentDevelopment: true,
                    debug: __DEV__,
                });
            } catch (error) {
                console.error('Failed to initialize Sentry:', error);
            }
        } else {
            console.log('[SentryService] Sentry is not installed. Logs will fallback to console.');
        }
    },

    captureException(error: any, extraInfo?: any) {
        console.error('[SentryService Exception]', error, extraInfo);
        if (Sentry) {
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
        }
    },

    captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
        console.log(`[SentryService Message - ${level}]`, message);
        if (Sentry) {
            try {
                Sentry.captureMessage(message, level);
            } catch (e) {
                console.error('Failed to capture message in Sentry:', e);
            }
        }
    }
};
