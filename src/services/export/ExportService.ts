import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { supabase } from '../../lib/supabase';
import {
    ServiceResponse,
    WeeklyRoutine,
    RoutineDay,
    Exercise,
    WeightHistoryEntry,
} from '../../types/models';
import { LogService } from '../LogService';
import { formatWorkoutHistoryToCSV, WorkoutSetExportRow } from '../../utils/csvFormatter';

export interface PressFitBackupData {
    schemaVersion: 1;
    appVersion: string;
    exportedAt: string;
    userId: string;
    data: {
        routines: WeeklyRoutine[];
        workouts: RoutineDay[];
        customExercises: Exercise[];
        weightHistory?: WeightHistoryEntry[];
    };
}

export interface CSVExportResult {
    fileUri: string;
    rowCount: number;
    csvContent: string;
    shared: boolean;
}

export interface JSONExportResult {
    fileUri: string;
    backup: PressFitBackupData;
    jsonContent: string;
    shared: boolean;
}

interface RoutineDayQueryRow {
    id: string;
    nombre_dia: string;
    fecha_dia: string | null;
    rutina_semanal?: { usuario_id: string } | null;
    ejercicios_programados?: Array<{
        id: string;
        orden_ejecucion?: number;
        ejercicio?: {
            nombre?: string;
            titulo?: string;
        } | null;
        series?: Array<{
            id: string;
            numero_serie: number;
            tipo_serie?: string;
            peso_utilizado?: number | null;
            repeticiones?: number | null;
            rpe?: number | null;
            completada?: boolean;
            is_completed?: boolean;
        }>;
    }>;
}

export const ExportService = {
    /**
     * Fetches all completed/logged workout sets for a user and formats them into
     * tabular rows ready for CSV serialization.
     */
    async fetchWorkoutHistoryRows(userId: string): Promise<ServiceResponse<WorkoutSetExportRow[]>> {
        try {
            const { data, error } = await supabase
                .from('rutinas_diarias')
                .select(`
                    id,
                    nombre_dia,
                    fecha_dia,
                    rutina_semanal:rutinas_semanales!inner(usuario_id),
                    ejercicios_programados(
                        id,
                        orden_ejecucion,
                        ejercicio:ejercicios(nombre, titulo),
                        series(
                            id,
                            numero_serie,
                            tipo_serie,
                            peso_utilizado,
                            repeticiones,
                            rpe,
                            completada,
                            is_completed
                        )
                    )
                `)
                .eq('rutina_semanal.usuario_id', userId)
                .not('fecha_dia', 'is', null)
                .order('fecha_dia', { ascending: true });

            if (error) {
                LogService.error('Error fetching workout history for export:', error);
                return { data: null, error };
            }

            const rows: WorkoutSetExportRow[] = [];
            const routineDays = (data || []) as unknown as RoutineDayQueryRow[];

            for (const day of routineDays) {
                const dateStr = day.fecha_dia || '';
                const routineName = day.nombre_dia || '';

                const scheduled = [...(day.ejercicios_programados || [])].sort(
                    (a, b) => (a.orden_ejecucion ?? 0) - (b.orden_ejecucion ?? 0)
                );

                for (const ex of scheduled) {
                    const exerciseName = ex.ejercicio?.titulo || ex.ejercicio?.nombre || 'Ejercicio';
                    const seriesList = [...(ex.series || [])].sort(
                        (a, b) => (a.numero_serie ?? 0) - (b.numero_serie ?? 0)
                    );

                    for (const s of seriesList) {
                        rows.push({
                            fecha: dateStr,
                            rutina: routineName,
                            ejercicio: exerciseName,
                            serie: s.numero_serie,
                            tipo_serie: s.tipo_serie || 'normal',
                            peso: Number(s.peso_utilizado ?? 0),
                            repeticiones: Number(s.repeticiones ?? 0),
                            rpe: s.rpe ?? null,
                        });
                    }
                }
            }

            return { data: rows, error: null };
        } catch (error) {
            LogService.error('Unexpected error compiling workout history rows:', error);
            return { data: null, error };
        }
    },

    /**
     * Compiles workout history to standard RFC 4180 CSV, writes it to local storage
     * and opens the native system share sheet.
     */
    async exportWorkoutHistoryToCSV(userId: string): Promise<ServiceResponse<CSVExportResult>> {
        try {
            const { data: rows, error } = await ExportService.fetchWorkoutHistoryRows(userId);
            if (error || !rows) {
                return { data: null, error: error || new Error('Failed to fetch workout history') };
            }

            const csvContent = formatWorkoutHistoryToCSV(rows);
            const targetDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '';
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileUri = `${targetDir}pressfit_historial_${timestamp}.csv`;

            await FileSystem.writeAsStringAsync(fileUri, csvContent, {
                encoding: FileSystem.EncodingType.UTF8,
            });

            let shared = false;
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'text/csv',
                    dialogTitle: 'Exportar historial de entrenamientos',
                    UTI: 'public.comma-separated-values-text',
                });
                shared = true;
            }

            return {
                data: {
                    fileUri,
                    rowCount: rows.length,
                    csvContent,
                    shared,
                },
                error: null,
            };
        } catch (error) {
            LogService.error('Error exporting workout history to CSV:', error);
            return { data: null, error };
        }
    },

    /**
     * Creates a full versioned JSON backup (`schemaVersion: 1`), writes it to local
     * storage and opens the native share sheet.
     */
    async exportBackupToJSON(userId: string): Promise<ServiceResponse<JSONExportResult>> {
        try {
            // 1. Fetch weekly routine templates with days and scheduled exercises
            const { data: routinesData, error: routinesError } = await supabase
                .from('rutinas_semanales')
                .select(`
                    *,
                    rutinas_diarias(
                        *,
                        ejercicios_programados(
                            *,
                            ejercicio:ejercicios(*)
                        )
                    )
                `)
                .eq('usuario_id', userId)
                .eq('es_plantilla', true);

            if (routinesError) {
                LogService.error('Error fetching routine templates for backup:', routinesError);
            }

            // 2. Fetch completed workout sessions with exercises and sets
            const { data: workoutsData, error: workoutsError } = await supabase
                .from('rutinas_diarias')
                .select(`
                    *,
                    rutina_semanal:rutinas_semanales!inner(usuario_id),
                    ejercicios_programados(
                        *,
                        ejercicio:ejercicios(*),
                        series(*)
                    )
                `)
                .eq('rutina_semanal.usuario_id', userId)
                .not('fecha_dia', 'is', null);

            if (workoutsError) {
                LogService.error('Error fetching workouts for backup:', workoutsError);
            }

            // 3. Fetch custom exercises
            const { data: customExercisesData, error: customExercisesError } = await supabase
                .from('ejercicios')
                .select('*')
                .or(`user_id.eq.${userId},created_by.eq.${userId},es_custom.eq.true`);

            if (customExercisesError) {
                LogService.error('Error fetching custom exercises for backup:', customExercisesError);
            }

            // 4. Fetch weight history
            const { data: weightData, error: weightError } = await supabase
                .from('historial_peso')
                .select('*')
                .eq('usuario_id', userId)
                .order('created_at', { ascending: true });

            if (weightError) {
                LogService.warn('Error fetching weight history for backup:', weightError);
            }

            const backup: PressFitBackupData = {
                schemaVersion: 1,
                appVersion: '1.11.0',
                exportedAt: new Date().toISOString(),
                userId,
                data: {
                    routines: (routinesData as WeeklyRoutine[]) || [],
                    workouts: (workoutsData as RoutineDay[]) || [],
                    customExercises: (customExercisesData as Exercise[]) || [],
                    weightHistory: (weightData as WeightHistoryEntry[]) || [],
                },
            };

            const jsonContent = JSON.stringify(backup, null, 2);
            const targetDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '';
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileUri = `${targetDir}pressfit_backup_${timestamp}.json`;

            await FileSystem.writeAsStringAsync(fileUri, jsonContent, {
                encoding: FileSystem.EncodingType.UTF8,
            });

            let shared = false;
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/json',
                    dialogTitle: 'Exportar copia de seguridad',
                    UTI: 'public.json',
                });
                shared = true;
            }

            return {
                data: {
                    fileUri,
                    backup,
                    jsonContent,
                    shared,
                },
                error: null,
            };
        } catch (error) {
            LogService.error('Error exporting backup to JSON:', error);
            return { data: null, error };
        }
    },
};
