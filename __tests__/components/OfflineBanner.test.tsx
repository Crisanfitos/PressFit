import React from 'react';
import { render } from '@testing-library/react-native';
import { OfflineBanner } from '../../src/components/OfflineBanner';
import * as networkHook from '../../src/hooks/useNetworkStatus';

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
});
