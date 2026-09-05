import React from 'react';
import { render } from '@testing-library/react-native';
import { SyncStatusBadge } from '../../src/components/SyncStatusBadge';
import { ThemeProvider } from '../../src/context/ThemeContext';

describe('SyncStatusBadge Component (RNTL)', () => {
  it('should render null when no pending sync and not synced', async () => {
    const { queryByTestId } = await render(
      <ThemeProvider>
        <SyncStatusBadge hasPendingSync={false} isSynced={false} />
      </ThemeProvider>
    );
    expect(queryByTestId('sync-status-badge')).toBeNull();
  });

  it('should render "Guardado localmente" when hasPendingSync is true', async () => {
    const { getByText, getByTestId } = await render(
      <ThemeProvider>
        <SyncStatusBadge hasPendingSync={true} />
      </ThemeProvider>
    );
    expect(getByTestId('sync-status-badge')).toBeTruthy();
    expect(getByText('Guardado localmente')).toBeTruthy();
  });

  it('should render "Sincronizado" when isSynced is true and hasPendingSync is false', async () => {
    const { getByText, getByTestId } = await render(
      <ThemeProvider>
        <SyncStatusBadge hasPendingSync={false} isSynced={true} />
      </ThemeProvider>
    );
    expect(getByTestId('sync-status-badge')).toBeTruthy();
    expect(getByText('Sincronizado')).toBeTruthy();
  });

  it('should render "Sincronizado" when alwaysShow is true and queue is empty', async () => {
    const { getByText, getByTestId } = await render(
      <ThemeProvider>
        <SyncStatusBadge alwaysShow={true} />
      </ThemeProvider>
    );
    expect(getByTestId('sync-status-badge')).toBeTruthy();
    expect(getByText('Sincronizado')).toBeTruthy();
  });
});
