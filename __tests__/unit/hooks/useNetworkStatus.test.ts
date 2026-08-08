import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import NetInfo from '@react-native-community/netinfo';
import { useNetworkStatus } from '../../../src/hooks/useNetworkStatus';

describe('useNetworkStatus Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
    });
    (NetInfo.addEventListener as jest.Mock).mockReturnValue(jest.fn());
  });

  it('should initialize with online network status and subscribe to NetInfo events', async () => {
    let latestStatus: any = null;

    await act(async () => {
      TestRenderer.create(
        React.createElement(() => {
          latestStatus = useNetworkStatus();
          return null;
        })
      );
    });

    expect(NetInfo.fetch).toHaveBeenCalledTimes(1);
    expect(NetInfo.addEventListener).toHaveBeenCalledTimes(1);
    expect(latestStatus.isConnected).toBe(true);
    expect(latestStatus.isOffline).toBe(false);
  });

  it('should update status when NetInfo emits connectivity changes', async () => {
    let listenerCallback: any = null;
    (NetInfo.addEventListener as jest.Mock).mockImplementation((cb) => {
      listenerCallback = cb;
      return jest.fn();
    });

    let latestStatus: any = null;

    await act(async () => {
      TestRenderer.create(
        React.createElement(() => {
          latestStatus = useNetworkStatus();
          return null;
        })
      );
    });

    expect(listenerCallback).not.toBeNull();

    await act(async () => {
      listenerCallback({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });
    });

    expect(latestStatus.isConnected).toBe(false);
    expect(latestStatus.isInternetReachable).toBe(false);
    expect(latestStatus.isOffline).toBe(true);
    expect(latestStatus.type).toBe('none');
  });

  it('should unsubscribe from NetInfo listener when component unmounts', async () => {
    const unsubscribeMock = jest.fn();
    (NetInfo.addEventListener as jest.Mock).mockReturnValue(unsubscribeMock);

    let renderer: any;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(() => {
          useNetworkStatus();
          return null;
        })
      );
    });

    await act(async () => {
      renderer.unmount();
    });

    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });
});
