import { parseAndValidateBackup } from '../../../src/schemas/backupSchema';

describe('backupSchema (PF-326)', () => {
    const validBackupPayload = {
        schemaVersion: 1,
        appVersion: '1.11.0',
        exportedAt: '2026-09-29T12:00:00.000Z',
        userId: 'user-test-123',
        data: {
            routines: [
                {
                    id: 'r-1',
                    nombre: 'Torso-Pierna',
                    es_plantilla: true,
                    rutinas_diarias: [
                        {
                            id: 'd-1',
                            nombre_dia: 'Torso A',
                            ejercicios_programados: [
                                {
                                    id: 'ep-1',
                                    ejercicio_id: 'ex-1',
                                    orden_ejecucion: 1,
                                    tipo_peso: 'total',
                                    ejercicio: {
                                        id: 'ex-1',
                                        nombre: 'Press Banca',
                                        titulo: 'Press Banca Plano',
                                        grupo_muscular: 'pecho',
                                    },
                                    series: [
                                        {
                                            numero_serie: 1,
                                            peso_utilizado: 80,
                                            repeticiones: 10,
                                            rpe: 8,
                                            tipo_serie: 'normal',
                                            completada: true,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
            workouts: [
                {
                    id: 'w-1',
                    nombre_dia: 'Torso A',
                    fecha_dia: '2026-09-28',
                    completada: true,
                    ejercicios_programados: [],
                },
            ],
            customExercises: [
                {
                    id: 'ce-1',
                    titulo: 'Press inclinado máquina',
                    grupo_muscular: 'pecho',
                    es_custom: true,
                },
            ],
            weightHistory: [
                {
                    id: 'wh-1',
                    peso: 77.2,
                    created_at: '2026-09-20T08:00:00Z',
                },
            ],
        },
    };

    it('successfully validates a complete and compliant schemaVersion: 1 backup object', () => {
        const result = parseAndValidateBackup(validBackupPayload);
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.schemaVersion).toBe(1);
        expect(result.data?.data.routines).toHaveLength(1);
        expect(result.data?.data.workouts).toHaveLength(1);
        expect(result.data?.data.customExercises).toHaveLength(1);
        expect(result.data?.data.weightHistory).toHaveLength(1);
    });

    it('successfully parses and validates when passed as a JSON string', () => {
        const jsonStr = JSON.stringify(validBackupPayload);
        const result = parseAndValidateBackup(jsonStr);
        expect(result.success).toBe(true);
        expect(result.data?.userId).toBe('user-test-123');
    });

    it('rejects unsupported schema versions (e.g. schemaVersion: 2)', () => {
        const invalidPayload = {
            ...validBackupPayload,
            schemaVersion: 2,
        };
        const result = parseAndValidateBackup(invalidPayload);
        expect(result.success).toBe(false);
        expect(result.errors?.some((e) => e.includes('schemaVersion'))).toBe(true);
    });

    it('rejects payloads missing mandatory root fields like userId or exportedAt', () => {
        const { userId, ...missingUserId } = validBackupPayload;
        const result = parseAndValidateBackup(missingUserId);
        expect(result.success).toBe(false);
        expect(result.errors?.some((e) => e.includes('userId'))).toBe(true);
    });

    it('handles malformed JSON strings gracefully with informative error', () => {
        const result = parseAndValidateBackup('{ invalid json');
        expect(result.success).toBe(false);
        expect(result.errors?.[0]).toContain('Error al parsear JSON');
    });

    it('rejects primitive or non-object values', () => {
        expect(parseAndValidateBackup(null).success).toBe(false);
        expect(parseAndValidateBackup(12345).success).toBe(false);
        expect(parseAndValidateBackup('just a string').success).toBe(false);
    });

    it('validates routine day structures and series attributes correctly', () => {
        const invalidSeriesPayload = {
            ...validBackupPayload,
            data: {
                ...validBackupPayload.data,
                routines: [
                    {
                        nombre: 'Test Routine',
                        rutinas_diarias: [
                            {
                                nombre_dia: 'Day 1',
                                ejercicios_programados: [
                                    {
                                        series: [
                                            {
                                                numero_serie: -1, // invalid: must be >= 1
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        };
        const result = parseAndValidateBackup(invalidSeriesPayload);
        expect(result.success).toBe(false);
        expect(result.errors?.some((e) => e.includes('numero_serie'))).toBe(true);
    });
});
