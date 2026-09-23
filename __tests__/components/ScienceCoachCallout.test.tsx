import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react-native';
import { ScienceCoachCallout } from '../../src/components/analytics/ScienceCoachCallout';
import { ThemeProvider } from '../../src/context/ThemeContext';
import i18n from '../../src/i18n';

describe('ScienceCoachCallout Component', () => {
    afterEach(() => {
        cleanup();
        i18n.changeLanguage('es');
    });

    it('renders fallback title, message, and CTA label correctly', async () => {
        const onPressCta = jest.fn();
        const { getByTestId, getByText } = await render(
            <ThemeProvider>
                <ScienceCoachCallout
                    title="Recomendación Personalizada"
                    message="Volumen adecuado para la semana actual."
                    ctaLabel="Ir a Rutinas"
                    onPressCta={onPressCta}
                />
            </ThemeProvider>
        );

        expect(getByText('Recomendación Personalizada')).toBeTruthy();
        expect(getByTestId('hypertrophy-coach-callout-message')).toBeTruthy();
        expect(getByText('Volumen adecuado para la semana actual.')).toBeTruthy();

        const cta = getByTestId('hypertrophy-coach-callout-cta');
        fireEvent.press(cta);
        expect(onPressCta).toHaveBeenCalledTimes(1);
    });

    it('renders localized content in Spanish when i18n keys and params are provided', async () => {
        await i18n.changeLanguage('es');

        const { getByText } = await render(
            <ThemeProvider>
                <ScienceCoachCallout
                    title="Fallback Title"
                    message="Fallback Message"
                    ctaLabel="Fallback CTA"
                    titleKey="scienceRec.title"
                    messageKey="scienceRec.overtraining"
                    messageParams={{ muscle: 'Pecho', sets: 24 }}
                    ctaLabelKey="scienceRec.ctaLabel"
                />
            </ThemeProvider>
        );

        expect(getByText('Sobrecarga Progresiva & Deload')).toBeTruthy();
        expect(
            getByText(
                'Tu volumen en Pecho supera el MRV (24 series). Considera una semana de deload o reducir 3-4 series para recuperar adaptación.'
            )
        ).toBeTruthy();
        expect(getByText('Ajustar Volumen en Rutinas')).toBeTruthy();
    });

    it('renders localized content in English when locale is en', async () => {
        await i18n.changeLanguage('en');

        const { getByText } = await render(
            <ThemeProvider>
                <ScienceCoachCallout
                    title="Fallback Title"
                    message="Fallback Message"
                    ctaLabel="Fallback CTA"
                    titleKey="scienceRec.title"
                    messageKey="scienceRec.overtraining"
                    messageParams={{ muscle: 'Chest', sets: 24 }}
                    ctaLabelKey="scienceRec.ctaLabel"
                />
            </ThemeProvider>
        );

        expect(getByText('Progressive Overload & Deload')).toBeTruthy();
        expect(
            getByText(
                'Your volume in Chest exceeds MRV (24 sets). Consider a deload week or reducing 3-4 sets to recover adaptation.'
            )
        ).toBeTruthy();
        expect(getByText('Adjust Volume in Routines')).toBeTruthy();
    });
});
