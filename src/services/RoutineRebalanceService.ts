import { supabase } from '../lib/supabase';
import { LogService } from './LogService';
import { RoutineService } from './RoutineService';
import { RoutineDay, ScheduledExercise, Serie, ServiceResponse, WeeklyRoutine } from '../types/models';
import { RebalanceOperation, RebalancePlan } from '../utils/routineRebalancePlanner';
import { formatLocalDateKey, getStartOfWeek } from '../utils/dateUtils';

export interface CloneRebalanceOptions {
    customName?: string;
    activateImmediately?: boolean;
}

interface SeriesInsertRow {
    ejercicio_programado_id: string;
    numero_serie: number;
    repeticiones: number | null;
    peso_utilizado: number | null;
    tipo_serie?: string;
    created_at: string;
}

function applySetDeltaToSeries(
    existingSeries: Serie[],
    delta: number,
    defaultWeight: number,
    defaultReps: number
): { numero_serie: number; repeticiones: number | null; peso_utilizado: number | null; tipo_serie: string }[] {
    const base = existingSeries.map((s) => ({
        numero_serie: s.numero_serie,
        repeticiones: s.repeticiones ?? null,
        peso_utilizado: s.peso_utilizado ?? null,
        tipo_serie: s.tipo_serie || 'normal',
    }));

    if (delta > 0) {
        let nextNum = base.length + 1;
        for (let i = 0; i < delta; i++) {
            base.push({
                numero_serie: nextNum++,
                repeticiones: defaultReps,
                peso_utilizado: defaultWeight,
                tipo_serie: 'normal',
            });
        }
        return base;
    }

    if (delta < 0) {
        let toRemove = Math.abs(delta);
        const kept = [...base];
        // Remove non-warmup sets from the end while keeping at least 1 set
        for (let i = kept.length - 1; i >= 0 && toRemove > 0 && kept.length > 1; i--) {
            const t = (kept[i].tipo_serie || 'normal').toLowerCase();
            if (t !== 'warmup' && t !== 'calentamiento') {
                kept.splice(i, 1);
                toRemove--;
            }
        }
        return kept.map((s, idx) => ({ ...s, numero_serie: idx + 1 }));
    }

    return base;
}

export const RoutineRebalanceService = {
    /**
     * Clones the active weekly routine with a new name and applies all enabled operations
     * from the provided RebalancePlan. Never mutates the original routine.
     */
    async cloneAndApplyRebalancePlan(
        userId: string,
        activeRoutine: WeeklyRoutine,
        plan: RebalancePlan,
        options: CloneRebalanceOptions = {}
    ): Promise<ServiceResponse<WeeklyRoutine>> {
        let createdRoutineId: string | null = null;

        try {
            if (!userId || !activeRoutine?.id) {
                return { data: null, error: new Error('Missing user or active routine') };
            }

            const nowIso = new Date().toISOString();
            const routineName = (options.customName || plan.suggestedName).trim() || plan.suggestedName;

            const { data: newRoutine, error: routineError } = await supabase
                .from('rutinas_semanales')
                .insert({
                    usuario_id: userId,
                    nombre: routineName,
                    objetivo: activeRoutine.objetivo || null,
                    es_plantilla: true,
                    activa: false,
                    copiada_de_id: activeRoutine.id,
                    fecha_inicio_semana: formatLocalDateKey(getStartOfWeek(new Date())),
                    created_at: nowIso,
                    updated_at: nowIso,
                })
                .select()
                .single();

            if (routineError || !newRoutine) {
                throw routineError || new Error('Failed to create rebalanced routine');
            }

            createdRoutineId = newRoutine.id;

            const enabledOps = plan.operations.filter((op) => op.enabled);
            const opsByScheduledId = new Map<string, RebalanceOperation[]>();
            const addExerciseOpsByDayId = new Map<string, RebalanceOperation[]>();

            for (const op of enabledOps) {
                if (op.type === 'add_exercise') {
                    const list = addExerciseOpsByDayId.get(op.dayId) || [];
                    list.push(op);
                    addExerciseOpsByDayId.set(op.dayId, list);
                } else if (op.scheduledExerciseId) {
                    const list = opsByScheduledId.get(op.scheduledExerciseId) || [];
                    list.push(op);
                    opsByScheduledId.set(op.scheduledExerciseId, list);
                }
            }

            const sourceDays = activeRoutine.rutinas_diarias || [];
            if (sourceDays.length > 0) {
                const daysToInsert = sourceDays.map((day: RoutineDay) => ({
                    rutina_semanal_id: newRoutine.id,
                    nombre_dia: day.nombre_dia,
                    descripcion: day.descripcion || null,
                    created_at: nowIso,
                    updated_at: nowIso,
                }));

                const { data: insertedDays, error: daysError } = await supabase
                    .from('rutinas_diarias')
                    .insert(daysToInsert)
                    .select();

                if (daysError || !insertedDays) {
                    throw daysError || new Error('Failed to clone routine days');
                }

                for (let i = 0; i < sourceDays.length; i++) {
                    const sourceDay = sourceDays[i];
                    const newDay =
                        insertedDays.find((d: RoutineDay) => d.nombre_dia === sourceDay.nombre_dia) ||
                        insertedDays[i];

                    if (!newDay) continue;

                    const sourceExercises = sourceDay.ejercicios_programados || [];
                    const addedOps = addExerciseOpsByDayId.get(sourceDay.id) || [];

                    const exercisesPayload = [
                        ...sourceExercises.map((ex: ScheduledExercise) => ({
                            rutina_diaria_id: newDay.id,
                            ejercicio_id: ex.ejercicio_id,
                            orden_ejecucion: ex.orden_ejecucion,
                            tipo_peso: ex.tipo_peso || 'total',
                            created_at: nowIso,
                            updated_at: nowIso,
                        })),
                        ...addedOps.map((op, idx) => ({
                            rutina_diaria_id: newDay.id,
                            ejercicio_id: op.exerciseId,
                            orden_ejecucion: sourceExercises.length + idx + 1,
                            tipo_peso: 'total',
                            created_at: nowIso,
                            updated_at: nowIso,
                        })),
                    ];

                    if (exercisesPayload.length === 0) continue;

                    const { data: insertedExercises, error: exError } = await supabase
                        .from('ejercicios_programados')
                        .insert(exercisesPayload)
                        .select();

                    if (exError || !insertedExercises) {
                        throw exError || new Error('Failed to clone scheduled exercises');
                    }

                    const allSeriesToInsert: SeriesInsertRow[] = [];

                    // Series for cloned existing exercises (with any set adjustments)
                    for (let j = 0; j < sourceExercises.length; j++) {
                        const sourceEx = sourceExercises[j];
                        const insertedEx = insertedExercises[j];
                        if (!insertedEx) continue;

                        const ops = opsByScheduledId.get(sourceEx.id) || [];
                        const netDelta = ops.reduce((sum, op) => sum + op.deltaSets, 0);
                        const lastOp = ops[ops.length - 1];

                        const adjustedSeries = applySetDeltaToSeries(
                            sourceEx.series || [],
                            netDelta,
                            lastOp?.defaultWeight ?? 20,
                            lastOp?.defaultReps ?? 10
                        );

                        for (const s of adjustedSeries) {
                            allSeriesToInsert.push({
                                ejercicio_programado_id: insertedEx.id,
                                numero_serie: s.numero_serie,
                                repeticiones: s.repeticiones,
                                peso_utilizado: s.peso_utilizado,
                                tipo_serie: s.tipo_serie,
                                created_at: nowIso,
                            });
                        }
                    }

                    // Series for newly injected exercises
                    for (let k = 0; k < addedOps.length; k++) {
                        const op = addedOps[k];
                        const insertedEx = insertedExercises[sourceExercises.length + k];
                        if (!insertedEx) continue;

                        const count = Math.max(1, op.proposedSets);
                        for (let sNum = 1; sNum <= count; sNum++) {
                            allSeriesToInsert.push({
                                ejercicio_programado_id: insertedEx.id,
                                numero_serie: sNum,
                                repeticiones: op.defaultReps ?? 10,
                                peso_utilizado: op.defaultWeight ?? 20,
                                tipo_serie: 'normal',
                                created_at: nowIso,
                            });
                        }
                    }

                    if (allSeriesToInsert.length > 0) {
                        const { error: seriesError } = await supabase
                            .from('series')
                            .insert(allSeriesToInsert);
                        if (seriesError) {
                            throw seriesError;
                        }
                    }
                }
            }

            let finalRoutine: WeeklyRoutine = newRoutine;
            if (options.activateImmediately) {
                const { data: activated, error: activateError } =
                    await RoutineService.setActiveRoutine(userId, newRoutine.id);
                if (!activateError && activated) {
                    finalRoutine = activated;
                }
            }

            return { data: finalRoutine, error: null };
        } catch (error) {
            LogService.error('Error cloning and applying rebalance plan:', error);
            if (createdRoutineId) {
                try {
                    await supabase.from('rutinas_semanales').delete().eq('id', createdRoutineId);
                } catch (cleanupErr) {
                    LogService.error('Failed to rollback rebalanced routine:', cleanupErr);
                }
            }
            return { data: null, error };
        }
    },
};
