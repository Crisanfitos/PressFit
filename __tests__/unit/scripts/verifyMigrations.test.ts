import fs from 'fs';
import path from 'path';
// @ts-ignore
const { verifyMigrations, MIGRATION_NAME_REGEX } = require('../../../scripts/verify_migrations');

describe('Supabase Migrations Verification Engine (PF-339)', () => {
    const tempTestDir = path.resolve(__dirname, '../../../scratch/test_migrations');
    const tempRollbackDir = path.resolve(tempTestDir, 'rollback');

    beforeEach(() => {
        if (fs.existsSync(tempTestDir)) {
            fs.rmSync(tempTestDir, { recursive: true, force: true });
        }
        fs.mkdirSync(tempRollbackDir, { recursive: true });
    });

    afterAll(() => {
        if (fs.existsSync(tempTestDir)) {
            fs.rmSync(tempTestDir, { recursive: true, force: true });
        }
    });

    describe('Filename regex pattern', () => {
        it('matches standard 14-digit timestamp migration filenames', () => {
            expect(MIGRATION_NAME_REGEX.test('20260910000000_add_tipo_serie_to_series.sql')).toBe(true);
            expect(MIGRATION_NAME_REGEX.test('20260728000000_initial_schema.sql')).toBe(true);
            expect(MIGRATION_NAME_REGEX.test('20260914220000_create_index_test.sql')).toBe(true);
        });

        it('rejects filenames without valid timestamp or non-snake_case', () => {
            expect(MIGRATION_NAME_REGEX.test('add_tipo_serie.sql')).toBe(false);
            expect(MIGRATION_NAME_REGEX.test('2026_test.sql')).toBe(false);
            expect(MIGRATION_NAME_REGEX.test('20260910000000_CamelCase.sql')).toBe(false);
            expect(MIGRATION_NAME_REGEX.test('20260910000000_invalid-kebab.sql')).toBe(false);
            expect(MIGRATION_NAME_REGEX.test('20260910000000_test.txt')).toBe(false);
        });
    });

    describe('verifyMigrations with live repo migrations', () => {
        it('verifies all existing project migrations and rollbacks successfully', () => {
            const results = verifyMigrations();
            expect(results.valid).toBe(true);
            expect(results.checkedCount).toBeGreaterThanOrEqual(3);
            expect(results.errors).toHaveLength(0);
            expect(results.warnings).toHaveLength(0);
        });
    });

    describe('Synthetic scenarios & error detection', () => {
        it('returns error when directory does not exist', () => {
            const results = verifyMigrations({ migrationsDir: '/invalid/path/that/does/not/exist' });
            expect(results.valid).toBe(false);
            expect(results.errors[0]).toContain('Migrations directory not found');
        });

        it('warns when no .sql files exist', () => {
            const results = verifyMigrations({ migrationsDir: tempTestDir });
            expect(results.valid).toBe(true);
            expect(results.checkedCount).toBe(0);
            expect(results.warnings[0]).toContain('No .sql migration files found');
        });

        it('detects invalid filename convention', () => {
            fs.writeFileSync(path.join(tempTestDir, 'invalid_name.sql'), 'SELECT 1;');
            const results = verifyMigrations({ migrationsDir: tempTestDir, rollbackDir: tempRollbackDir });
            expect(results.valid).toBe(false);
            expect(results.errors.some((e: string) => e.includes('Invalid filename pattern'))).toBe(true);
        });

        it('detects empty migration file', () => {
            fs.writeFileSync(path.join(tempTestDir, '20260914000000_empty_migration.sql'), '   \n  ');
            const results = verifyMigrations({ migrationsDir: tempTestDir, rollbackDir: tempRollbackDir });
            expect(results.valid).toBe(false);
            expect(results.errors.some((e: string) => e.includes('is empty'))).toBe(true);
        });

        it('detects unbalanced quotes in SQL', () => {
            fs.writeFileSync(path.join(tempTestDir, '20260914000000_broken_quotes.sql'), "SELECT 'unclosed string;");
            const results = verifyMigrations({ migrationsDir: tempTestDir, rollbackDir: tempRollbackDir });
            expect(results.valid).toBe(false);
            expect(results.errors.some((e: string) => e.includes('unbalanced single quotes'))).toBe(true);
        });

        it('warns when incremental migration has no rollback script', () => {
            fs.writeFileSync(path.join(tempTestDir, '20260914000000_new_column.sql'), 'ALTER TABLE test ADD COLUMN col TEXT;');
            const results = verifyMigrations({ migrationsDir: tempTestDir, rollbackDir: tempRollbackDir });
            expect(results.valid).toBe(true); // Warnings do not invalidate syntax
            expect(results.warnings.some((w: string) => w.includes('Missing rollback script'))).toBe(true);
        });

        it('passes when incremental migration has matching rollback script', () => {
            fs.writeFileSync(path.join(tempTestDir, '20260914000000_new_column.sql'), 'ALTER TABLE test ADD COLUMN col TEXT;');
            fs.writeFileSync(path.join(tempRollbackDir, '20260914000000_rollback_new_column.sql'), 'ALTER TABLE test DROP COLUMN col;');
            const results = verifyMigrations({ migrationsDir: tempTestDir, rollbackDir: tempRollbackDir });
            expect(results.valid).toBe(true);
            expect(results.warnings).toHaveLength(0);
            expect(results.errors).toHaveLength(0);
        });
    });
});
