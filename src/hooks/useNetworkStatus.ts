import { useState, useEffect } from 'react';
import { NetworkService, NetworkState } from '../services/NetworkService';

export type NetworkStatus = NetworkState;

/**
 * Custom hook to monitor network connectivity status in real-time using NetworkService (expo-network).
 */
export const useNetworkStatus = (): NetworkStatus => {
  const [status, setStatus] = useState<NetworkStatus>({
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

  return status;
};
