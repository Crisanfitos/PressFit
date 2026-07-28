-- PressFit Initial Database Schema Migration
-- Migration ID: 20260728000000_initial_schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. Tabla Usuarios (User Profiles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    nombre TEXT NOT NULL DEFAULT '',
    peso NUMERIC(5,2),
    altura NUMERIC(5,2), -- Almacenado en metros (ej. 1.75)
    grasa_corporal NUMERIC(4,1),
    imc NUMERIC(4,1),
    url_foto TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. Tabla Rutinas Semanales (Weekly Routines / Templates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rutinas_semanales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    objetivo TEXT,
    es_plantilla BOOLEAN NOT NULL DEFAULT true,
    activa BOOLEAN NOT NULL DEFAULT false,
    copiada_de_id UUID REFERENCES public.rutinas_semanales(id) ON DELETE SET NULL,
    fecha_inicio_semana DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. Tabla Rutinas Diarias (Daily Routines / Workout Days)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rutinas_diarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rutina_semanal_id UUID NOT NULL REFERENCES public.rutinas_semanales(id) ON DELETE CASCADE,
    nombre_dia TEXT NOT NULL,
    fecha_dia DATE,
    hora_inicio TIMESTAMPTZ,
    hora_fin TIMESTAMPTZ,
    completada BOOLEAN NOT NULL DEFAULT false,
    descripcion_usuario TEXT,
    descripcion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. Tabla Ejercicios (Exercise Catalog)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ejercicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    grupo_muscular_principal TEXT NOT NULL,
    grupos_musculares_secundarios TEXT[],
    descripcion TEXT,
    imagen_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. Tabla Ejercicios Programados (Scheduled Exercises)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ejercicios_programados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rutina_diaria_id UUID NOT NULL REFERENCES public.rutinas_diarias(id) ON DELETE CASCADE,
    ejercicio_id UUID NOT NULL REFERENCES public.ejercicios(id) ON DELETE CASCADE,
    orden_ejecucion INT NOT NULL DEFAULT 1,
    tipo_peso TEXT NOT NULL DEFAULT 'total' CHECK (tipo_peso IN ('total', 'por_lado', 'corporal')),
    notas_sesion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. Tabla Series (Exercise Sets)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ejercicio_programado_id UUID NOT NULL REFERENCES public.ejercicios_programados(id) ON DELETE CASCADE,
    numero_serie INT NOT NULL,
    peso_utilizado NUMERIC(6,2) NOT NULL DEFAULT 0,
    repeticiones INT NOT NULL DEFAULT 0,
    rpe NUMERIC(3,1),
    descanso_segundos INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. Tabla Fotos Progreso (Progress Photos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.fotos_progreso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    url_foto TEXT NOT NULL,
    comentario TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 8. Tabla Historial Peso (Weight History Logs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.historial_peso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    peso NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 9. Índices para Optimización de Consultas
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_rutinas_semanales_usuario ON public.rutinas_semanales(usuario_id);
CREATE INDEX IF NOT EXISTS idx_rutinas_diarias_rutina ON public.rutinas_diarias(rutina_semanal_id);
CREATE INDEX IF NOT EXISTS idx_rutinas_diarias_fecha ON public.rutinas_diarias(fecha_dia);
CREATE INDEX IF NOT EXISTS idx_ejercicios_programados_diaria ON public.ejercicios_programados(rutina_diaria_id);
CREATE INDEX IF NOT EXISTS idx_ejercicios_programados_ejercicio ON public.ejercicios_programados(ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_series_programado ON public.series(ejercicio_programado_id);
CREATE INDEX IF NOT EXISTS idx_fotos_progreso_usuario ON public.fotos_progreso(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_peso_usuario ON public.historial_peso(usuario_id);
