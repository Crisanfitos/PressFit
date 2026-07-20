module.exports = {
    preset: 'jest-expo',
    verbose: true,
    roots: ['<rootDir>/__tests__/components'],
    testMatch: [
        '**/__tests__/components/**/*.test.tsx',
        '**/__tests__/components/**/*.test.ts'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '__tests__/e2e/',
        '__tests__/unit/'
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    setupFiles: ['dotenv/config'],
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup/componentTestSetup.ts'],
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-gifted-charts|gifted-charts-core)'
    ],
    collectCoverageFrom: [
        'src/components/**/*.{ts,tsx}',
        'src/screens/**/*.{ts,tsx}',
        '!**/node_modules/**'
    ],
    coverageDirectory: 'coverage-components',
    testTimeout: 15000,
};
