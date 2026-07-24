import { SentryService } from '../../src/services/SentryService';

// We can test SentryService methods to ensure they do not throw errors
describe('SentryService', () => {
    it('initializes cleanly', () => {
        expect(() => SentryService.init()).not.toThrow();
    });

    it('captures exceptions cleanly', () => {
        expect(() => SentryService.captureException(new Error('Test Exception'), { additional: 'info' })).not.toThrow();
    });

    it('captures messages cleanly', () => {
        expect(() => SentryService.captureMessage('Test Message', 'warning')).not.toThrow();
    });
});
