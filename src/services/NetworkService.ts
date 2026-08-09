import * as Network from 'expo-network';

export interface NetworkState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  isOffline: boolean;
  type: string | null;
}

let networkListeners: Array<(state: NetworkState) => void> = [];
let intervalId: any = null;
let lastKnownState: NetworkState = {
  isConnected: true,
  isInternetReachable: true,
  isOffline: false,
  type: 'WIFI',
};

async function fetchNetworkState(): Promise<NetworkState> {
  try {
    const state = await Network.getNetworkStateAsync();
    const isConnected = state.isConnected ?? true;
    const isInternetReachable = state.isInternetReachable ?? true;
    return {
      isConnected,
      isInternetReachable,
      isOffline: isConnected === false || isInternetReachable === false,
      type: state.type ? String(state.type) : 'UNKNOWN',
    };
  } catch (error) {
    const online = typeof navigator !== 'undefined' && 'onLine' in navigator ? navigator.onLine : true;
    return {
      isConnected: online,
      isInternetReachable: online,
      isOffline: !online,
      type: online ? 'WIFI' : 'NONE',
    };
  }
}

function startPollingIfNeeded() {
  if (intervalId || networkListeners.length === 0) return;
  intervalId = setInterval(async () => {
    const newState = await fetchNetworkState();
    if (
      newState.isConnected !== lastKnownState.isConnected ||
      newState.isInternetReachable !== lastKnownState.isInternetReachable ||
      newState.isOffline !== lastKnownState.isOffline
    ) {
      lastKnownState = newState;
      networkListeners.forEach((listener) => listener(newState));
    }
  }, 3000);
}

function stopPollingIfUnused() {
  if (networkListeners.length === 0 && intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export const NetworkService = {
  async getNetworkState(): Promise<NetworkState> {
    const state = await fetchNetworkState();
    lastKnownState = state;
    return state;
  },

  async isOffline(): Promise<boolean> {
    const state = await this.getNetworkState();
    return state.isOffline;
  },

  addNetworkListener(callback: (state: NetworkState) => void): () => void {
    networkListeners.push(callback);
    startPollingIfNeeded();

    fetchNetworkState().then((state) => {
      lastKnownState = state;
      callback(state);
    });

    return () => {
      networkListeners = networkListeners.filter((cb) => cb !== callback);
      stopPollingIfUnused();
    };
  },
};
