import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { ServiceResponse } from '../../types/models';
import { LogService } from '../LogService';
import { parseAndValidateBackup, PressFitBackupPayload } from '../../schemas/backupSchema';

export interface ImportSummary {
    exercisesImported: number;
    routinesImported: number;
    workoutsImported: number;
    weightEntriesImported: number;
    skippedCount: number;
}

export interface PurgeResult {
    cleared: boolean;
    keysRemoved: number;
}

export const ImportService = {
    /**
     * Prompts the user to pick a JSON backup file using the native document picker
     * and reads its content.
     */
    async pickBackupFile(): Promise<ServiceResponse<{ content: string; name: string } | null>> {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/json', 'text/json', '*/*'],
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return { data: null, error: null };
            }

            const asset = result.assets[0];
            const content = await FileSystem.readAsStringAsync(asset.uri, {
                encoding: 'utf8',
            });

            return {
                data: {
                    content,
                    name: asset.name,
                },
                error: null,
            };
        } catch (error) {
            LogService.error('Error picking or reading backup file:', error);
            return { data: null, error };
        }
    },

    /**
     * Validates and imports a PressFit JSON backup into Supabase for the active user.
     * Guarantees idempotent restoration without duplicating existing data.
     */
    async importBackup(
        rawJson: string | unknown,
        targetUserId: string
    ): Promise<ServiceResponse<ImportSummary>> {
        try {
            const validation = parseAndValidateBackup(rawJson);

            if (!validation.success || !validation.data) {
                const errorMsg = (validation.errors || []).join('\n') || 'Formato de copia de seguridad no válido';
                return { data: null, error: new Error(errorMsg) };
            }

            const backup = validation.data;
            let exercisesImported = 0;
            let routinesImported = 0;
            let workoutsImported = 0;
            let weightEntriesImported = 0;
            let skippedCount = 0;

            const exerciseIdMap = new Map<string, string>();

            // 1. Import Custom Exercises
            const customExercises = backup.data.customExercises || [];
            if (customExercises.length > 0) {
                const { data: existingExercises } = await supabase
                    .from('ejercicios')
                    .select('id, nombre, titulo')
                    .or(`user_id.eq.${targetUserId},created_by.eq.${targetUserId}`);

                const existingMap = new Map<string, string>();
                for (const ex of existingExercises || []) {
                    const key = (ex.titulo || ex.nombre || '').toLowerCase().trim();
                    if (key) existingMap.set(key, ex.id);
                }

                for (const ex of customExercises) {
                    const title = (ex.titulo || ex.nombre || '').trim();
                    const key = title.toLowerCase();

                    if (existingMap.has(key)) {
                        if (ex.id) exerciseIdMap.set(ex.id, existingMap.get(key)!);
                        skippedCount++;
                        continue;
                    }

                    const { data: inserted, error: insertErr } = await supabase
                        .from('ejercicios')
                        .insert({
                            titulo: title || 'Ejercicio Personalizado',
                            nombre: title || 'Ejercicio Personalizado',
                            grupo_muscular: ex.grupo_muscular || 'pecho',
                            categoria: ex.categoria || 'fuerza',
                            descripcion: ex.descripcion || null,
                            es_custom: true,
                            user_id: targetUserId,
                            created_by: targetUserId,
                        })
                        .select('id')
                        .single();

                    if (insertErr) {
                        LogService.warn('Failed to insert custom exercise during import:', insertErr);
                        continue;
                    }

                    if (inserted && ex.id) {
                        exerciseIdMap.set(ex.id, inserted.id);
                    }
                    exercisesImported++;
                }
            }

            // 2. Import Weekly Routines
            const routines = backup.data.routines || [];
            for (const routine of routines) {
                const routineName = (routine.nombre || '').trim();

                const { data: existingRoutine } = await supabase
                    .from('rutinas_semanales')
                    .select('id')
                    .eq('usuario_id', targetUserId)
                    .eq('nombre', routineName)
                    .eq('es_plantilla', true)
                    .maybeSingle();

                if (existingRoutine) {
                    skippedCount++;
                    continue;
                }

                const { data: insertedRoutine, error: routineErr } = await supabase
                    .from('rutinas_semanales')
                    .insert({
                        usuario_id: targetUserId,
                        nombre: routineName,
                        es_plantilla: true,
                        activa: routine.activa ?? false,
                    })
                    .select('id')
                    .single();

                if (routineErr || !insertedRoutine) {
                    LogService.warn('Failed to insert routine during import:', routineErr);
                    continue;
                }

                routinesImported++;

                // Import days
                const days = routine.rutinas_diarias || [];
                for (const day of days) {
                    const { data: insertedDay, error: dayErr } = await supabase
                        .from('rutinas_diarias')
                        .insert({
                            rutina_semanal_id: insertedRoutine.id,
                            nombre_dia: day.nombre_dia,
                            fecha_dia: null,
                            completada: false,
                        })
                        .select('id')
                        .single();

                    if (dayErr || !insertedDay) continue;

                    // Import scheduled exercises
                    const sched = day.ejercicios_programados || [];
                    for (const s of sched) {
                        const originalExerciseId = s.ejercicio?.id || s.ejercicio_id || '';
                        const resolvedExerciseId =
                            exerciseIdMap.get(originalExerciseId) || originalExerciseId;

                        if (!resolvedExerciseId) continue;

                        await supabase.from('ejercicios_programados').insert({
                            rutina_diaria_id: insertedDay.id,
                            ejercicio_id: resolvedExerciseId,
                            orden_ejecucion: s.orden_ejecucion ?? 1,
                            tipo_peso: s.tipo_peso || 'total',
                        });
                    }
                }
            }

            // 3. Import Workout Sessions
            const workouts = backup.data.workouts || [];
            for (const workout of workouts) {
                if (!workout.fecha_dia) continue;

                // Check for existing workout on that date
                const { data: existingWorkout } = await supabase
                    .from('rutinas_diarias')
                    .select(`
                        id,
                        rutina_semanal:rutinas_semanales!inner(usuario_id)
                    `)
                    .eq('rutina_semanal.usuario_id', targetUserId)
                    .eq('fecha_dia', workout.fecha_dia)
                    .eq('nombre_dia', workout.nombre_dia)
                    .maybeSingle();

                if (existingWorkout) {
                    skippedCount++;
                    continue;
                }

                // If user doesn't have an active routine to link, find or create one
                let routineId: string | null = null;
                const { data: defaultRoutine } = await supabase
                    .from('rutinas_semanales')
                    .select('id')
                    .eq('usuario_id', targetUserId)
                    .limit(1)
                    .maybeSingle();

                if (defaultRoutine) {
                    routineId = defaultRoutine.id;
                } else {
                    const { data: newR } = await supabase
                        .from('rutinas_semanales')
                        .insert({
                            usuario_id: targetUserId,
                            nombre: 'Rutina Importada',
                            es_plantilla: false,
                            activa: false,
                        })
                        .select('id')
                        .single();
                    if (newR) routineId = newR.id;
                }

                if (!routineId) continue;

                const { data: insertedWorkout, error: workoutErr } = await supabase
                    .from('rutinas_diarias')
                    .insert({
                        rutina_semanal_id: routineId,
                        nombre_dia: workout.nombre_dia,
                        fecha_dia: workout.fecha_dia,
                        hora_inicio: workout.hora_inicio || null,
                        hora_fin: workout.hora_fin || null,
                        completada: workout.completada ?? true,
                    })
                    .select('id')
                    .single();

                if (workoutErr || !insertedWorkout) {
                    LogService.warn('Failed to insert workout during import:', workoutErr);
                    continue;
                }

                workoutsImported++;

                // Insert scheduled exercises & series
                const scheduled = workout.ejercicios_programados || [];
                for (const ex of scheduled) {
                    const originalExerciseId = ex.ejercicio?.id || ex.ejercicio_id || '';
                    const resolvedExerciseId =
                        exerciseIdMap.get(originalExerciseId) || originalExerciseId;

                    if (!resolvedExerciseId) continue;

                    const { data: insertedSched, error: schedErr } = await supabase
                        .from('ejercicios_programados')
                        .insert({
                            rutina_diaria_id: insertedWorkout.id,
                            ejercicio_id: resolvedExerciseId,
                            orden_ejecucion: ex.orden_ejecucion ?? 1,
                            tipo_peso: ex.tipo_peso || 'total',
                        })
                        .select('id')
                        .single();

                    if (schedErr || !insertedSched) continue;

                    const series = ex.series || [];
                    for (const s of series) {
                        await supabase.from('series').insert({
                            ejercicio_programado_id: insertedSched.id,
                            numero_serie: s.numero_serie,
                            peso_utilizado: s.peso_utilizado ?? 0,
                            repeticiones: s.repeticiones ?? 0,
                            rpe: s.rpe ?? null,
                            tipo_serie: s.tipo_serie || 'normal',
                            completada: s.completada ?? s.is_completed ?? true,
                        });
                    }
                }
            }

            // 4. Import Weight History
            const weightHistory = backup.data.weightHistory || [];
            for (const entry of weightHistory) {
                const { error: wErr } = await supabase.from('historial_peso').insert({
                    usuario_id: targetUserId,
                    peso: entry.peso,
                    created_at: entry.created_at,
                });
                if (!wErr) {
                    weightEntriesImported++;
                }
            }

            return {
                data: {
                    exercisesImported,
                    routinesImported,
                    workoutsImported,
                    weightEntriesImported,
                    skippedCount,
                },
                error: null,
            };
        } catch (error) {
            LogService.error('Unexpected error importing backup:', error);
            return { data: null, error };
        }
    },

    /**
     * Purges local offline caches, workout states, and cached lists from AsyncStorage.
     */
    async purgeLocalCache(): Promise<ServiceResponse<PurgeResult>> {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const keysToRemove = allKeys.filter(
                (k) =>
                    k.startsWith('pressfit_') ||
                    k.startsWith('cached_') ||
                    k.startsWith('offline_') ||
                    k.includes('_cache') ||
                    k.includes('workout_active')
            );

            if (keysToRemove.length > 0) {
                await AsyncStorage.multiRemove(keysToRemove);
            }

            return {
                data: {
                    cleared: true,
                    keysRemoved: keysToRemove.length,
                },
                error: null,
            };
        } catch (error) {
            LogService.error('Error purging local cache:', error);
            return { data: null, error };
        }
    },
};
