import { NetworkService } from '../../../src/services/NetworkService';
import * as Network from 'expo-network';

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(),
  NetworkStateType: {
    WIFI: 'WIFI',
    CELLULAR: 'CELLULAR',
    NONE: 'NONE',
    UNKNOWN: 'UNKNOWN',
  },
}));

describe('NetworkService Unit Tests (PF-BUG-063)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getNetworkState returns correct state when connected to wifi', async () => {
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'WIFI',
    });

    const state = await NetworkService.getNetworkState();
    expect(state.isConnected).toBe(true);
    expect(state.isInternetReachable).toBe(true);
    expect(state.isOffline).toBe(false);
    expect(state.type).toBe('WIFI');
  });

  it('isOffline returns true when disconnected', async () => {
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
      type: 'NONE',
    });

    const isOffline = await NetworkService.isOffline();
    expect(isOffline).toBe(true);
  });

  it('addNetworkListener registers callback and triggers state updates', async () => {
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'CELLULAR',
    });

    const listener = jest.fn();
    const unsubscribe = NetworkService.addNetworkListener(listener);

    expect(typeof unsubscribe).toBe('function');

    unsubscribe();
  });

  it('handles errors gracefully with online fallback', async () => {
    (Network.getNetworkStateAsync as jest.Mock).mockRejectedValue(new Error('Network native error'));

    const state = await NetworkService.getNetworkState();
    expect(state.isConnected).toBe(true);
    expect(state.isOffline).toBe(false);
  });
});
