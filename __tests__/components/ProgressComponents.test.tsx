import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { es } from 'date-fns/locale';
import {
    PhysicalProgressHeader,
    PhotoGrid,
    PhysicalProgressEmptyState,
    PhysicalProgressFab,
    PhotoSourceModal,
    PhotoUploadModal,
    PhotoViewerModal,
    PhotoEditModal,
    ProgressCustomAlertModal,
} from '../../src/components/progress';

jest.mock('react-native-image-zoom-viewer', () => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return (props: any) => (
        <View testID="mock-image-viewer">
            <Text>ImageViewer Mock</Text>
        </View>
    );
});

const mockColors: any = {
    primary: '#22c55e',
    background: '#0a0f0d',
    surface: '#121a16',
    border: '#1f2e26',
    text: '#ffffff',
    textSecondary: '#9ca3af',
    inputBackground: '#16221c',
};

describe('PhysicalProgress Sub-components (PF-268)', () => {
    describe('PhysicalProgressHeader', () => {
        it('renders title and back button in standard mode', async () => {
            const mockBack = jest.fn();
            const { findByText, getByTestId } = await render(
                <PhysicalProgressHeader
                    isSelectionMode={false}
                    selectedCount={0}
                    title="Cambio Físico"
                    colors={mockColors}
                    onBack={mockBack}
                    onClearSelection={jest.fn()}
                    onDeleteSelected={jest.fn()}
                />
            );

            expect(await findByText('Cambio Físico')).toBeTruthy();
            const backBtn = getByTestId('physical-progress-back-button');
            fireEvent.press(backBtn);
            expect(mockBack).toHaveBeenCalled();
        });

        it('renders selected count and delete button in selection mode', async () => {
            const mockDelete = jest.fn();
            const mockClear = jest.fn();
            const { findByText } = await render(
                <PhysicalProgressHeader
                    isSelectionMode={true}
                    selectedCount={2}
                    title="Cambio Físico"
                    colors={mockColors}
                    onBack={jest.fn()}
                    onClearSelection={mockClear}
                    onDeleteSelected={mockDelete}
                />
            );

            expect(await findByText('2 seleccionadas')).toBeTruthy();
        });
    });

    describe('PhotoGrid', () => {
        it('renders grouped photos by month and responds to click', async () => {
            const mockOpenViewer = jest.fn();
            const mockLongPress = jest.fn();
            const photos = [
                {
                    id: 'photo-1',
                    url_foto: 'https://example.com/photo1.jpg',
                    created_at: '2026-08-15T10:00:00.000Z',
                },
            ];

            const { findByText } = await render(
                <PhotoGrid
                    photos={photos}
                    selectedIds={new Set(['photo-1'])}
                    onOpenViewer={mockOpenViewer}
                    onLongPress={mockLongPress}
                    colors={mockColors}
                    locale={es}
                />
            );

            expect(await findByText(/Agosto 2026/i)).toBeTruthy();
        });
    });

    describe('PhysicalProgressEmptyState & PhysicalProgressFab', () => {
        it('renders empty state message', async () => {
            const { findByText } = await render(
                <PhysicalProgressEmptyState message="No hay fotos de progreso aún" colors={mockColors} />
            );

            expect(await findByText('No hay fotos de progreso aún')).toBeTruthy();
        });

        it('renders fab button and responds to press', async () => {
            const mockPress = jest.fn();
            const { findByText } = await render(
                <PhysicalProgressFab colors={mockColors} label="Añadir Foto" onPress={mockPress} />
            );

            const btn = await findByText('Añadir Foto');
            fireEvent.press(btn);
            expect(mockPress).toHaveBeenCalled();
        });
    });

    describe('PhotoSourceModal & PhotoUploadModal', () => {
        it('renders source modal with camera and gallery options', async () => {
            const mockCamera = jest.fn();
            const mockGallery = jest.fn();
            const { findByText } = await render(
                <PhotoSourceModal
                    visible={true}
                    colors={mockColors}
                    t={(_key, fallback) => fallback}
                    onClose={jest.fn()}
                    onPickFromCamera={mockCamera}
                    onPickFromGallery={mockGallery}
                />
            );

            expect(await findByText('Cámara')).toBeTruthy();
            expect(await findByText('Galería')).toBeTruthy();
            fireEvent.press(await findByText('Cámara'));
            expect(mockCamera).toHaveBeenCalled();
            fireEvent.press(await findByText('Galería'));
            expect(mockGallery).toHaveBeenCalled();
        });

        it('renders upload modal with comment input and buttons', async () => {
            const mockUpload = jest.fn();
            const mockSetComment = jest.fn();
            const { findByText, getByPlaceholderText } = await render(
                <PhotoUploadModal
                    visible={true}
                    imageUri="https://example.com/test.jpg"
                    selectedDate={new Date('2026-08-20T12:00:00.000Z')}
                    setSelectedDate={jest.fn()}
                    showDatePicker={false}
                    setShowDatePicker={jest.fn()}
                    comment="Test upload"
                    setComment={mockSetComment}
                    uploading={false}
                    colors={mockColors}
                    themeMode="dark"
                    onClose={jest.fn()}
                    onConfirmUpload={mockUpload}
                />
            );

            expect(await findByText('Nueva Foto de Progreso')).toBeTruthy();
            const input = getByPlaceholderText('Añade un comentario...');
            expect(input.props.value).toBe('Test upload');
            fireEvent.press(await findByText('Guardar'));
            expect(mockUpload).toHaveBeenCalled();
        });
    });

    describe('PhotoViewerModal, PhotoEditModal & ProgressCustomAlertModal', () => {
        it('renders viewer modal with date and counter', async () => {
            const mockEdit = jest.fn();
            const photos = [
                {
                    id: 'p-1',
                    url_foto: 'https://example.com/1.jpg',
                    created_at: '2026-08-10T10:00:00.000Z',
                    comentario: 'Foto 1',
                },
            ];

            const { findByText } = await render(
                <PhotoViewerModal
                    visible={true}
                    images={[{ url: 'https://example.com/1.jpg' }]}
                    currentIndex={0}
                    photos={photos}
                    onIndexChange={jest.fn()}
                    onClose={jest.fn()}
                    onEditPhoto={mockEdit}
                />
            );

            expect(await findByText('Foto 1')).toBeTruthy();
            expect(await findByText('1 / 1')).toBeTruthy();
        });

        it('renders edit modal with save button', async () => {
            const mockSave = jest.fn();
            const { findByText } = await render(
                <PhotoEditModal
                    visible={true}
                    editDate={new Date()}
                    setEditDate={jest.fn()}
                    editComment="Edit test"
                    setEditComment={jest.fn()}
                    saving={false}
                    colors={mockColors}
                    onClose={jest.fn()}
                    onSave={mockSave}
                />
            );

            expect(await findByText('Editar Detalles de Foto')).toBeTruthy();
            fireEvent.press(await findByText('Guardar'));
            expect(mockSave).toHaveBeenCalled();
        });

        it('renders custom alert modal with title and message', async () => {
            const mockConfirm = jest.fn();
            const alertData: any = {
                visible: true,
                type: 'success',
                title: 'Alerta Éxito',
                message: 'Todo ha salido bien',
                onConfirm: mockConfirm,
            };

            const { findByText } = await render(
                <ProgressCustomAlertModal alert={alertData} colors={mockColors} onClose={jest.fn()} />
            );

            expect(await findByText('Alerta Éxito')).toBeTruthy();
            expect(await findByText('Todo ha salido bien')).toBeTruthy();
        });
    });
});
