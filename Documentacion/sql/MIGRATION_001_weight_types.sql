-- MIGRATION 001: Weight Types (tipo_peso)
-- Date: 2026-03-02
-- Description: Adds tipo_peso column to ejercicios_programados table
--              to distinguish between total weight, per-side weight, and bodyweight.
--
-- IMPORTANT: Take a backup of the database before running this migration.
-- Run this in Supabase SQL Editor.

-- Add tipo_peso column to ejercicios_programados
ALTER TABLE public.ejercicios_programados
ADD COLUMN tipo_peso TEXT NOT NULL DEFAULT 'total'
CHECK (tipo_peso IN ('total', 'por_lado', 'corporal'));

-- Verify the column was added
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'ejercicios_programados' AND column_name = 'tipo_peso';
