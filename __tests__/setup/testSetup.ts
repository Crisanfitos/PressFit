/**
 * Global Test Setup
 *
 * Configures mocks and environment for all unit tests.
 * - Mocks AsyncStorage (React Native dependency)
 * - Sets extended timeout for async operations
 *
 * Each test file is responsible for mocking supabase via mockSupabase helper.
 */

// Mock AsyncStorage globally (required for React Native)
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Extended timeout for tests
jest.setTimeout(10000);
