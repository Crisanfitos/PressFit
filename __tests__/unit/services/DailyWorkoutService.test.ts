import { DailyWorkoutService } from '../../../src/services/DailyWorkoutService';
import { supabase } from '../../../src/lib/supabase';

jest.mock('../../../src/lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
    },
}));

describe('DailyWorkoutService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getRoutineDayById', () => {
        it('should fetch routine day by ID successfully and sort exercises/series', async () => {
            const mockDay = {
                id: 'day-1',
                nombre_dia: 'Lunes',
                ejercicios_programados: [
                    {
                        id: 'ex-2',
                        orden_ejecucion: 2,
                        series: [
                            { numero_serie: 2 },
                            { numero_serie: 1 },
                        ],
                    },
                    {
                        id: 'ex-1',
                        orden_ejecucion: 1,
                        series: [],
                    },
                ],
            };

            const mockSingle = jest.fn().mockResolvedValue({ data: mockDay, error: null });
            const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
            const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
            (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

            const result = await DailyWorkoutService.getRoutineDayById('day-1');

            expect(result.error).toBeNull();
            expect(result.data?.id).toBe('day-1');
            expect(result.data?.ejercicios_programados[0].id).toBe('ex-1');
            expect(result.data?.ejercicios_programados[1].series[0].numero_serie).toBe(1);
        });

        it('should handle error if query fails', async () => {
            const mockSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('DB Error') });
            const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
            const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
            (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

            const result = await DailyWorkoutService.getRoutineDayById('day-invalid');

            expect(result.data).toBeNull();
            expect(result.error).toBeDefined();
        });
    });

    describe('getRoutineDayByDate', () => {
        it('should fetch day by date', async () => {
            const mockDay = { id: 'day-date-1', fecha_dia: '2026-07-28' };
            const mockSingle = jest.fn().mockResolvedValue({ data: mockDay, error: null });
            const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
            const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
            const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
            (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

            const result = await DailyWorkoutService.getRoutineDayByDate('routine-1', '2026-07-28');

            expect(result.error).toBeNull();
            expect(result.data?.id).toBe('day-date-1');
        });
    });

    describe('getRoutineDayByName', () => {
        it('should fetch template day by name', async () => {
            const mockDay = { id: 'template-day-1', nombre_dia: 'Lunes' };
            const mockSingle = jest.fn().mockResolvedValue({ data: mockDay, error: null });
            const mockIs = jest.fn().mockReturnValue({ single: mockSingle });
            const mockEq2 = jest.fn().mockReturnValue({ is: mockIs });
            const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
            const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
            (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

            const result = await DailyWorkoutService.getRoutineDayByName('routine-1', 'Lunes');

            expect(result.error).toBeNull();
            expect(result.data?.id).toBe('template-day-1');
        });
    });

    describe('getRoutineDayStatus', () => {
        it('should return COMPLETED when workout is completed', () => {
            const status = DailyWorkoutService.getRoutineDayStatus(
                null,
                { isCompleted: true, exerciseCount: 3, duration: 45 },
                1
            );
            expect(status).toBe('COMPLETED');
        });

        it('should return IN_PROGRESS when exercises exist but not completed', () => {
            const status = DailyWorkoutService.getRoutineDayStatus(
                null,
                { isCompleted: false, exerciseCount: 2, duration: null },
                1
            );
            expect(status).toBe('IN_PROGRESS');
        });
    });

    describe('updateRoutineDayDescription', () => {
        it('should update description successfully', async () => {
            const mockSingle = jest.fn().mockResolvedValue({ data: { id: 'day-1', descripcion: 'Nueva desc' }, error: null });
            const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
            const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
            const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
            (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

            const result = await DailyWorkoutService.updateRoutineDayDescription('day-1', 'Nueva desc');

            expect(result.error).toBeNull();
            expect(result.data?.descripcion).toBe('Nueva desc');
        });
    });
});
