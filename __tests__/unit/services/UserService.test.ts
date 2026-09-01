import { UserService } from '../../../src/services/UserService';
import { supabase } from '../../../src/lib/supabase';
import { User } from '@supabase/supabase-js';

jest.mock('../../../src/lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
        storage: {
            from: jest.fn(),
        },
        auth: {
            updateUser: jest.fn(),
        },
    },
}));

describe('UserService (PF-264)', () => {
    const mockUserId = 'user-123';

    // Mock query builders
    let queryBuilder: any;
    let storageBucket: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});

        queryBuilder = {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            upsert: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };

        (supabase.from as jest.Mock).mockReturnValue(queryBuilder);

        storageBucket = {
            upload: jest.fn().mockResolvedValue({ data: { path: 'path' }, error: null }),
            getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/avatar.jpg' } }),
        };

        (supabase.storage.from as jest.Mock).mockReturnValue(storageBucket);
        (supabase.auth.updateUser as jest.Mock).mockResolvedValue({ data: { user: {} }, error: null });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('createOrUpdateProfile', () => {
        it('upserts user profile with full_name from metadata and returns data', async () => {
            const mockUser: Partial<User> = {
                id: 'user-789',
                email: 'test@example.com',
                user_metadata: {
                    full_name: 'John Doe',
                },
            };

            const mockProfile = {
                id: 'user-789',
                email: 'test@example.com',
                nombre: 'John Doe',
                updated_at: '2026-09-01T10:00:00.000Z',
            };

            queryBuilder.single.mockResolvedValueOnce({
                data: mockProfile,
                error: null,
            });

            const result = await UserService.createOrUpdateProfile(mockUser as User);

            expect(supabase.from).toHaveBeenCalledWith('usuarios');
            expect(queryBuilder.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'user-789',
                    email: 'test@example.com',
                    nombre: 'John Doe',
                })
            );
            expect(result).toEqual({
                data: mockProfile,
                error: null,
            });
        });

        it('defaults nombre to empty string if user_metadata is undefined', async () => {
            const mockUser: Partial<User> = {
                id: 'user-789',
                email: 'noname@example.com',
                user_metadata: undefined,
            };

            queryBuilder.single.mockResolvedValueOnce({
                data: { id: 'user-789', email: 'noname@example.com', nombre: '' },
                error: null,
            });

            const result = await UserService.createOrUpdateProfile(mockUser as User);

            expect(queryBuilder.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    nombre: '',
                })
            );
            expect(result.error).toBeNull();
        });

        it('handles Postgrest error and returns { data: null, error }', async () => {
            const dbError = { message: 'Duplicate key', code: '23505' };
            queryBuilder.single.mockResolvedValueOnce({
                data: null,
                error: dbError,
            });

            const mockUser: Partial<User> = { id: 'user-789', email: 'error@example.com' };
            const result = await UserService.createOrUpdateProfile(mockUser as User);

            expect(result).toEqual({
                data: null,
                error: dbError,
            });
            expect(console.error).toHaveBeenCalledWith('Error creating/updating profile:', dbError);
        });

        it('catches thrown exceptions and returns { data: null, error }', async () => {
            const networkError = new Error('Network timeout');
            queryBuilder.single.mockRejectedValueOnce(networkError);

            const mockUser: Partial<User> = { id: 'user-789', email: 'error@example.com' };
            const result = await UserService.createOrUpdateProfile(mockUser as User);

            expect(result).toEqual({
                data: null,
                error: networkError,
            });
            expect(console.error).toHaveBeenCalledWith('Error creating/updating profile:', networkError);
        });
    });

    describe('saveUserMetrics', () => {
        it('calculates IMC, converts height to meters for DB and reconverts to CM in return data', async () => {
            // weight 80, height 180 (1.8m) -> IMC = 80 / (1.8^2) = 24.6913... -> 24.7
            const metrics = {
                weight: 80,
                height: 180,
                bodyFatPercentage: 15,
            };

            const returnedProfile = {
                id: mockUserId,
                peso: 80,
                altura: 1.8, // in meters from DB
                grasa_corporal: 15,
                imc: 24.7,
            };

            queryBuilder.single.mockResolvedValueOnce({
                data: { ...returnedProfile },
                error: null,
            });

            const result = await UserService.saveUserMetrics(mockUserId, metrics);

            expect(supabase.from).toHaveBeenCalledWith('usuarios');
            expect(queryBuilder.update).toHaveBeenCalledWith({
                peso: 80,
                altura: 1.8,
                grasa_corporal: 15,
                imc: 24.7,
            });
            expect(queryBuilder.eq).toHaveBeenCalledWith('id', mockUserId);

            // Verify weight history insert
            expect(supabase.from).toHaveBeenCalledWith('historial_peso');
            expect(queryBuilder.insert).toHaveBeenCalledWith({
                usuario_id: mockUserId,
                peso: 80,
            });

            // Height reconverted to CM
            expect(result.data?.altura).toBe(180);
            expect(result.error).toBeNull();
        });

        it('preserves predefined metrics.imc if already provided', async () => {
            const metrics = {
                weight: 80,
                height: 180,
                imc: 25.5, // explicitly set
            };

            queryBuilder.single.mockResolvedValueOnce({
                data: { id: mockUserId, altura: 1.8, imc: 25.5 },
                error: null,
            });

            const result = await UserService.saveUserMetrics(mockUserId, metrics);

            expect(queryBuilder.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    imc: 25.5,
                    grasa_corporal: null,
                })
            );
            expect(result.error).toBeNull();
        });

        it('does not crash if returned data has no altura', async () => {
            const metrics = {
                weight: 70,
                height: 170,
            };

            queryBuilder.single.mockResolvedValueOnce({
                data: { id: mockUserId, altura: null },
                error: null,
            });

            const result = await UserService.saveUserMetrics(mockUserId, metrics);

            expect(result.data?.altura).toBeNull();
            expect(result.error).toBeNull();
        });

        it('does not insert into historial_peso if metrics.weight is 0 or falsy', async () => {
            const metrics = {
                weight: 0,
                height: 175,
            };

            queryBuilder.single.mockResolvedValueOnce({
                data: { id: mockUserId, altura: 1.75 },
                error: null,
            });

            await UserService.saveUserMetrics(mockUserId, metrics);

            expect(queryBuilder.insert).not.toHaveBeenCalled();
        });

        it('handles error from update query and returns { data: null, error }', async () => {
            const updateError = { message: 'Update failed' };
            queryBuilder.single.mockResolvedValueOnce({
                data: null,
                error: updateError,
            });

            const result = await UserService.saveUserMetrics(mockUserId, { weight: 70, height: 170 });

            expect(result).toEqual({
                data: null,
                error: updateError,
            });
            expect(console.error).toHaveBeenCalledWith('Error saving user metrics:', updateError);
        });

        it('catches thrown exceptions during saveUserMetrics and returns { data: null, error }', async () => {
            const thrownError = new Error('Database disconnected');
            queryBuilder.single.mockRejectedValueOnce(thrownError);

            const result = await UserService.saveUserMetrics(mockUserId, { weight: 70, height: 170 });

            expect(result).toEqual({
                data: null,
                error: thrownError,
            });
            expect(console.error).toHaveBeenCalledWith('Error saving user metrics:', thrownError);
        });
    });

    describe('getUserMetrics', () => {
        it('fetches metrics and converts altura from meters to cm', async () => {
            const dbData = {
                peso: 75,
                altura: 1.78, // in meters
                grasa_corporal: 14.5,
                imc: 23.7,
                updated_at: '2026-08-30T12:00:00Z',
            };

            queryBuilder.single.mockResolvedValueOnce({
                data: { ...dbData },
                error: null,
            });

            const result = await UserService.getUserMetrics(mockUserId);

            expect(supabase.from).toHaveBeenCalledWith('usuarios');
            expect(queryBuilder.select).toHaveBeenCalledWith('peso, altura, grasa_corporal, imc, updated_at');
            expect(queryBuilder.eq).toHaveBeenCalledWith('id', mockUserId);
            expect(result.data?.altura).toBe(178);
            expect(result.error).toBeNull();
        });

        it('silences PGRST116 (not found) error and returns { data: null, error: null }', async () => {
            const pgrstError = {
                code: 'PGRST116',
                message: 'JSON object requested, multiple (or no) rows returned',
            };

            queryBuilder.single.mockResolvedValueOnce({
                data: null,
                error: pgrstError,
            });

            const result = await UserService.getUserMetrics('user-new');

            expect(result).toEqual({
                data: null,
                error: null,
            });
            expect(console.error).not.toHaveBeenCalled();
        });

        it('handles non-PGRST116 errors by throwing and returning { data: null, error }', async () => {
            const dbError = {
                code: '42P01',
                message: 'relation "usuarios" does not exist',
            };

            queryBuilder.single.mockResolvedValueOnce({
                data: null,
                error: dbError,
            });

            const result = await UserService.getUserMetrics(mockUserId);

            expect(result).toEqual({
                data: null,
                error: dbError,
            });
            expect(console.error).toHaveBeenCalledWith('Error fetching user metrics:', dbError);
        });

        it('catches thrown exceptions and returns { data: null, error }', async () => {
            const exception = new Error('Unexpected crash');
            queryBuilder.single.mockRejectedValueOnce(exception);

            const result = await UserService.getUserMetrics(mockUserId);

            expect(result).toEqual({
                data: null,
                error: exception,
            });
            expect(console.error).toHaveBeenCalledWith('Error fetching user metrics:', exception);
        });
    });

    describe('uploadProfilePhoto', () => {
        const mockPhotoUri = 'file:///path/to/my-avatar.png';

        beforeEach(() => {
            // Mock global fetch & Response
            const mockBlob = new Blob(['dummy-image-content'], { type: 'image/png' });
            global.fetch = jest.fn().mockResolvedValue({
                blob: jest.fn().mockResolvedValue(mockBlob),
            } as any);

            // Mock Response arrayBuffer
            global.Response = jest.fn().mockImplementation(() => ({
                arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
            })) as any;
        });

        it('fetches photo blob, uploads to storage, updates auth metadata and usuarios table', async () => {
            const result = await UserService.uploadProfilePhoto(mockUserId, mockPhotoUri);

            expect(global.fetch).toHaveBeenCalledWith(mockPhotoUri);
            expect(supabase.storage.from).toHaveBeenCalledWith('fotos-perfil');
            expect(storageBucket.upload).toHaveBeenCalledWith(
                expect.stringMatching(new RegExp(`^${mockUserId}/\\d+\\.png$`)),
                expect.any(ArrayBuffer),
                {
                    contentType: 'image/png',
                    upsert: true,
                }
            );

            expect(storageBucket.getPublicUrl).toHaveBeenCalled();
            expect(supabase.auth.updateUser).toHaveBeenCalledWith({
                data: { custom_avatar_url: 'https://cdn.example.com/avatar.jpg' },
            });

            expect(supabase.from).toHaveBeenCalledWith('usuarios');
            expect(queryBuilder.update).toHaveBeenCalledWith({
                url_foto: 'https://cdn.example.com/avatar.jpg',
            });
            expect(queryBuilder.eq).toHaveBeenCalledWith('id', mockUserId);

            expect(result).toEqual({
                url: 'https://cdn.example.com/avatar.jpg',
                error: null,
            });
        });

        it('defaults file extension to jpg when photoUri split yields no extension', async () => {
            const uriWithoutExt = '';

            await UserService.uploadProfilePhoto(mockUserId, uriWithoutExt);

            expect(storageBucket.upload).toHaveBeenCalledWith(
                expect.stringMatching(new RegExp(`^${mockUserId}/\\d+\\.jpg$`)),
                expect.any(ArrayBuffer),
                expect.objectContaining({
                    contentType: 'image/jpg',
                })
            );
        });

        it('handles storage upload error and returns { url: null, error }', async () => {
            const uploadError = { message: 'Bucket full' };
            storageBucket.upload.mockResolvedValueOnce({
                data: null,
                error: uploadError,
            });

            const result = await UserService.uploadProfilePhoto(mockUserId, mockPhotoUri);

            expect(result).toEqual({
                url: null,
                error: uploadError,
            });
            expect(console.error).toHaveBeenCalledWith('Error uploading profile photo:', uploadError);
        });

        it('handles auth.updateUser error and returns { url: null, error }', async () => {
            const authError = { message: 'User unauthorized' };
            (supabase.auth.updateUser as jest.Mock).mockResolvedValueOnce({
                data: null,
                error: authError,
            });

            const result = await UserService.uploadProfilePhoto(mockUserId, mockPhotoUri);

            expect(result).toEqual({
                url: null,
                error: authError,
            });
            expect(console.error).toHaveBeenCalledWith('Error uploading profile photo:', authError);
        });

        it('catches thrown exceptions during upload and returns { url: null, error }', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('File not found'));

            const result = await UserService.uploadProfilePhoto(mockUserId, mockPhotoUri);

            expect(result.url).toBeNull();
            expect(result.error).toBeInstanceOf(Error);
            expect(console.error).toHaveBeenCalledWith('Error uploading profile photo:', expect.any(Error));
        });
    });

    describe('getWeightHistory', () => {
        it('fetches weight history with specified or default limit and ordering', async () => {
            const mockHistory = [
                { id: 'w-1', peso: 80, created_at: '2026-08-01T00:00:00Z' },
                { id: 'w-2', peso: 79.5, created_at: '2026-08-08T00:00:00Z' },
            ];

            queryBuilder.limit.mockResolvedValueOnce({
                data: mockHistory,
                error: null,
            });

            const result = await UserService.getWeightHistory(mockUserId, 10);

            expect(supabase.from).toHaveBeenCalledWith('historial_peso');
            expect(queryBuilder.select).toHaveBeenCalledWith('id, peso, created_at');
            expect(queryBuilder.eq).toHaveBeenCalledWith('usuario_id', mockUserId);
            expect(queryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: true });
            expect(queryBuilder.limit).toHaveBeenCalledWith(10);
            expect(result).toEqual({
                data: mockHistory,
                error: null,
            });
        });

        it('uses default limit of 20 when limit is omitted and falls back to empty array if data is null', async () => {
            queryBuilder.limit.mockResolvedValueOnce({
                data: null,
                error: null,
            });

            const result = await UserService.getWeightHistory(mockUserId);

            expect(queryBuilder.limit).toHaveBeenCalledWith(20);
            expect(result).toEqual({
                data: [],
                error: null,
            });
        });

        it('handles error and returns { data: null, error }', async () => {
            const dbError = { message: 'Permission denied', code: '42501' };
            queryBuilder.limit.mockResolvedValueOnce({
                data: null,
                error: dbError,
            });

            const result = await UserService.getWeightHistory(mockUserId);

            expect(result).toEqual({
                data: null,
                error: dbError,
            });
            expect(console.error).toHaveBeenCalledWith('Error fetching weight history:', dbError);
        });

        it('catches thrown exceptions and returns { data: null, error }', async () => {
            const timeoutError = new Error('Request timeout');
            queryBuilder.limit.mockRejectedValueOnce(timeoutError);

            const result = await UserService.getWeightHistory(mockUserId);

            expect(result).toEqual({
                data: null,
                error: timeoutError,
            });
            expect(console.error).toHaveBeenCalledWith('Error fetching weight history:', timeoutError);
        });
    });
});
