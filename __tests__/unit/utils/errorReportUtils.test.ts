import {
    computeSyncFingerprint,
    extractCulprit,
    normalizeErrorMessage,
    normalizeLevel,
    sanitizeErrorReportPayload,
} from '../../../src/utils/errorReportUtils';

describe('errorReportUtils', () => {
    it('normalizeErrorMessage replaces UUIDs, ISO timestamps, and large numbers deterministically', () => {
        const msg1 = 'Failed updating set 550e8400-e29b-41d4-a716-446655440000 at 2026-11-26T20:15:00.123Z id 987654';
        const msg2 = 'Failed updating set 123e4567-e89b-12d3-a456-426614174000 at 2026-12-01T09:00:00Z id 12345';

        expect(normalizeErrorMessage(msg1)).toBe('Failed updating set <uuid> at <timestamp> id <num>');
        expect(normalizeErrorMessage(msg1)).toBe(normalizeErrorMessage(msg2));
    });

    it('extractCulprit uses explicit culprit when provided or parses first stack frame', () => {
        expect(extractCulprit('at foo (Bar.tsx:10)', 'explicitFn')).toBe('explicitFn');
        const stack = 'Error: Boom\nat saveWorkout (src/services/WorkoutService.ts:142:10)\nat run (App.tsx:20)';
        expect(extractCulprit(stack)).toBe('saveWorkout (src/services/WorkoutService.ts:142:10)');
        expect(extractCulprit('Error: Without frames')).toBe('unknown');
    });

    it('computeSyncFingerprint produces identical 16-hex hashes for normalized equivalent errors', () => {
        const fp1 = computeSyncFingerprint(
            'TypeError',
            'Row 550e8400-e29b-41d4-a716-446655440000 missing',
            'saveSet (WorkoutSetMutationService.ts:142)'
        );
        const fp2 = computeSyncFingerprint(
            'TypeError',
            'Row 11111111-2222-3333-4444-555555555555 missing',
            'saveSet (WorkoutSetMutationService.ts:142)'
        );
        expect(fp1).toMatch(/^[0-9a-f]{16}$/);
        expect(fp1).toBe(fp2);
    });

    it('sanitizeErrorReportPayload rejects invalid or empty error_message payloads', () => {
        expect(sanitizeErrorReportPayload(null)).toBeNull();
        expect(sanitizeErrorReportPayload({})).toBeNull();
        expect(sanitizeErrorReportPayload({ error_message: '   ' })).toBeNull();
    });

    it('sanitizeErrorReportPayload truncates oversized stacktraces, limits breadcrumbs to 30, and populates defaults without avoidable nulls', () => {
        const breadcrumbs = Array.from({ length: 40 }, (_, i) => ({
            timestamp: `2026-11-26T20:00:${String(i).padStart(2, '0')}Z`,
            category: 'navigation',
            message: `Step ${i}`,
        }));

        const sanitized = sanitizeErrorReportPayload({
            level: 'FATAL' as unknown as 'fatal',
            error_message: '  Crash en entrenamiento  ',
            stacktrace: 'x'.repeat(10000),
            breadcrumbs,
            app_version: '1.13.3',
            app_build: '9',
            os_name: 'Android',
            os_version: '16',
            device_model: '24115RA8EG',
            device_brand: 'Redmi',
        });

        expect(sanitized).not.toBeNull();
        expect(sanitized!.level).toBe('fatal');
        expect(sanitized!.handled).toBe(false);
        expect(sanitized!.stacktrace.length).toBe(8192);
        expect(sanitized!.breadcrumbs).toHaveLength(30);
        expect(sanitized!.breadcrumbs[0].message).toBe('Step 10');
        expect(sanitized!.issue_key).toMatch(/^pf-[0-9a-f]{16}$/);
        expect(sanitized!.short_id).toMatch(/^PF-ERR-[0-9A-F]{6}$/);
        expect(sanitized!.release).toBe('1.13.3+9');
        expect(sanitized!.os_name).toBe('Android');
        expect(sanitized!.device_model).toBe('24115RA8EG');
        expect(sanitized!.affected_user_id).toBeNull();
    });

    it('normalizeLevel falls back to error on unknown values', () => {
        expect(normalizeLevel('warning')).toBe('warning');
        expect(normalizeLevel('unexpected')).toBe('error');
    });
});
