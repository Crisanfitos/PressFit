import { z } from 'zod';

export const SerieBackupSchema = z.object({
    id: z.string().optional(),
    numero_serie: z.number().int().min(1),
    peso_utilizado: z.number().nullable().optional(),
    repeticiones: z.number().nullable().optional(),
    rpe: z.number().nullable().optional(),
    tipo_serie: z.string().optional(),
    completada: z.boolean().optional(),
    is_completed: z.boolean().optional(),
});

export const ScheduledExerciseBackupSchema = z.object({
    id: z.string().optional(),
    ejercicio_id: z.string().optional(),
    orden_ejecucion: z.number().optional(),
    tipo_peso: z.string().optional(),
    ejercicio: z
        .object({
            id: z.string().optional(),
            nombre: z.string().optional(),
            titulo: z.string().optional(),
            grupo_muscular: z.string().optional(),
        })
        .nullable()
        .optional(),
    series: z.array(SerieBackupSchema).optional(),
});

export const RoutineDayBackupSchema = z.object({
    id: z.string().optional(),
    nombre_dia: z.string().min(1),
    fecha_dia: z.string().nullable().optional(),
    hora_inicio: z.string().nullable().optional(),
    hora_fin: z.string().nullable().optional(),
    completada: z.boolean().optional(),
    ejercicios_programados: z.array(ScheduledExerciseBackupSchema).optional(),
});

export const WeeklyRoutineBackupSchema = z.object({
    id: z.string().optional(),
    nombre: z.string().min(1),
    es_plantilla: z.boolean().optional(),
    activa: z.boolean().optional(),
    rutinas_diarias: z.array(RoutineDayBackupSchema).optional(),
});

export const CustomExerciseBackupSchema = z.object({
    id: z.string().optional(),
    nombre: z.string().optional(),
    titulo: z.string().optional(),
    grupo_muscular: z.string().optional(),
    categoria: z.string().optional(),
    es_custom: z.boolean().optional(),
    descripcion: z.string().nullable().optional(),
});

export const WeightHistoryBackupSchema = z.object({
    id: z.string().optional(),
    peso: z.number().positive(),
    created_at: z.string(),
});

export const PressFitBackupSchema = z.object({
    schemaVersion: z.literal(1),
    appVersion: z.string().min(1),
    exportedAt: z.string(),
    userId: z.string().min(1),
    data: z.object({
        routines: z.array(WeeklyRoutineBackupSchema).default([]),
        workouts: z.array(RoutineDayBackupSchema).default([]),
        customExercises: z.array(CustomExerciseBackupSchema).default([]),
        weightHistory: z.array(WeightHistoryBackupSchema).optional().default([]),
    }),
});

export type PressFitBackupPayload = z.infer<typeof PressFitBackupSchema>;

export interface BackupValidationResult {
    success: boolean;
    data?: PressFitBackupPayload;
    errors?: string[];
}

/**
 * Validates a JSON string or parsed object against the PressFit backup schema (schemaVersion 1).
 */
export function parseAndValidateBackup(rawJson: string | unknown): BackupValidationResult {
    try {
        const obj = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;

        if (typeof obj !== 'object' || obj === null) {
            return {
                success: false,
                errors: ['El archivo no contiene un objeto JSON válido'],
            };
        }

        const result = PressFitBackupSchema.safeParse(obj);

        if (result.success) {
            return { success: true, data: result.data };
        }

        const errors = result.error.issues.map(
            (e) => `${e.path.join('.') || 'root'}: ${e.message}`
        );

        return { success: false, errors };
    } catch (err: any) {
        return {
            success: false,
            errors: [`Error al parsear JSON: ${err?.message || 'Sintaxis inválida'}`],
        };
    }
}
