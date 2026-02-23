module.exports = {
    preset: 'jest-expo',
    verbose: true,
    testEnvironment: 'node',
    roots: ['<rootDir>/__tests__'],
    testMatch: [
        '**/__tests__/**/*.test.ts',
        '**/__tests__/**/*.test.tsx'
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup/testSetup.ts'],
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
    ],
    collectCoverageFrom: [
        'src/services/**/*.ts',
        'src/controllers/**/*.ts',
        '!**/node_modules/**'
    ],
    coverageDirectory: 'coverage',
    testTimeout: 30000, // 30s para operaciones de BD
    // projects removed for debugging
    collectCoverageFrom: [
        'src/services/**/*.ts',
        'src/controllers/**/*.ts',
        '!**/node_modules/**'
    ]
};
