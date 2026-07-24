import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import ErrorBoundary from '../../src/components/ErrorBoundary';

const BuggyComponent = () => {
    throw new Error('Test Crash');
};

describe('ErrorBoundary Component (RNTL)', () => {
    let originalError: any;
    beforeAll(() => {
        originalError = console.error;
        console.error = jest.fn();
    });

    afterAll(() => {
        console.error = originalError;
    });

    it('renders children normally when no error occurs', async () => {
        const { getByText } = await render(
            <ErrorBoundary>
                <Text>All Good</Text>
            </ErrorBoundary>
        );
        expect(getByText('All Good')).toBeTruthy();
    });

    it('renders fallback UI when a child crashes', async () => {
        const { getByText } = await render(
            <ErrorBoundary>
                <BuggyComponent />
            </ErrorBoundary>
        );
        expect(getByText('¡Ups! Algo salió mal')).toBeTruthy();
        expect(getByText('Reintentar')).toBeTruthy();
    });

    it('allows retrying after a crash', async () => {
        let shouldCrash = true;
        const TestWrapper = () => {
            return (
                <ErrorBoundary>
                    {shouldCrash ? <BuggyComponent /> : <Text>Recovered</Text>}
                </ErrorBoundary>
            );
        };

        const { getByText, rerender } = await render(<TestWrapper />);
        expect(getByText('¡Ups! Algo salió mal')).toBeTruthy();

        shouldCrash = false;
        const retryButton = getByText('Reintentar');
        fireEvent.press(retryButton);

        await rerender(<TestWrapper />);
        expect(getByText('Recovered')).toBeTruthy();
    });
});
