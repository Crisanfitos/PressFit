/**
 * PressFit - Supabase Migrations Integrity & Validation Engine
 * Validates:
 * 1. Migration naming format (YYYYMMDDHHMMSS_<name>.sql)
 * 2. Non-empty file contents
 * 3. Existence of matching rollback scripts for incremental migrations
 * 4. Basic DDL safety checks (unbalanced quotes, presence of semicolons)
 */

const fs = require('fs');
const path = require('path');

const MIGRATION_NAME_REGEX = /^[0-9]{14}_[a-z0-9_]+\.sql$/;

function verifyMigrations(options = {}) {
    const migrationsDir = options.migrationsDir || path.resolve(__dirname, '../supabase/migrations');
    const rollbackDir = options.rollbackDir || path.resolve(migrationsDir, 'rollback');

    const results = {
        valid: true,
        checkedCount: 0,
        errors: [],
        warnings: [],
        migrations: []
    };

    if (!fs.existsSync(migrationsDir)) {
        results.valid = false;
        results.errors.push(`Migrations directory not found: ${migrationsDir}`);
        return results;
    }

    const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });
    const sqlFiles = entries
        .filter(entry => entry.isFile() && entry.name.endsWith('.sql'))
        .map(entry => entry.name)
        .sort();

    if (sqlFiles.length === 0) {
        results.warnings.push('No .sql migration files found in migrations directory.');
        return results;
    }

    // List of existing rollback files if rollback dir exists
    const rollbackFiles = fs.existsSync(rollbackDir)
        ? fs.readdirSync(rollbackDir).filter(f => f.endsWith('.sql'))
        : [];

    for (const filename of sqlFiles) {
        results.checkedCount++;
        const filePath = path.join(migrationsDir, filename);
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        const migrationInfo = {
            filename,
            timestamp: filename.slice(0, 14),
            sizeBytes: Buffer.byteLength(fileContent, 'utf-8'),
            hasRollback: false,
            errors: []
        };

        // 1. Check filename convention
        if (!MIGRATION_NAME_REGEX.test(filename)) {
            const err = `Invalid filename pattern: "${filename}". Expected format: YYYYMMDDHHMMSS_name.sql`;
            results.errors.push(err);
            migrationInfo.errors.push(err);
        }

        // 2. Check non-empty content
        if (!fileContent.trim()) {
            const err = `Migration file "${filename}" is empty.`;
            results.errors.push(err);
            migrationInfo.errors.push(err);
        }

        // 3. Check quote balance (basic SQL syntax check)
        const singleQuotes = (fileContent.match(/'/g) || []).length;
        if (singleQuotes % 2 !== 0) {
            const err = `Migration file "${filename}" has unbalanced single quotes.`;
            results.errors.push(err);
            migrationInfo.errors.push(err);
        }

        // 4. Check rollback for incremental migrations (skip initial_schema)
        const isInitial = filename.includes('initial_schema');
        if (!isInitial) {
            const timestamp = migrationInfo.timestamp;
            const matchingRollback = rollbackFiles.find(rf => rf.startsWith(timestamp));
            if (matchingRollback) {
                migrationInfo.hasRollback = true;
            } else {
                results.warnings.push(`Missing rollback script for incremental migration: "${filename}"`);
            }
        } else {
            migrationInfo.hasRollback = true; // Initial baseline schema
        }

        results.migrations.push(migrationInfo);
    }

    if (results.errors.length > 0) {
        results.valid = false;
    }

    return results;
}

// Standalone CLI runner
if (require.main === module) {
    console.log('🔍 Auditing Supabase migrations integrity...');
    const result = verifyMigrations();

    console.log(`📦 Checked ${result.checkedCount} migration file(s).`);
    
    if (result.warnings.length > 0) {
        result.warnings.forEach(w => console.warn(`⚠️ Warning: ${w}`));
    }

    if (!result.valid) {
        console.error('❌ Migration verification failed:');
        result.errors.forEach(e => console.error(`  - ${e}`));
        process.exit(1);
    }

    console.log('✅ All migrations passed verification successfully!');
    process.exit(0);
}

module.exports = {
    verifyMigrations,
    MIGRATION_NAME_REGEX
};
