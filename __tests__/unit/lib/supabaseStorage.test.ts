import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { SecureStoreAdapter, supabase } from '../../../src/lib/supabase';

describe('SecureStoreAdapter', () => {
    const originalPlatform = Platform.OS;

    beforeEach(() => {
        jest.clearAllMocks();
        (Platform as any).OS = 'android';
    });

    afterAll(() => {
        supabase.auth.stopAutoRefresh();
        (Platform as any).OS = originalPlatform;
    });

    describe('Native Platforms (Android / iOS)', () => {
        beforeEach(() => {
            (Platform as any).OS = 'android';
        });

        it('should get item via SecureStore.getItemAsync', async () => {
            (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('test-token');

            const result = await SecureStoreAdapter.getItem('sb-token');

            expect(SecureStore.getItemAsync).toHaveBeenCalledWith('sb-token');
            expect(AsyncStorage.getItem).not.toHaveBeenCalled();
            expect(result).toBe('test-token');
        });

        it('should set item via SecureStore.setItemAsync', async () => {
            (SecureStore.setItemAsync as jest.Mock).mockResolvedValueOnce(undefined);

            await SecureStoreAdapter.setItem('sb-token', 'my-val');

            expect(SecureStore.setItemAsync).toHaveBeenCalledWith('sb-token', 'my-val');
            expect(AsyncStorage.setItem).not.toHaveBeenCalled();
        });

        it('should remove item via SecureStore.deleteItemAsync', async () => {
            (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValueOnce(undefined);

            await SecureStoreAdapter.removeItem('sb-token');

            expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('sb-token');
            expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
        });
    });

    describe('Web Platform', () => {
        beforeEach(() => {
            (Platform as any).OS = 'web';
        });

        it('should fallback to AsyncStorage.getItem on web', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('web-token');

            const result = await SecureStoreAdapter.getItem('sb-token');

            expect(AsyncStorage.getItem).toHaveBeenCalledWith('sb-token');
            expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
            expect(result).toBe('web-token');
        });

        it('should fallback to AsyncStorage.setItem on web', async () => {
            (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

            await SecureStoreAdapter.setItem('sb-token', 'web-val');

            expect(AsyncStorage.setItem).toHaveBeenCalledWith('sb-token', 'web-val');
            expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
        });

        it('should fallback to AsyncStorage.removeItem on web', async () => {
            (AsyncStorage.removeItem as jest.Mock).mockResolvedValueOnce(undefined);

            await SecureStoreAdapter.removeItem('sb-token');

            expect(AsyncStorage.removeItem).toHaveBeenCalledWith('sb-token');
            expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
        });
    });
});
