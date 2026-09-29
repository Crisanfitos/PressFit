import { calculate1RM } from './analyticsUtils';

export interface WorkoutSetExportRow {
    fecha: string;
    rutina: string;
    ejercicio: string;
    serie: number;
    tipo_serie: string;
    peso: number;
    repeticiones: number;
    rpe?: number | null;
    estimado_1rm?: number;
}

/**
 * Escapes a single CSV value following RFC 4180 rules.
 * Encloses the field in double quotes if it contains quotes, commas, or line breaks,
 * and escapes internal quotes by doubling them ("").
 */
export function escapeCSVField(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
        return '';
    }

    const str = String(value);

    // If string contains comma, quote, or newline characters, wrap in quotes and double quotes
    if (/[",\r\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
}

export const CSV_STANDARD_HEADERS = [
    'Fecha',
    'Rutina',
    'Ejercicio',
    'Serie',
    'Tipo de Serie',
    'Peso',
    'Repeticiones',
    'RPE',
    '1RM Estimado',
] as const;

/**
 * Converts an array of workout set rows into a standardized CSV string.
 *
 * Headers: Fecha, Rutina, Ejercicio, Serie, Tipo de Serie, Peso, Repeticiones, RPE, 1RM Estimado
 */
export function formatWorkoutHistoryToCSV(rows: WorkoutSetExportRow[]): string {
    const headerLine = CSV_STANDARD_HEADERS.map(escapeCSVField).join(',');

    if (!rows || rows.length === 0) {
        return headerLine;
    }

    const dataLines = rows.map((row) => {
        const est1RM =
            row.estimado_1rm !== undefined
                ? row.estimado_1rm
                : row.peso > 0 && row.repeticiones > 0
                  ? calculate1RM(row.peso, row.repeticiones, 'auto')
                  : 0;

        const fields = [
            escapeCSVField(row.fecha),
            escapeCSVField(row.rutina),
            escapeCSVField(row.ejercicio),
            escapeCSVField(row.serie),
            escapeCSVField(row.tipo_serie || 'normal'),
            escapeCSVField(row.peso),
            escapeCSVField(row.repeticiones),
            escapeCSVField(row.rpe !== null && row.rpe !== undefined ? row.rpe : ''),
            escapeCSVField(est1RM),
        ];

        return fields.join(',');
    });

    return [headerLine, ...dataLines].join('\r\n');
}
