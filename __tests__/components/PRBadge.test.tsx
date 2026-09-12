import React from 'react';
import { render, cleanup } from '@testing-library/react-native';
import { PRBadge } from '../../src/components/workout/PRBadge';

describe('PRBadge Component (PF-318)', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders with default small size and text PR', async () => {
        const { getByTestId, getByText } = await render(<PRBadge />);
        expect(getByTestId('pr-badge')).toBeTruthy();
        expect(getByText('PR')).toBeTruthy();
    });

    it('renders with medium size and custom testID', async () => {
        const { getByTestId, getByText } = await render(
            <PRBadge size="medium" testID="custom-pr-badge" />
        );
        expect(getByTestId('custom-pr-badge')).toBeTruthy();
        expect(getByText('PR')).toBeTruthy();
    });
});
