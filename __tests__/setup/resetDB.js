/**
 * resetDB.js — Template-Only Architecture
 * 
 * Creates a SINGLE routine that is BOTH the template AND active.
 * Template days (fecha_dia = null) hold the exercise definitions.
 * Workout days (fecha_dia = date) are created when the user starts training.
 * 
 * Test data structure:
 * - 1 rutina_semanal: "Plantilla_Fuerza Básica" (es_plantilla=true, activa=true)
 *   - 7 template days (fecha_dia=null): Lunes-Domingo
 *     - Lunes: Press Banca (3 series)
 *     - Miércoles: Sentadilla (3 series)
 *     - Viernes: Peso Muerto (3 series)
 *   - 1 completed workout day: Viernes last week (fecha_dia=lastFriday)
 *     - Peso Muerto with 2 completed series (real data)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://suaxmalkquricsbwkczt.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error("FATAL: SUPABASE_SERVICE_ROLE_KEY missing from .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const testUserId = '204efe8a-b79a-41a5-8536-f2feef30e049';

async function resetAndInsert() {
    console.log("=== RESETTING TEST USER DATA ===");
    try {
        // 1. Delete ALL routines for test user (CASCADE deletes days, exercises, series)
        console.log("Deleting all routines for", testUserId);
        const { error: delErr } = await supabase
            .from('rutinas_semanales')
            .delete()
            .eq('usuario_id', testUserId);

        if (delErr) throw delErr;

        // 2. Fetch 3 exercise IDs from the catalog
        const { data: exercises, error: exErr } = await supabase
            .from('ejercicios')
            .select('id, titulo')
            .limit(3);
        if (exErr) throw exErr;
        if (!exercises || exercises.length < 3) throw new Error("No hay suficientes ejercicios en la BD");

        const [ejBanca, ejSentadilla, ejPesoMuerto] = exercises;
        console.log("Exercises:", ejBanca.titulo, ejSentadilla.titulo, ejPesoMuerto.titulo);

        // 3. Create SINGLE routine: both template AND active
        const { data: rutina, error: rErr } = await supabase
            .from('rutinas_semanales')
            .insert({
                usuario_id: testUserId,
                nombre: 'Plantilla_Fuerza Básica',
                es_plantilla: true,
                activa: true,
                objetivo: 'Rutina de fuerza 3 días/semana'
            })
            .select()
            .single();
        if (rErr) throw rErr;
        console.log("Created routine:", rutina.id, rutina.nombre);

        // 4. Create 7 TEMPLATE days (fecha_dia = null)
        const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const templateDaysInsert = dayNames.map(d => ({
            rutina_semanal_id: rutina.id,
            nombre_dia: d,
            fecha_dia: null,   // NULL = template day
            completada: false,
        }));

        const { data: templateDays, error: tdErr } = await supabase
            .from('rutinas_diarias')
            .insert(templateDaysInsert)
            .select();
        if (tdErr) throw tdErr;
        console.log("Created", templateDays.length, "template days");

        const tLunes = templateDays.find(d => d.nombre_dia === 'Lunes');
        const tMiercoles = templateDays.find(d => d.nombre_dia === 'Miércoles');
        const tViernes = templateDays.find(d => d.nombre_dia === 'Viernes');

        // 5. Add exercises to template days (Lunes, Miércoles, Viernes)
        const templateExInsert = [
            { rutina_diaria_id: tLunes.id, ejercicio_id: ejBanca.id, orden_ejecucion: 1 },
            { rutina_diaria_id: tMiercoles.id, ejercicio_id: ejSentadilla.id, orden_ejecucion: 1 },
            { rutina_diaria_id: tViernes.id, ejercicio_id: ejPesoMuerto.id, orden_ejecucion: 1 },
        ];

        const { data: templateExs, error: teErr } = await supabase
            .from('ejercicios_programados')
            .insert(templateExInsert)
            .select();
        if (teErr) throw teErr;
        console.log("Added", templateExs.length, "exercises to template days");

        // 6. Add series to template exercises (3 series each with target reps)
        const templateSeriesInsert = [];
        for (const ex of templateExs) {
            for (let i = 1; i <= 3; i++) {
                templateSeriesInsert.push({
                    ejercicio_programado_id: ex.id,
                    numero_serie: i,
                    repeticiones: 10,      // Target reps
                    peso_utilizado: 0,     // No weight set yet (template)
                });
            }
        }

        const { error: tsErr } = await supabase
            .from('series')
            .insert(templateSeriesInsert);
        if (tsErr) throw tsErr;
        console.log("Added", templateSeriesInsert.length, "template series");

        // 7. Create a COMPLETED workout for last Friday (historical data)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysToLastFriday = dayOfWeek >= 5 ? dayOfWeek - 5 + 7 : dayOfWeek + 2;
        const lastFriday = new Date(now);
        lastFriday.setDate(now.getDate() - daysToLastFriday);
        const lastFridayStr = lastFriday.toISOString().split('T')[0];

        const fridayStart = new Date(lastFriday);
        fridayStart.setHours(10, 0, 0, 0);
        const fridayEnd = new Date(lastFriday);
        fridayEnd.setHours(11, 15, 0, 0);

        const { data: fridayWorkout, error: fwErr } = await supabase
            .from('rutinas_diarias')
            .insert({
                rutina_semanal_id: rutina.id,
                nombre_dia: 'Viernes',
                fecha_dia: lastFridayStr,
                hora_inicio: fridayStart.toISOString(),
                hora_fin: fridayEnd.toISOString(),
                completada: true,
            })
            .select()
            .single();
        if (fwErr) throw fwErr;
        console.log("Created completed Friday workout:", fridayWorkout.id, "date:", lastFridayStr);

        // 8. Add exercise + series to the completed Friday workout
        const { data: fridayEx, error: feErr } = await supabase
            .from('ejercicios_programados')
            .insert({
                rutina_diaria_id: fridayWorkout.id,
                ejercicio_id: ejPesoMuerto.id,
                orden_ejecucion: 1,
                notas_sesion: 'Buen día, me sentí fuerte',
            })
            .select()
            .single();
        if (feErr) throw feErr;

        await supabase.from('series').insert([
            { ejercicio_programado_id: fridayEx.id, numero_serie: 1, repeticiones: 8, peso_utilizado: 100, rpe: 7 },
            { ejercicio_programado_id: fridayEx.id, numero_serie: 2, repeticiones: 8, peso_utilizado: 105, rpe: 8 },
            { ejercicio_programado_id: fridayEx.id, numero_serie: 3, repeticiones: 6, peso_utilizado: 110, rpe: 9 },
        ]);
        console.log("Added completed Friday exercise with 3 series");

        // Summary
        console.log("\n=== DONE - TEST DATA SUMMARY ===");
        console.log("Routine ID:", rutina.id);
        console.log("  es_plantilla: true, activa: true");
        console.log("  Template days: 7 (LUN/MIE/VIE have exercises with 3 series each)");
        console.log("  Friday workout:", lastFridayStr, "(completed, 1 exercise, 3 series)");
        console.log("================================\n");

    } catch (err) {
        console.error("Error:", err);
        throw err;
    }
}

module.exports = { resetAndInsert, testUserId };
