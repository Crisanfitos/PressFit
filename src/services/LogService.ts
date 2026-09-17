import { SentryService } from './SentryService';

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

export type LogContext = Record<string, any> | undefined;

export const LogService = {
    /**
     * Informational logs (development only)
     */
    info(message: string, context?: any): void {
        if (isDev) {
            if (context !== undefined) {
                console.info(message, context);
            } else {
                console.info(message);
            }
        }
    },

    /**
     * Debug logs (development only)
     */
    debug(message: string, context?: any): void {
        if (isDev) {
            if (context !== undefined) {
                console.debug(message, context);
            } else {
                console.debug(message);
            }
        }
    },

    /**
     * Warnings: printed to console in dev, forwarded to Sentry as warning message in prod.
     */
    warn(message: string, context?: any): void {
        if (isDev) {
            if (context !== undefined) {
                console.warn(message, context);
            } else {
                console.warn(message);
            }
        } else {
            const contextStr = context !== undefined ? (typeof context === 'object' ? JSON.stringify(context) : String(context)) : '';
            const fullMessage = contextStr ? `${message} ${contextStr}` : message;
            SentryService.captureMessage(fullMessage, 'warning');
        }
    },

    /**
     * Errors: printed to console in dev, forwarded to Sentry as captured exception in prod.
     */
    error(message: string, error?: any, context?: any): void {
        if (isDev) {
            if (error !== undefined && context !== undefined) {
                console.error(message, error, context);
            } else if (error !== undefined) {
                console.error(message, error);
            } else {
                console.error(message);
            }
        } else {
            const errObj = error instanceof Error ? error : new Error(typeof error === 'string' ? error : message);
            const extra = {
                message,
                ...(typeof context === 'object' && context !== null ? context : (context !== undefined ? { context } : {})),
                ...(error !== undefined && !(error instanceof Error) ? { rawError: error } : {}),
            };
            SentryService.captureException(errObj, extra);
        }
    },
};
