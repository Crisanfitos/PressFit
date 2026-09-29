import { ImportService } from '../../../../src/services/import/ImportService';
import { supabase } from '../../../../src/lib/supabase';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mocks
jest.mock('expo-document-picker', () => ({
    getDocumentAsync: jest.fn(),
}));

jest.mock('expo-file-system/legacy', () => ({
    readAsStringAsync: jest.fn(),
}));

jest.mock('../../../../src/lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
    },
}));

describe('ImportService (PF-326)', () => {
    const targetUserId = 'target-user-456';

    const validBackupData = {
        schemaVersion: 1,
        appVersion: '1.11.0',
        exportedAt: '2026-09-29T12:00:00Z',
        userId: 'source-user-123',
        data: {
            customExercises: [
                {
                    id: 'old-ex-1',
                    titulo: 'Press Inclinado Custom',
                    grupo_muscular: 'pecho',
                    es_custom: true,
                },
            ],
            routines: [
                {
                    id: 'r-1',
                    nombre: 'Rutina Fuerza',
                    es_plantilla: true,
                    rutinas_diarias: [
                        {
                            nombre_dia: 'Día A',
                            ejercicios_programados: [
                                {
                                    ejercicio_id: 'old-ex-1',
                                    orden_ejecucion: 1,
                                    tipo_peso: 'total',
                                },
                            ],
                        },
                    ],
                },
            ],
            workouts: [
                {
                    id: 'w-1',
                    nombre_dia: 'Día A',
                    fecha_dia: '2026-09-25',
                    ejercicios_programados: [
                        {
                            ejercicio_id: 'old-ex-1',
                            orden_ejecucion: 1,
                            series: [
                                {
                                    numero_serie: 1,
                                    peso_utilizado: 90,
                                    repeticiones: 5,
                                    rpe: 8,
                                    tipo_serie: 'normal',
                                },
                            ],
                        },
                    ],
                },
            ],
            weightHistory: [
                {
                    peso: 80.5,
                    created_at: '2026-09-20T10:00:00Z',
                },
            ],
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('pickBackupFile', () => {
        it('returns file content and name when document is picked successfully', async () => {
            (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
                canceled: false,
                assets: [{ uri: 'file:///mock/backup.json', name: 'backup.json' }],
            });

            (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
                JSON.stringify(validBackupData)
            );

            const result = await ImportService.pickBackupFile();

            expect(result.error).toBeNull();
            expect(result.data).toBeDefined();
            expect(result.data?.name).toBe('backup.json');
            expect(result.data?.content).toContain('source-user-123');
        });

        it('returns null data without error when user cancels file picker', async () => {
            (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
                canceled: true,
            });

            const result = await ImportService.pickBackupFile();

            expect(result.error).toBeNull();
            expect(result.data).toBeNull();
        });
    });

    describe('importBackup', () => {
        it('fails gracefully when backup schema validation fails', async () => {
            const invalidJson = JSON.stringify({ schemaVersion: 99 });
            const result = await ImportService.importBackup(invalidJson, targetUserId);

            expect(result.data).toBeNull();
            expect(result.error).toBeDefined();
            expect((result.error as Error).message).toContain('schemaVersion');
        });

        it('imports custom exercises, routines, workouts, and weight history idempotently', async () => {
            // Mock Supabase interactions
            (supabase.from as jest.Mock).mockImplementation((table: string) => {
                if (table === 'ejercicios') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        or: jest.fn().mockResolvedValue({ data: [], error: null }),
                        insert: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: { id: 'new-ex-id-999' },
                            error: null,
                        }),
                    };
                }
                if (table === 'rutinas_semanales') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        limit: jest.fn().mockReturnThis(),
                        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                        insert: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: { id: 'new-routine-id-888' },
                            error: null,
                        }),
                    };
                }
                if (table === 'rutinas_diarias') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                        insert: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: { id: 'new-day-id-777' },
                            error: null,
                        }),
                    };
                }
                if (table === 'ejercicios_programados') {
                    return {
                        insert: jest.fn().mockReturnThis(),
                        select: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: { id: 'new-ep-id-666' },
                            error: null,
                        }),
                    };
                }
                if (table === 'series') {
                    return {
                        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
                    };
                }
                if (table === 'historial_peso') {
                    return {
                        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
                    };
                }

                return {
                    select: jest.fn().mockReturnThis(),
                    insert: jest.fn().mockReturnThis(),
                };
            });

            const result = await ImportService.importBackup(validBackupData, targetUserId);

            expect(result.error).toBeNull();
            expect(result.data).toBeDefined();
            expect(result.data?.exercisesImported).toBe(1);
            expect(result.data?.routinesImported).toBe(1);
            expect(result.data?.workoutsImported).toBe(1);
            expect(result.data?.weightEntriesImported).toBe(1);
        });

        it('skips existing routines and exercises without throwing errors', async () => {
            // Mock existing exercise and existing routine
            (supabase.from as jest.Mock).mockImplementation((table: string) => {
                if (table === 'ejercicios') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        or: jest.fn().mockResolvedValue({
                            data: [{ id: 'existing-ex-1', titulo: 'Press Inclinado Custom' }],
                            error: null,
                        }),
                    };
                }
                if (table === 'rutinas_semanales') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        limit: jest.fn().mockReturnThis(),
                        maybeSingle: jest.fn().mockResolvedValue({
                            data: { id: 'existing-r-1' },
                            error: null,
                        }),
                    };
                }
                if (table === 'rutinas_diarias') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        maybeSingle: jest.fn().mockResolvedValue({
                            data: { id: 'existing-w-1' },
                            error: null,
                        }),
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    insert: jest.fn().mockResolvedValue({ data: null, error: null }),
                };
            });

            const result = await ImportService.importBackup(validBackupData, targetUserId);

            expect(result.error).toBeNull();
            expect(result.data).toBeDefined();
            expect(result.data?.exercisesImported).toBe(0);
            expect(result.data?.routinesImported).toBe(0);
            expect(result.data?.workoutsImported).toBe(0);
            expect(result.data?.skippedCount).toBeGreaterThan(0);
        });
    });

    describe('purgeLocalCache', () => {
        it('clears matching cache keys from AsyncStorage', async () => {
            const mockKeys = [
                'pressfit_theme',
                'pressfit_cache_exercises',
                'cached_workouts_2026',
                'user_token', // should not be purged
            ];

            (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys);
            (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

            const result = await ImportService.purgeLocalCache();

            expect(result.error).toBeNull();
            expect(result.data?.cleared).toBe(true);
            expect(result.data?.keysRemoved).toBe(3);
            expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
                'pressfit_theme',
                'pressfit_cache_exercises',
                'cached_workouts_2026',
            ]);
        });
    });
});
