import { calculate1RM } from './analyticsUtils';
import type { WorkoutSession } from '../services/HistoryService';

export interface PRHighlight {
    exerciseName: string;
    weight: number;
    reps: number;
    dateKey: string | null;
    isOfficialPR: boolean;
}

export interface SessionSummary {
    id: string;
    title: string;
    dateKey: string | null;
    weekdayLabel: string;
    durationMin: number | null;
    exerciseCount: number;
    setCount: number;
    tonnageKg: number;
}

export interface DailyLoadBar {
    dayIndex: number;
    label: string;
    tonnageKg: number;
    workouts: number;
}

interface SeriesLike {
    peso_utilizado?: number | null;
    repeticiones?: number | null;
    is_pr?: boolean | null;
}

function getAllSeries(session: WorkoutSession): SeriesLike[] {
    const eps = (session.ejercicios_programados as { series?: SeriesLike[] }[] | undefined) || [];
    const out: SeriesLike[] = [];
    for (const ep of eps) {
        if (Array.isArray(ep?.series)) out.push(...ep.series);
    }
    return out;
}

function exerciseNameOf(ep: unknown): string {
    const e = (ep as { ejercicio?: { titulo?: string; nombre?: string } } | undefined)?.ejercicio;
    return e?.titulo || e?.nombre || 'Ejercicio';
}

/**
 * Finds the latest official PR set (is_pr) across sessions.
 * Falls back to the best set of the period scored by estimated 1RM.
 * Pure function — no service changes (PF-396 keeps HistoryService untouched).
 */
export function findLatestPRSet(sessions: WorkoutSession[] | null | undefined): PRHighlight | null {
    if (!sessions || sessions.length === 0) return null;

    let latestPR: PRHighlight | null = null;
    let bestFallback: PRHighlight | null = null;
    let bestScore = 0;

    for (const session of sessions) {
        const eps = (session.ejercicios_programados as {
            series?: SeriesLike[];
            ejercicio?: { titulo?: string; nombre?: string };
        }[] | undefined) || [];
        for (const ep of eps) {
            const name = exerciseNameOf(ep);
            for (const set of ep?.series || []) {
                const w = Number(set?.peso_utilizado) || 0;
                const r = Number(set?.repeticiones) || 0;
                if (w <= 0 || r <= 0) continue;
                if (set?.is_pr) {
                    latestPR = {
                        exerciseName: name,
                        weight: w,
                        reps: r,
                        dateKey: (session.fecha_dia as string) || null,
                        isOfficialPR: true,
                    };
                }
                const score = calculate1RM(w, r, 'auto');
                if (score > bestScore) {
                    bestScore = score;
                    bestFallback = {
                        exerciseName: name,
                        weight: w,
                        reps: r,
                        dateKey: (session.fecha_dia as string) || null,
                        isOfficialPR: false,
                    };
                }
            }
        }
    }

    return latestPR || bestFallback;
}

/**
 * Summarizes one session for the chronological timeline feed.
 */
export function summarizeSession(session: WorkoutSession, index: number): SessionSummary {
    const series = getAllSeries(session);
    const eps = (session.ejercicios_programados as unknown[] | undefined) || [];

    let durationMin: number | null = null;
    if (session.hora_inicio && session.hora_fin) {
        const ms = new Date(session.hora_fin as string).getTime() - new Date(session.hora_inicio as string).getTime();
        if (Number.isFinite(ms) && ms > 0) durationMin = Math.round(ms / 60000);
    }

    const tonnageKg = Math.round(
        series.reduce((acc, s) => acc + (Number(s.peso_utilizado) || 0) * (Number(s.repeticiones) || 0), 0)
    );

    const date = session.fecha_dia ? new Date(`${session.fecha_dia}T12:00:00`) : null;
    const weekdayLabel = date
        ? ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][date.getDay()]
        : `Sesión ${index + 1}`;

    return {
        id: String(session.id ?? `session-${index}`),
        title: (session.nombre_dia as string) || `Entrenamiento ${index + 1}`,
        dateKey: (session.fecha_dia as string) || null,
        weekdayLabel,
        durationMin,
        exerciseCount: eps.length,
        setCount: series.length,
        tonnageKg,
    };
}

/**
 * Aggregates session tonnage per weekday (Mon..Sun) for the kinetic load chart.
 */
export function buildDailyLoad(
    sessions: WorkoutSession[] | null | undefined,
    dayLabels: string[] = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
): DailyLoadBar[] {
    const bars: DailyLoadBar[] = dayLabels.map((label, i) => ({
        dayIndex: i,
        label,
        tonnageKg: 0,
        workouts: 0,
    }));

    if (!sessions) return bars;

    for (const session of sessions) {
        const ref = session.fecha_dia || session.hora_fin || session.hora_inicio;
        if (!ref) continue;
        const d = new Date(ref as string);
        if (Number.isNaN(d.getTime())) continue;
        const mondayFirst = (d.getDay() + 6) % 7;
        const series = getAllSeries(session);
        const tonnage = series.reduce(
            (acc, s) => acc + (Number(s.peso_utilizado) || 0) * (Number(s.repeticiones) || 0),
            0
        );
        bars[mondayFirst].tonnageKg += Math.round(tonnage);
        bars[mondayFirst].workouts += 1;
    }

    return bars;
}

export default { findLatestPRSet, summarizeSession, buildDailyLoad };
