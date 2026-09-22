import expoConfig from 'eslint-config-expo/flat.js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
  expoConfig,
  {
    files: ['e2e/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'coverage/**',
      'android/**',
      'ios/**',
      'dist/**',
      '.agents/**',
    ],
  },
]);
