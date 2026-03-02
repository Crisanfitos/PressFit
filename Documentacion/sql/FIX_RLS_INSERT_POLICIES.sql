-- ==============================================================================
-- FIX: RLS Policies for INSERT operations
-- ==============================================================================
-- PROBLEMA: Las políticas RLS usan FOR ALL USING(...) sin WITH CHECK.
-- PostgreSQL necesita WITH CHECK para validar filas nuevas en INSERT.
-- Sin WITH CHECK, los INSERTs se bloquean silenciosamente.
-- ==============================================================================

-- 1. FIX: rutinas_diarias
DROP POLICY IF EXISTS "Usuarios ven sus dias" ON public.rutinas_diarias;

CREATE POLICY "Usuarios gestionan sus dias" ON public.rutinas_diarias
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.rutinas_semanales rs 
            WHERE rs.id = rutinas_diarias.rutina_semanal_id 
            AND rs.usuario_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.rutinas_semanales rs 
            WHERE rs.id = rutinas_diarias.rutina_semanal_id 
            AND rs.usuario_id = auth.uid()
        )
    );

-- 2. FIX: ejercicios_programados
DROP POLICY IF EXISTS "Usuarios gestionan sus ejercicios programados" ON public.ejercicios_programados;

CREATE POLICY "Usuarios gestionan sus ejercicios programados" ON public.ejercicios_programados
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.rutinas_diarias rd
            JOIN public.rutinas_semanales rs ON rd.rutina_semanal_id = rs.id
            WHERE rd.id = ejercicios_programados.rutina_diaria_id
            AND rs.usuario_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.rutinas_diarias rd
            JOIN public.rutinas_semanales rs ON rd.rutina_semanal_id = rs.id
            WHERE rd.id = ejercicios_programados.rutina_diaria_id
            AND rs.usuario_id = auth.uid()
        )
    );

-- 3. FIX: series
DROP POLICY IF EXISTS "Usuarios gestionan sus series" ON public.series;

CREATE POLICY "Usuarios gestionan sus series" ON public.series
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.ejercicios_programados ep
            JOIN public.rutinas_diarias rd ON ep.rutina_diaria_id = rd.id
            JOIN public.rutinas_semanales rs ON rd.rutina_semanal_id = rs.id
            WHERE ep.id = series.ejercicio_programado_id
            AND rs.usuario_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ejercicios_programados ep
            JOIN public.rutinas_diarias rd ON ep.rutina_diaria_id = rd.id
            JOIN public.rutinas_semanales rs ON rd.rutina_semanal_id = rs.id
            WHERE ep.id = series.ejercicio_programado_id
            AND rs.usuario_id = auth.uid()
        )
    );
