import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PhysicalProgressScreen from '../../src/screens/PhysicalProgressScreen';
import { useProgressController } from '../../src/controllers/useProgressController';
import { UserService } from '../../src/services/UserService';
import { AuthContext } from '../../src/context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

jest.mock('../../src/controllers/useProgressController');
jest.mock('../../src/services/UserService', () => ({
  UserService: {
    getWeightHistory: jest.fn().mockResolvedValue({ data: [], error: null }),
    getProgressPhotos: jest.fn().mockResolvedValue({ data: [], error: null }),
    getUserMetrics: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));

const mockUseProgressController = useProgressController as jest.MockedFunction<typeof useProgressController>;

describe('PhysicalProgressScreen Component (RNTL)', () => {
  const mockNavigation = { navigate: jest.fn() } as any;
  const mockUploadPhoto = jest.fn().mockResolvedValue(true);
  const mockDeletePhotos = jest.fn().mockResolvedValue(true);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseProgressController.mockReturnValue({
      dailyStats: null,
      weeklyStats: null,
      monthlyStats: null,
      progressPhotos: [
        {
          id: 'p1',
          url_foto: 'https://example.com/photo1.jpg',
          fecha_foto: '2026-08-01',
          created_at: '2026-08-01T10:00:00Z',
          comentario: 'Front view',
        },
      ],
      loading: false,
      fetchDailyProgress: jest.fn(),
      fetchWeeklyProgress: jest.fn(),
      fetchMonthlyProgress: jest.fn(),
      fetchPhotos: jest.fn(),
      uploadPhoto: mockUploadPhoto,
      deletePhotos: mockDeletePhotos,
      updatePhoto: jest.fn(),
    } as any);

    (UserService.getWeightHistory as jest.Mock).mockResolvedValue({
      data: [{ id: 'w1', peso: 75, created_at: '2026-01-01' }],
      error: null,
    });
  });

  it('renders physical progress screen title and tabs', async () => {
    const { findByText } = await render(
      <AuthContext.Provider value={{ user: { id: 'u1' } } as any}>
        <PhysicalProgressScreen navigation={mockNavigation} />
      </AuthContext.Provider>
    );

    expect(await findByText('Cambio Físico')).toBeTruthy();
    expect(await findByText('Evolución de Peso')).toBeTruthy();
    expect(await findByText('Añadir Foto')).toBeTruthy();
  });

  it('renders progress photo card and opens photo source picker modal', async () => {
    const { findByText, getByText } = await render(
      <AuthContext.Provider value={{ user: { id: 'u1' } } as any}>
        <PhysicalProgressScreen navigation={mockNavigation} />
      </AuthContext.Provider>
    );

    expect(await findByText('Agosto 2026')).toBeTruthy();

    const addPhotoBtn = getByText('Añadir Foto');
    fireEvent.press(addPhotoBtn);

    expect(await findByText('Elige de dónde quieres obtener la foto')).toBeTruthy();
    expect(await findByText('Galería')).toBeTruthy();
    expect(await findByText('Cámara')).toBeTruthy();
  });

  it('handles gallery photo selection and upload confirmation modal', async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///local/photo.jpg' }],
    });

    const { getByText, findByText } = await render(
      <AuthContext.Provider value={{ user: { id: 'u1' } } as any}>
        <PhysicalProgressScreen navigation={mockNavigation} />
      </AuthContext.Provider>
    );

    fireEvent.press(getByText('Añadir Foto'));
    const galleryBtn = await findByText('Galería');
    fireEvent.press(galleryBtn);

    const savePhotoBtn = await findByText('Guardar');
    fireEvent.press(savePhotoBtn);

    await waitFor(() => {
      expect(mockUploadPhoto).toHaveBeenCalledWith('file:///local/photo.jpg', expect.any(Date), '');
    });
  });
});
