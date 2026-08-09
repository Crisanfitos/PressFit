import { NativeModules } from 'react-native';

/**
 * Polyfill for @react-native-community/netinfo native module RNCNetInfo.
 * Prevents "NativeModule.RNCNetInfo is null" fatal error when running
 * in Expo Go, web, or environments without linked native RNCNetInfo binaries.
 */
if (!NativeModules.RNCNetInfo) {
  NativeModules.RNCNetInfo = {
    getCurrentState: async () => ({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
      details: {
        isConnectionExpensive: false,
      },
    }),
    addListener: () => {},
    removeListeners: () => {},
    configure: () => {},
  };
}

export const isNetInfoPolyfilled = Boolean(NativeModules.RNCNetInfo);
