import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProfileScreen from '../../src/screens/ProfileScreen';
import { AuthContext } from '../../src/context/AuthContext';
import { useProfileController } from '../../src/controllers/useProfileController';

jest.mock('../../src/controllers/useProfileController');

const mockUseProfileController = useProfileController as jest.MockedFunction<typeof useProfileController>;

describe('ProfileScreen Component (RNTL)', () => {
    const mockNavigation = { navigate: jest.fn() } as any;
    const mockSignOut = jest.fn();

    const mockUser = {
        id: 'user-123',
        email: 'atleta@pressfit.app',
        user_metadata: { full_name: 'Atleta PressFit' },
    } as any;

    const mockAuthContextValue = {
        signInWithEmail: jest.fn(),
        signInWithGoogle: jest.fn(),
        signUpWithEmail: jest.fn(),
        signOut: mockSignOut,
        user: mockUser,
        session: null,
        loading: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockUseProfileController.mockReturnValue({
            metrics: { peso: 78, altura: 180, imc: 24.1, grasa_corporal: 15 },
            progressPhotos: [],
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

    it('renders profile title, user info, and physical metrics', async () => {
        const { getByText } = await renderProfileScreen();

        expect(getByText('Perfil')).toBeTruthy();
        expect(getByText('Atleta PressFit')).toBeTruthy();
        expect(getByText('atleta@pressfit.app')).toBeTruthy();
        expect(getByText('78 kg')).toBeTruthy();
        expect(getByText('180 cm')).toBeTruthy();
    });

    it('navigates to PhysicalProgress when Ver Cambio Físico button is pressed', async () => {
        const { getByText } = await renderProfileScreen();

        fireEvent.press(getByText('Ver Cambio Físico'));
        expect(mockNavigation.navigate).toHaveBeenCalledWith('PhysicalProgress');
    });

    it('opens Logout modal when clicking Cerrar Sesión button', async () => {
        const { getByText, findByText } = await renderProfileScreen();

        fireEvent.press(getByText('Cerrar Sesión'));

        expect(await findByText('¿Estás seguro de que deseas cerrar sesión en tu cuenta?')).toBeTruthy();
    });
});
