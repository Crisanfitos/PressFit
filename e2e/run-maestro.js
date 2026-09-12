#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const dotenv = require('dotenv');

// 1. Cargar variables de entorno desde .env.e2e
const localEnvPath = path.resolve(__dirname, '.env.e2e');
const rootEnvPath = path.resolve(__dirname, '..', '.env.e2e');

if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

// 2. Extraer credenciales con soporte de alias
const email = process.env.E2E_TEST_EMAIL || process.env.E2E_EMAIL;
const password = process.env.E2E_TEST_PASSWORD || process.env.E2E_PASSWORD;

// 3. Procesar argumentos de CLI
const rawArgs = process.argv.slice(2);

// Soporte para flag de depuración / verificación sin emulador
if (rawArgs.includes('--dry-run') || rawArgs.includes('--print-cmd')) {
  const filteredArgs = rawArgs.filter(arg => arg !== '--dry-run' && arg !== '--print-cmd');
  console.log('[run-maestro] E2E_TEST_EMAIL:', email ? '***configured***' : 'missing');
  console.log('[run-maestro] E2E_TEST_PASSWORD:', password ? '***configured***' : 'missing');
  console.log('[run-maestro] Target args:', filteredArgs);
  process.exit(0);
}

// Determinar si ya se especificó un dispositivo
const hasDeviceFlag = rawArgs.some(arg => arg.startsWith('--device') || arg === '-d' || arg.startsWith('--udid'));
const deviceArgs = hasDeviceFlag ? [] : ['--device', process.env.MAESTRO_DEVICE || 'emulator-5554'];

// Construir flags de entorno para Maestro
const envArgs = [];
if (email) {
  envArgs.push('-e', `E2E_TEST_EMAIL=${email}`);
  envArgs.push('-e', `E2E_EMAIL=${email}`);
}
if (password) {
  envArgs.push('-e', `E2E_TEST_PASSWORD=${password}`);
  envArgs.push('-e', `E2E_PASSWORD=${password}`);
}

if (!email || !password) {
  console.warn('\n⚠️ [run-maestro] No se detectaron credenciales E2E completas en e2e/.env.e2e');
  console.warn('   Si la prueba requiere autenticación, por favor copia e2e/.env.e2e.example a e2e/.env.e2e y configura tus credenciales.\n');
}

// Construir comando final: maestro <deviceArgs> test <envArgs> <targetArgs>
const maestroArgs = [...deviceArgs, 'test', ...envArgs, ...rawArgs];

const homeDir = process.env.HOME || process.env.USERPROFILE || '';
const maestroBin = path.join(homeDir, '.maestro', 'bin');
const pathDelimiter = path.delimiter || ':';
const currentPath = process.env.PATH || '';
const extendedPath = fs.existsSync(maestroBin) && !currentPath.includes(maestroBin)
  ? `${maestroBin}${pathDelimiter}${currentPath}`
  : currentPath;

const result = spawnSync('maestro', maestroArgs, {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PATH: extendedPath,
    ...(email ? { E2E_TEST_EMAIL: email, E2E_EMAIL: email } : {}),
    ...(password ? { E2E_TEST_PASSWORD: password, E2E_PASSWORD: password } : {}),
  },
});

process.exit(result.status ?? (result.error ? 1 : 0));
