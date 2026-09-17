import { LogService } from '../../../src/services/LogService';
import { SentryService } from '../../../src/services/SentryService';

jest.mock('../../../src/services/SentryService', () => ({
    SentryService: {
        init: jest.fn(),
        captureException: jest.fn(),
        captureMessage: jest.fn(),
    },
}));

describe('LogService', () => {
    let originalConsoleInfo: typeof console.info;
    let originalConsoleDebug: typeof console.debug;
    let originalConsoleWarn: typeof console.warn;
    let originalConsoleError: typeof console.error;

    beforeEach(() => {
        jest.clearAllMocks();
        originalConsoleInfo = console.info;
        originalConsoleDebug = console.debug;
        originalConsoleWarn = console.warn;
        originalConsoleError = console.error;

        console.info = jest.fn();
        console.debug = jest.fn();
        console.warn = jest.fn();
        console.error = jest.fn();
    });

    afterEach(() => {
        console.info = originalConsoleInfo;
        console.debug = originalConsoleDebug;
        console.warn = originalConsoleWarn;
        console.error = originalConsoleError;
    });

    describe('Development mode logging', () => {
        it('logs info messages and context to console.info', () => {
            LogService.info('User action performed', { userId: '123' });
            expect(console.info).toHaveBeenCalledWith('User action performed', { userId: '123' });

            LogService.info('Plain info message');
            expect(console.info).toHaveBeenCalledWith('Plain info message');
        });

        it('logs debug messages and context to console.debug', () => {
            LogService.debug('Cache miss', { key: 'workout_1' });
            expect(console.debug).toHaveBeenCalledWith('Cache miss', { key: 'workout_1' });

            LogService.debug('Plain debug message');
            expect(console.debug).toHaveBeenCalledWith('Plain debug message');
        });

        it('logs warnings and context to console.warn', () => {
            LogService.warn('Deprecated format detected', { line: 42 });
            expect(console.warn).toHaveBeenCalledWith('Deprecated format detected', { line: 42 });

            LogService.warn('Plain warning');
            expect(console.warn).toHaveBeenCalledWith('Plain warning');
        });

        it('logs errors and stack/context to console.error', () => {
            const err = new Error('Database connection failed');
            LogService.error('Query execution error', err, { queryId: 'q-99' });
            expect(console.error).toHaveBeenCalledWith('Query execution error', err, { queryId: 'q-99' });

            LogService.error('Error without context', err);
            expect(console.error).toHaveBeenCalledWith('Error without context', err);

            LogService.error('Error without error object');
            expect(console.error).toHaveBeenCalledWith('Error without error object');
        });
    });

    describe('Production mode routing (with simulated production environment)', () => {
        let originalNodeEnv: string | undefined;

        beforeAll(() => {
            originalNodeEnv = process.env.NODE_ENV;
        });

        afterAll(() => {
            process.env.NODE_ENV = originalNodeEnv || 'test';
        });

        it('forwards warning to SentryService.captureMessage in production', () => {
            // Re-evaluate module with production environment
            jest.isolateModules(() => {
                const originalDev = (global as any).__DEV__;
                (global as any).__DEV__ = false;
                process.env.NODE_ENV = 'production';

                const { LogService: ProdLogService } = require('../../../src/services/LogService');
                const { SentryService: ProdSentryService } = require('../../../src/services/SentryService');

                ProdLogService.warn('Network degraded', { attempts: 3 });
                expect(ProdSentryService.captureMessage).toHaveBeenCalledWith(
                    expect.stringContaining('Network degraded {"attempts":3}'),
                    'warning'
                );

                ProdLogService.info('Suppressed in prod');
                ProdLogService.debug('Suppressed in prod');
                expect(console.info).not.toHaveBeenCalled();
                expect(console.debug).not.toHaveBeenCalled();

                (global as any).__DEV__ = originalDev;
            });
        });

        it('forwards error to SentryService.captureException in production', () => {
            jest.isolateModules(() => {
                const originalDev = (global as any).__DEV__;
                (global as any).__DEV__ = false;
                process.env.NODE_ENV = 'production';

                const { LogService: ProdLogService } = require('../../../src/services/LogService');
                const { SentryService: ProdSentryService } = require('../../../src/services/SentryService');

                const testError = new Error('Fatal mutation error');
                ProdLogService.error('Failed to sync', testError, { syncId: 's-1' });

                expect(ProdSentryService.captureException).toHaveBeenCalledWith(
                    testError,
                    expect.objectContaining({
                        message: 'Failed to sync',
                        syncId: 's-1',
                    })
                );

                (global as any).__DEV__ = originalDev;
            });
        });

        it('wraps non-Error error into Error instance for Sentry in production', () => {
            jest.isolateModules(() => {
                const originalDev = (global as any).__DEV__;
                (global as any).__DEV__ = false;
                process.env.NODE_ENV = 'production';

                const { LogService: ProdLogService } = require('../../../src/services/LogService');
                const { SentryService: ProdSentryService } = require('../../../src/services/SentryService');

                ProdLogService.error('String failure', 'Network timeout string');

                expect(ProdSentryService.captureException).toHaveBeenCalledWith(
                    expect.any(Error),
                    expect.objectContaining({
                        message: 'String failure',
                        rawError: 'Network timeout string',
                    })
                );

                (global as any).__DEV__ = originalDev;
            });
        });
    });
});
