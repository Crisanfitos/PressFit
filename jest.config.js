module.exports = {
    preset: 'jest-expo',
    verbose: true,
    testEnvironment: 'node',
    roots: ['<rootDir>/__tests__'],
    testMatch: [
        '**/__tests__/**/*.test.ts',
        '**/__tests__/**/*.test.tsx'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '__tests__/e2e/',
        '__tests__/components/'
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    setupFiles: ['dotenv/config'],
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup/testSetup.ts'],
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-gifted-charts|gifted-charts-core)'
    ],
    collectCoverageFrom: [
        'src/services/**/*.ts',
        'src/controllers/**/*.ts',
        '!**/node_modules/**'
    ],
    coverageDirectory: 'coverage',
    testTimeout: 10000,
};
