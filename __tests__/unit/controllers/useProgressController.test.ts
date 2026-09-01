import { renderHook, act } from '@testing-library/react-native';
import { useProgressController } from '../../../src/controllers/useProgressController';
import { ProgressService } from '../../../src/services/ProgressService';
import { HistoryService } from '../../../src/services/HistoryService';

jest.mock('../../../src/services/ProgressService', () => ({
    ProgressService: {
        getProgressPhotos: jest.fn(),
        uploadProgressPhoto: jest.fn(),
        deleteProgressPhotos: jest.fn(),
        updateProgressPhoto: jest.fn(),
    },
}));

jest.mock('../../../src/services/HistoryService', () => ({
    HistoryService: {
        getDailyProgress: jest.fn(),
        getWeeklyProgress: jest.fn(),
        getMonthlyProgress: jest.fn(),
        getExerciseHistory: jest.fn(),
    },
}));

describe('useProgressController (PF-259)', () => {
    const mockUserId = 'user-test-123';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        (console.error as jest.Mock).mockRestore?.();
    });

    describe('Initial State & Missing userId Handling', () => {
        it('returns correct default initial state', async () => {
            const hook = await renderHook(() => useProgressController(mockUserId));

            expect(hook.result.current.loading).toBe(true);
            expect(hook.result.current.dailyStats).toBeNull();
            expect(hook.result.current.weeklyStats).toBeNull();
            expect(hook.result.current.monthlyStats).toBeNull();
            expect(hook.result.current.processedMonthlyData).toBeNull();
            expect(hook.result.current.progressPhotos).toEqual([]);
            expect(hook.result.current.exerciseHistory).toEqual([]);
        });

        it('returns early and does not call services if userId is undefined', async () => {
            const hook = await renderHook(() => useProgressController(undefined));

            await act(async () => {
                await hook.result.current.fetchDailyProgress();
                await hook.result.current.fetchWeeklyProgress();
                await hook.result.current.fetchMonthlyProgress();
                await hook.result.current.fetchMonthlyProgressByDate(2026, 7);
                await hook.result.current.fetchPhotos();
                await hook.result.current.fetchExerciseHistory('ex-1');
            });

            expect(HistoryService.getDailyProgress).not.toHaveBeenCalled();
            expect(HistoryService.getWeeklyProgress).not.toHaveBeenCalled();
            expect(HistoryService.getMonthlyProgress).not.toHaveBeenCalled();
            expect(ProgressService.getProgressPhotos).not.toHaveBeenCalled();
            expect(HistoryService.getExerciseHistory).not.toHaveBeenCalled();

            let uploadResult: boolean | undefined;
            let deleteResult: boolean | undefined;

            await act(async () => {
                uploadResult = await hook.result.current.uploadPhoto('file://photo.jpg', new Date(), 'test');
                deleteResult = await hook.result.current.deletePhotos(['p1']);
            });

            expect(uploadResult).toBe(false);
            expect(deleteResult).toBe(false);
            expect(ProgressService.uploadProgressPhoto).not.toHaveBeenCalled();
            expect(ProgressService.deleteProgressPhotos).not.toHaveBeenCalled();
        });
    });

    describe('fetchDailyProgress', () => {
        it('calculates aggregated daily stats accurately when workout exists', async () => {
            const mockWorkout = {
                id: 'workout-1',
                fecha_dia: '2026-08-01',
                hora_inicio: '2026-08-01T10:00:00.000Z',
                hora_fin: '2026-08-01T11:15:00.000Z', // 75 minutes
                ejercicios_programados: [
                    {
                        ejercicio_id: 'ex-1',
                        series: [
                            { peso_utilizado: 50, repeticiones: 10 }, // 500
                            { peso_utilizado: 60, repeticiones: 8 },  // 480
                        ],
                    },
                    {
                        ejercicio_id: 'ex-2',
                        series: [
                            { peso_utilizado: 20, repeticiones: 12 }, // 240
                        ],
                    },
                    {
                        ejercicio_id: 'ex-1', // duplicate exercise ID to verify Set uniqueness
                        series: [
                            { peso_utilizado: 70, repeticiones: 5 },  // 350
                            { peso_utilizado: undefined, repeticiones: 10 }, // 0
                            { peso_utilizado: 50, repeticiones: undefined }, // 0
                        ],
                    },
                ],
            };

            (HistoryService.getDailyProgress as jest.Mock).mockResolvedValue({
                data: [mockWorkout],
                error: null,
            });

            const hook = await renderHook(() => useProgressController(mockUserId));

            const testDate = new Date('2026-08-01');
            await act(async () => {
                await hook.result.current.fetchDailyProgress(testDate);
            });

            expect(HistoryService.getDailyProgress).toHaveBeenCalledWith(mockUserId, testDate);
            expect(hook.result.current.loading).toBe(false);
            expect(hook.result.current.dailyStats).toEqual({
                exercises: 2, // ex-1 and ex-2
                sets: 6,
                totalWeight: 1570, // 500 + 480 + 240 + 350 + 0 + 0
                duration: 75,
                workoutDetails: mockWorkout,
            });
        });

        it('handles workouts with missing scheduled exercises or series safely', async () => {
            const mockWorkout = {
                id: 'workout-2',
                fecha_dia: '2026-08-01',
                ejercicios_programados: [
                    { ejercicio_id: 'ex-1' }, // no series property
                ],
            };

            (HistoryService.getDailyProgress as jest.Mock).mockResolvedValue({
                data: [mockWorkout],
                error: null,
            });

            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchDailyProgress();
            });

            expect(hook.result.current.dailyStats).toEqual({
                exercises: 1,
                sets: 0,
                totalWeight: 0,
                duration: 0,
                workoutDetails: mockWorkout,
            });
        });

        it('handles workouts without ejercicios_programados field', async () => {
            const mockWorkout = {
                id: 'workout-3',
                hora_inicio: '2026-08-01T10:00:00.000Z',
                hora_fin: '2026-08-01T10:30:00.000Z',
            };

            (HistoryService.getDailyProgress as jest.Mock).mockResolvedValue({
                data: [mockWorkout],
                error: null,
            });

            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchDailyProgress();
            });

            expect(hook.result.current.dailyStats).toEqual({
                exercises: 0,
                sets: 0,
                totalWeight: 0,
                duration: 30,
                workoutDetails: mockWorkout,
            });
        });

        it('sets dailyStats to null when data is empty or null', async () => {
            (HistoryService.getDailyProgress as jest.Mock).mockResolvedValue({
                data: [],
                error: null,
            });

            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchDailyProgress();
            });

            expect(hook.result.current.dailyStats).toBeNull();
            expect(hook.result.current.loading).toBe(false);
        });

        it('catches and logs error when HistoryService.getDailyProgress rejects', async () => {
            (HistoryService.getDailyProgress as jest.Mock).mockRejectedValue(new Error('Network error'));

            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchDailyProgress();
            });

            expect(console.error).toHaveBeenCalledWith('Error fetching daily progress:', expect.any(Error));
            expect(hook.result.current.loading).toBe(false);
        });
    });

    describe('fetchWeeklyProgress', () => {
        it('fetches and sets weekly stats on success', async () => {
            const mockWeeklyData = [
                { week: '2026-W31', workoutCount: 4, totalDuration: 240 },
                { week: '2026-W32', workoutCount: 3, totalDuration: 180 },
            ];

            (HistoryService.getWeeklyProgress as jest.Mock).mockResolvedValue({
                data: mockWeeklyData,
                error: null,
            });

            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchWeeklyProgress();
            });

            expect(HistoryService.getWeeklyProgress).toHaveBeenCalledWith(mockUserId);
            expect(hook.result.current.weeklyStats).toEqual(mockWeeklyData);
            expect(hook.result.current.loading).toBe(false);
        });

        it('sets weeklyStats to empty array when data is null', async () => {
            (HistoryService.getWeeklyProgress as jest.Mock).mockResolvedValue({
                data: null,
                error: null,
            });

            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchWeeklyProgress();
            });

            expect(hook.result.current.weeklyStats).toEqual([]);
            expect(hook.result.current.loading).toBe(false);
        });

        it('catches error and resets loading if HistoryService.getWeeklyProgress throws', async () => {
            (HistoryService.getWeeklyProgress as jest.Mock).mockRejectedValue(new Error('DB Error'));

            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchWeeklyProgress();
            });

            expect(console.error).toHaveBeenCalledWith('Error fetching weekly progress:', expect.any(Error));
            expect(hook.result.current.loading).toBe(false);
        });
    });

    describe('fetchMonthlyProgress', () => {
        it('fetches and sets monthly stats on success', async () => {
            const mockMonthlyData = [
                { month: '2026-07', workoutCount: 16, totalDuration: 960 },
                { month: '2026-08', workoutCount: 18, totalDuration: 1080 },
            ];

            (HistoryService.getMonthlyProgress as jest.Mock).mockResolvedValue({
                data: mockMonthlyData,
                error: null,
            });

            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchMonthlyProgress();
            });

            expect(HistoryService.getMonthlyProgress).toHaveBeenCalledWith(mockUserId);
            expect(hook.result.current.monthlyStats).toEqual(mockMonthlyData);
            expect(hook.result.current.loading).toBe(false);
        });

        it('sets monthlyStats to empty array when data is null', async () => {
            (HistoryService.getMonthlyProgress as jest.Mock).mockResolvedValue({
                data: null,
                error: null,
            });

            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchMonthlyProgress();
            });

            expect(hook.result.current.monthlyStats).toEqual([]);
            expect(hook.result.current.loading).toBe(false);
        });

        it('catches error and resets loading if HistoryService.getMonthlyProgress throws', async () => {
            (HistoryService.getMonthlyProgress as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchMonthlyProgress();
            });

            expect(console.error).toHaveBeenCalledWith('Error fetching monthly progress:', expect.any(Error));
            expect(hook.result.current.loading).toBe(false);
        });
    });

    describe('fetchMonthlyProgressByDate', () => {
        it('returns zeroed 4-week structure when data is null or empty', async () => {
            (HistoryService.getMonthlyProgress as jest.Mock).mockResolvedValue({
                data: [],
                error: null,
            });

            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchMonthlyProgressByDate(2026, 7); // August 2026 (0-indexed month 7)
            });

            expect(HistoryService.getMonthlyProgress).toHaveBeenCalledWith(mockUserId, 2026, 7);
            expect(hook.result.current.processedMonthlyData).toEqual({
                totalDurationMinutes: 0,
                totalHours: 0,
                totalMinutes: 0,
                totalWorkouts: 0,
                weeklyData: [
                    { weekNumber: 1, weekLabel: 'Semana 1', durationMinutes: 0, startDate: null, endDate: null, workoutCount: 0 },
                    { weekNumber: 2, weekLabel: 'Semana 2', durationMinutes: 0, startDate: null, endDate: null, workoutCount: 0 },
                    { weekNumber: 3, weekLabel: 'Semana 3', durationMinutes: 0, startDate: null, endDate: null, workoutCount: 0 },
                    { weekNumber: 4, weekLabel: 'Semana 4', durationMinutes: 0, startDate: null, endDate: null, workoutCount: 0 },
                ],
            });
            expect(hook.result.current.loading).toBe(false);
        });

        it('calculates total minutes/hours and divides workouts into 4 weekly buckets', async () => {
            const mockWorkouts = [
                {
                    id: 'w1',
                    fecha_dia: '2026-08-02',
                    hora_inicio: '2026-08-02T10:00:00.000Z',
                    hora_fin: '2026-08-02T11:00:00.000Z', // 60 mins
                },
                {
                    id: 'w2',
                    fecha_dia: '2026-08-05',
                    hora_inicio: '2026-08-05T18:00:00.000Z',
                    hora_fin: '2026-08-05T19:30:00.000Z', // 90 mins
                },
                {
                    id: 'w3',
                    fecha_dia: '2026-08-10',
                    hora_inicio: '2026-08-10T08:00:00.000Z',
                    hora_fin: '2026-08-10T08:45:00.000Z', // 45 mins
                },
                {
                    id: 'w4',
                    fecha_dia: null, // missing date key, ignored in weekly partition
                    hora_inicio: '2026-08-15T09:00:00.000Z',
                    hora_fin: '2026-08-15T10:00:00.000Z', // 60 mins
                },
                {
                    id: 'w5',
                    fecha_dia: '2026-08-25', // Week 4
                    // Missing hora_fin, so 0 duration added to total
                },
            ];

            (HistoryService.getMonthlyProgress as jest.Mock).mockResolvedValue({
                data: mockWorkouts,
                error: null,
            });

            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchMonthlyProgressByDate(2026, 7);
            });

            const processed = hook.result.current.processedMonthlyData;
            expect(processed).not.toBeNull();
            // Total duration = 60 + 90 + 45 + 60 = 255 mins (4 hours 15 mins)
            expect(processed?.totalDurationMinutes).toBe(255);
            expect(processed?.totalHours).toBe(4);
            expect(processed?.totalMinutes).toBe(15);
            expect(processed?.totalWorkouts).toBe(5);

            expect(processed?.weeklyData).toHaveLength(4);
            // Week 1 (w1 + w2 = 150 mins, 2 workouts)
            expect(processed?.weeklyData[0].workoutCount).toBe(2);
            expect(processed?.weeklyData[0].durationMinutes).toBe(150);
            // Week 2 (w3 = 45 mins, 1 workout)
            expect(processed?.weeklyData[1].workoutCount).toBe(1);
            expect(processed?.weeklyData[1].durationMinutes).toBe(45);
            // Week 3 (0 workouts with fecha_dia)
            expect(processed?.weeklyData[2].workoutCount).toBe(0);
            expect(processed?.weeklyData[2].durationMinutes).toBe(0);
            // Week 4 (w5 = 1 workout, 0 mins duration)
            expect(processed?.weeklyData[3].workoutCount).toBe(1);
            expect(processed?.weeklyData[3].durationMinutes).toBe(0);
        });

        it('catches and logs error when HistoryService.getMonthlyProgress throws', async () => {
            (HistoryService.getMonthlyProgress as jest.Mock).mockRejectedValue(new Error('Network error'));

            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchMonthlyProgressByDate(2026, 7);
            });

            expect(console.error).toHaveBeenCalledWith('Error fetching monthly progress by date:', expect.any(Error));
            expect(hook.result.current.loading).toBe(false);
        });
    });

    describe('fetchPhotos', () => {
        it('fetches and sets progress photos on success', async () => {
            const mockPhotos = [
                { id: 'p1', created_at: '2026-08-02T10:00:00Z', url_foto: 'url1' },
                { id: 'p2', created_at: '2026-08-01T10:00:00Z', url_foto: 'url2' },
            ];

            (ProgressService.getProgressPhotos as jest.Mock).mockResolvedValue({
                data: mockPhotos,
                error: null,
            });

            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchPhotos();
            });

            expect(ProgressService.getProgressPhotos).toHaveBeenCalledWith(mockUserId);
            expect(hook.result.current.progressPhotos).toEqual(mockPhotos);
            expect(hook.result.current.loading).toBe(false);
        });

        it('sets progressPhotos to empty array when data is null', async () => {
            (ProgressService.getProgressPhotos as jest.Mock).mockResolvedValue({
                data: null,
                error: null,
            });

            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchPhotos();
            });

            expect(hook.result.current.progressPhotos).toEqual([]);
            expect(hook.result.current.loading).toBe(false);
        });

        it('catches error and resets loading if ProgressService.getProgressPhotos throws', async () => {
            (ProgressService.getProgressPhotos as jest.Mock).mockRejectedValue(new Error('Storage Error'));

            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchPhotos();
            });

            expect(console.error).toHaveBeenCalledWith('Error fetching photos:', expect.any(Error));
            expect(hook.result.current.loading).toBe(false);
        });
    });

    describe('fetchExerciseHistory', () => {
        it('fetches and sets exercise history on success', async () => {
            const mockHistory = [
                { id: 'eh1', peso: 80, repeticiones: 10, fecha: '2026-08-01' },
            ];

            (HistoryService.getExerciseHistory as jest.Mock).mockResolvedValue({
                data: mockHistory,
                error: null,
            });

            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchExerciseHistory('ex-bench-press');
            });

            expect(HistoryService.getExerciseHistory).toHaveBeenCalledWith(mockUserId, 'ex-bench-press');
            expect(hook.result.current.exerciseHistory).toEqual(mockHistory);
            expect(hook.result.current.loading).toBe(false);
        });

        it('returns early and does not call service if exerciseId is empty', async () => {
            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchExerciseHistory('');
            });

            expect(HistoryService.getExerciseHistory).not.toHaveBeenCalled();
        });

        it('sets exerciseHistory to empty array when data is null', async () => {
            (HistoryService.getExerciseHistory as jest.Mock).mockResolvedValue({
                data: null,
                error: null,
            });

            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchExerciseHistory('ex-squat');
            });

            expect(hook.result.current.exerciseHistory).toEqual([]);
            expect(hook.result.current.loading).toBe(false);
        });

        it('catches error and resets loading if HistoryService.getExerciseHistory throws', async () => {
            (HistoryService.getExerciseHistory as jest.Mock).mockRejectedValue(new Error('Query error'));

            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchExerciseHistory('ex-squat');
            });

            expect(console.error).toHaveBeenCalledWith('Error fetching exercise history:', expect.any(Error));
            expect(hook.result.current.loading).toBe(false);
        });
    });

    describe('uploadPhoto', () => {
        it('uploads photo, prepends to state sorted descending by created_at, and returns true', async () => {
            const initialPhotos = [
                { id: 'p1', created_at: '2026-08-01T10:00:00Z', url_foto: 'u1' },
            ];

            (ProgressService.getProgressPhotos as jest.Mock).mockResolvedValue({
                data: initialPhotos,
                error: null,
            });

            const newPhoto = { id: 'p2', created_at: '2026-08-05T12:00:00Z', url_foto: 'u2' };
            (ProgressService.uploadProgressPhoto as jest.Mock).mockResolvedValue({
                data: newPhoto,
                error: null,
            });

            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchPhotos();
            });

            let success = false;
            const photoDate = new Date('2026-08-05T12:00:00Z');
            await act(async () => {
                success = await hook.result.current.uploadPhoto('file://pic2.jpg', photoDate, 'Progress photo 2');
            });

            expect(success).toBe(true);
            expect(ProgressService.uploadProgressPhoto).toHaveBeenCalledWith(
                mockUserId,
                'file://pic2.jpg',
                photoDate,
                'Progress photo 2'
            );
            expect(hook.result.current.progressPhotos).toEqual([newPhoto, initialPhotos[0]]);
        });

        it('returns false if ProgressService.uploadProgressPhoto returns null data', async () => {
            (ProgressService.uploadProgressPhoto as jest.Mock).mockResolvedValue({
                data: null,
                error: new Error('Upload error'),
            });

            const hook = await renderHook(() => useProgressController(mockUserId));

            let success = true;
            await act(async () => {
                success = await hook.result.current.uploadPhoto('file://pic.jpg', new Date(), 'test');
            });

            expect(success).toBe(false);
        });

        it('catches error and returns false if ProgressService.uploadProgressPhoto throws', async () => {
            (ProgressService.uploadProgressPhoto as jest.Mock).mockRejectedValue(new Error('Network offline'));

            const hook = await renderHook(() => useProgressController(mockUserId));

            let success = true;
            await act(async () => {
                success = await hook.result.current.uploadPhoto('file://pic.jpg', new Date(), 'test');
            });

            expect(success).toBe(false);
            expect(console.error).toHaveBeenCalledWith('Error uploading photo:', expect.any(Error));
        });
    });

    describe('deletePhotos', () => {
        it('returns false early if photoIds array is empty', async () => {
            const hook = await renderHook(() => useProgressController(mockUserId));

            let success: boolean | undefined;
            await act(async () => {
                success = await hook.result.current.deletePhotos([]);
            });

            expect(success).toBe(false);
            expect(ProgressService.deleteProgressPhotos).not.toHaveBeenCalled();
        });

        it('deletes photos, filters out from state, and returns true on success', async () => {
            const existingPhotos = [
                { id: 'p1', created_at: '2026-08-01T10:00:00Z' },
                { id: 'p2', created_at: '2026-08-02T10:00:00Z' },
                { id: 'p3', created_at: '2026-08-03T10:00:00Z' },
            ];

            (ProgressService.getProgressPhotos as jest.Mock).mockResolvedValue({
                data: existingPhotos,
                error: null,
            });

            (ProgressService.deleteProgressPhotos as jest.Mock).mockResolvedValue({
                success: true,
                error: null,
            });

            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchPhotos();
            });

            let deleteResult = false;
            await act(async () => {
                deleteResult = await hook.result.current.deletePhotos(['p1', 'p3']);
            });

            expect(deleteResult).toBe(true);
            expect(ProgressService.deleteProgressPhotos).toHaveBeenCalledWith(['p1', 'p3']);
            expect(hook.result.current.progressPhotos).toEqual([existingPhotos[1]]);
        });

        it('returns false if deleteProgressPhotos returns success: false', async () => {
            (ProgressService.deleteProgressPhotos as jest.Mock).mockResolvedValue({
                success: false,
                error: new Error('Delete failed'),
            });

            const hook = await renderHook(() => useProgressController(mockUserId));

            let success = true;
            await act(async () => {
                success = await hook.result.current.deletePhotos(['p1']);
            });

            expect(success).toBe(false);
        });

        it('catches error and returns false if deleteProgressPhotos throws', async () => {
            (ProgressService.deleteProgressPhotos as jest.Mock).mockRejectedValue(new Error('DB failure'));

            const hook = await renderHook(() => useProgressController(mockUserId));

            let success = true;
            await act(async () => {
                success = await hook.result.current.deletePhotos(['p1']);
            });

            expect(success).toBe(false);
            expect(console.error).toHaveBeenCalledWith('Error deleting photos:', expect.any(Error));
        });
    });

    describe('updatePhoto', () => {
        it('updates matching photo in state, re-sorts descending by created_at, and returns true', async () => {
            const existingPhotos = [
                { id: 'p1', created_at: '2026-08-01T10:00:00Z', comentario: 'Old 1' },
                { id: 'p2', created_at: '2026-08-02T10:00:00Z', comentario: 'Old 2' },
            ];

            (ProgressService.getProgressPhotos as jest.Mock).mockResolvedValue({
                data: existingPhotos,
                error: null,
            });

            // Updating p1 to have a newer created_at date so it re-orders before p2
            const updatedData = {
                id: 'p1',
                created_at: '2026-08-05T10:00:00Z',
                comentario: 'Updated comment',
            };

            (ProgressService.updateProgressPhoto as jest.Mock).mockResolvedValue({
                data: updatedData,
                error: null,
            });

            const hook = await renderHook(() => useProgressController(mockUserId));

            await act(async () => {
                await hook.result.current.fetchPhotos();
            });

            let success = false;
            await act(async () => {
                success = await hook.result.current.updatePhoto('p1', {
                    comentario: 'Updated comment',
                    created_at: '2026-08-05T10:00:00Z',
                });
            });

            expect(success).toBe(true);
            expect(ProgressService.updateProgressPhoto).toHaveBeenCalledWith('p1', {
                comentario: 'Updated comment',
                created_at: '2026-08-05T10:00:00Z',
            });
            expect(hook.result.current.progressPhotos).toEqual([
                { id: 'p1', created_at: '2026-08-05T10:00:00Z', comentario: 'Updated comment' },
                existingPhotos[1],
            ]);
        });

        it('returns false if updateProgressPhoto returns null data', async () => {
            (ProgressService.updateProgressPhoto as jest.Mock).mockResolvedValue({
                data: null,
                error: new Error('Update error'),
            });

            const hook = await renderHook(() => useProgressController(mockUserId));

            let success = true;
            await act(async () => {
                success = await hook.result.current.updatePhoto('p1', { comentario: 'test' });
            });

            expect(success).toBe(false);
        });

        it('catches error and returns false if updateProgressPhoto throws', async () => {
            (ProgressService.updateProgressPhoto as jest.Mock).mockRejectedValue(new Error('Update failed'));

            const hook = await renderHook(() => useProgressController(mockUserId));

            let success = true;
            await act(async () => {
                success = await hook.result.current.updatePhoto('p1', { comentario: 'test' });
            });

            expect(success).toBe(false);
            expect(console.error).toHaveBeenCalledWith('Error updating photo:', expect.any(Error));
        });
    });
});
