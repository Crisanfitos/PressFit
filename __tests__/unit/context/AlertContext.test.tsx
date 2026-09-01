import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { render, renderHook, fireEvent, act, waitFor } from '@testing-library/react-native';
import { AlertProvider, useAlert } from '../../../src/context/AlertContext';

jest.mock('../../../src/context/ThemeContext', () => ({
    useTheme: () => ({
        theme: {
            colors: {
                surface: '#1E1E1E',
                surfaceHighlight: '#2A2A2A',
                border: '#333333',
                text: '#FFFFFF',
                textSecondary: '#AAAAAA',
                textOnPrimary: '#000000',
                primary: '#FF4500',
                statusSuccess: '#00C853',
                statusError: '#D50000',
                statusWarning: '#FFD600',
                statusInfo: '#2979FF',
                background: '#121212',
            },
        },
    }),
}));

describe('AlertContext (PF-265)', () => {
    describe('useAlert hook', () => {
        it('throws an error when used outside of an AlertProvider', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await expect(async () => {
                await renderHook(() => useAlert());
            }).rejects.toThrow('useAlert must be used within an AlertProvider');

            consoleSpy.mockRestore();
        });
    });

    describe('AlertProvider and showAlert flows', () => {
        const AlertTester = ({
            onCustomPress,
        }: {
            onCustomPress?: () => void;
        }) => {
            const alert = useAlert();

            return (
                <View testID="test-container">
                    <TouchableOpacity
                        testID="btn-default"
                        onPress={() => alert.showAlert({ message: 'Default info message' })}
                    >
                        <Text>Show Default</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        testID="btn-info-explicit"
                        onPress={() => alert.showAlert({
                            title: 'Información',
                            message: 'Mensaje de tipo info explícito',
                            type: 'info',
                        })}
                    >
                        <Text>Show Info</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        testID="btn-success"
                        onPress={() => alert.showAlert({
                            title: '¡Éxito!',
                            message: 'Operación realizada correctamente',
                            type: 'success',
                        })}
                    >
                        <Text>Show Success</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        testID="btn-error"
                        onPress={() => alert.showAlert({
                            title: 'Error Crítico',
                            message: 'No se pudo eliminar el elemento',
                            type: 'error',
                            buttons: [
                                { text: 'Eliminar', style: 'destructive', onPress: onCustomPress },
                            ],
                        })}
                    >
                        <Text>Show Error</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        testID="btn-warning"
                        onPress={() => alert.showAlert({
                            title: 'Advertencia',
                            message: 'Esta acción no se puede deshacer',
                            type: 'warning',
                            buttons: [
                                { text: 'Cancelar', style: 'cancel', onPress: onCustomPress },
                            ],
                        })}
                    >
                        <Text>Show Warning</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        testID="btn-confirm"
                        onPress={() => alert.showAlert({
                            title: 'Confirmación',
                            message: '¿Deseas continuar?',
                            type: 'confirm',
                            buttons: [
                                { text: 'Aceptar', style: 'default', onPress: onCustomPress },
                            ],
                        })}
                    >
                        <Text>Show Confirm</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        testID="btn-no-callback"
                        onPress={() => alert.showAlert({
                            message: 'No callback alert',
                            buttons: [{ text: 'Entendido' }],
                        })}
                    >
                        <Text>Show No Callback</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        testID="btn-hide"
                        onPress={() => alert.hideAlert()}
                    >
                        <Text>Hide Alert</Text>
                    </TouchableOpacity>
                </View>
            );
        };

        it('renders children correctly and modal is initially not visible', async () => {
            const { getByTestId, queryByTestId } = await render(
                <AlertProvider>
                    <AlertTester />
                </AlertProvider>
            );

            expect(getByTestId('test-container')).toBeTruthy();
            expect(queryByTestId('alert-modal')).toBeNull();
        });

        it('shows default info alert with fallback values (OK button, info icon, no title)', async () => {
            const { getByTestId, getByText } = await render(
                <AlertProvider>
                    <AlertTester />
                </AlertProvider>
            );

            fireEvent.press(getByTestId('btn-default'));

            await waitFor(() => {
                expect(getByTestId('alert-modal')).toBeTruthy();
            });

            expect(getByText('Default info message')).toBeTruthy();
            expect(getByText('OK')).toBeTruthy();
            expect(getByText('info')).toBeTruthy();
        });

        it('renders explicit info alert with title and message', async () => {
            const { getByTestId, getByText } = await render(
                <AlertProvider>
                    <AlertTester />
                </AlertProvider>
            );

            fireEvent.press(getByTestId('btn-info-explicit'));

            await waitFor(() => {
                expect(getByTestId('alert-modal')).toBeTruthy();
            });

            expect(getByText('Información')).toBeTruthy();
            expect(getByText('Mensaje de tipo info explícito')).toBeTruthy();
            expect(getByText('info')).toBeTruthy();
        });

        it('renders success alert with custom title, message and icon', async () => {
            const { getByTestId, getByText } = await render(
                <AlertProvider>
                    <AlertTester />
                </AlertProvider>
            );

            fireEvent.press(getByTestId('btn-success'));

            await waitFor(() => {
                expect(getByTestId('alert-modal')).toBeTruthy();
            });

            expect(getByText('¡Éxito!')).toBeTruthy();
            expect(getByText('Operación realizada correctamente')).toBeTruthy();
            expect(getByText('check-circle')).toBeTruthy();
        });

        it('renders error alert with destructive button style and triggers custom onPress callback', async () => {
            const onCustomPress = jest.fn();
            const { getByTestId, getByText, queryByTestId } = await render(
                <AlertProvider>
                    <AlertTester onCustomPress={onCustomPress} />
                </AlertProvider>
            );

            fireEvent.press(getByTestId('btn-error'));

            await waitFor(() => {
                expect(getByTestId('alert-modal')).toBeTruthy();
            });

            expect(getByText('Error Crítico')).toBeTruthy();
            expect(getByText('No se pudo eliminar el elemento')).toBeTruthy();
            expect(getByText('error')).toBeTruthy();

            const deleteButton = getByText('Eliminar');
            fireEvent.press(deleteButton);

            expect(onCustomPress).toHaveBeenCalledTimes(1);

            await waitFor(() => {
                expect(queryByTestId('alert-modal')).toBeNull();
            });
        });

        it('renders warning alert with cancel button and triggers onPress callback', async () => {
            const onCancelPress = jest.fn();
            const { getByTestId, getByText, queryByTestId } = await render(
                <AlertProvider>
                    <AlertTester onCustomPress={onCancelPress} />
                </AlertProvider>
            );

            fireEvent.press(getByTestId('btn-warning'));

            await waitFor(() => {
                expect(getByTestId('alert-modal')).toBeTruthy();
            });

            expect(getByText('Advertencia')).toBeTruthy();
            expect(getByText('warning')).toBeTruthy();

            fireEvent.press(getByText('Cancelar'));
            expect(onCancelPress).toHaveBeenCalledTimes(1);

            await waitFor(() => {
                expect(queryByTestId('alert-modal')).toBeNull();
            });
        });

        it('renders confirm alert with default button style and triggers onPress callback', async () => {
            const onConfirmPress = jest.fn();
            const { getByTestId, getByText, queryByTestId } = await render(
                <AlertProvider>
                    <AlertTester onCustomPress={onConfirmPress} />
                </AlertProvider>
            );

            fireEvent.press(getByTestId('btn-confirm'));

            await waitFor(() => {
                expect(getByTestId('alert-modal')).toBeTruthy();
            });

            expect(getByText('Confirmación')).toBeTruthy();
            expect(getByText('help')).toBeTruthy();

            fireEvent.press(getByText('Aceptar'));
            expect(onConfirmPress).toHaveBeenCalledTimes(1);

            await waitFor(() => {
                expect(queryByTestId('alert-modal')).toBeNull();
            });
        });

        it('handles button press without an onPress callback cleanly and hides modal', async () => {
            const { getByTestId, getByText, queryByTestId } = await render(
                <AlertProvider>
                    <AlertTester />
                </AlertProvider>
            );

            fireEvent.press(getByTestId('btn-no-callback'));

            await waitFor(() => {
                expect(getByTestId('alert-modal')).toBeTruthy();
            });

            expect(getByText('No callback alert')).toBeTruthy();

            const button = getByText('Entendido');
            fireEvent.press(button);

            await waitFor(() => {
                expect(queryByTestId('alert-modal')).toBeNull();
            });
        });

        it('closes the modal when hideAlert is called', async () => {
            const { getByTestId, queryByTestId } = await render(
                <AlertProvider>
                    <AlertTester />
                </AlertProvider>
            );

            fireEvent.press(getByTestId('btn-default'));

            await waitFor(() => {
                expect(getByTestId('alert-modal')).toBeTruthy();
            });

            fireEvent.press(getByTestId('btn-hide'));

            await waitFor(() => {
                expect(queryByTestId('alert-modal')).toBeNull();
            });
        });

        it('handles Modal onRequestClose by hiding alert', async () => {
            const { getByTestId, queryByTestId } = await render(
                <AlertProvider>
                    <AlertTester />
                </AlertProvider>
            );

            fireEvent.press(getByTestId('btn-default'));

            await waitFor(() => {
                expect(getByTestId('alert-modal')).toBeTruthy();
            });

            fireEvent(getByTestId('alert-modal'), 'requestClose');

            await waitFor(() => {
                expect(queryByTestId('alert-modal')).toBeNull();
            });
        });
    });
});
