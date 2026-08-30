import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useWeeklyRoutineController } from '../../src/controllers/useWeeklyRoutineController';
import { RoutineService } from '../../src/services/RoutineService';

jest.mock('../../src/services/RoutineService', () => ({
    RoutineService: {
        getAllWeeklyRoutines: jest.fn(),
        createWeeklyRoutine: jest.fn(),
        updateWeeklyRoutine: jest.fn(),
        deleteWeeklyRoutine: jest.fn(),
    },
}));

describe('useWeeklyRoutineController (PF-BUG-057)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('fetches routines on mount for the given userId', async () => {
        const mockData = [
            { id: 'r1', usuario_id: 'u1', nombre: 'Rutina A', activa: true },
            { id: 'r2', usuario_id: 'u1', nombre: 'Rutina B', activa: false },
        ];
        (RoutineService.getAllWeeklyRoutines as jest.Mock).mockResolvedValue({
            data: mockData,
            error: null,
        });

        const hook = await renderHook(() => useWeeklyRoutineController('u1'));

        await waitFor(() => {
            expect(hook.result.current.loading).toBe(false);
        });

        expect(hook.result.current.allRoutines).toEqual(mockData);
        expect(RoutineService.getAllWeeklyRoutines).toHaveBeenCalledWith('u1');
    });

    it('transfers active state to next routine when deleting active routine (PF-BUG-057)', async () => {
        const mockData = [
            { id: 'r1', usuario_id: 'u1', nombre: 'Rutina A', activa: true },
            { id: 'r2', usuario_id: 'u1', nombre: 'Rutina B', activa: false },
            { id: 'r3', usuario_id: 'u1', nombre: 'Rutina C', activa: false },
        ];
        (RoutineService.getAllWeeklyRoutines as jest.Mock).mockResolvedValue({
            data: mockData,
            error: null,
        });
        (RoutineService.deleteWeeklyRoutine as jest.Mock).mockResolvedValue({ error: null });
        (RoutineService.updateWeeklyRoutine as jest.Mock).mockResolvedValue({ data: { id: 'r2', activa: true }, error: null });

        const hook = await renderHook(() => useWeeklyRoutineController('u1'));
        await waitFor(() => {
            expect(hook.result.current.loading).toBe(false);
        });

        let success = false;
        await act(async () => {
            success = await hook.result.current.deleteRoutine('r1');
        });

        expect(success).toBe(true);
        expect(RoutineService.deleteWeeklyRoutine).toHaveBeenCalledWith('r1');
        expect(RoutineService.updateWeeklyRoutine).toHaveBeenCalledWith('r2', { activa: true });
        expect(hook.result.current.allRoutines).toEqual([
            { id: 'r2', usuario_id: 'u1', nombre: 'Rutina B', activa: true },
            { id: 'r3', usuario_id: 'u1', nombre: 'Rutina C', activa: false },
        ]);
    });

    it('does not transfer active state when deleting an inactive routine', async () => {
        const mockData = [
            { id: 'r1', usuario_id: 'u1', nombre: 'Rutina A', activa: true },
            { id: 'r2', usuario_id: 'u1', nombre: 'Rutina B', activa: false },
        ];
        (RoutineService.getAllWeeklyRoutines as jest.Mock).mockResolvedValue({
            data: mockData,
            error: null,
        });
        (RoutineService.deleteWeeklyRoutine as jest.Mock).mockResolvedValue({ error: null });

        const hook = await renderHook(() => useWeeklyRoutineController('u1'));
        await waitFor(() => {
            expect(hook.result.current.loading).toBe(false);
        });

        let success = false;
        await act(async () => {
            success = await hook.result.current.deleteRoutine('r2');
        });

        expect(success).toBe(true);
        expect(RoutineService.deleteWeeklyRoutine).toHaveBeenCalledWith('r2');
        expect(RoutineService.updateWeeklyRoutine).not.toHaveBeenCalled();
        expect(hook.result.current.allRoutines).toEqual([
            { id: 'r1', usuario_id: 'u1', nombre: 'Rutina A', activa: true },
        ]);
    });

    it('empties the routine list cleanly when deleting the only routine', async () => {
        const mockData = [
            { id: 'r1', usuario_id: 'u1', nombre: 'Rutina Unica', activa: true },
        ];
        (RoutineService.getAllWeeklyRoutines as jest.Mock).mockResolvedValue({
            data: mockData,
            error: null,
        });
        (RoutineService.deleteWeeklyRoutine as jest.Mock).mockResolvedValue({ error: null });

        const hook = await renderHook(() => useWeeklyRoutineController('u1'));
        await waitFor(() => {
            expect(hook.result.current.loading).toBe(false);
        });

        let success = false;
        await act(async () => {
            success = await hook.result.current.deleteRoutine('r1');
        });

        expect(success).toBe(true);
        expect(RoutineService.deleteWeeklyRoutine).toHaveBeenCalledWith('r1');
        expect(RoutineService.updateWeeklyRoutine).not.toHaveBeenCalled();
        expect(hook.result.current.allRoutines).toEqual([]);
    });

    it('returns false and retains routines if deleteWeeklyRoutine fails', async () => {
        const mockData = [
            { id: 'r1', usuario_id: 'u1', nombre: 'Rutina A', activa: true },
        ];
        (RoutineService.getAllWeeklyRoutines as jest.Mock).mockResolvedValue({
            data: mockData,
            error: null,
        });
        (RoutineService.deleteWeeklyRoutine as jest.Mock).mockResolvedValue({ error: new Error('DB Delete failed') });

        const hook = await renderHook(() => useWeeklyRoutineController('u1'));
        await waitFor(() => {
            expect(hook.result.current.loading).toBe(false);
        });

        let success = false;
        await act(async () => {
            success = await hook.result.current.deleteRoutine('r1');
        });

        expect(success).toBe(false);
        expect(hook.result.current.allRoutines).toEqual(mockData);
    });
});
