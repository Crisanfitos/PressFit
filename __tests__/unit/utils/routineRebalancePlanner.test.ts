import {
    buildRebalancedRoutineName,
    buildRoutineRebalancePlan,
    recalculatePlanSummaries,
} from '../../../src/utils/routineRebalancePlanner';
import { Exercise, WeeklyRoutine } from '../../../src/types/models';
import { EffectiveSetsSummary } from '../../../src/utils/analyticsUtils';

describe('routineRebalancePlanner (PF-446)', () => {
    const fixedDate = new Date(2026, 10, 14); // 14/11/2026

    const mockCatalog: Exercise[] = [
        {
            id: 'cat-gemelos-1',
            titulo: 'Elevación de Talones de Pie',
            categoria: 'Gemelos',
            grupo_muscular: 'Gemelos',
        },
        {
            id: 'cat-pecho-1',
            titulo: 'Press Inclinado con Mancuernas',
            categoria: 'Pecho',
            grupo_muscular: 'Pecho',
        },
    ];

    const makeRoutine = (): WeeklyRoutine => ({
        id: 'routine-1',
        usuario_id: 'user-1',
        nombre: 'Push Pull Legs Hipertrofia',
        activa: true,
        es_plantilla: true,
        rutinas_diarias: [
            {
                id: 'day-push',
                rutina_semanal_id: 'routine-1',
                nombre_dia: 'Lunes - Empuje',
                fecha_dia: null,
                ejercicios_programados: [
                    {
                        id: 'se-pecho',
                        rutina_diaria_id: 'day-push',
                        ejercicio_id: 'ex-pecho',
                        orden_ejecucion: 1,
                        tipo_peso: 'total',
                        ejercicio: {
                            id: 'ex-pecho',
                            titulo: 'Press Banca',
                            categoria: 'Pecho',
                        },
                        series: [
                            { id: 's1', ejercicio_programado_id: 'se-pecho', numero_serie: 1, peso_utilizado: 80, repeticiones: 8, tipo_serie: 'normal' },
                            { id: 's2', ejercicio_programado_id: 'se-pecho', numero_serie: 2, peso_utilizado: 80, repeticiones: 8, tipo_serie: 'normal' },
                            { id: 's3', ejercicio_programado_id: 'se-pecho', numero_serie: 3, peso_utilizado: 80, repeticiones: 8, tipo_serie: 'normal' },
                            { id: 's4', ejercicio_programado_id: 'se-pecho', numero_serie: 4, peso_utilizado: 80, repeticiones: 8, tipo_serie: 'normal' },
                        ],
                    },
                    {
                        id: 'se-biceps',
                        rutina_diaria_id: 'day-push',
                        ejercicio_id: 'ex-biceps',
                        orden_ejecucion: 2,
                        tipo_peso: 'por_lado',
                        ejercicio: {
                            id: 'ex-biceps',
                            titulo: 'Curl Alterno',
                            categoria: 'Bíceps',
                        },
                        series: [
                            { id: 'b1', ejercicio_programado_id: 'se-biceps', numero_serie: 1, peso_utilizado: 14, repeticiones: 12, tipo_serie: 'normal' },
                            { id: 'b2', ejercicio_programado_id: 'se-biceps', numero_serie: 2, peso_utilizado: 14, repeticiones: 12, tipo_serie: 'normal' },
                        ],
                    },
                ],
            },
            {
                id: 'day-pull',
                rutina_semanal_id: 'routine-1',
                nombre_dia: 'Miércoles - Tirón',
                fecha_dia: null,
                ejercicios_programados: [
                    {
                        id: 'se-espalda',
                        rutina_diaria_id: 'day-pull',
                        ejercicio_id: 'ex-espalda',
                        orden_ejecucion: 1,
                        tipo_peso: 'total',
                        ejercicio: {
                            id: 'ex-espalda',
                            titulo: 'Remo con Barra',
                            categoria: 'Espalda',
                        },
                        series: [
                            { id: 'e1', ejercicio_programado_id: 'se-espalda', numero_serie: 1, peso_utilizado: 90, repeticiones: 8, tipo_serie: 'normal' },
                            { id: 'e2', ejercicio_programado_id: 'se-espalda', numero_serie: 2, peso_utilizado: 90, repeticiones: 8, tipo_serie: 'normal' },
                            { id: 'e3', ejercicio_programado_id: 'se-espalda', numero_serie: 3, peso_utilizado: 90, repeticiones: 8, tipo_serie: 'normal' },
                        ],
                    },
                ],
            },
            {
                id: 'day-rest',
                rutina_semanal_id: 'routine-1',
                nombre_dia: 'Domingo - Descanso',
                fecha_dia: null,
                ejercicios_programados: [],
            },
        ],
    });

    describe('buildRebalancedRoutineName', () => {
        it('builds shortened name with consultation date', () => {
            const result = buildRebalancedRoutineName('Push Pull Legs Hipertrofia', fixedDate);
            expect(result).toBe('Adj. Push Pull Legs Hi… (14/11)');
        });

        it('keeps short routine names intact and avoids stacking Adj. prefix', () => {
            const first = buildRebalancedRoutineName('Full Body', fixedDate);
            expect(first).toBe('Adj. Full Body (14/11)');

            const second = buildRebalancedRoutineName(first, fixedDate);
            expect(second).toBe('Adj. Full Body (14/11)');
        });
    });

    describe('buildRoutineRebalancePlan', () => {
        it('returns no_active_routine when activeRoutine is null', () => {
            const plan = buildRoutineRebalancePlan({
                activeRoutine: null,
                volumeSummary: { totalSeriesEfectivas: 0, porGrupoMuscular: {}, distribucion: [] },
                referenceDate: fixedDate,
            });
            expect(plan.status).toBe('no_active_routine');
            expect(plan.operations).toHaveLength(0);
        });

        it('boosts underworked muscles, keeps optimal muscles, and reduces overtrained muscles', () => {
            const volumeSummary: EffectiveSetsSummary = {
                totalSeriesEfectivas: 45,
                porGrupoMuscular: {
                    Pecho: 24, // overtraining (> MRV 22) -> reduce
                    Espalda: 16, // optimal (14..22) -> keep
                    Bíceps: 4, // maintenance (< MEV 6) -> boost
                    Gemelos: 2, // below_mv (< MV 6) -> boost (not in routine -> add_exercise)
                },
                distribucion: [
                    { grupo_muscular: 'Pecho', series_efectivas: 24, porcentaje: 53 },
                    { grupo_muscular: 'Espalda', series_efectivas: 16, porcentaje: 35 },
                    { grupo_muscular: 'Bíceps', series_efectivas: 4, porcentaje: 9 },
                    { grupo_muscular: 'Gemelos', series_efectivas: 2, porcentaje: 3 },
                ],
            };

            const plan = buildRoutineRebalancePlan({
                activeRoutine: makeRoutine(),
                volumeSummary,
                catalogExercises: mockCatalog,
                referenceDate: fixedDate,
            });

            expect(plan.status).toBe('ready');
            expect(plan.sourceRoutineId).toBe('routine-1');
            expect(plan.suggestedName).toBe('Adj. Push Pull Legs Hi… (14/11)');

            const pechoSummary = plan.muscleSummaries.find((m) => m.muscleKey === 'pecho');
            const espaldaSummary = plan.muscleSummaries.find((m) => m.muscleKey === 'espalda');
            const bicepsSummary = plan.muscleSummaries.find((m) => m.muscleKey === 'biceps');
            const gemelosSummary = plan.muscleSummaries.find((m) => m.muscleKey === 'gemelos');

            expect(pechoSummary?.action).toBe('reduce');
            expect(pechoSummary!.deltaSets).toBeLessThan(0);

            expect(espaldaSummary?.action).toBe('keep');
            expect(espaldaSummary?.deltaSets).toBe(0);

            expect(bicepsSummary?.action).toBe('boost');
            expect(bicepsSummary!.deltaSets).toBeGreaterThan(0);

            expect(gemelosSummary?.action).toBe('boost');
            expect(gemelosSummary!.deltaSets).toBeGreaterThan(0);

            // Espalda must have zero operations
            expect(plan.operations.filter((o) => o.muscleKey === 'espalda')).toHaveLength(0);

            // Gemelos was added to the lightest non-rest day (day-pull has 1 exercise vs day-push 2)
            const addExOp = plan.operations.find((o) => o.type === 'add_exercise');
            expect(addExOp).toBeDefined();
            expect(addExOp?.dayId).toBe('day-pull');
            expect(addExOp?.exerciseId).toBe('cat-gemelos-1');
        });

        it('returns already_balanced when all muscles are in optimal range', () => {
            const volumeSummary: EffectiveSetsSummary = {
                totalSeriesEfectivas: 30,
                porGrupoMuscular: { Pecho: 14, Espalda: 16 },
                distribucion: [
                    { grupo_muscular: 'Pecho', series_efectivas: 14, porcentaje: 47 },
                    { grupo_muscular: 'Espalda', series_efectivas: 16, porcentaje: 53 },
                ],
            };

            const routine = makeRoutine();
            // Remove biceps so all routine muscles are optimal
            routine.rutinas_diarias![0].ejercicios_programados = [
                routine.rutinas_diarias![0].ejercicios_programados![0],
            ];

            const plan = buildRoutineRebalancePlan({
                activeRoutine: routine,
                volumeSummary,
                referenceDate: fixedDate,
            });

            expect(plan.status).toBe('already_balanced');
            expect(plan.operations).toHaveLength(0);
        });

        it('recalculates summaries when an operation is toggled off', () => {
            const volumeSummary: EffectiveSetsSummary = {
                totalSeriesEfectivas: 28,
                porGrupoMuscular: { Pecho: 24, Bíceps: 4, Espalda: 15 },
                distribucion: [
                    { grupo_muscular: 'Pecho', series_efectivas: 24, porcentaje: 55 },
                    { grupo_muscular: 'Espalda', series_efectivas: 15, porcentaje: 35 },
                    { grupo_muscular: 'Bíceps', series_efectivas: 4, porcentaje: 10 },
                ],
            };

            const plan = buildRoutineRebalancePlan({
                activeRoutine: makeRoutine(),
                volumeSummary,
                referenceDate: fixedDate,
            });

            const toggled = {
                ...plan,
                operations: plan.operations.map((op) =>
                    op.muscleKey === 'pecho' ? { ...op, enabled: false } : op
                ),
            };

            const recalculated = recalculatePlanSummaries(toggled);
            const pecho = recalculated.find((m) => m.muscleKey === 'pecho');
            expect(pecho?.deltaSets).toBe(0);
            expect(pecho?.projectedSets).toBe(24);
        });

        it('ignores historical logged days (fecha_dia != null) and duplicate template day names', () => {
            const routine = makeRoutine();
            routine.rutinas_diarias!.push({
                id: 'day-push-logged-history',
                rutina_semanal_id: 'routine-1',
                nombre_dia: 'Lunes - Empuje',
                fecha_dia: '2026-11-01',
                ejercicios_programados: [
                    {
                        id: 'se-hist-1',
                        rutina_diaria_id: 'day-push-logged-history',
                        ejercicio_id: 'ex-press-banca',
                        orden_ejecucion: 1,
                        tipo_peso: 'total',
                        ejercicio: { id: 'ex-press-banca', nombre: 'Press Banca', grupo_muscular: 'Pecho' } as any,
                        series: [{ id: 'sh-1', ejercicio_programado_id: 'se-hist-1', numero_serie: 1, repeticiones: 10, peso_utilizado: 80 }],
                    },
                ],
            });

            const volumeSummary: EffectiveSetsSummary = {
                totalSeriesEfectivas: 24,
                porGrupoMuscular: { Pecho: 24 },
                distribucion: [{ grupo_muscular: 'Pecho', series_efectivas: 24, porcentaje: 100 }],
            };

            const plan = buildRoutineRebalancePlan({
                activeRoutine: routine,
                volumeSummary,
                referenceDate: fixedDate,
            });

            expect(plan.operations.some((op) => op.dayId === 'day-push-logged-history')).toBe(false);
            expect(plan.operations.some((op) => op.scheduledExerciseId === 'se-hist-1')).toBe(false);
        });
    });
});
