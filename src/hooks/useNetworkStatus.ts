import { useState, useEffect, useCallback } from 'react';
import { NetworkService, NetworkState } from '../services/NetworkService';

export interface NetworkStatus extends NetworkState {
  /** Triggers an immediate connectivity check and updates all listeners */
  refresh?: () => Promise<NetworkState>;
}

/**
 * Custom hook to monitor network connectivity status in real-time using NetworkService.
 */
export const useNetworkStatus = (): NetworkStatus => {
  const [status, setStatus] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
    isOffline: false,
    type: 'WIFI',
  });

  useEffect(() => {
    NetworkService.getNetworkState().then(setStatus);
    const unsubscribe = NetworkService.addNetworkListener(setStatus);
    return () => {
      unsubscribe();
    };
  }, []);

  const refresh = useCallback(async (): Promise<NetworkState> => {
    const fresh = NetworkService.refreshNetworkState
      ? await NetworkService.refreshNetworkState()
      : await NetworkService.getNetworkState();
    setStatus(fresh);
    return fresh;
  }, []);

  return {
    ...status,
    refresh,
  };
};
