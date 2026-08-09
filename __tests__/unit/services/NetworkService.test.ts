import { NetworkService } from '../../../src/services/NetworkService';

describe('NetworkService Pure JS Unit Tests (PF-BUG-064)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('getNetworkState returns connected state when fetch ping returns 204', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 204,
      ok: true,
    } as Response);

    const state = await NetworkService.getNetworkState();
    expect(state.isConnected).toBe(true);
    expect(state.isInternetReachable).toBe(true);
    expect(state.isOffline).toBe(false);
  });

  it('isOffline returns true when fetch ping throws network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const isOffline = await NetworkService.isOffline();
    expect(isOffline).toBe(true);
  });

  it('addNetworkListener registers callback and triggers initial state', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 204,
      ok: true,
    } as Response);

    const listener = jest.fn();
    const unsubscribe = NetworkService.addNetworkListener(listener);

    expect(typeof unsubscribe).toBe('function');

    // Wait for initial fetch promise to resolve
    await new Promise((r) => setTimeout(r, 50));
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        isConnected: true,
        isOffline: false,
      })
    );

    unsubscribe();
  });
});
