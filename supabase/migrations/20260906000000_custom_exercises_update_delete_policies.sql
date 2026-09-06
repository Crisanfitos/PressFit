-- PressFit Migration: RLS policies for Custom Exercises Update and Delete
-- Migration ID: 20260906000000_custom_exercises_update_delete_policies

CREATE POLICY "Usuarios pueden actualizar sus propios ejercicios personalizados" 
ON public.ejercicios 
FOR UPDATE 
TO authenticated 
USING ((auth.uid() = created_by) AND (is_custom = true)) 
WITH CHECK ((auth.uid() = created_by) AND (is_custom = true));

CREATE POLICY "Usuarios pueden eliminar sus propios ejercicios personalizados" 
ON public.ejercicios 
FOR DELETE 
TO authenticated 
USING ((auth.uid() = created_by) AND (is_custom = true));
