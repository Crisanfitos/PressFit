-- ============================================================================
-- Migration: Add tipo_serie to public.series
-- Ticket: PF-313
-- Description: Añade la columna tipo_serie con restricción CHECK ('normal', 'warmup', 'feeder', 'failure', 'drop')
--              y valor predeterminado 'normal' a la tabla series, junto con un índice de optimización.
-- ============================================================================

ALTER TABLE public.series
ADD COLUMN IF NOT EXISTS tipo_serie TEXT NOT NULL DEFAULT 'normal'
CHECK (tipo_serie IN ('normal', 'warmup', 'feeder', 'failure', 'drop'));

-- Índice para acelerar consultas y agregaciones por tipo de serie
CREATE INDEX IF NOT EXISTS idx_series_tipo_serie ON public.series(tipo_serie);
