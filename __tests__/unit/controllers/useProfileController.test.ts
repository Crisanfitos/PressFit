import { renderHook, act } from '@testing-library/react-native';
import { useProfileController } from '../../../src/controllers/useProfileController';
import { UserService } from '../../../src/services/UserService';
import { ProgressService } from '../../../src/services/ProgressService';

jest.mock('../../../src/services/UserService', () => ({
    UserService: {
        getUserMetrics: jest.fn(),
        saveUserMetrics: jest.fn(),
        uploadProfilePhoto: jest.fn(),
    },
}));

jest.mock('../../../src/services/ProgressService', () => ({
    ProgressService: {
        getProgressPhotos: jest.fn(),
        uploadProgressPhoto: jest.fn(),
    },
}));

describe('useProfileController (PF-260)', () => {
    const mockUser = {
        id: 'user-123',
        email: 'test@pressfit.app',
        user_metadata: {
            full_name: 'Test Athlete',
            avatar_url: 'https://example.com/avatar.jpg',
            custom_avatar_url: 'https://example.com/custom.jpg',
        },
    };

    const mockMetrics = {
        peso: 80,
        altura: 180,
        imc: 24.7,
        grasa_corporal: 19.2,
    };

    const mockPhotos = [
        {
            id: 'photo-1',
            usuario_id: 'user-123',
            foto_url: 'https://example.com/p1.jpg',
            created_at: '2026-09-01T08:00:00Z',
        },
        {
            id: 'photo-2',
            usuario_id: 'user-123',
            foto_url: 'https://example.com/p2.jpg',
            created_at: '2026-08-25T08:00:00Z',
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        (UserService.getUserMetrics as jest.Mock).mockResolvedValue({
            data: mockMetrics,
            error: null,
        });
        (ProgressService.getProgressPhotos as jest.Mock).mockResolvedValue({
            data: mockPhotos,
            error: null,
        });
    });

    describe('Initial State & Missing User Handling', () => {
        it('returns default initial state when user is null', async () => {
            const hook = await renderHook(() => useProfileController(null));

            expect(hook.result.current.profile).toBeNull();
            expect(hook.result.current.metrics).toBeNull();
            expect(hook.result.current.progressPhotos).toEqual([]);
            expect(hook.result.current.loading).toBe(true);
            expect(hook.result.current.loadingPhotos).toBe(false);
            expect(hook.result.current.uploadingPhoto).toBe(false);
            expect(hook.result.current.bodyFatPercentage).toBeNull();
            expect(UserService.getUserMetrics).not.toHaveBeenCalled();
            expect(ProgressService.getProgressPhotos).not.toHaveBeenCalled();
        });

        it('returns default initial state when user is undefined', async () => {
            const hook = await renderHook(() => useProfileController(undefined));

            expect(hook.result.current.profile).toBeNull();
            expect(hook.result.current.metrics).toBeNull();
            expect(hook.result.current.progressPhotos).toEqual([]);
            expect(UserService.getUserMetrics).not.toHaveBeenCalled();
            expect(ProgressService.getProgressPhotos).not.toHaveBeenCalled();
        });

        it('returns early from updateMetrics when user is not present', async () => {
            const hook = await renderHook(() => useProfileController(null));

            let result: any;
            await act(async () => {
                result = await hook.result.current.updateMetrics({ weight: 75, height: 175 });
            });

            expect(result).toBeUndefined();
            expect(UserService.saveUserMetrics).not.toHaveBeenCalled();
        });

        it('returns early from updateProfilePhoto when user is not present', async () => {
            const hook = await renderHook(() => useProfileController(null));

            let result: any;
            await act(async () => {
                result = await hook.result.current.updateProfilePhoto('file://photo.jpg');
            });

            expect(result).toBeUndefined();
            expect(UserService.uploadProfilePhoto).not.toHaveBeenCalled();
        });

        it('returns early from addProgressPhoto when user is not present', async () => {
            const hook = await renderHook(() => useProfileController(null));

            let result: any;
            await act(async () => {
                result = await hook.result.current.addProgressPhoto('file://progress.jpg');
            });

            expect(result).toBeUndefined();
            expect(ProgressService.uploadProgressPhoto).not.toHaveBeenCalled();
        });
    });

    describe('fetchProfileData', () => {
        it('loads user metrics and profile on mount successfully', async () => {
            const hook = await renderHook(() => useProfileController(mockUser));

            expect(UserService.getUserMetrics).toHaveBeenCalledWith('user-123');
            expect(hook.result.current.metrics).toEqual(mockMetrics);
            expect(hook.result.current.profile).toEqual(mockUser);
            expect(hook.result.current.loading).toBe(false);
        });

        it('catches and logs error if UserService.getUserMetrics throws', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            (UserService.getUserMetrics as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            const hook = await renderHook(() => useProfileController(mockUser));

            expect(consoleSpy).toHaveBeenCalledWith('Error fetching profile data:', expect.any(Error));
            expect(hook.result.current.loading).toBe(false);
            expect(hook.result.current.metrics).toBeNull();
            consoleSpy.mockRestore();
        });
    });

    describe('fetchPhotos', () => {
        it('loads progress photos on mount successfully', async () => {
            const hook = await renderHook(() => useProfileController(mockUser));

            expect(ProgressService.getProgressPhotos).toHaveBeenCalledWith('user-123');
            expect(hook.result.current.progressPhotos).toEqual(mockPhotos);
            expect(hook.result.current.loadingPhotos).toBe(false);
        });

        it('falls back to empty array if ProgressService.getProgressPhotos returns null data', async () => {
            (ProgressService.getProgressPhotos as jest.Mock).mockResolvedValueOnce({
                data: null,
                error: null,
            });

            const hook = await renderHook(() => useProfileController(mockUser));

            expect(hook.result.current.progressPhotos).toEqual([]);
            expect(hook.result.current.loadingPhotos).toBe(false);
        });

        it('catches and logs error if ProgressService.getProgressPhotos throws', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            (ProgressService.getProgressPhotos as jest.Mock).mockRejectedValueOnce(new Error('Photos error'));

            const hook = await renderHook(() => useProfileController(mockUser));

            expect(consoleSpy).toHaveBeenCalledWith('Error fetching photos:', expect.any(Error));
            expect(hook.result.current.loadingPhotos).toBe(false);
            expect(hook.result.current.progressPhotos).toEqual([]);
            consoleSpy.mockRestore();
        });
    });

    describe('updateMetrics', () => {
        it('calculates IMC and estimates body fat when bodyFatPercentage is omitted', async () => {
            const savedData = {
                peso: 75,
                altura: 175,
                imc: 24.5,
                grasa_corporal: 18.9,
            };
            (UserService.saveUserMetrics as jest.Mock).mockResolvedValueOnce({
                data: savedData,
                error: null,
            });

            const hook = await renderHook(() => useProfileController(mockUser));

            let result: any;
            await act(async () => {
                // weight: 75, height: 175cm -> heightM: 1.75 -> IMC: 75 / (1.75*1.75) = 24.489 -> 24.5
                // bf = 1.2 * 24.5 - 10.45 = 29.4 - 10.45 = 18.95 -> 18.9 (via toFixed(1))
                result = await hook.result.current.updateMetrics({ weight: 75, height: 175 });
            });

            expect(UserService.saveUserMetrics).toHaveBeenCalledWith('user-123', {
                weight: 75,
                height: 175,
                imc: 24.5,
                bodyFatPercentage: 18.9,
            });
            expect(result).toEqual(savedData);
            expect(hook.result.current.metrics).toEqual(savedData);
        });

        it('calculates IMC and estimates body fat when bodyFatPercentage is null', async () => {
            const savedData = {
                peso: 80,
                altura: 180,
                imc: 24.7,
                grasa_corporal: 19.2,
            };
            (UserService.saveUserMetrics as jest.Mock).mockResolvedValueOnce({
                data: savedData,
                error: null,
            });

            const hook = await renderHook(() => useProfileController(mockUser));

            let result: any;
            await act(async () => {
                result = await hook.result.current.updateMetrics({
                    weight: 80,
                    height: 180,
                    bodyFatPercentage: null as any,
                });
            });

            expect(UserService.saveUserMetrics).toHaveBeenCalledWith('user-123', {
                weight: 80,
                height: 180,
                imc: 24.7,
                bodyFatPercentage: 19.2,
            });
            expect(result).toEqual(savedData);
        });

        it('uses explicit bodyFatPercentage when provided without calculating estimation', async () => {
            const savedData = {
                peso: 70,
                altura: 170,
                imc: 24.2,
                grasa_corporal: 14.5,
            };
            (UserService.saveUserMetrics as jest.Mock).mockResolvedValueOnce({
                data: savedData,
                error: null,
            });

            const hook = await renderHook(() => useProfileController(mockUser));

            let result: any;
            await act(async () => {
                result = await hook.result.current.updateMetrics({
                    weight: 70,
                    height: 170,
                    bodyFatPercentage: 14.5,
                });
            });

            expect(UserService.saveUserMetrics).toHaveBeenCalledWith('user-123', {
                weight: 70,
                height: 170,
                imc: 24.2,
                bodyFatPercentage: 14.5,
            });
            expect(result).toEqual(savedData);
        });

        it('handles NaN IMC gracefully when bodyFatPercentage is omitted and weight is NaN', async () => {
            (UserService.saveUserMetrics as jest.Mock).mockResolvedValueOnce({
                data: null,
                error: null,
            });

            const hook = await renderHook(() => useProfileController(mockUser));

            await act(async () => {
                await hook.result.current.updateMetrics({
                    weight: NaN,
                    height: 175,
                });
            });

            expect(UserService.saveUserMetrics).toHaveBeenCalledWith('user-123', {
                weight: NaN,
                height: 175,
                imc: NaN,
                bodyFatPercentage: undefined,
            });
        });

        it('throws error when UserService.saveUserMetrics returns an error object', async () => {
            (UserService.saveUserMetrics as jest.Mock).mockResolvedValueOnce({
                data: null,
                error: new Error('Save error'),
            });

            const hook = await renderHook(() => useProfileController(mockUser));

            await expect(
                act(async () => {
                    await hook.result.current.updateMetrics({ weight: 75, height: 175 });
                })
            ).rejects.toThrow('Save error');
        });

        it('catches and rethrows when UserService.saveUserMetrics throws an exception', async () => {
            (UserService.saveUserMetrics as jest.Mock).mockRejectedValueOnce(new Error('Fatal DB crash'));

            const hook = await renderHook(() => useProfileController(mockUser));

            await expect(
                act(async () => {
                    await hook.result.current.updateMetrics({ weight: 75, height: 175 });
                })
            ).rejects.toThrow('Fatal DB crash');
        });
    });

    describe('updateProfilePhoto', () => {
        it('uploads profile photo and returns url on success', async () => {
            (UserService.uploadProfilePhoto as jest.Mock).mockResolvedValueOnce({
                url: 'https://example.com/new-avatar.jpg',
                error: null,
            });

            const hook = await renderHook(() => useProfileController(mockUser));

            let url: any;
            await act(async () => {
                url = await hook.result.current.updateProfilePhoto('file://new-avatar.jpg');
            });

            expect(UserService.uploadProfilePhoto).toHaveBeenCalledWith('user-123', 'file://new-avatar.jpg');
            expect(url).toBe('https://example.com/new-avatar.jpg');
            expect(hook.result.current.uploadingPhoto).toBe(false);
        });

        it('throws error and resets uploadingPhoto if UserService.uploadProfilePhoto returns error', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            (UserService.uploadProfilePhoto as jest.Mock).mockResolvedValueOnce({
                url: null,
                error: new Error('Upload failed'),
            });

            const hook = await renderHook(() => useProfileController(mockUser));

            await expect(
                act(async () => {
                    await hook.result.current.updateProfilePhoto('file://bad-photo.jpg');
                })
            ).rejects.toThrow('Upload failed');

            expect(consoleSpy).toHaveBeenCalledWith('Error updating profile photo:', expect.any(Error));
            expect(hook.result.current.uploadingPhoto).toBe(false);
            consoleSpy.mockRestore();
        });

        it('catches, logs and rethrows if UserService.uploadProfilePhoto throws exception', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            (UserService.uploadProfilePhoto as jest.Mock).mockRejectedValueOnce(new Error('Network offline'));

            const hook = await renderHook(() => useProfileController(mockUser));

            await expect(
                act(async () => {
                    await hook.result.current.updateProfilePhoto('file://bad-photo.jpg');
                })
            ).rejects.toThrow('Network offline');

            expect(consoleSpy).toHaveBeenCalledWith('Error updating profile photo:', expect.any(Error));
            expect(hook.result.current.uploadingPhoto).toBe(false);
            consoleSpy.mockRestore();
        });
    });

    describe('addProgressPhoto', () => {
        it('uploads progress photo, re-fetches photos, and returns data on success', async () => {
            const newPhoto = {
                id: 'photo-new',
                usuario_id: 'user-123',
                foto_url: 'https://example.com/new-progress.jpg',
                created_at: '2026-09-01T09:00:00Z',
            };
            (ProgressService.uploadProgressPhoto as jest.Mock).mockResolvedValueOnce({
                data: newPhoto,
                error: null,
            });

            const hook = await renderHook(() => useProfileController(mockUser));
            jest.clearAllMocks(); // Clear initial mount fetch calls

            (ProgressService.getProgressPhotos as jest.Mock).mockResolvedValueOnce({
                data: [newPhoto, ...mockPhotos],
                error: null,
            });

            let result: any;
            await act(async () => {
                result = await hook.result.current.addProgressPhoto('file://new-progress.jpg');
            });

            expect(ProgressService.uploadProgressPhoto).toHaveBeenCalledWith(
                'user-123',
                'file://new-progress.jpg',
                expect.any(Date),
                ''
            );
            expect(ProgressService.getProgressPhotos).toHaveBeenCalledWith('user-123');
            expect(result).toEqual(newPhoto);
            expect(hook.result.current.progressPhotos).toEqual([newPhoto, ...mockPhotos]);
            expect(hook.result.current.uploadingPhoto).toBe(false);
        });

        it('throws error and resets uploadingPhoto if ProgressService.uploadProgressPhoto returns error', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            (ProgressService.uploadProgressPhoto as jest.Mock).mockResolvedValueOnce({
                data: null,
                error: new Error('Upload progress failed'),
            });

            const hook = await renderHook(() => useProfileController(mockUser));

            await expect(
                act(async () => {
                    await hook.result.current.addProgressPhoto('file://bad-progress.jpg');
                })
            ).rejects.toThrow('Upload progress failed');

            expect(consoleSpy).toHaveBeenCalledWith('Error adding progress photo:', expect.any(Error));
            expect(hook.result.current.uploadingPhoto).toBe(false);
            consoleSpy.mockRestore();
        });

        it('catches, logs and rethrows if ProgressService.uploadProgressPhoto throws exception', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            (ProgressService.uploadProgressPhoto as jest.Mock).mockRejectedValueOnce(new Error('Storage disk full'));

            const hook = await renderHook(() => useProfileController(mockUser));

            await expect(
                act(async () => {
                    await hook.result.current.addProgressPhoto('file://bad-progress.jpg');
                })
            ).rejects.toThrow('Storage disk full');

            expect(consoleSpy).toHaveBeenCalledWith('Error adding progress photo:', expect.any(Error));
            expect(hook.result.current.uploadingPhoto).toBe(false);
            consoleSpy.mockRestore();
        });
    });

    describe('calculateBodyFat / bodyFatPercentage', () => {
        it('returns null when metrics is null', async () => {
            (UserService.getUserMetrics as jest.Mock).mockResolvedValueOnce({
                data: null,
                error: null,
            });

            const hook = await renderHook(() => useProfileController(mockUser));

            expect(hook.result.current.bodyFatPercentage).toBeNull();
        });

        it('returns null when peso is missing or 0', async () => {
            (UserService.getUserMetrics as jest.Mock).mockResolvedValueOnce({
                data: { altura: 180 },
                error: null,
            });

            const hook = await renderHook(() => useProfileController(mockUser));

            expect(hook.result.current.bodyFatPercentage).toBeNull();
        });

        it('returns null when altura is missing or 0', async () => {
            (UserService.getUserMetrics as jest.Mock).mockResolvedValueOnce({
                data: { peso: 80 },
                error: null,
            });

            const hook = await renderHook(() => useProfileController(mockUser));

            expect(hook.result.current.bodyFatPercentage).toBeNull();
        });

        it('returns existing grasa_corporal directly when present in metrics', async () => {
            (UserService.getUserMetrics as jest.Mock).mockResolvedValueOnce({
                data: { peso: 80, altura: 180, grasa_corporal: 15.5 },
                error: null,
            });

            const hook = await renderHook(() => useProfileController(mockUser));

            expect(hook.result.current.bodyFatPercentage).toBe(15.5);
        });

        it('calculates estimated body fat formula when grasa_corporal is missing but peso & altura exist', async () => {
            // peso: 80, altura: 180 -> heightM: 1.8 -> bmi: 80 / (1.8*1.8) = 24.691358
            // bf: 1.2 * 24.691358 - 10.45 = 29.6296 - 10.45 = 19.1796 -> "19.2"
            (UserService.getUserMetrics as jest.Mock).mockResolvedValueOnce({
                data: { peso: 80, altura: 180 },
                error: null,
            });

            const hook = await renderHook(() => useProfileController(mockUser));

            expect(hook.result.current.bodyFatPercentage).toBe('19.2');
        });
    });
});
