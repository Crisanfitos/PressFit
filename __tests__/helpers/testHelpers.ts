/**
 * Test Helpers — Pure utility functions only.
 *
 * No database calls. These are deterministic functions
 * used across multiple test suites.
 */

// ==============================================================================
// RUTINA DIARIA — State machine
// ==============================================================================

export type RutinaDiariaEstado = 'PLANTILLA' | 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA';

/**
 * Determines the state of a daily routine based on its fields.
 */
export const getRutinaDiariaEstado = (rutinaDiaria: {
    fecha_dia: string | null;
    hora_inicio: string | null;
    hora_fin: string | null;
}): RutinaDiariaEstado => {
    if (rutinaDiaria.fecha_dia === null) {
        return 'PLANTILLA';
    }
    if (rutinaDiaria.hora_fin !== null) {
        return 'COMPLETADA';
    }
    if (rutinaDiaria.hora_inicio !== null && rutinaDiaria.hora_fin === null) {
        return 'EN_PROGRESO';
    }
    return 'PENDIENTE';
};

/**
 * Calculates workout duration in minutes.
 */
export const calcularDuracionMinutos = (hora_inicio: string, hora_fin: string): number => {
    const inicio = new Date(hora_inicio);
    const fin = new Date(hora_fin);
    const diffMs = fin.getTime() - inicio.getTime();
    return Math.round(diffMs / 1000 / 60);
};

// ==============================================================================
// DATE HELPERS
// ==============================================================================

/**
 * Returns the Monday of the current week as YYYY-MM-DD.
 * Uses local timezone to avoid UTC date shift issues.
 */
export const getMondayOfCurrentWeek = (): string => {
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const daysToSubtract = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToSubtract);
    monday.setHours(0, 0, 0, 0);
    // Use local date components to avoid UTC shift
    const y = monday.getFullYear();
    const m = String(monday.getMonth() + 1).padStart(2, '0');
    const d = String(monday.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

/**
 * Parses a YYYY-MM-DD string into a local Date object.
 * Avoids the UTC midnight issue of new Date("YYYY-MM-DD").
 */
export const parseLocalDate = (dateStr: string): Date => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
};

// ==============================================================================
// MOCK DATA FIXTURES
// ==============================================================================

export const MOCK_USER_ID = 'user-test-001';

export const createMockExercise = (overrides: Record<string, any> = {}) => ({
    id: 'exercise-001',
    titulo: 'Press Banca',
    descripcion: 'Ejercicio de pecho',
    grupo_muscular: 'Pecho',
    url_video: null,
    imagen_url: null,
    ...overrides,
});

export const createMockSerie = (overrides: Record<string, any> = {}) => ({
    id: 'serie-001',
    ejercicio_programado_id: 'ep-001',
    numero_serie: 1,
    peso_utilizado: 60,
    repeticiones: 10,
    rpe: 7,
    ...overrides,
});

export const createMockEjercicioProgramado = (overrides: Record<string, any> = {}) => ({
    id: 'ep-001',
    rutina_diaria_id: 'day-001',
    ejercicio_id: 'exercise-001',
    orden_ejecucion: 1,
    tipo_peso: 'total',
    notas_sesion: null,
    ejercicio: createMockExercise(),
    series: [
        createMockSerie({ id: 'serie-001', numero_serie: 1 }),
        createMockSerie({ id: 'serie-002', numero_serie: 2, peso_utilizado: 65 }),
    ],
    ...overrides,
});

export const createMockRutinaDiaria = (overrides: Record<string, any> = {}) => ({
    id: 'day-001',
    rutina_semanal_id: 'routine-001',
    nombre_dia: 'Lunes',
    fecha_dia: null,
    hora_inicio: null,
    hora_fin: null,
    completada: false,
    ejercicios_programados: [createMockEjercicioProgramado()],
    ...overrides,
});

export const createMockRutinaSemanal = (overrides: Record<string, any> = {}) => ({
    id: 'routine-001',
    usuario_id: MOCK_USER_ID,
    nombre: 'Mi Rutina PPL',
    es_plantilla: true,
    activa: true,
    fecha_inicio_semana: null,
    copiada_de_id: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    rutinas_diarias: [
        createMockRutinaDiaria({ id: 'day-lunes', nombre_dia: 'Lunes' }),
        createMockRutinaDiaria({ id: 'day-martes', nombre_dia: 'Martes', ejercicios_programados: [] }),
        createMockRutinaDiaria({ id: 'day-miercoles', nombre_dia: 'Miércoles', ejercicios_programados: [] }),
        createMockRutinaDiaria({ id: 'day-jueves', nombre_dia: 'Jueves', ejercicios_programados: [] }),
        createMockRutinaDiaria({ id: 'day-viernes', nombre_dia: 'Viernes', ejercicios_programados: [] }),
        createMockRutinaDiaria({ id: 'day-sabado', nombre_dia: 'Sábado', ejercicios_programados: [] }),
        createMockRutinaDiaria({ id: 'day-domingo', nombre_dia: 'Domingo', ejercicios_programados: [] }),
    ],
    ...overrides,
});
