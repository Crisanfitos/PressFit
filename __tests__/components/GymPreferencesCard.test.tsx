import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react-native';
import { GymPreferencesCard } from '../../src/components/profile/GymPreferencesCard';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { DEFAULT_GYM_PREFERENCES } from '../../src/utils/gymPreferences';
import i18n from '../../src/i18n';

describe('GymPreferencesCard Component', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders gym preferences in English when locale is en', async () => {
        await i18n.changeLanguage('en');
        const onChange = jest.fn();
        const onOpenPlates = jest.fn();

        try {
            const { getByText } = await render(
                <ThemeProvider>
                    <GymPreferencesCard
                        prefs={DEFAULT_GYM_PREFERENCES}
                        onChange={onChange}
                        onOpenPlates={onOpenPlates}
                    />
                </ThemeProvider>
            );

            expect(getByText('Gym Preferences')).toBeTruthy();
            expect(getByText('Weight Unit')).toBeTruthy();
            expect(getByText('Default Rest Time')).toBeTruthy();
            expect(getByText('Sound when rest finishes')).toBeTruthy();
            expect(getByText('Haptic vibration')).toBeTruthy();
            expect(getByText('Plates & Barbells')).toBeTruthy();
        } finally {
            cleanup();
            await i18n.changeLanguage('es');
        }
    });

    it('renders gym preferences in Spanish by default', async () => {
        const onChange = jest.fn();
        const onOpenPlates = jest.fn();

        const { getByText, getByTestId } = await render(
            <ThemeProvider>
                <GymPreferencesCard
                    prefs={DEFAULT_GYM_PREFERENCES}
                    onChange={onChange}
                    onOpenPlates={onOpenPlates}
                />
            </ThemeProvider>
        );

        expect(getByText('Preferencias de gimnasio')).toBeTruthy();
        expect(getByText('Unidad de peso')).toBeTruthy();
        expect(getByText('Descanso por defecto')).toBeTruthy();
        expect(getByText('Sonido al finalizar descanso')).toBeTruthy();
        expect(getByText('Vibración táctil')).toBeTruthy();
        expect(getByText('Discos y Barras')).toBeTruthy();

        fireEvent.press(getByTestId('profile-gym-prefs-unit-lb'));
        expect(onChange).toHaveBeenCalledWith({ weightUnit: 'lb' });

        fireEvent.press(getByTestId('plate-settings-navigation-button'));
        expect(onOpenPlates).toHaveBeenCalled();
    });
});
