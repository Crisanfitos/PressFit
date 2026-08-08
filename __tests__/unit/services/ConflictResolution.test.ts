import { SyncService } from '../../../src/services/SyncService';

describe('ConflictResolution (PF-152)', () => {
    describe('parseEntityTimestamp', () => {
        it('should return 0 if entity or timestamp field is missing/null', () => {
            expect(SyncService.parseEntityTimestamp(null as any)).toBe(0);
            expect(SyncService.parseEntityTimestamp({})).toBe(0);
            expect(SyncService.parseEntityTimestamp({ updated_at: null })).toBe(0);
        });

        it('should return numeric timestamp directly if provided as number', () => {
            const timestamp = 1700000000000;
            expect(SyncService.parseEntityTimestamp({ timestamp })).toBe(timestamp);
            expect(SyncService.parseEntityTimestamp({ updated_at: timestamp })).toBe(timestamp);
        });

        it('should parse ISO date string to epoch milliseconds', () => {
            const iso = '2026-08-08T12:00:00Z';
            const expectedMs = new Date(iso).getTime();
            expect(SyncService.parseEntityTimestamp({ updated_at: iso })).toBe(expectedMs);
        });

        it('should return 0 for invalid date strings', () => {
            expect(SyncService.parseEntityTimestamp({ updated_at: 'invalid-date-string' })).toBe(0);
        });
    });

    describe('resolveConflict', () => {
        it('should return LOCAL when local timestamp is newer than remote in LWW', () => {
            const local = { id: 'set-1', reps: 12, updated_at: '2026-08-08T12:05:00Z' };
            const remote = { id: 'set-1', reps: 10, updated_at: '2026-08-08T12:00:00Z' };

            const res = SyncService.resolveConflict(local, remote, 'LAST_WRITE_WINS');
            expect(res.winner).toBe('LOCAL');
            expect(res.resolved).toEqual(local);
            expect(res.isConflict).toBe(true);
        });

        it('should return REMOTE when remote timestamp is newer than local in LWW', () => {
            const local = { id: 'set-1', reps: 10, updated_at: '2026-08-08T12:00:00Z' };
            const remote = { id: 'set-1', reps: 12, updated_at: '2026-08-08T12:05:00Z' };

            const res = SyncService.resolveConflict(local, remote, 'LAST_WRITE_WINS');
            expect(res.winner).toBe('REMOTE');
            expect(res.resolved).toEqual(remote);
            expect(res.isConflict).toBe(true);
        });

        it('should default to REMOTE on timestamp ties', () => {
            const local = { id: 'set-1', reps: 10, updated_at: '2026-08-08T12:00:00Z' };
            const remote = { id: 'set-1', reps: 10, updated_at: '2026-08-08T12:00:00Z' };

            const res = SyncService.resolveConflict(local, remote, 'LAST_WRITE_WINS');
            expect(res.winner).toBe('REMOTE');
            expect(res.resolved).toEqual(remote);
        });

        it('should handle null/undefined entities without reporting conflict', () => {
            const local = { id: 'set-1', reps: 10 };
            const res1 = SyncService.resolveConflict(local, null);
            expect(res1.winner).toBe('LOCAL');
            expect(res1.isConflict).toBe(false);

            const remote = { id: 'set-1', reps: 12 };
            const res2 = SyncService.resolveConflict(null, remote);
            expect(res2.winner).toBe('REMOTE');
            expect(res2.isConflict).toBe(false);
        });

        it('should respect SERVER_WINS and LOCAL_WINS strategies', () => {
            const local = { id: 's1', updated_at: '2026-08-08T15:00:00Z' };
            const remote = { id: 's1', updated_at: '2026-08-08T10:00:00Z' };

            const resServer = SyncService.resolveConflict(local, remote, 'SERVER_WINS');
            expect(resServer.winner).toBe('REMOTE');

            const resLocal = SyncService.resolveConflict(local, remote, 'LOCAL_WINS');
            expect(resLocal.winner).toBe('LOCAL');
        });
    });

    describe('deduplicateEntities', () => {
        it('should preserve unique entities in list', () => {
            const items = [
                { id: 's1', reps: 10, updated_at: '2026-08-08T10:00:00Z' },
                { id: 's2', reps: 12, updated_at: '2026-08-08T10:00:00Z' },
            ];
            const deduped = SyncService.deduplicateEntities(items);
            expect(deduped).toHaveLength(2);
        });

        it('should deduplicate items keeping the newest timestamp (LWW)', () => {
            const items = [
                { id: 's1', reps: 10, updated_at: '2026-08-08T10:00:00Z' },
                { id: 's1', reps: 12, updated_at: '2026-08-08T11:00:00Z' }, // newer duplicate
                { id: 's2', reps: 8, updated_at: '2026-08-08T09:00:00Z' },
            ];
            const deduped = SyncService.deduplicateEntities(items);
            expect(deduped).toHaveLength(2);
            expect(deduped.find((i) => i.id === 's1')?.reps).toBe(12);
        });

        it('should handle empty or non-array inputs gracefully', () => {
            expect(SyncService.deduplicateEntities(null as any)).toEqual([]);
            expect(SyncService.deduplicateEntities([])).toEqual([]);
        });
    });
});
