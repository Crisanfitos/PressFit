const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDatabaseSnapshot(outputDir) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const targetDir = outputDir || path.resolve(__dirname, '../supabase/snapshots');

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    console.log(`📡 Connecting to Supabase at: ${new URL(supabaseUrl).hostname}`);
    console.log('🔄 Fetching tables for snapshot point-in-time recovery...');

    // 1. Fetch rutinas_semanales
    const { data: rutinasSemanales, error: rsError } = await supabase
        .from('rutinas_semanales')
        .select('*');
    if (rsError) console.warn('⚠️ Warning fetching rutinas_semanales:', rsError.message);

    // 2. Fetch rutinas_diarias
    const { data: rutinasDiarias, error: rdError } = await supabase
        .from('rutinas_diarias')
        .select('*');
    if (rdError) console.warn('⚠️ Warning fetching rutinas_diarias:', rdError.message);

    // 3. Fetch ejercicios_programados
    const { data: ejerciciosProgramados, error: epError } = await supabase
        .from('ejercicios_programados')
        .select('*');
    if (epError) console.warn('⚠️ Warning fetching ejercicios_programados:', epError.message);

    // 4. Fetch series
    const { data: series, error: sError } = await supabase
        .from('series')
        .select('*');
    if (sError) console.warn('⚠️ Warning fetching series:', sError.message);

    const snapshot = {
        metadata: {
            createdAt: new Date().toISOString(),
            sourceUrl: new URL(supabaseUrl).hostname,
            version: '1.0.0',
            tables: ['rutinas_semanales', 'rutinas_diarias', 'ejercicios_programados', 'series'],
        },
        counts: {
            rutinas_semanales: rutinasSemanales?.length || 0,
            rutinas_diarias: rutinasDiarias?.length || 0,
            ejercicios_programados: ejerciciosProgramados?.length || 0,
            series: series?.length || 0,
        },
        data: {
            rutinas_semanales: rutinasSemanales || [],
            rutinas_diarias: rutinasDiarias || [],
            ejercicios_programados: ejerciciosProgramados || [],
            series: series || [],
        },
    };

    const filename = `db_snapshot_${timestamp}.json`;
    const filePath = path.join(targetDir, filename);

    fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');

    console.log(`✅ Snapshot successfully created at: ${filePath}`);
    console.log(`📊 Summary of backed up records:
   - rutinas_semanales: ${snapshot.counts.rutinas_semanales}
   - rutinas_diarias: ${snapshot.counts.rutinas_diarias}
   - ejercicios_programados: ${snapshot.counts.ejercicios_programados}
   - series: ${snapshot.counts.series}`);

    return filePath;
}

if (require.main === module) {
    createDatabaseSnapshot()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('❌ Failed to create snapshot:', err);
            process.exit(1);
        });
}

module.exports = { createDatabaseSnapshot };
