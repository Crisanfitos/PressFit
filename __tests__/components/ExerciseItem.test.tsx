import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ExerciseItem } from '../../src/components/ExerciseItem';

describe('ExerciseItem Component (RNTL)', () => {
    const mockColors = {
        primary: '#238636',
        surface: '#161b22',
        border: '#30363d',
        text: '#ffffff',
        textSecondary: '#888888',
        inputBackground: '#0d1117',
        statusInfo: '#38bdf8',
        statusWarning: '#fbbf24',
    } as any;

    const mockItem = {
        id: 'ex-101',
        titulo: 'Sentadilla Trasera',
        musculos_primarios: 'Cuádriceps, Glúteos',
        musculos_secundarios: 'Isquiotibiales',
        descripcion: 'Mantener la espalda recta y bajar hasta 90 grados.',
        url_video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        categoria: 'Fuerza',
        dificultad: 'Intermedio',
    } as any;

    const mockNavigation = { navigate: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders title and primary muscle info', async () => {
        const { getByText } = await render(
            <ExerciseItem
                item={mockItem}
                isSelected={false}
                selectionMode={false}
                onSelect={jest.fn()}
                onThumbnailPress={jest.fn()}
                colors={mockColors}
                navigation={mockNavigation}
            />
        );

        expect(getByText('Sentadilla Trasera')).toBeTruthy();
        expect(getByText('Cuádriceps, Glúteos')).toBeTruthy();
    });

    it('calls onSelect when exercise card is pressed', async () => {
        const mockOnSelect = jest.fn();
        const { getByText } = await render(
            <ExerciseItem
                item={mockItem}
                isSelected={false}
                selectionMode={false}
                onSelect={mockOnSelect}
                colors={mockColors}
                navigation={mockNavigation}
            />
        );

        fireEvent.press(getByText('Sentadilla Trasera'));
        expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it('expands description and muscle badges when expand icon is pressed', async () => {
        const { getByTestId, queryByText, findByText } = await render(
            <ExerciseItem
                item={mockItem}
                isSelected={false}
                selectionMode={false}
                onSelect={jest.fn()}
                onThumbnailPress={jest.fn()}
                colors={mockColors}
                navigation={mockNavigation}
            />
        );

        // Before expanding, description is hidden
        expect(queryByText('Mantener la espalda recta y bajar hasta 90 grados.')).toBeNull();

        // Press expand icon with stopPropagation event mock
        const expandIcon = getByTestId('icon-expand-more');
        fireEvent.press(expandIcon, { stopPropagation: jest.fn() });

        // Description and badges are now visible
        expect(await findByText('Mantener la espalda recta y bajar hasta 90 grados.')).toBeTruthy();
        expect(await findByText('Cuádriceps')).toBeTruthy();
        expect(await findByText('Glúteos')).toBeTruthy();
        expect(await findByText('Intermedio')).toBeTruthy();
    });

    it('navigates to ExerciseDetail screen when info icon is pressed', async () => {
        const { getByTestId } = await render(
            <ExerciseItem
                item={mockItem}
                isSelected={false}
                selectionMode={false}
                onSelect={jest.fn()}
                onThumbnailPress={jest.fn()}
                colors={mockColors}
                navigation={mockNavigation}
            />
        );

        const infoIcon = getByTestId('icon-info-outline');
        fireEvent.press(infoIcon, { stopPropagation: jest.fn() });

        expect(mockNavigation.navigate).toHaveBeenCalledWith('ExerciseDetail', { exerciseId: 'ex-101' });
    });

    it('shows selection checkmark when selectionMode is true and item isSelected', async () => {
        const { getByTestId } = await render(
            <ExerciseItem
                item={mockItem}
                isSelected={true}
                selectionMode={true}
                onSelect={jest.fn()}
                onThumbnailPress={jest.fn()}
                colors={mockColors}
                navigation={mockNavigation}
            />
        );

        expect(getByTestId('icon-check-circle')).toBeTruthy();
    });
});
