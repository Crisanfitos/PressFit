import { Exercise, RoutineDay, ScheduledExercise, Serie, WeeklyRoutine } from '../types/models';
import { EffectiveSetsSummary } from './analyticsUtils';
import {
    assessMuscleHypertrophy,
    HypertrophyStatus,
    HypertrophyThresholds,
    normalizeMuscleKey,
} from './hypertrophyLandmarks';
import { MAX_TOTAL_SETS_PER_EXERCISE } from './setLimits';

export type RebalanceMuscleAction = 'boost' | 'keep' | 'reduce';

export type RebalanceOperationType = 'add_sets' | 'remove_sets' | 'add_exercise';

export interface RebalanceOperation {
    id: string;
    type: RebalanceOperationType;
    action: 'boost' | 'reduce';
    muscleKey: string;
    muscleLabel: string;
    dayId: string;
    dayName: string;
    scheduledExerciseId?: string;
    exerciseId: string;
    exerciseName: string;
    currentSets: number;
    proposedSets: number;
    deltaSets: number;
    defaultWeight?: number;
    defaultReps?: number;
    enabled: boolean;
}

export interface MuscleRebalanceSummary {
    muscleKey: string;
    muscleLabel: string;
    currentSets: number;
    projectedSets: number;
    deltaSets: number;
    statusBefore: HypertrophyStatus;
    action: RebalanceMuscleAction;
    thresholds: HypertrophyThresholds;
}

export type RebalancePlanStatus = 'ready' | 'no_active_routine' | 'already_balanced';

export interface RebalancePlan {
    status: RebalancePlanStatus;
    sourceRoutineId: string | null;
    sourceRoutineName: string;
    suggestedName: string;
    consultationDate: string;
    muscleSummaries: MuscleRebalanceSummary[];
    operations: RebalanceOperation[];
}

const MAX_SHORT_BASE_LENGTH = 18;
const DEFAULT_NEW_EXERCISE_SETS = 3;
const DEFAULT_NEW_EXERCISE_REPS = 10;

function formatShortDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
}

/**
 * Builds a concise, human-readable routine name incorporating the consultation date.
 * Strips any previous `Adj.` prefix or `(DD/MM)` suffix to prevent recursive stacking.
 */
export function buildRebalancedRoutineName(baseName: string, date: Date = new Date()): string {
    const cleaned = (baseName || 'Rutina')
        .replace(/^Adj\.\s*/i, '')
        .replace(/\s*\(\d{2}\/\d{2}\)\s*$/i, '')
        .trim();

    const shortBase =
        cleaned.length > MAX_SHORT_BASE_LENGTH
            ? `${cleaned.slice(0, MAX_SHORT_BASE_LENGTH - 1).trimEnd()}…`
            : cleaned || 'Rutina';

    return `Adj. ${shortBase} (${formatShortDate(date)})`;
}

function getExercisePrimaryMuscle(exercise?: Exercise | null): string {
    if (!exercise) return '';
    if (exercise.grupo_muscular_principal) return exercise.grupo_muscular_principal;
    if (exercise.grupo_muscular) return exercise.grupo_muscular;
    if (exercise.categoria) return exercise.categoria;
    if (Array.isArray(exercise.musculos_primarios) && exercise.musculos_primarios.length > 0) {
        return exercise.musculos_primarios[0];
    }
    if (typeof exercise.musculos_primarios === 'string' && exercise.musculos_primarios.trim()) {
        return exercise.musculos_primarios.split(',')[0].trim();
    }
    return '';
}

function getExerciseTitle(exercise?: Exercise | null): string {
    return exercise?.titulo || exercise?.nombre || 'Ejercicio';
}

function isWarmupSet(set: Serie): boolean {
    const t = (set.tipo_serie || 'normal').toLowerCase();
    return t === 'warmup' || t === 'calentamiento';
}

function countWorkingSets(series?: Serie[]): number {
    if (!series || series.length === 0) return 0;
    return series.filter((s) => !isWarmupSet(s)).length;
}

function isRestDay(day: RoutineDay): boolean {
    const maybeRest = (day as RoutineDay & { es_descanso?: boolean }).es_descanso;
    if (maybeRest) return true;
    const name = (day.nombre_dia || '').toLowerCase();
    return name.includes('descanso') || name.includes('rest');
}

function mapStatusToAction(status: HypertrophyStatus): RebalanceMuscleAction {
    if (status === 'below_mv' || status === 'maintenance') return 'boost';
    if (status === 'warning' || status === 'overtraining') return 'reduce';
    return 'keep';
}

function computeTargetDelta(
    action: RebalanceMuscleAction,
    currentSets: number,
    thresholds: HypertrophyThresholds
): number {
    if (action === 'keep') return 0;

    if (action === 'boost') {
        const target = Math.min(thresholds.mavMin, thresholds.mev + 2);
        const rawGap = Math.max(2, Math.ceil(target - currentSets));
        return Math.min(4, rawGap);
    }

    // reduce: bring down toward upper MAV without dropping below MV
    const safeTarget = Math.max(thresholds.mv, thresholds.mavMax - 2);
    const rawExcess = Math.max(2, Math.ceil(currentSets - safeTarget));
    return -Math.min(4, rawExcess);
}

/**
 * Keeps only weekly template days (fecha_dia == null), excluding historical logged workout
 * days that share the same rutina_semanal_id, and deduplicates by day name.
 */
export function extractTemplateDays(days?: RoutineDay[]): RoutineDay[] {
    if (!days || days.length === 0) return [];
    const seen = new Set<string>();
    const result: RoutineDay[] = [];
    for (const day of days) {
        if (day.fecha_dia !== null && day.fecha_dia !== undefined && day.fecha_dia !== '') {
            continue;
        }
        const key = (day.nombre_dia || '').trim().toLowerCase() || day.id;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(day);
    }
    return result;
}

/**
 * Generates a deterministic routine rebalance plan from weekly hypertrophy volume data
 * and the user's active weekly routine.
 */
export function buildRoutineRebalancePlan(params: {
    activeRoutine: WeeklyRoutine | null | undefined;
    volumeSummary: EffectiveSetsSummary | null | undefined;
    catalogExercises?: Exercise[];
    referenceDate?: Date;
}): RebalancePlan {
    const {
        activeRoutine,
        volumeSummary,
        catalogExercises = [],
        referenceDate = new Date(),
    } = params;

    const consultationDate = formatShortDate(referenceDate);

    if (!activeRoutine) {
        return {
            status: 'no_active_routine',
            sourceRoutineId: null,
            sourceRoutineName: '',
            suggestedName: buildRebalancedRoutineName('Rutina', referenceDate),
            consultationDate,
            muscleSummaries: [],
            operations: [],
        };
    }

    const suggestedName = buildRebalancedRoutineName(activeRoutine.nombre, referenceDate);
    const activeDays = extractTemplateDays(activeRoutine.rutinas_diarias).filter((d) => !isRestDay(d));

    // Collect muscle volume map from summary + muscles present in active routine
    const muscleMap = new Map<string, { label: string; effectiveSets: number }>();

    for (const item of volumeSummary?.distribucion || []) {
        const key = normalizeMuscleKey(item.grupo_muscular);
        if (!key) continue;
        const existing = muscleMap.get(key);
        if (existing) {
            existing.effectiveSets += item.series_efectivas;
        } else {
            muscleMap.set(key, {
                label: item.grupo_muscular,
                effectiveSets: item.series_efectivas,
            });
        }
    }

    for (const day of activeDays) {
        for (const scheduled of day.ejercicios_programados || []) {
            const rawMuscle = getExercisePrimaryMuscle(scheduled.ejercicio);
            const key = normalizeMuscleKey(rawMuscle);
            if (key && !muscleMap.has(key)) {
                muscleMap.set(key, {
                    label: rawMuscle,
                    effectiveSets: 0,
                });
            }
        }
    }

    const operations: RebalanceOperation[] = [];
    const muscleDeltaApplied = new Map<string, number>();
    const assessments: {
        key: string;
        label: string;
        currentSets: number;
        statusBefore: HypertrophyStatus;
        action: RebalanceMuscleAction;
        thresholds: HypertrophyThresholds;
        desiredDelta: number;
    }[] = [];

    for (const [key, entry] of muscleMap.entries()) {
        const assessment = assessMuscleHypertrophy(entry.label, entry.effectiveSets);
        const action = mapStatusToAction(assessment.status);
        const desiredDelta = computeTargetDelta(action, entry.effectiveSets, assessment.thresholds);

        assessments.push({
            key,
            label: entry.label,
            currentSets: entry.effectiveSets,
            statusBefore: assessment.status,
            action,
            thresholds: assessment.thresholds,
            desiredDelta,
        });
    }

    // Track per-scheduled-exercise proposed working set adjustments so we stay within limits
    const exerciseSetDelta = new Map<string, number>();
    const dayAddedExercisesCount = new Map<string, number>();

    let opIndex = 0;

    // 1. Apply reductions for 'reduce' muscles
    for (const item of assessments) {
        if (item.action !== 'reduce' || item.desiredDelta >= 0) continue;

        let remainingToRemove = Math.abs(item.desiredDelta);
        let removedTotal = 0;

        // Collect all scheduled exercises matching this muscle, sorted by highest working sets
        const candidates: { day: RoutineDay; scheduled: ScheduledExercise; workingSets: number }[] = [];
        for (const day of activeDays) {
            for (const scheduled of day.ejercicios_programados || []) {
                const exMuscleKey = normalizeMuscleKey(getExercisePrimaryMuscle(scheduled.ejercicio));
                if (exMuscleKey === item.key) {
                    candidates.push({
                        day,
                        scheduled,
                        workingSets: countWorkingSets(scheduled.series),
                    });
                }
            }
        }
        candidates.sort((a, b) => b.workingSets - a.workingSets);

        for (const candidate of candidates) {
            if (remainingToRemove <= 0) break;
            const currentDelta = exerciseSetDelta.get(candidate.scheduled.id) || 0;
            const effectiveWorking = candidate.workingSets + currentDelta;
            // Always keep at least 1 working set per exercise
            const removable = Math.max(0, effectiveWorking - 1);
            if (removable <= 0) continue;

            const toRemove = Math.min(remainingToRemove, removable, 2);
            if (toRemove <= 0) continue;

            const totalSetsNow = (candidate.scheduled.series?.length || 0) + currentDelta;
            exerciseSetDelta.set(candidate.scheduled.id, currentDelta - toRemove);
            remainingToRemove -= toRemove;
            removedTotal += toRemove;

            opIndex++;
            operations.push({
                id: `op-${opIndex}-${candidate.scheduled.id}`,
                type: 'remove_sets',
                action: 'reduce',
                muscleKey: item.key,
                muscleLabel: item.label,
                dayId: candidate.day.id,
                dayName: candidate.day.nombre_dia,
                scheduledExerciseId: candidate.scheduled.id,
                exerciseId: candidate.scheduled.ejercicio_id,
                exerciseName: getExerciseTitle(candidate.scheduled.ejercicio),
                currentSets: totalSetsNow,
                proposedSets: totalSetsNow - toRemove,
                deltaSets: -toRemove,
                enabled: true,
            });
        }

        muscleDeltaApplied.set(item.key, -removedTotal);
    }

    // 2. Apply boosts for 'boost' muscles
    for (const item of assessments) {
        if (item.action !== 'boost' || item.desiredDelta <= 0) continue;

        let remainingToAdd = item.desiredDelta;
        let addedTotal = 0;

        // First try boosting existing exercises for this muscle
        const candidates: { day: RoutineDay; scheduled: ScheduledExercise; totalSets: number }[] = [];
        for (const day of activeDays) {
            for (const scheduled of day.ejercicios_programados || []) {
                const exMuscleKey = normalizeMuscleKey(getExercisePrimaryMuscle(scheduled.ejercicio));
                if (exMuscleKey === item.key) {
                    candidates.push({
                        day,
                        scheduled,
                        totalSets: scheduled.series?.length || 0,
                    });
                }
            }
        }

        for (const candidate of candidates) {
            if (remainingToAdd <= 0) break;
            const currentDelta = exerciseSetDelta.get(candidate.scheduled.id) || 0;
            const currentTotal = candidate.totalSets + currentDelta;
            const capacity = Math.max(0, MAX_TOTAL_SETS_PER_EXERCISE - currentTotal);
            if (capacity <= 0) continue;

            const toAdd = Math.min(remainingToAdd, capacity, 2);
            if (toAdd <= 0) continue;

            exerciseSetDelta.set(candidate.scheduled.id, currentDelta + toAdd);
            remainingToAdd -= toAdd;
            addedTotal += toAdd;

            const lastSet = candidate.scheduled.series?.[candidate.scheduled.series.length - 1];
            opIndex++;
            operations.push({
                id: `op-${opIndex}-${candidate.scheduled.id}`,
                type: 'add_sets',
                action: 'boost',
                muscleKey: item.key,
                muscleLabel: item.label,
                dayId: candidate.day.id,
                dayName: candidate.day.nombre_dia,
                scheduledExerciseId: candidate.scheduled.id,
                exerciseId: candidate.scheduled.ejercicio_id,
                exerciseName: getExerciseTitle(candidate.scheduled.ejercicio),
                currentSets: currentTotal,
                proposedSets: currentTotal + toAdd,
                deltaSets: toAdd,
                defaultWeight: lastSet?.peso_utilizado ?? 20,
                defaultReps: lastSet?.repeticiones ?? DEFAULT_NEW_EXERCISE_REPS,
                enabled: true,
            });
        }

        // If no existing exercises could absorb the boost and we have catalog exercises, add one on the lightest day
        if (remainingToAdd > 0 && activeDays.length > 0 && catalogExercises.length > 0) {
            const matchingCatalogEx = catalogExercises.find(
                (ex) => normalizeMuscleKey(getExercisePrimaryMuscle(ex)) === item.key
            );

            if (matchingCatalogEx) {
                const sortedDays = [...activeDays].sort((a, b) => {
                    const countA =
                        (a.ejercicios_programados?.length || 0) +
                        (dayAddedExercisesCount.get(a.id) || 0);
                    const countB =
                        (b.ejercicios_programados?.length || 0) +
                        (dayAddedExercisesCount.get(b.id) || 0);
                    return countA - countB;
                });

                const targetDay = sortedDays[0];
                const setsToCreate = Math.min(
                    Math.max(DEFAULT_NEW_EXERCISE_SETS, remainingToAdd),
                    MAX_TOTAL_SETS_PER_EXERCISE
                );

                dayAddedExercisesCount.set(
                    targetDay.id,
                    (dayAddedExercisesCount.get(targetDay.id) || 0) + 1
                );
                addedTotal += setsToCreate;

                opIndex++;
                operations.push({
                    id: `op-${opIndex}-new-${matchingCatalogEx.id}`,
                    type: 'add_exercise',
                    action: 'boost',
                    muscleKey: item.key,
                    muscleLabel: item.label,
                    dayId: targetDay.id,
                    dayName: targetDay.nombre_dia,
                    exerciseId: matchingCatalogEx.id,
                    exerciseName: getExerciseTitle(matchingCatalogEx),
                    currentSets: 0,
                    proposedSets: setsToCreate,
                    deltaSets: setsToCreate,
                    defaultWeight: 20,
                    defaultReps: DEFAULT_NEW_EXERCISE_REPS,
                    enabled: true,
                });
            }
        }

        muscleDeltaApplied.set(item.key, addedTotal);
    }

    const actionOrder: Record<RebalanceMuscleAction, number> = {
        boost: 0,
        reduce: 1,
        keep: 2,
    };

    const muscleSummaries: MuscleRebalanceSummary[] = assessments
        .map((a) => {
            const applied = muscleDeltaApplied.get(a.key) || 0;
            return {
                muscleKey: a.key,
                muscleLabel: a.label,
                currentSets: a.currentSets,
                projectedSets: Math.max(0, a.currentSets + applied),
                deltaSets: applied,
                statusBefore: a.statusBefore,
                action: a.action,
                thresholds: a.thresholds,
            };
        })
        .sort((a, b) => actionOrder[a.action] - actionOrder[b.action]);

    const status: RebalancePlanStatus =
        operations.length === 0 ? 'already_balanced' : 'ready';

    return {
        status,
        sourceRoutineId: activeRoutine.id,
        sourceRoutineName: activeRoutine.nombre,
        suggestedName,
        consultationDate,
        muscleSummaries,
        operations,
    };
}

/**
 * Recomputes muscle summary projections when the user toggles operations on/off in the preview modal.
 */
export function recalculatePlanSummaries(plan: RebalancePlan): MuscleRebalanceSummary[] {
    const deltaByMuscle = new Map<string, number>();
    for (const op of plan.operations) {
        if (!op.enabled) continue;
        deltaByMuscle.set(op.muscleKey, (deltaByMuscle.get(op.muscleKey) || 0) + op.deltaSets);
    }

    return plan.muscleSummaries.map((summary) => {
        const delta = deltaByMuscle.get(summary.muscleKey) || 0;
        return {
            ...summary,
            deltaSets: delta,
            projectedSets: Math.max(0, summary.currentSets + delta),
        };
    });
}
