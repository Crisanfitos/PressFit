import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

export const SecureStoreAdapter = {
    getItem: (key: string): Promise<string | null> => {
        if (typeof Platform !== 'undefined' && Platform?.OS === 'web') {
            return AsyncStorage.getItem(key);
        }
        return SecureStore.getItemAsync(key);
    },
    setItem: (key: string, value: string): Promise<void> => {
        if (typeof Platform !== 'undefined' && Platform?.OS === 'web') {
            return AsyncStorage.setItem(key, value);
        }
        return SecureStore.setItemAsync(key, value);
    },
    removeItem: (key: string): Promise<void> => {
        if (typeof Platform !== 'undefined' && Platform?.OS === 'web') {
            return AsyncStorage.removeItem(key);
        }
        return SecureStore.deleteItemAsync(key);
    },
};

const supabaseUrl =
    process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

// Supabase a veces te da la anon key como EXPO_PUBLIC_SUPABASE_KEY.
const supabaseAnonKey =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and either EXPO_PUBLIC_SUPABASE_ANON_KEY or EXPO_PUBLIC_SUPABASE_KEY (or SUPABASE_URL/SUPABASE_ANON_KEY).'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: SecureStoreAdapter,
        autoRefreshToken: process.env.NODE_ENV !== 'test',
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground.
AppState.addEventListener('change', (state) => {
    if (state === 'active') {
        supabase.auth.startAutoRefresh();
    } else {
        supabase.auth.stopAutoRefresh();
    }
});
