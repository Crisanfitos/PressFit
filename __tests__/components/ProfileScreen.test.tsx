import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import ProfileScreen from '../../src/screens/ProfileScreen';
import { AuthContext } from '../../src/context/AuthContext';
import { useProfileController } from '../../src/controllers/useProfileController';

jest.mock('../../src/controllers/useProfileController');

const mockUseProfileController = useProfileController as jest.MockedFunction<typeof useProfileController>;

describe('ProfileScreen Component (RNTL)', () => {
    const mockNavigation = { navigate: jest.fn() } as any;
    const mockSignOut = jest.fn();

    const mockAuthContextValue = {
        signOut: mockSignOut,
        user: {
            id: 'user-123',
            email: 'atleta@pressfit.app',
            user_metadata: { full_name: 'Atleta PressFit' },
        },
        signInWithEmail: jest.fn(),
        signInWithGoogle: jest.fn(),
        signUpWithEmail: jest.fn(),
        session: null,
        loading: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseProfileController.mockReturnValue({
            metrics: { peso: 80, altura: 180, imc: 24.69, grasa_corporal: 15 },
            progressPhotos: [{ id: 'p1', url_foto: 'http://photo.com/1' }],
            loading: false,
            loadingPhotos: false,
            uploadingPhoto: false,
            updateProfilePhoto: jest.fn(),
            updateMetrics: jest.fn(),
        } as any);
    });

    const renderProfileScreen = async () => {
        return render(
            <AuthContext.Provider value={mockAuthContextValue}>
                <ProfileScreen navigation={mockNavigation} />
            </AuthContext.Provider>
        );
    };

    it('renders user info, physical metrics and progress photo', async () => {
        const { getByText } = await renderProfileScreen();

        expect(getByText('Perfil')).toBeTruthy();
        expect(getByText('Atleta PressFit')).toBeTruthy();
        expect(getByText('atleta@pressfit.app')).toBeTruthy();
        expect(getByText('80 kg')).toBeTruthy();
        expect(getByText('180 cm')).toBeTruthy();
        expect(getByText('24.7')).toBeTruthy();
    });

    it('opens EditProfileModal when clicking edit icon button', async () => {
        const { getByTestId, findByText } = await renderProfileScreen();

        fireEvent.press(getByTestId('icon-edit'));
        expect(await findByText('Editar Datos Físicos')).toBeTruthy();
    });

    it('opens LogoutConfirmationModal and handles sign out confirmation', async () => {
        mockSignOut.mockResolvedValue(undefined);
        const { getByText, findByText } = await renderProfileScreen();

        fireEvent.press(getByText('Cerrar Sesión'));
        expect(await findByText(/¿Estás seguro de que deseas cerrar sesión/)).toBeTruthy();
    });

    it('navigates to PhysicalProgress screen when Ver Cambio Físico is pressed', async () => {
        const { getByText } = await renderProfileScreen();

        fireEvent.press(getByText('Ver Cambio Físico'));
        expect(mockNavigation.navigate).toHaveBeenCalledWith('PhysicalProgress');
    });
});
