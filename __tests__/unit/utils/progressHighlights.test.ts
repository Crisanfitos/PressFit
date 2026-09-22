import {
    findLatestPRSet,
    summarizeSession,
    buildDailyLoad,
} from '../../../src/utils/progressHighlights';
import type { WorkoutSession } from '../../../src/services/HistoryService';

const baseSession = (): Record<string, unknown> => ({
    id: 's1',
    nombre_dia: 'Empuje: Pecho & Hombros',
    fecha_dia: '2026-09-20',
    hora_inicio: '2026-09-20T10:00:00',
    hora_fin: '2026-09-20T10:58:00',
    ejercicios_programados: [
        {
            ejercicio: { titulo: 'Press de Banca' },
            series: [
                { peso_utilizado: 100, repeticiones: 5 },
                { peso_utilizado: 100, repeticiones: 5, is_pr: true },
            ],
        },
        {
            ejercicio: { titulo: 'Press Militar' },
            series: [{ peso_utilizado: 60, repeticiones: 8 }],
        },
    ],
});

const session = (overrides: Record<string, unknown> = {}): WorkoutSession =>
    ({ ...baseSession(), ...overrides } as unknown as WorkoutSession);

describe('progressHighlights (PF-396)', () => {
    it('findLatestPRSet prefers official is_pr sets', () => {
        const pr = findLatestPRSet([session()]);
        expect(pr).not.toBeNull();
        expect(pr?.exerciseName).toBe('Press de Banca');
        expect(pr?.weight).toBe(100);
        expect(pr?.reps).toBe(5);
        expect(pr?.isOfficialPR).toBe(true);
    });

    it('findLatestPRSet falls back to best 1RM when no official PR', () => {
        const s = session({
            ejercicios_programados: [
                {
                    ejercicio: { titulo: 'Sentadilla' },
                    series: [{ peso_utilizado: 120, repeticiones: 5 }],
                },
            ],
        });
        const pr = findLatestPRSet([s]);
        expect(pr?.isOfficialPR).toBe(false);
        expect(pr?.exerciseName).toBe('Sentadilla');
    });

    it('findLatestPRSet returns null without sessions', () => {
        expect(findLatestPRSet([])).toBeNull();
        expect(findLatestPRSet(null)).toBeNull();
    });

    it('summarizeSession computes duration, counts and tonnage', () => {
        const summary = summarizeSession(session(), 0);
        expect(summary.durationMin).toBe(58);
        expect(summary.exerciseCount).toBe(2);
        expect(summary.setCount).toBe(3);
        expect(summary.tonnageKg).toBe(100 * 5 + 100 * 5 + 60 * 8);
        expect(summary.title).toBe('Empuje: Pecho & Hombros');
    });

    it('buildDailyLoad aggregates tonnage on the correct weekday', () => {
        const bars = buildDailyLoad([session()]);
        // 2026-09-20 is a Sunday -> index 6 (Monday-first)
        expect(bars[6].tonnageKg).toBe(1480);
        expect(bars[6].workouts).toBe(1);
        expect(bars[0].tonnageKg).toBe(0);
        expect(bars).toHaveLength(7);
    });
});
