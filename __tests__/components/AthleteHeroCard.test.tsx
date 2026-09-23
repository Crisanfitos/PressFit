import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react-native';
import { AthleteHeroCard } from '../../src/components/profile/AthleteHeroCard';
import { ThemeProvider } from '../../src/context/ThemeContext';

describe('AthleteHeroCard Component', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders athlete name, email, and metric values without cloud badge', async () => {
        const onPressAvatar = jest.fn();
        const { getByText, queryByText, getByTestId } = await render(
            <ThemeProvider>
                <AthleteHeroCard
                    displayName="Carlos PressFit"
                    email="carlos@example.com"
                    primaryMetricValue="14"
                    primaryMetricLabel="Entrenos (mes)"
                    secondaryMetricValue="720"
                    secondaryMetricLabel="Minutos (mes)"
                    onPressAvatar={onPressAvatar}
                />
            </ThemeProvider>
        );

        expect(getByText('Carlos PressFit')).toBeTruthy();
        expect(getByText('carlos@example.com')).toBeTruthy();
        expect(getByText('14')).toBeTruthy();
        expect(getByText('Entrenos (mes)')).toBeTruthy();
        expect(getByText('720')).toBeTruthy();
        expect(getByText('Minutos (mes)')).toBeTruthy();

        // Ensure cloud badge is removed
        expect(queryByText(/Atleta PressFit Cloud/i)).toBeNull();

        fireEvent.press(getByTestId('profile-athlete-hero-avatar-button'));
        expect(onPressAvatar).toHaveBeenCalledTimes(1);
    });
});
