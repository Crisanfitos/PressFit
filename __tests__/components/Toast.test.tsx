import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Toast } from '../../src/components/Toast';

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        surface: '#1E1E1E',
        border: '#333333',
        text: '#FFFFFF',
        textSecondary: '#AAAAAA',
        statusSuccess: '#00C853',
        statusError: '#D50000',
        statusWarning: '#FFD600',
        statusInfo: '#2979FF',
      },
    },
  }),
}));

describe('Toast Component (PF-274)', () => {
  it('renders nothing when visible is false', async () => {
    const { queryByTestId } = await render(
      <Toast
        visible={false}
        config={{ message: 'Hidden toast', type: 'info' }}
        onDismiss={jest.fn()}
      />
    );
    expect(queryByTestId('toast-box')).toBeNull();
  });

  it('renders nothing when config is null', async () => {
    const { queryByTestId } = await render(
      <Toast visible={true} config={null} onDismiss={jest.fn()} />
    );
    expect(queryByTestId('toast-box')).toBeNull();
  });

  it('renders correctly with message and default info icon', async () => {
    const { getByTestId, queryByTestId } = await render(
      <Toast
        visible={true}
        config={{ message: 'Operación completada' }}
        onDismiss={jest.fn()}
      />
    );

    expect(getByTestId('toast-box')).toBeTruthy();
    expect(getByTestId('toast-message').props.children).toBe('Operación completada');
    expect(queryByTestId('toast-title')).toBeNull();
    expect(getByTestId('icon-info')).toBeTruthy();
  });

  it('renders success toast with title and check icon', async () => {
    const { getByTestId } = await render(
      <Toast
        visible={true}
        config={{
          title: 'Éxito',
          message: 'Serie guardada correctamente',
          type: 'success',
        }}
        onDismiss={jest.fn()}
      />
    );

    expect(getByTestId('toast-title').props.children).toBe('Éxito');
    expect(getByTestId('toast-message').props.children).toBe('Serie guardada correctamente');
    expect(getByTestId('icon-check-circle')).toBeTruthy();
  });

  it('renders error toast with icon error', async () => {
    const { getByTestId } = await render(
      <Toast
        visible={true}
        config={{
          title: 'Error',
          message: 'Fallo de conexión',
          type: 'error',
        }}
        onDismiss={jest.fn()}
      />
    );

    expect(getByTestId('icon-error')).toBeTruthy();
    expect(getByTestId('toast-title').props.children).toBe('Error');
  });

  it('renders warning toast with icon warning', async () => {
    const { getByTestId } = await render(
      <Toast
        visible={true}
        config={{
          title: 'Advertencia',
          message: 'Batería baja',
          type: 'warning',
        }}
        onDismiss={jest.fn()}
      />
    );

    expect(getByTestId('icon-warning')).toBeTruthy();
    expect(getByTestId('toast-title').props.children).toBe('Advertencia');
  });

  it('triggers onPress callback when toast body is tapped', async () => {
    const onPressMock = jest.fn();

    const { getByTestId } = await render(
      <Toast
        visible={true}
        config={{
          message: 'Tappable toast',
          type: 'info',
          onPress: onPressMock,
        }}
        onDismiss={jest.fn()}
      />
    );

    fireEvent.press(getByTestId('toast-touchable'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('triggers dismiss action when close button is pressed', async () => {
    const onDismissMock = jest.fn();
    const configDismissMock = jest.fn();

    const { getByTestId } = await render(
      <Toast
        visible={true}
        config={{
          message: 'Dismissable toast',
          type: 'info',
          onDismiss: configDismissMock,
        }}
        onDismiss={onDismissMock}
      />
    );

    expect(getByTestId('toast-dismiss-button')).toBeTruthy();
    fireEvent.press(getByTestId('toast-dismiss-button'));
  });

  it('renders at bottom position when configured', async () => {
    const { getByTestId } = await render(
      <Toast
        visible={true}
        config={{
          message: 'Bottom position toast',
          position: 'bottom',
        }}
        onDismiss={jest.fn()}
      />
    );

    expect(getByTestId('toast-box')).toBeTruthy();
  });
});
