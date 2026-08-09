import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useNetworkStatus } from '../../../src/hooks/useNetworkStatus';
import { NetworkService } from '../../../src/services/NetworkService';

jest.mock('../../../src/services/NetworkService');

const mockNetworkService = NetworkService as jest.Mocked<typeof NetworkService>;

describe('useNetworkStatus Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNetworkService.getNetworkState.mockResolvedValue({
      type: 'WIFI',
      isConnected: true,
      isInternetReachable: true,
      isOffline: false,
    });
    mockNetworkService.addNetworkListener.mockReturnValue(jest.fn());
  });

  it('should initialize with online network status and subscribe to NetworkService events', async () => {
    let latestStatus: any = null;

    await act(async () => {
      TestRenderer.create(
        React.createElement(() => {
          latestStatus = useNetworkStatus();
          return null;
        })
      );
    });

    expect(mockNetworkService.getNetworkState).toHaveBeenCalledTimes(1);
    expect(mockNetworkService.addNetworkListener).toHaveBeenCalledTimes(1);
    expect(latestStatus.isConnected).toBe(true);
    expect(latestStatus.isOffline).toBe(false);
  });

  it('should update status when NetworkService emits connectivity changes', async () => {
    let listenerCallback: any = null;
    mockNetworkService.addNetworkListener.mockImplementation((cb) => {
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
        isOffline: true,
        type: 'NONE',
      });
    });

    expect(latestStatus.isConnected).toBe(false);
    expect(latestStatus.isInternetReachable).toBe(false);
    expect(latestStatus.isOffline).toBe(true);
    expect(latestStatus.type).toBe('NONE');
  });

  it('should unsubscribe from NetworkService listener when component unmounts', async () => {
    const unsubscribeMock = jest.fn();
    mockNetworkService.addNetworkListener.mockReturnValue(unsubscribeMock);

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
