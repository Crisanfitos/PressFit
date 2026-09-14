-- ============================================================================
-- Rollback Migration: Revert RLS policies for Custom Exercises Update and Delete
-- Migration Ref: 20260906000000_custom_exercises_update_delete_policies
-- ============================================================================

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios ejercicios personalizados" ON public.ejercicios;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios ejercicios personalizados" ON public.ejercicios;
