import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { View, Text, TouchableOpacity } from 'react-native';
import i18n from '../../src/i18n';
import { PhotoGrid } from '../../src/components/progress/PhotoGrid';
import WeightChart from '../../src/components/WeightChart';
import { es, enUS } from 'date-fns/locale';

jest.mock('react-native-gifted-charts', () => {
    const mockReact = require('react');
    const { View: mockView, Text: mockText, TouchableOpacity: mockTouch } = require('react-native');
    return {
        LineChart: (props: any) => mockReact.createElement(
            mockView,
            { testID: 'line-chart-mock' },
            ...(props.data || []).map((pt: any, idx: number) =>
                mockReact.createElement(
                    mockTouch,
                    {
                        key: pt.id || idx,
                        testID: `weight-chart-point-${pt.id || idx}`,
                        onPress: pt.onPress,
                    },
                    mockReact.createElement(mockText, null, `${pt.value} kg`)
                )
            )
        ),
    };
});

describe('PF-410 PhysicalProgress Translations and Date Formatting', () => {
    const mockColors = {
        primary: '#238636',
        surface: '#161b22',
        border: '#30363d',
        text: '#ffffff',
        textSecondary: '#888888',
        background: '#0d1117',
    } as any;

    afterEach(async () => {
        await act(async () => {
            await i18n.changeLanguage('es');
        });
    });

    it('formats photo dates correctly without hardcoded "de" in English and Spanish (PhotoGrid)', async () => {
        const mockPhotos = [
            {
                id: 'p1',
                url_foto: 'https://example.com/p1.jpg',
                created_at: '2026-03-01T10:00:00Z',
            },
        ];

        // En español: debe contener "1 de marzo" o similar con "de"
        await act(async () => {
            await i18n.changeLanguage('es');
        });
        const { getByText, rerender } = await render(
            <PhotoGrid
                photos={mockPhotos}
                selectedIds={new Set()}
                onOpenViewer={jest.fn()}
                onLongPress={jest.fn()}
                colors={mockColors}
                locale={es}
            />
        );

        expect(getByText(/1 de marzo/i)).toBeTruthy();

        // En inglés: debe contener "March 1" sin "de"
        await act(async () => {
            await i18n.changeLanguage('en');
        });
        await rerender(
            <PhotoGrid
                photos={mockPhotos}
                selectedIds={new Set()}
                onOpenViewer={jest.fn()}
                onLongPress={jest.fn()}
                colors={mockColors}
                locale={enUS}
            />
        );

        expect(getByText('March 1')).toBeTruthy();
    });

    it('translates WeightChart titles, empty state and trend labels in English and Spanish', async () => {
        // En español
        await act(async () => {
            await i18n.changeLanguage('es');
        });

        const { getByText, rerender, getByTestId } = await render(
            <WeightChart data={[]} colors={mockColors} />
        );

        expect(getByText('Evolución de Peso')).toBeTruthy();
        expect(getByText('Aún no hay datos de peso registrados')).toBeTruthy();

        // En inglés
        await act(async () => {
            await i18n.changeLanguage('en');
        });

        await rerender(<WeightChart data={[]} colors={mockColors} />);

        expect(getByText('Weight Evolution')).toBeTruthy();
        expect(getByText('No weight data recorded yet')).toBeTruthy();

        // Con datos: verificar tendencias en inglés
        const mockData = [
            { id: 'w1', peso: 70, created_at: '2026-01-01T10:00:00Z' },
            { id: 'w2', peso: 73, created_at: '2026-01-15T10:00:00Z' },
        ];

        await rerender(<WeightChart data={mockData} colors={mockColors} />);

        expect(getByText('+3.0 kg since first record')).toBeTruthy();
        expect(getByText('+3.0 kg since last record')).toBeTruthy();

        // Seleccionar punto para verificar tooltip
        const point = getByTestId('weight-chart-point-w1');
        await act(async () => {
            fireEvent.press(point);
        });

        expect(getByText(/Point 1 of 2/)).toBeTruthy();
    });
});
