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

async function checkInternetPing(): Promise<boolean> {
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 2500) : null;

    const response = await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      cache: 'no-store',
      ...(controller ? { signal: controller.signal } : {}),
    });

    if (timer) clearTimeout(timer);
    return response.status === 204 || response.ok;
  } catch {
    return false;
  }
}

async function fetchNetworkState(): Promise<NetworkState> {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    const online = navigator.onLine;
    return {
      isConnected: online,
      isInternetReachable: online,
      isOffline: !online,
      type: online ? 'WIFI' : 'NONE',
    };
  }

  const isOnline = await checkInternetPing();
  return {
    isConnected: isOnline,
    isInternetReachable: isOnline,
    isOffline: !isOnline,
    type: isOnline ? 'WIFI' : 'NONE',
  };
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
  }, 5000);
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
