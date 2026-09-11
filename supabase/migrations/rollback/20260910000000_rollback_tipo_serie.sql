-- ============================================================================
-- Rollback Migration: Revert tipo_serie from public.series
-- Ticket: PF-332 (reversing PF-313 changes if needed)
-- Description: Elimina de forma segura y reversible el índice idx_series_tipo_serie
--              y la columna tipo_serie de la tabla public.series sin afectar al resto
--              de datos de series (peso, repeticiones, rpe, etc.).
-- ============================================================================

-- 1. Eliminar el índice si existe
DROP INDEX IF EXISTS public.idx_series_tipo_serie;

-- 2. Eliminar la columna tipo_serie si existe
ALTER TABLE public.series
DROP COLUMN IF EXISTS tipo_serie;
