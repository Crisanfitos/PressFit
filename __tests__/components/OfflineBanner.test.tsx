import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { OfflineBanner } from '../../src/components/OfflineBanner';
import * as networkHook from '../../src/hooks/useNetworkStatus';
import { SyncService } from '../../src/services/SyncService';

jest.mock('../../src/services/HapticService', () => ({
  HapticService: {
    selection: jest.fn(),
  },
}));

describe('OfflineBanner Component (RNTL)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should not render anything when online (isOffline = false)', async () => {
    jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
      isConnected: true,
      isInternetReachable: true,
      isOffline: false,
      type: 'wifi',
    });

    const { queryByTestId } = await render(<OfflineBanner isOffline={false} />);
    expect(queryByTestId('offline-banner')).toBeNull();
  });

  it('should render offline banner when isOffline = true', async () => {
    jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
      isConnected: false,
      isInternetReachable: false,
      isOffline: true,
      type: 'none',
    });

    const { getByTestId, getByText } = await render(<OfflineBanner isOffline={true} />);
    expect(getByTestId('offline-banner')).toBeTruthy();
    expect(getByText(/Modo Offline — Los cambios se guardarán localmente/i)).toBeTruthy();
    expect(getByTestId('icon-wifi-off')).toBeTruthy();
    expect(getByTestId('offline-retry-button')).toBeTruthy();
  });

  it('should render network status hook value when prop is undefined', async () => {
    jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
      isConnected: false,
      isInternetReachable: false,
      isOffline: true,
      type: 'none',
    });

    const { getByTestId, getByText } = await render(<OfflineBanner />);
    expect(getByTestId('offline-banner')).toBeTruthy();
    expect(getByText(/Modo Offline — Los cambios se guardarán localmente/i)).toBeTruthy();
  });

  it('applies SafeAreaInsetsContext top inset for both offline and restored states', async () => {
    const mockInsets = { top: 44, right: 0, bottom: 0, left: 0 };
    jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
      isConnected: false,
      isInternetReachable: false,
      isOffline: true,
      type: 'none',
    });

    const { getByTestId, rerender } = await render(
      <SafeAreaInsetsContext.Provider value={mockInsets}>
        <OfflineBanner isOffline={true} />
      </SafeAreaInsetsContext.Provider>
    );

    const offlineStyle = StyleSheet.flatten(getByTestId('offline-banner').props.style);
    expect(offlineStyle.paddingTop).toBe(52); // 44 + 8

    await rerender(
      <SafeAreaInsetsContext.Provider value={mockInsets}>
        <OfflineBanner isOffline={false} />
      </SafeAreaInsetsContext.Provider>
    );

    const restoredStyle = StyleSheet.flatten(getByTestId('offline-banner').props.style);
    expect(restoredStyle.paddingTop).toBe(52);
  });

  it('hides retry button when connection is restored', async () => {
    jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
      isConnected: false,
      isInternetReachable: false,
      isOffline: true,
      type: 'none',
    });

    const { queryByTestId, getByText, rerender } = await render(<OfflineBanner isOffline={true} />);
    expect(queryByTestId('offline-retry-button')).toBeTruthy();

    await rerender(<OfflineBanner isOffline={false} />);
    expect(getByText(/Conexión restablecida — Sincronizando cambios/i)).toBeTruthy();
    expect(queryByTestId('offline-retry-button')).toBeNull();
  });

  it('triggers refresh, SyncService.processQueue and onRetry when retry button is pressed and online returns', async () => {
    const mockRefresh = jest.fn().mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      isOffline: false,
      type: 'WIFI',
    });
    const mockOnRetry = jest.fn().mockResolvedValue(undefined);
    const processQueueSpy = jest.spyOn(SyncService, 'processQueue').mockResolvedValue({
      data: { processed: 1, failed: 0 },
      error: null,
    });

    jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
      isConnected: false,
      isInternetReachable: false,
      isOffline: true,
      type: 'NONE',
      refresh: mockRefresh,
    });

    const { getByTestId } = await render(<OfflineBanner isOffline={true} onRetry={mockOnRetry} />);

    fireEvent.press(getByTestId('offline-retry-button'));

    await waitFor(() => {
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
      expect(mockRefresh).toHaveBeenCalledTimes(1);
      expect(processQueueSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('shows spinner and prevents duplicate taps while retry is in progress', async () => {
    let resolveRefresh!: (val: networkHook.NetworkStatus) => void;
    const pendingRefresh = new Promise<networkHook.NetworkStatus>((resolve) => {
      resolveRefresh = resolve;
    });
    const mockRefresh = jest.fn().mockReturnValue(pendingRefresh);

    jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
      isConnected: false,
      isInternetReachable: false,
      isOffline: true,
      type: 'NONE',
      refresh: mockRefresh,
    });

    const { getByTestId, queryByTestId } = await render(<OfflineBanner isOffline={true} />);
    const retryBtn = getByTestId('offline-retry-button');

    await act(async () => {
      fireEvent.press(retryBtn);
    });

    await waitFor(() => {
      expect(getByTestId('offline-retry-spinner')).toBeTruthy();
    });

    // Second tap while loading must be ignored
    await act(async () => {
      fireEvent.press(getByTestId('offline-retry-button'));
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRefresh({
        isConnected: false,
        isInternetReachable: false,
        isOffline: true,
        type: 'NONE',
      });
    });

    await waitFor(() => {
      expect(queryByTestId('offline-retry-spinner')).toBeNull();
      expect(getByTestId('icon-refresh')).toBeTruthy();
    });
  });
});
