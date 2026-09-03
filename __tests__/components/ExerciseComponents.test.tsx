import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Animated } from 'react-native';
import {
    ExerciseHeader,
    ExerciseSearchBar,
    ExerciseFilterSection,
    ExerciseListItem,
    ScrollToTopFab,
    ExerciseVideoModal,
    ExerciseEmptyState,
    getVideoId,
    getThumbnailUrl,
} from '../../src/components/exercises';

const mockColors: any = {
    primary: '#22c55e',
    background: '#0a0f0d',
    surface: '#121a16',
    border: '#1f2e26',
    text: '#ffffff',
    textSecondary: '#9ca3af',
    textOnPrimary: '#ffffff',
    statusInfo: '#38bdf8',
    statusWarning: '#f59e0b',
    inputBackground: '#16221c',
};

describe('Exercise Sub-components (PF-267)', () => {
    describe('ExerciseHeader', () => {
        it('renders title and handles back button press in standard mode', async () => {
            const mockBack = jest.fn();
            const { getByText, getByTestId } = await render(
                <ExerciseHeader
                    isSelectionMode={false}
                    selectedCount={0}
                    saving={false}
                    colors={mockColors}
                    onBack={mockBack}
                    onClearSelection={jest.fn()}
                    onConfirmSelection={jest.fn()}
                    onOpenCreateModal={jest.fn()}
                />
            );

            expect(getByText('Biblioteca de Ejercicios')).toBeTruthy();
            const backBtn = getByTestId('exercise-library-back-button');
            fireEvent.press(backBtn);
            expect(mockBack).toHaveBeenCalled();
        });

        it('renders selected count and handles confirm button in selection mode', async () => {
            const mockConfirm = jest.fn();
            const { getByText, getByTestId } = await render(
                <ExerciseHeader
                    isSelectionMode={true}
                    selectedCount={3}
                    saving={false}
                    colors={mockColors}
                    onBack={jest.fn()}
                    onClearSelection={jest.fn()}
                    onConfirmSelection={mockConfirm}
                    onOpenCreateModal={jest.fn()}
                />
            );

            expect(getByText('3 Seleccionados')).toBeTruthy();
            const confirmBtn = getByTestId('confirm-exercise-selection-button');
            fireEvent.press(confirmBtn);
            expect(mockConfirm).toHaveBeenCalled();
        });
    });

    describe('ExerciseSearchBar', () => {
        it('renders search input and triggers clear search button', async () => {
            const mockClear = jest.fn();
            const mockSetQuery = jest.fn();
            const { getByPlaceholderText } = await render(
                <ExerciseSearchBar
                    searchQuery="Press"
                    setSearchQuery={mockSetQuery}
                    isSearchFocused={true}
                    setIsSearchFocused={jest.fn()}
                    onClearSearch={mockClear}
                    colors={mockColors}
                />
            );

            const input = getByPlaceholderText('Buscar ejercicio...');
            expect(input.props.value).toBe('Press');
        });
    });

    describe('ExerciseFilterSection', () => {
        it('renders filter toggle and filters when visible', async () => {
            const mockSetFilter = jest.fn();
            const filterRows = [
                {
                    key: 'primaryMuscle' as any,
                    label: 'Músculo Principal',
                    options: ['Pecho', 'Espalda'],
                },
            ];

            const { getByText } = await render(
                <ExerciseFilterSection
                    showFilters={true}
                    setShowFilters={jest.fn()}
                    hasActiveFilters={false}
                    filterRows={filterRows}
                    filters={{}}
                    setFilter={mockSetFilter}
                    clearFilter={jest.fn()}
                    clearAllFilters={jest.fn()}
                    colors={mockColors}
                />
            );

            expect(getByText('Ocultar filtros')).toBeTruthy();
            expect(getByText('Músculo Principal')).toBeTruthy();
            const optionBtn = getByText('Pecho');
            fireEvent.press(optionBtn);
            expect(mockSetFilter).toHaveBeenCalledWith('primaryMuscle', 'Pecho');
        });
    });

    describe('ExerciseListItem and video helpers', () => {
        it('extracts youtube video id and generates thumbnail url correctly', () => {
            const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
            const videoId = getVideoId(url);
            expect(videoId).toBe('dQw4w9WgXcQ');
            expect(getThumbnailUrl(videoId)).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg');
            expect(getVideoId(undefined)).toBeNull();
            expect(getThumbnailUrl(null)).toBeNull();
        });

        it('renders exercise card with testID and responds to select', async () => {
            const mockSelect = jest.fn();
            const mockNavigation = { navigate: jest.fn() };
            const exercise = {
                id: 'ex-bench-1',
                titulo: 'Press de Banca Plano',
                musculos_primarios: 'Pecho',
                url_video: 'https://youtu.be/dQw4w9WgXcQ',
            };

            const { getByTestId, getByText } = await render(
                <ExerciseListItem
                    item={exercise}
                    isSelected={false}
                    onSelect={mockSelect}
                    onThumbnailPress={jest.fn()}
                    colors={mockColors}
                    navigation={mockNavigation}
                />
            );

            expect(getByText('Press de Banca Plano')).toBeTruthy();
            const card = getByTestId('exercise-item-ex-bench-1');
            fireEvent.press(card);
            expect(mockSelect).toHaveBeenCalled();
        });
    });

    describe('ScrollToTopFab', () => {
        it('renders fab button and calls onScrollToTop', async () => {
            const mockScroll = jest.fn();
            const opacity = new Animated.Value(1);
            const { toJSON } = await render(
                <ScrollToTopFab
                    visible={true}
                    opacity={opacity}
                    colors={mockColors}
                    onScrollToTop={mockScroll}
                />
            );

            expect(toJSON()).toBeTruthy();
        });
    });

    describe('ExerciseVideoModal and ExerciseEmptyState', () => {
        it('renders video modal when visible and handles close', async () => {
            const mockClose = jest.fn();
            const { getByText } = await render(
                <ExerciseVideoModal visible={true} videoId="dQw4w9WgXcQ" onClose={mockClose} />
            );

            expect(getByText('Ver en YouTube')).toBeTruthy();
        });

        it('renders empty state text based on active filters', async () => {
            const { getByText } = await render(
                <ExerciseEmptyState hasActiveFilters={true} searchQuery="" colors={mockColors} />
            );

            expect(getByText(/No se encontraron ejercicios con los filtros actuales/)).toBeTruthy();
        });
    });
});
