import {
    escapeCSVField,
    formatWorkoutHistoryToCSV,
    CSV_STANDARD_HEADERS,
    WorkoutSetExportRow,
} from '../../../src/utils/csvFormatter';

describe('csvFormatter (PF-325)', () => {
    describe('escapeCSVField', () => {
        it('returns empty string for null and undefined', () => {
            expect(escapeCSVField(null)).toBe('');
            expect(escapeCSVField(undefined)).toBe('');
        });

        it('returns plain string without modification if no special characters are present', () => {
            expect(escapeCSVField('Press de Banca')).toBe('Press de Banca');
            expect(escapeCSVField(100)).toBe('100');
            expect(escapeCSVField(0)).toBe('0');
        });

        it('escapes fields containing commas by enclosing in quotes', () => {
            expect(escapeCSVField('Sentadilla, Barra Trasera')).toBe('"Sentadilla, Barra Trasera"');
        });

        it('escapes fields containing quotes by doubling quotes and enclosing in quotes', () => {
            expect(escapeCSVField('Press "Arnold"')).toBe('"Press ""Arnold"""');
        });

        it('escapes fields containing line breaks', () => {
            expect(escapeCSVField('Línea 1\nLínea 2')).toBe('"Línea 1\nLínea 2"');
            expect(escapeCSVField('Línea 1\r\nLínea 2')).toBe('"Línea 1\r\nLínea 2"');
        });
    });

    describe('formatWorkoutHistoryToCSV', () => {
        it('returns only the header row when rows array is empty', () => {
            const result = formatWorkoutHistoryToCSV([]);
            expect(result).toBe(CSV_STANDARD_HEADERS.join(','));
        });

        it('formats workout set rows with correct standard header and values', () => {
            const rows: WorkoutSetExportRow[] = [
                {
                    fecha: '2026-09-08',
                    rutina: 'Torso A',
                    ejercicio: 'Press Banca Plano',
                    serie: 1,
                    tipo_serie: 'normal',
                    peso: 80,
                    repeticiones: 10,
                    rpe: 8,
                },
                {
                    fecha: '2026-09-08',
                    rutina: 'Torso A',
                    ejercicio: 'Remo con Barra',
                    serie: 2,
                    tipo_serie: 'calentamiento',
                    peso: 60,
                    repeticiones: 12,
                    rpe: null,
                },
            ];

            const csv = formatWorkoutHistoryToCSV(rows);
            const lines = csv.split('\r\n');

            expect(lines).toHaveLength(3);
            expect(lines[0]).toBe('Fecha,Rutina,Ejercicio,Serie,Tipo de Serie,Peso,Repeticiones,RPE,1RM Estimado');
            // Line 1: 80kg x 10 reps -> estimated 1RM calculated automatically
            expect(lines[1]).toContain('2026-09-08,Torso A,Press Banca Plano,1,normal,80,10,8,');
            // Line 2: null RPE should be empty string
            expect(lines[2]).toContain('2026-09-08,Torso A,Remo con Barra,2,calentamiento,60,12,,');
        });

        it('properly escapes exercises or routines with quotes and commas in CSV output', () => {
            const rows: WorkoutSetExportRow[] = [
                {
                    fecha: '2026-09-09',
                    rutina: 'Torso, Hombro y Brazo',
                    ejercicio: 'Press "Militar", Mancuernas',
                    serie: 1,
                    tipo_serie: 'normal',
                    peso: 24,
                    repeticiones: 8,
                    rpe: 9,
                },
            ];

            const csv = formatWorkoutHistoryToCSV(rows);
            const lines = csv.split('\r\n');

            expect(lines[1]).toContain('"Torso, Hombro y Brazo"');
            expect(lines[1]).toContain('"Press ""Militar"", Mancuernas"');
        });

        it('uses explicitly provided estimado_1rm when present', () => {
            const rows: WorkoutSetExportRow[] = [
                {
                    fecha: '2026-09-09',
                    rutina: 'Pierna',
                    ejercicio: 'Sentadilla',
                    serie: 1,
                    tipo_serie: 'normal',
                    peso: 100,
                    repeticiones: 5,
                    rpe: 8.5,
                    estimado_1rm: 115.5,
                },
            ];

            const csv = formatWorkoutHistoryToCSV(rows);
            expect(csv).toContain(',115.5');
        });
    });
});
