import React from 'react';
import { render, cleanup } from '@testing-library/react-native';
import { MuscleVolumeBar } from '../../src/components/analytics/MuscleVolumeBar';
import { ThemeProvider } from '../../src/context/ThemeContext';

describe('MuscleVolumeBar Component', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders muscle name and effective sets count correctly', async () => {
        const { getByTestId, getByText } = await render(
            <ThemeProvider>
                <MuscleVolumeBar muscle="Pecho" effectiveSets={16} />
            </ThemeProvider>
        );

        expect(getByTestId('muscle-volume-bar-pecho')).toBeTruthy();
        expect(getByText('Pecho')).toBeTruthy();
        expect(getByTestId('muscle-volume-bar-pecho-count')).toBeTruthy();
    });

    it('renders optimal status badge and progress track for optimal volume', async () => {
        const { getByTestId } = await render(
            <ThemeProvider>
                <MuscleVolumeBar muscle="Espalda" effectiveSets={16} />
            </ThemeProvider>
        );

        const badge = getByTestId('muscle-volume-bar-espalda-badge');
        expect(badge).toBeTruthy();

        const track = getByTestId('muscle-volume-bar-espalda-track');
        expect(track).toBeTruthy();

        const fill = getByTestId('muscle-volume-bar-espalda-fill');
        expect(fill).toBeTruthy();
    });

    it('renders warning status when volume approaches MRV', async () => {
        const { getByTestId, getByText } = await render(
            <ThemeProvider>
                <MuscleVolumeBar muscle="Cuádriceps" effectiveSets={20} />
            </ThemeProvider>
        );

        expect(getByTestId('muscle-volume-bar-cuadriceps-badge')).toBeTruthy();
        expect(getByText(/Cerca de MRV/i)).toBeTruthy();
    });

    it('renders overtraining status when volume exceeds MRV', async () => {
        const { getByTestId, getByText } = await render(
            <ThemeProvider>
                <MuscleVolumeBar muscle="Bíceps" effectiveSets={22} />
            </ThemeProvider>
        );

        expect(getByTestId('muscle-volume-bar-biceps-badge')).toBeTruthy();
        expect(getByText(/Sobreentrenamiento/i)).toBeTruthy();
    });

    it('renders below MV status for low sets', async () => {
        const { getByTestId, getByText } = await render(
            <ThemeProvider>
                <MuscleVolumeBar muscle="Pecho" effectiveSets={2} />
            </ThemeProvider>
        );

        expect(getByTestId('muscle-volume-bar-pecho-badge')).toBeTruthy();
        expect(getByText(/Bajo Mantenimiento/i)).toBeTruthy();
    });

    it('supports custom testID override', async () => {
        const { getByTestId } = await render(
            <ThemeProvider>
                <MuscleVolumeBar
                    muscle="Hombros"
                    effectiveSets={14}
                    testID="custom-muscle-bar"
                />
            </ThemeProvider>
        );

        expect(getByTestId('custom-muscle-bar')).toBeTruthy();
        expect(getByTestId('custom-muscle-bar-badge')).toBeTruthy();
    });
});
