/**
 * Central TypeScript type definitions for all Supabase domain models.
 *
 * These interfaces map to the database tables and are consumed by
 * all services and controllers across the application.
 *
 * @module types/models
 */

import { TipoPeso } from './setTypes';

// ============================================================================
// Service Response
// ============================================================================

/**
 * Standard response wrapper for all service methods that interact with Supabase.
 * Uses `unknown` instead of `any` for type-safe error handling.
 */
export interface ServiceResponse<T> {
    data: T | null;
    error: unknown;
}

// ============================================================================
// Core Domain Models (mapped to Supabase tables)
// ============================================================================

/**
 * Represents a single exercise from the `ejercicios` catalog table.
 */
export interface Exercise {
    id: string;
    nombre: string;
    grupo_muscular_principal: string;
    grupos_musculares_secundarios?: string[];
    descripcion?: string;
    imagen_url?: string;
    created_at?: string;
}

/**
 * Represents a single set (serie) from the `series` table.
 */
export interface Serie {
    id: string;
    ejercicio_programado_id: string;
    numero_serie: number;
    peso_utilizado: number;
    repeticiones: number;
    rpe?: number;
    descanso_segundos?: number;
    created_at?: string;
}

/**
 * Represents a scheduled exercise from the `ejercicios_programados` table.
 * Links an exercise to a routine day with ordering and optional nested data.
 */
export interface ScheduledExercise {
    id: string;
    rutina_diaria_id: string;
    ejercicio_id: string;
    orden_ejecucion: number;
    tipo_peso: TipoPeso;
    ejercicio?: Exercise;
    series?: Serie[];
    notas_sesion?: string | null;
    created_at?: string;
    updated_at?: string;
}

/**
 * Represents a daily routine / workout day from the `rutinas_diarias` table.
 * Can be either a template day (no fecha_dia) or an active workout instance.
 */
export interface RoutineDay {
    id: string;
    rutina_semanal_id: string;
    nombre_dia: string;
    fecha_dia: string | null;
    hora_inicio?: string;
    hora_fin?: string;
    completada?: boolean;
    descripcion_usuario?: string;
    descripcion?: string;
    ejercicios_programados?: ScheduledExercise[];
    rutina_semanal?: { usuario_id: string };
    isStale?: boolean;
    days_diff?: number;
}

/**
 * Represents a weekly routine from the `rutinas_semanales` table.
 * Contains one or more routine days.
 */
export interface WeeklyRoutine {
    id: string;
    usuario_id: string;
    nombre: string;
    es_plantilla: boolean;
    activa: boolean;
    fecha_inicio_semana?: string;
    rutinas_diarias?: RoutineDay[];
    created_at?: string;
    updated_at?: string;
}

/**
 * Represents a user profile from the `usuarios` table.
 */
export interface UserProfile {
    id: string;
    email: string;
    nombre: string;
    peso?: number;
    altura?: number;
    grasa_corporal?: number | null;
    imc?: number;
    url_foto?: string;
    updated_at?: string;
}

/**
 * Represents a progress photo from the `fotos_progreso` table.
 */
export interface ProgressPhoto {
    id: string;
    usuario_id: string;
    url_foto: string;
    comentario?: string;
    created_at: string;
}

/**
 * Weight history entry from the `historial_peso` table.
 */
export interface WeightHistoryEntry {
    id: string;
    peso: number;
    created_at: string;
}

// ============================================================================
// Computed / Derived Types (not direct DB mappings)
// ============================================================================

/**
 * Workout statistics computed from routine day data.
 */
export interface WorkoutStats {
    exerciseCount: number;
    duration: number | null;
    isCompleted: boolean;
    startTime?: string | null;
    endTime?: string | null;
}

/**
 * User physical metrics input (app-side, height in CM).
 */
export interface UserMetrics {
    weight: number;
    height: number;
    bodyFatPercentage?: number;
    imc?: number;
}

/**
 * Personal record for an exercise.
 */
export interface PersonalRecord {
    peso_maximo: number;
    repeticiones: number;
    fecha_pr: string;
    fecha_dia: string;
}

/**
 * Exercise history entry for tracking progress over time.
 */
export interface ExerciseHistoryEntry {
    fecha_dia: string;
    peso_sesion: number;
    reps_totales: number;
    volumen_sesion: number;
    tipo_peso?: TipoPeso;
}

/**
 * Partial update payload for a set (serie).
 */
export interface SetUpdatePayload {
    peso_utilizado?: number;
    repeticiones?: number;
    rpe?: number;
    descanso_segundos?: number;
}

/**
 * Insert payload for creating a new weekly routine.
 */
export interface WeeklyRoutineInsert extends Partial<WeeklyRoutine> {
    updated_at?: string;
}

// ============================================================================
// Supabase / PostgREST Error
// ============================================================================

/**
 * PostgREST error shape returned by Supabase client.
 * Used to replace `(error as any).code` casts.
 */
export interface PostgrestError {
    message: string;
    code: string;
    details?: string;
    hint?: string;
}

// ============================================================================
// Insert Payloads
// ============================================================================

/**
 * Payload for inserting a new series row into the `series` table.
 */
export interface SeriesInsert {
    ejercicio_programado_id: string;
    numero_serie: number;
    peso_utilizado: number;
    repeticiones: number;
    rpe?: number;
    descanso_segundos?: number;
}

// ============================================================================
// Preset Routines Seed Types (EPIC-08)
// ============================================================================

export interface PresetSeries {
    numero_serie: number;
    peso_sugerido?: number;
    repeticiones_objetivo: number;
    rpe_objetivo?: number;
    descanso_segundos?: number;
}

export interface PresetScheduledExercise {
    nombre_ejercicio: string;
    grupo_muscular_principal: string;
    orden_ejecucion: number;
    tipo_peso: TipoPeso;
    notas?: string;
    series: PresetSeries[];
}

export interface PresetRoutineDay {
    nombre_dia: string;
    descripcion?: string;
    orden: number;
    ejercicios: PresetScheduledExercise[];
}

export interface PresetRoutine {
    id: string;
    nombre: string;
    descripcion: string;
    categoria: 'Hipertrofia' | 'Fuerza' | 'Estética' | 'Principiante' | 'Híbrido';
    dias_por_semana: number;
    nivel: 'Principiante' | 'Intermedio' | 'Avanzado';
    imagen_url?: string;
    rutinas_diarias: PresetRoutineDay[];
}

export interface PresetFilterOptions {
    categoria?: string;
    dias_por_semana?: number;
    nivel?: string;
}

