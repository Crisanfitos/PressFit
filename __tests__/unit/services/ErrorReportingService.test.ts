import { Platform } from 'react-native';
import { ErrorReportingService } from '../../../src/services/ErrorReportingService';

describe('ErrorReportingService Unit Tests (PF-455)', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        jest.clearAllMocks();
        ErrorReportingService.resetForTests();
        process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('init marks service as initialized and wrap acts as passthrough', () => {
        ErrorReportingService.init();
        expect(ErrorReportingService.isInitialized).toBe(true);

        const Dummy = () => null;
        expect(ErrorReportingService.wrap(Dummy)).toBe(Dummy);
    });

    it('setUser stores and clears current user context', () => {
        ErrorReportingService.setUser({ id: 'user-42', username: 'crisanfitos' });
        expect(ErrorReportingService.getUser()).toEqual({ id: 'user-42', username: 'crisanfitos' });

        ErrorReportingService.setUser(null);
        expect(ErrorReportingService.getUser()).toBeNull();
    });

    it('addBreadcrumb maintains a circular buffer capped at 30 items', () => {
        for (let i = 0; i < 40; i++) {
            ErrorReportingService.addBreadcrumb({
                message: `Nav ${i}`,
                category: 'navigation',
                level: 'info',
            });
        }

        const items = ErrorReportingService.getBreadcrumbs();
        expect(items).toHaveLength(30);
        expect(items[0].message).toBe('Nav 10');
        expect(items[29].message).toBe('Nav 39');
    });

    it('captureException dispatches complete metadata payload to report-error Edge Function', async () => {
        const mockFetch = jest.fn().mockResolvedValue({ ok: true, status: 201 } as Response);
        global.fetch = mockFetch;

        const originalOsDesc = Object.getOwnPropertyDescriptor(Platform, 'OS');
        const originalConstantsDesc = Object.getOwnPropertyDescriptor(Platform, 'constants');

        Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
        Object.defineProperty(Platform, 'constants', {
            value: {
                Brand: 'Redmi',
                Manufacturer: 'Xiaomi',
                Model: '24115RA8EG',
                Release: '16',
            },
            configurable: true,
        });

        try {
            ErrorReportingService.setUser({ id: 'usr-99' });
            ErrorReportingService.addBreadcrumb({ message: 'Opened WorkoutScreen', category: 'ui' });

            const err = new Error('Schema column error');
            ErrorReportingService.captureException(
                err,
                { screen: 'Workout' },
                { handled: false, level: 'fatal', forceSend: true }
            );

            await new Promise((r) => setTimeout(r, 20));

            expect(mockFetch).toHaveBeenCalledTimes(1);
            const [url, init] = mockFetch.mock.calls[0];
            expect(url).toBe('https://mock.supabase.co/functions/v1/report-error');
            expect(init.method).toBe('POST');
            expect(init.headers.apikey).toBe('mock-anon-key');

            const body = JSON.parse(init.body);
            expect(body.level).toBe('fatal');
            expect(body.handled).toBe(false);
            expect(body.error_message).toBe('Schema column error');
            expect(body.os_name).toBe('Android');
            expect(body.os_version).toBe('16');
            expect(body.device_brand).toBe('Redmi');
            expect(body.device_model).toBe('24115RA8EG');
            expect(body.affected_user_id).toBe('usr-99');
            expect(body.breadcrumbs).toHaveLength(1);
            expect(body.app_version).toBeTruthy();
            expect(body.locale).toBeTruthy();
            expect(body.timezone).toBeTruthy();
        } finally {
            if (originalOsDesc) Object.defineProperty(Platform, 'OS', originalOsDesc);
            if (originalConstantsDesc) Object.defineProperty(Platform, 'constants', originalConstantsDesc);
        }
    });

    it('throttles duplicate error fingerprints within 15s window and handles network errors safely', async () => {
        const mockFetch = jest.fn().mockRejectedValue(new Error('Offline'));
        global.fetch = mockFetch;

        const err = new Error('Repeated burst error');
        expect(() => {
            ErrorReportingService.captureException(err, undefined, { forceSend: true });
            ErrorReportingService.captureException(err, undefined, { forceSend: true });
        }).not.toThrow();

        await new Promise((r) => setTimeout(r, 20));
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('captureMessage sends warning payload when forceSend is true', async () => {
        const mockFetch = jest.fn().mockResolvedValue({ ok: true, status: 201 } as Response);
        global.fetch = mockFetch;

        ErrorReportingService.captureMessage('Low cache space', 'warning', { freeMb: 12 }, { forceSend: true });

        await new Promise((r) => setTimeout(r, 20));
        expect(mockFetch).toHaveBeenCalledTimes(1);
        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.level).toBe('warning');
        expect(body.error_message).toBe('Low cache space');
        expect(body.extra_data).toEqual({ freeMb: 12 });
    });
});
