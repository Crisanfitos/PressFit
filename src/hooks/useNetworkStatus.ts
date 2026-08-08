import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  isOffline: boolean;
  type: string | null;
}

/**
 * Custom hook to monitor network connectivity status in real-time using NetInfo.
 */
export const useNetworkStatus = (): NetworkStatus => {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    isOffline: false,
    type: null,
  });

  useEffect(() => {
    // Fetch initial connection status
    NetInfo.fetch().then((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        isOffline: state.isConnected === false || state.isInternetReachable === false,
        type: state.type,
      });
    });

    // Listen to real-time network connectivity changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        isOffline: state.isConnected === false || state.isInternetReachable === false,
        type: state.type,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return status;
};
