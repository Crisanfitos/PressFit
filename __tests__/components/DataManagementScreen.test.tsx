import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { DataManagementScreen } from '../../src/screens/settings/DataManagementScreen';
import { ExportService } from '../../src/services/export/ExportService';
import { ImportService } from '../../src/services/import/ImportService';
import { AlertProvider } from '../../src/context/AlertContext';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { AuthContext } from '../../src/context/AuthContext';

// Mocks
jest.mock('../../src/services/export/ExportService', () => ({
    ExportService: {
        exportWorkoutHistoryToCSV: jest.fn(),
        exportBackupToJSON: jest.fn(),
    },
}));

jest.mock('../../src/services/import/ImportService', () => ({
    ImportService: {
        pickBackupFile: jest.fn(),
        importBackup: jest.fn(),
        purgeLocalCache: jest.fn(),
    },
}));

describe('DataManagementScreen Component (PF-326)', () => {
    const mockNavigation = {
        goBack: jest.fn(),
        navigate: jest.fn(),
    };

    const mockAuthContext = {
        user: { id: 'test-user-123' },
        session: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
    };

    const renderScreen = async () =>
        await render(
            <AuthContext.Provider value={mockAuthContext as any}>
                <ThemeProvider>
                    <AlertProvider>
                        <DataManagementScreen navigation={mockNavigation} />
                    </AlertProvider>
                </ThemeProvider>
            </AuthContext.Provider>
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders header, title, and all action buttons', async () => {
        const { getByTestId, getByText } = await renderScreen();

        expect(getByTestId('data-management-screen')).toBeTruthy();
        expect(getByTestId('back-button')).toBeTruthy();
        expect(getByTestId('export-csv-button')).toBeTruthy();
        expect(getByTestId('export-json-button')).toBeTruthy();
        expect(getByTestId('import-json-button')).toBeTruthy();
        expect(getByTestId('purge-cache-button')).toBeTruthy();

        expect(getByText('Gestión de Datos')).toBeTruthy();
    });

    it('navigates back when back button is pressed', async () => {
        const { getByTestId } = await renderScreen();
        fireEvent.press(getByTestId('back-button'));
        expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
    });

    it('triggers ExportService.exportWorkoutHistoryToCSV when CSV button is pressed', async () => {
        (ExportService.exportWorkoutHistoryToCSV as jest.Mock).mockResolvedValue({
            data: { fileUri: 'mock.csv', rowCount: 10, shared: true },
            error: null,
        });

        const { getByTestId } = await renderScreen();
        fireEvent.press(getByTestId('export-csv-button'));

        await waitFor(() => {
            expect(ExportService.exportWorkoutHistoryToCSV).toHaveBeenCalledWith('test-user-123');
        });
    });

    it('triggers ExportService.exportBackupToJSON when JSON export button is pressed', async () => {
        (ExportService.exportBackupToJSON as jest.Mock).mockResolvedValue({
            data: { fileUri: 'mock.json', shared: true },
            error: null,
        });

        const { getByTestId } = await renderScreen();
        fireEvent.press(getByTestId('export-json-button'));

        await waitFor(() => {
            expect(ExportService.exportBackupToJSON).toHaveBeenCalledWith('test-user-123');
        });
    });

    it('prompts file picker and confirms restore when import button is pressed', async () => {
        (ImportService.pickBackupFile as jest.Mock).mockResolvedValue({
            data: { content: '{"schemaVersion":1}', name: 'backup.json' },
            error: null,
        });

        const { getByTestId, findByText } = await renderScreen();
        fireEvent.press(getByTestId('import-json-button'));

        await waitFor(() => {
            expect(ImportService.pickBackupFile).toHaveBeenCalled();
        });

        // The confirmation alert should appear
        const confirmBtn = await findByText('Restaurar');
        expect(confirmBtn).toBeTruthy();
    });

    it('shows confirmation modal before purging local cache', async () => {
        const { getByTestId, findByText } = await renderScreen();
        fireEvent.press(getByTestId('purge-cache-button'));

        const purgeConfirmBtn = await findByText('Purgar Caché');
        expect(purgeConfirmBtn).toBeTruthy();
    });
});
