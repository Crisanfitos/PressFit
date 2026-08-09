import { NativeModules } from 'react-native';

describe('netInfoPolyfill Unit Tests (PF-BUG-062)', () => {
  it('polyfills NativeModules.RNCNetInfo when it is missing', () => {
    delete (NativeModules as any).RNCNetInfo;

    require('../../../src/lib/netInfoPolyfill');

    expect(NativeModules.RNCNetInfo).toBeDefined();
    expect(typeof NativeModules.RNCNetInfo.getCurrentState).toBe('function');
    expect(typeof NativeModules.RNCNetInfo.addListener).toBe('function');
    expect(typeof NativeModules.RNCNetInfo.removeListeners).toBe('function');
    expect(typeof NativeModules.RNCNetInfo.configure).toBe('function');
  });

  it('getCurrentState returns active wifi connection fallback', async () => {
    const state = await NativeModules.RNCNetInfo.getCurrentState();
    expect(state).toEqual({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
      details: {
        isConnectionExpensive: false,
      },
    });
  });
});
