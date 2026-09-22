import {
    buildBackupPayload,
    validateBackup,
    convertWeight,
} from '../../../src/utils/gymPreferences';

describe('gymPreferences backup (PF-397)', () => {
    it('buildBackupPayload produces a v1 payload', () => {
        const payload = buildBackupPayload({
            weightUnit: 'lb',
            defaultRestSec: 120,
            restSound: false,
            restVibration: true,
        });
        expect(payload.kind).toBe('pressfit-backup');
        expect(payload.version).toBe(1);
        expect(payload.gymPreferences.weightUnit).toBe('lb');
    });

    it('validateBackup accepts a valid payload and sanitizes prefs', () => {
        const result = validateBackup({
            kind: 'pressfit-backup',
            version: 1,
            exportedAt: new Date().toISOString(),
            gymPreferences: { weightUnit: 'lb', defaultRestSec: 60, restSound: true, restVibration: false },
        });
        expect(result.valid).toBe(true);
        expect(result.prefs?.defaultRestSec).toBe(60);
    });

    it('validateBackup rejects wrong kind, version or garbage', () => {
        expect(validateBackup(null).valid).toBe(false);
        expect(validateBackup({ kind: 'other', version: 1, gymPreferences: {} }).valid).toBe(false);
        expect(
            validateBackup({ kind: 'pressfit-backup', version: 2, gymPreferences: {} }).valid
        ).toBe(false);
    });

    it('validateBackup sanitizes out-of-range values instead of failing', () => {
        const result = validateBackup({
            kind: 'pressfit-backup',
            version: 1,
            gymPreferences: { weightUnit: 'stones', defaultRestSec: 999 },
        });
        expect(result.valid).toBe(true);
        expect(result.prefs?.weightUnit).toBe('kg');
        expect(result.prefs?.defaultRestSec).toBe(90);
    });

    it('convertWeight converts kg to lb', () => {
        expect(convertWeight(100, 'lb')).toBeCloseTo(220.5, 0);
        expect(convertWeight(100, 'kg')).toBe(100);
    });
});
