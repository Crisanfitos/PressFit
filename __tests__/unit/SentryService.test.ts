import { SentryService } from '../../src/services/SentryService';

describe('SentryService basic contract', () => {
    it('initializes cleanly', () => {
        expect(() => SentryService.init()).not.toThrow();
    });

    it('captures exceptions cleanly', () => {
        expect(() => SentryService.captureException(new Error('Test Exception'), { additional: 'info' })).not.toThrow();
    });

    it('captures messages cleanly', () => {
        expect(() => SentryService.captureMessage('Test Message', 'warning')).not.toThrow();
    });

    it('sets user cleanly', () => {
        expect(() => SentryService.setUser({ id: 'user_123', email: 'user@test.com' })).not.toThrow();
        expect(() => SentryService.setUser(null)).not.toThrow();
    });

    it('adds breadcrumbs cleanly', () => {
        expect(() => SentryService.addBreadcrumb({ message: 'User navigated', category: 'navigation' })).not.toThrow();
    });

    it('wraps components cleanly', () => {
        const dummy = () => null;
        expect(SentryService.wrap(dummy)).toBe(dummy);
    });
});
