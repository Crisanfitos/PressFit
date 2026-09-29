import { ExportService } from '../../../../src/services/export/ExportService';
import { supabase } from '../../../../src/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// Mock FileSystem and Sharing
jest.mock('expo-file-system/legacy', () => ({
    cacheDirectory: 'file:///mock-cache/',
    documentDirectory: 'file:///mock-documents/',
    EncodingType: {
        UTF8: 'utf8',
        Base64: 'base64',
    },
    writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-sharing', () => ({
    isAvailableAsync: jest.fn().mockResolvedValue(true),
    shareAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock Supabase
jest.mock('../../../../src/lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
    },
}));

describe('ExportService (PF-325)', () => {
    const mockUserId = 'user-123';

    beforeEach(() => {
        jest.clearAllMocks();
        (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    });

    describe('fetchWorkoutHistoryRows', () => {
        it('queries rutinas_diarias and flattens scheduled exercises and series into export rows', async () => {
            const mockDbData = [
                {
                    id: 'day-1',
                    nombre_dia: 'Torso A',
                    fecha_dia: '2026-09-08',
                    rutina_semanal: { usuario_id: mockUserId },
                    ejercicios_programados: [
                        {
                            id: 'prog-1',
                            orden_ejecucion: 1,
                            ejercicio: { nombre: 'Press Banca Plano', titulo: 'Press Banca' },
                            series: [
                                {
                                    id: 'set-1',
                                    numero_serie: 1,
                                    tipo_serie: 'calentamiento',
                                    peso_utilizado: 50,
                                    repeticiones: 12,
                                    rpe: null,
                                },
                                {
                                    id: 'set-2',
                                    numero_serie: 2,
                                    tipo_serie: 'normal',
                                    peso_utilizado: 80,
                                    repeticiones: 8,
                                    rpe: 8.5,
                                },
                            ],
                        },
                    ],
                },
            ];

            const mockQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                not: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: mockDbData, error: null }),
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

            const result = await ExportService.fetchWorkoutHistoryRows(mockUserId);

            expect(result.error).toBeNull();
            expect(result.data).toHaveLength(2);
            expect(result.data![0]).toEqual({
                fecha: '2026-09-08',
                rutina: 'Torso A',
                ejercicio: 'Press Banca',
                serie: 1,
                tipo_serie: 'calentamiento',
                peso: 50,
                repeticiones: 12,
                rpe: null,
            });
            expect(result.data![1]).toEqual({
                fecha: '2026-09-08',
                rutina: 'Torso A',
                ejercicio: 'Press Banca',
                serie: 2,
                tipo_serie: 'normal',
                peso: 80,
                repeticiones: 8,
                rpe: 8.5,
            });
        });

        it('returns error when Supabase query fails', async () => {
            const mockQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                not: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

            const result = await ExportService.fetchWorkoutHistoryRows(mockUserId);

            expect(result.data).toBeNull();
            expect(result.error).toEqual({ message: 'Database error' });
        });
    });

    describe('exportWorkoutHistoryToCSV', () => {
        it('exports history to CSV, writes file, and triggers native share dialog', async () => {
            const mockRows = [
                {
                    fecha: '2026-09-08',
                    rutina: 'Torso A',
                    ejercicio: 'Press Banca',
                    serie: 1,
                    tipo_serie: 'normal',
                    peso: 80,
                    repeticiones: 10,
                    rpe: 8,
                },
            ];

            jest.spyOn(ExportService, 'fetchWorkoutHistoryRows').mockResolvedValue({
                data: mockRows,
                error: null,
            });

            const result = await ExportService.exportWorkoutHistoryToCSV(mockUserId);

            expect(result.error).toBeNull();
            expect(result.data).toBeDefined();
            expect(result.data!.rowCount).toBe(1);
            expect(result.data!.shared).toBe(true);
            expect(result.data!.fileUri).toContain('file:///mock-cache/pressfit_historial_');
            expect(result.data!.csvContent).toContain('Fecha,Rutina,Ejercicio,Serie,Tipo de Serie,Peso,Repeticiones,RPE,1RM Estimado');
            expect(result.data!.csvContent).toContain('2026-09-08,Torso A,Press Banca,1,normal,80,10,8,');

            expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
                result.data!.fileUri,
                result.data!.csvContent,
                { encoding: 'utf8' }
            );

            expect(Sharing.shareAsync).toHaveBeenCalledWith(result.data!.fileUri, {
                mimeType: 'text/csv',
                dialogTitle: 'Exportar historial de entrenamientos',
                UTI: 'public.comma-separated-values-text',
            });
        });

        it('handles environment without native sharing availability gracefully', async () => {
            (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

            jest.spyOn(ExportService, 'fetchWorkoutHistoryRows').mockResolvedValue({
                data: [],
                error: null,
            });

            const result = await ExportService.exportWorkoutHistoryToCSV(mockUserId);

            expect(result.error).toBeNull();
            expect(result.data!.shared).toBe(false);
            expect(Sharing.shareAsync).not.toHaveBeenCalled();
        });
    });

    describe('exportBackupToJSON', () => {
        it('compiles full versioned backup (schemaVersion: 1), writes json file, and shares it', async () => {
            const mockRoutines = [
                {
                    id: 'routine-1',
                    nombre: 'Rutina Hipertrofia',
                    usuario_id: mockUserId,
                    es_plantilla: true,
                },
            ];

            const mockWorkouts = [
                {
                    id: 'workout-1',
                    fecha_dia: '2026-09-08',
                    nombre_dia: 'Torso A',
                },
            ];

            const mockCustomExercises = [
                {
                    id: 'custom-ex-1',
                    titulo: 'Press Sentado Personalizado',
                    es_custom: true,
                    created_by: mockUserId,
                },
            ];

            const mockWeightHistory = [
                {
                    id: 'weight-1',
                    peso: 75.5,
                    created_at: '2026-09-01T10:00:00Z',
                },
            ];

            (supabase.from as jest.Mock).mockImplementation((table: string) => {
                if (table === 'rutinas_semanales') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        then: (resolve: any) => resolve({ data: mockRoutines, error: null }),
                    };
                }
                if (table === 'rutinas_diarias') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        not: jest.fn().mockReturnThis(),
                        then: (resolve: any) => resolve({ data: mockWorkouts, error: null }),
                    };
                }
                if (table === 'ejercicios') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        or: jest.fn().mockResolvedValue({ data: mockCustomExercises, error: null }),
                    };
                }
                if (table === 'historial_peso') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        order: jest.fn().mockResolvedValue({ data: mockWeightHistory, error: null }),
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                };
            });

            const result = await ExportService.exportBackupToJSON(mockUserId);

            expect(result.error).toBeNull();
            expect(result.data).toBeDefined();
            expect(result.data!.shared).toBe(true);
            expect(result.data!.fileUri).toContain('file:///mock-cache/pressfit_backup_');

            const backup = result.data!.backup;
            expect(backup.schemaVersion).toBe(1);
            expect(backup.appVersion).toBe('1.11.0');
            expect(backup.userId).toBe(mockUserId);
            expect(backup.data.routines).toHaveLength(1);
            expect(backup.data.workouts).toHaveLength(1);
            expect(backup.data.customExercises).toHaveLength(1);
            expect(backup.data.weightHistory).toHaveLength(1);

            expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
                result.data!.fileUri,
                result.data!.jsonContent,
                { encoding: 'utf8' }
            );

            expect(Sharing.shareAsync).toHaveBeenCalledWith(result.data!.fileUri, {
                mimeType: 'application/json',
                dialogTitle: 'Exportar copia de seguridad',
                UTI: 'public.json',
            });
        });
    });
});
