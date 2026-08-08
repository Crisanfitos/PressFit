describe('SentryService Unit Tests (PF-245)', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('handles fallback gracefully when @sentry/react-native is not installed', () => {
    jest.doMock('@sentry/react-native', () => {
      throw new Error('Cannot find module @sentry/react-native');
    }, { virtual: true });

    jest.isolateModules(() => {
      const { SentryService } = require('../../../src/services/SentryService');
      expect(() => SentryService.init()).not.toThrow();
      expect(() => SentryService.captureException(new Error('Fallback error'), { extra: true })).not.toThrow();
      expect(() => SentryService.captureMessage('Fallback msg', 'info')).not.toThrow();
    });
  });

  it('calls Sentry methods when @sentry/react-native is loaded', () => {
    const mockSentry = {
      init: jest.fn(),
      withScope: jest.fn((cb: any) => cb({ setExtras: jest.fn() })),
      captureException: jest.fn(),
      captureMessage: jest.fn(),
    };

    jest.doMock('@sentry/react-native', () => mockSentry, { virtual: true });

    jest.isolateModules(() => {
      const { SentryService } = require('../../../src/services/SentryService');

      // Test init
      SentryService.init();
      expect(mockSentry.init).toHaveBeenCalled();

      // Test init exception branch
      mockSentry.init.mockImplementationOnce(() => {
        throw new Error('Init failure');
      });
      expect(() => SentryService.init()).not.toThrow();

      // Test captureException with extraInfo
      SentryService.captureException(new Error('Crash'), { user: '123' });
      expect(mockSentry.withScope).toHaveBeenCalled();
      expect(mockSentry.captureException).toHaveBeenCalled();

      // Test captureException error branch
      mockSentry.withScope.mockImplementationOnce(() => {
        throw new Error('Scope error');
      });
      expect(() => SentryService.captureException(new Error('Err'))).not.toThrow();

      // Test captureMessage
      SentryService.captureMessage('Log info', 'info');
      expect(mockSentry.captureMessage).toHaveBeenCalledWith('Log info', 'info');

      // Test captureMessage error branch
      mockSentry.captureMessage.mockImplementationOnce(() => {
        throw new Error('Capture message error');
      });
      expect(() => SentryService.captureMessage('Fail msg')).not.toThrow();
    });
  });
});
