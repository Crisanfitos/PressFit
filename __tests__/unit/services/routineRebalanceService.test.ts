import { RoutineRebalanceService } from '../../../src/services/RoutineRebalanceService';
import { RoutineService } from '../../../src/services/RoutineService';
import { supabase } from '../../../src/lib/supabase';
import { WeeklyRoutine } from '../../../src/types/models';
import { RebalancePlan } from '../../../src/utils/routineRebalancePlanner';

jest.mock('../../../src/lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
    },
}));

jest.mock('../../../src/services/RoutineService', () => ({
    RoutineService: {
        setActiveRoutine: jest.fn(),
    },
}));

describe('RoutineRebalanceService (PF-447)', () => {
    const activeRoutine: WeeklyRoutine = {
        id: 'orig-routine',
        usuario_id: 'user-1',
        nombre: 'Push Pull Legs',
        objetivo: 'Hipertrofia',
        activa: true,
        es_plantilla: true,
        rutinas_diarias: [
            {
                id: 'day-1',
                rutina_semanal_id: 'orig-routine',
                nombre_dia: 'Empuje',
                fecha_dia: null,
                ejercicios_programados: [
                    {
                        id: 'se-1',
                        rutina_diaria_id: 'day-1',
                        ejercicio_id: 'ex-1',
                        orden_ejecucion: 1,
                        tipo_peso: 'total',
                        series: [
                            { id: 's1', ejercicio_programado_id: 'se-1', numero_serie: 1, peso_utilizado: 80, repeticiones: 8, tipo_serie: 'normal' },
                            { id: 's2', ejercicio_programado_id: 'se-1', numero_serie: 2, peso_utilizado: 80, repeticiones: 8, tipo_serie: 'normal' },
                            { id: 's3', ejercicio_programado_id: 'se-1', numero_serie: 3, peso_utilizado: 80, repeticiones: 8, tipo_serie: 'normal' },
                        ],
                    },
                ],
            },
        ],
    };

    const plan: RebalancePlan = {
        status: 'ready',
        sourceRoutineId: 'orig-routine',
        sourceRoutineName: 'Push Pull Legs',
        suggestedName: 'Adj. Push Pull Legs (14/11)',
        consultationDate: '14/11',
        muscleSummaries: [],
        operations: [
            {
                id: 'op-1',
                type: 'remove_sets',
                action: 'reduce',
                muscleKey: 'pecho',
                muscleLabel: 'Pecho',
                dayId: 'day-1',
                dayName: 'Empuje',
                scheduledExerciseId: 'se-1',
                exerciseId: 'ex-1',
                exerciseName: 'Press Banca',
                currentSets: 3,
                proposedSets: 2,
                deltaSets: -1,
                enabled: true,
            },
            {
                id: 'op-2',
                type: 'add_exercise',
                action: 'boost',
                muscleKey: 'gemelos',
                muscleLabel: 'Gemelos',
                dayId: 'day-1',
                dayName: 'Empuje',
                exerciseId: 'ex-gemelos',
                exerciseName: 'Gemelos de Pie',
                currentSets: 0,
                proposedSets: 3,
                deltaSets: 3,
                defaultWeight: 20,
                defaultReps: 12,
                enabled: true,
            },
        ],
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('clones routine with copiada_de_id, applies adjustments, and activates when requested', async () => {
        const seriesInsertMock = jest.fn().mockResolvedValue({ error: null });
        const exInsertMock = jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
                data: [
                    { id: 'new-se-1', ejercicio_id: 'ex-1', orden_ejecucion: 1 },
                    { id: 'new-se-2', ejercicio_id: 'ex-gemelos', orden_ejecucion: 2 },
                ],
                error: null,
            }),
        });
        const daysInsertMock = jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
                data: [{ id: 'new-day-1', nombre_dia: 'Empuje' }],
                error: null,
            }),
        });
        const routineInsertMock = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                    data: { id: 'new-routine', nombre: 'Adj. Push Pull Legs (14/11)', activa: false },
                    error: null,
                }),
            }),
        });

        (supabase.from as jest.Mock).mockImplementation((table: string) => {
            if (table === 'rutinas_semanales') return { insert: routineInsertMock };
            if (table === 'rutinas_diarias') return { insert: daysInsertMock };
            if (table === 'ejercicios_programados') return { insert: exInsertMock };
            if (table === 'series') return { insert: seriesInsertMock };
            return {};
        });

        (RoutineService.setActiveRoutine as jest.Mock).mockResolvedValue({
            data: { id: 'new-routine', nombre: 'Adj. Push Pull Legs (14/11)', activa: true },
            error: null,
        });

        const res = await RoutineRebalanceService.cloneAndApplyRebalancePlan(
            'user-1',
            activeRoutine,
            plan,
            { activateImmediately: true }
        );

        expect(res.error).toBeNull();
        expect(res.data?.id).toBe('new-routine');
        expect(res.data?.activa).toBe(true);
        expect(routineInsertMock).toHaveBeenCalledWith(
            expect.objectContaining({
                copiada_de_id: 'orig-routine',
                nombre: 'Adj. Push Pull Legs (14/11)',
            })
        );
        // 2 sets kept for ex-1 + 3 sets created for ex-gemelos = 5 series rows
        expect(seriesInsertMock).toHaveBeenCalledTimes(1);
        expect(seriesInsertMock.mock.calls[0][0]).toHaveLength(5);
        expect(RoutineService.setActiveRoutine).toHaveBeenCalledWith('user-1', 'new-routine');
    });

    it('rolls back created routine if cloning days fails', async () => {
        const deleteEqMock = jest.fn().mockResolvedValue({ error: null });
        const deleteMock = jest.fn().mockReturnValue({ eq: deleteEqMock });
        const routineInsertMock = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                    data: { id: 'partial-routine' },
                    error: null,
                }),
            }),
        });
        const daysInsertMock = jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
                data: null,
                error: new Error('DB insert failed'),
            }),
        });

        (supabase.from as jest.Mock).mockImplementation((table: string) => {
            if (table === 'rutinas_semanales') return { insert: routineInsertMock, delete: deleteMock };
            if (table === 'rutinas_diarias') return { insert: daysInsertMock };
            return {};
        });

        const res = await RoutineRebalanceService.cloneAndApplyRebalancePlan(
            'user-1',
            activeRoutine,
            plan
        );

        expect(res.data).toBeNull();
        expect(res.error).toBeTruthy();
        expect(deleteEqMock).toHaveBeenCalledWith('id', 'partial-routine');
    });
});
