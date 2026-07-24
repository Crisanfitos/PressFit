module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/e2e/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 180000,
  globalSetup: '<rootDir>/node_modules/detox/runners/jest/globalSetup.js',
  globalTeardown: '<rootDir>/node_modules/detox/runners/jest/globalTeardown.js',
  testEnvironment: '<rootDir>/node_modules/detox/runners/jest/testEnvironment',
};