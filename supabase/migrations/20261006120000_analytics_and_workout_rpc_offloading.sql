-- ============================================================================
-- PressFit Migration: Analytics, Personal Records, Workout Offloading & Streaks
-- Migration ID: 20261006120000_analytics_and_workout_rpc_offloading
-- Description:
--   1. Pure SQL function for 1RM calculation (Brzycki <= 10 reps, Epley > 10 reps).
--   2. RPC get_exercise_1rm_history: Server-side daily max 1RM progression.
--   3. RPC get_exercise_prs: Server-side max weight, max volume, and max 1RM.
--   4. RPC get_personal_record: Restores missing RPC for PersonalRecordService.
--   5. RPC get_exercise_history: Restores missing RPC for PersonalRecordService.
--   6. RPC get_weekly_fatigue_analysis: Computes RPE load and athletic readiness.
--   7. RPC start_daily_workout: Atomic single-transaction workout session creation.
--   8. Table user_streaks, trigger for workout completion, and pg_cron maintenance.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Helper Function: calculate_1rm
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_1rm(p_weight NUMERIC, p_reps INT)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
    SELECT CASE
        WHEN p_weight IS NULL OR p_reps IS NULL OR p_weight <= 0 OR p_reps <= 0 THEN 0.00
        WHEN p_reps = 1 THEN ROUND(p_weight::NUMERIC, 2)
        WHEN p_reps <= 10 THEN ROUND((p_weight * (36.0 / (37.0 - p_reps)))::NUMERIC, 2)
        WHEN p_reps < 37 THEN ROUND((p_weight * (1.0 + 0.0333 * p_reps))::NUMERIC, 2)
        ELSE ROUND((p_weight * (1.0 + 0.0333 * p_reps))::NUMERIC, 2)
    END;
$$;

-- ----------------------------------------------------------------------------
-- 2. RPC: get_exercise_1rm_history
-- Returns chronologically ascending session 1RM data points.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_exercise_1rm_history(
    p_usuario_id UUID,
    p_ejercicio_id UUID
)
RETURNS TABLE (
    fecha TEXT,
    "estimated1RM" NUMERIC,
    peso_utilizado NUMERIC,
    repeticiones INT,
    numero_serie INT,
    formula TEXT,
    rutina_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    RETURN QUERY
    WITH candidate_sets AS (
        SELECT
            rd.fecha_dia::TEXT AS fecha,
            public.calculate_1rm(s.peso_utilizado, s.repeticiones) AS e1rm,
            s.peso_utilizado,
            s.repeticiones,
            s.numero_serie,
            CASE WHEN s.repeticiones <= 10 THEN 'brzycki'::TEXT ELSE 'epley'::TEXT END AS formula_name,
            rd.id AS rutina_id,
            ROW_NUMBER() OVER (
                PARTITION BY rd.fecha_dia
                ORDER BY public.calculate_1rm(s.peso_utilizado, s.repeticiones) DESC, s.numero_serie ASC
            ) AS rn
        FROM public.series s
        JOIN public.ejercicios_programados ep ON s.ejercicio_programado_id = ep.id
        JOIN public.rutinas_diarias rd ON ep.rutina_diaria_id = rd.id
        JOIN public.rutinas_semanales rs ON rd.rutina_semanal_id = rs.id
        WHERE rs.usuario_id = p_usuario_id
          AND ep.ejercicio_id = p_ejercicio_id
          AND rd.fecha_dia IS NOT NULL
          AND s.peso_utilizado IS NOT NULL
          AND s.peso_utilizado > 0
          AND s.repeticiones IS NOT NULL
          AND s.repeticiones > 0
    )
    SELECT
        cs.fecha,
        cs.e1rm AS "estimated1RM",
        cs.peso_utilizado,
        cs.repeticiones,
        cs.numero_serie,
        cs.formula_name AS formula,
        cs.rutina_id
    FROM candidate_sets cs
    WHERE cs.rn = 1
    ORDER BY cs.fecha ASC;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. RPC: get_exercise_prs
-- Returns historical max weight, max single-set volume, and max estimated 1RM.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_exercise_prs(
    p_usuario_id UUID,
    p_ejercicio_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_max_weight NUMERIC := 0;
    v_max_volume NUMERIC := 0;
    v_max_1rm NUMERIC := 0;
BEGIN
    SELECT
        COALESCE(MAX(s.peso_utilizado), 0),
        COALESCE(MAX(ROUND((s.peso_utilizado * s.repeticiones)::NUMERIC, 2)), 0),
        COALESCE(MAX(public.calculate_1rm(s.peso_utilizado, s.repeticiones)), 0)
    INTO
        v_max_weight,
        v_max_volume,
        v_max_1rm
    FROM public.series s
    JOIN public.ejercicios_programados ep ON s.ejercicio_programado_id = ep.id
    JOIN public.rutinas_diarias rd ON ep.rutina_diaria_id = rd.id
    JOIN public.rutinas_semanales rs ON rd.rutina_semanal_id = rs.id
    WHERE rs.usuario_id = p_usuario_id
      AND ep.ejercicio_id = p_ejercicio_id
      AND s.peso_utilizado > 0
      AND s.repeticiones > 0;

    RETURN jsonb_build_object(
        'maxWeight', v_max_weight,
        'maxVolume', v_max_volume,
        'max1RM', v_max_1rm
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. RPC: get_personal_record
-- Restores RPC required by PersonalRecordService.ts
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_personal_record(
    p_usuario_id UUID,
    p_ejercicio_id UUID
)
RETURNS TABLE (
    peso_maximo NUMERIC,
    repeticiones INT,
    fecha_pr TEXT,
    fecha_dia TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.peso_utilizado AS peso_maximo,
        s.repeticiones,
        rd.fecha_dia::TEXT AS fecha_pr,
        rd.fecha_dia::TEXT AS fecha_dia
    FROM public.series s
    JOIN public.ejercicios_programados ep ON s.ejercicio_programado_id = ep.id
    JOIN public.rutinas_diarias rd ON ep.rutina_diaria_id = rd.id
    JOIN public.rutinas_semanales rs ON rd.rutina_semanal_id = rs.id
    WHERE rs.usuario_id = p_usuario_id
      AND ep.ejercicio_id = p_ejercicio_id
      AND s.peso_utilizado > 0
      AND s.repeticiones > 0
    ORDER BY s.peso_utilizado DESC, s.repeticiones DESC, rd.fecha_dia DESC
    LIMIT 1;
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. RPC: get_exercise_history
-- Restores RPC required by PersonalRecordService.ts
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_exercise_history(
    p_usuario_id UUID,
    p_ejercicio_id UUID
)
RETURNS TABLE (
    fecha_dia TEXT,
    peso_sesion NUMERIC,
    reps_totales BIGINT,
    volumen_sesion NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    RETURN QUERY
    SELECT
        rd.fecha_dia::TEXT AS fecha_dia,
        MAX(s.peso_utilizado) AS peso_sesion,
        SUM(s.repeticiones)::BIGINT AS reps_totales,
        ROUND(SUM(s.peso_utilizado * s.repeticiones)::NUMERIC, 2) AS volumen_sesion
    FROM public.series s
    JOIN public.ejercicios_programados ep ON s.ejercicio_programado_id = ep.id
    JOIN public.rutinas_diarias rd ON ep.rutina_diaria_id = rd.id
    JOIN public.rutinas_semanales rs ON rd.rutina_semanal_id = rs.id
    WHERE rs.usuario_id = p_usuario_id
      AND ep.ejercicio_id = p_ejercicio_id
      AND rd.fecha_dia IS NOT NULL
      AND s.peso_utilizado > 0
      AND s.repeticiones > 0
    GROUP BY rd.fecha_dia
    ORDER BY rd.fecha_dia DESC
    LIMIT 10;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. RPC: get_weekly_fatigue_analysis
-- Computes accumulated RPE fatigue and traffic light status.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_weekly_fatigue_analysis(
    p_usuario_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_total_series INT := 0;
    v_rpe_series INT := 0;
    v_rpe_sum NUMERIC := 0;
    v_high_intensity INT := 0;
    v_avg_rpe NUMERIC := 0;
    v_level TEXT := 'sin_datos';
    v_label TEXT := 'Sin Datos';
    v_color TEXT := '#6B7280';
    v_rec TEXT := 'Registra el RPE en tus series de entrenamiento para analizar tu fatiga acumulada.';
BEGIN
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE s.rpe IS NOT NULL AND s.rpe >= 1 AND s.rpe <= 10),
        COALESCE(SUM(s.rpe) FILTER (WHERE s.rpe IS NOT NULL AND s.rpe >= 1 AND s.rpe <= 10), 0),
        COUNT(*) FILTER (WHERE s.rpe IS NOT NULL AND s.rpe >= 9 AND s.rpe <= 10)
    INTO
        v_total_series,
        v_rpe_series,
        v_rpe_sum,
        v_high_intensity
    FROM public.series s
    JOIN public.ejercicios_programados ep ON s.ejercicio_programado_id = ep.id
    JOIN public.rutinas_diarias rd ON ep.rutina_diaria_id = rd.id
    JOIN public.rutinas_semanales rs ON rd.rutina_semanal_id = rs.id
    WHERE rs.usuario_id = p_usuario_id
      AND rd.fecha_dia BETWEEN p_start_date AND p_end_date
      AND s.tipo_serie NOT IN ('warmup', 'calentamiento')
      AND (s.rpe IS NULL OR s.rpe >= 5)
      AND s.peso_utilizado >= 0
      AND s.repeticiones > 0;

    IF v_rpe_series > 0 THEN
        v_avg_rpe := ROUND((v_rpe_sum / v_rpe_series)::NUMERIC, 1);

        IF v_avg_rpe > 8.7 OR (v_rpe_series >= 10 AND (v_high_intensity::NUMERIC / v_rpe_series) >= 0.6) THEN
            v_level := 'sobreentrenamiento';
            v_label := 'Sobreentrenamiento';
            v_color := '#EF4444';
            v_rec := 'Alerta de fatiga acumulada crítica. Considera una semana de descarga (deload) o descanso activo.';
        ELSIF v_avg_rpe >= 7.5 OR (v_rpe_series >= 8 AND v_high_intensity >= 4) THEN
            v_level := 'alto';
            v_label := 'Alto';
            v_color := '#F59E0B';
            v_rec := 'Fatiga acumulada moderada-alta. Monitorea tu recuperación, sueño y nutrición.';
        ELSE
            v_level := 'optimo';
            v_label := 'Óptimo';
            v_color := '#10B981';
            v_rec := 'Carga de trabajo óptima. Excelente capacidad de asimilación y recuperación.';
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'averageRPE', v_avg_rpe,
        'fatigueLevel', v_level,
        'totalSeriesCount', v_total_series,
        'rpeSeriesCount', v_rpe_series,
        'highIntensityCount', v_high_intensity,
        'statusLabel', v_label,
        'statusColor', v_color,
        'recommendation', v_rec
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. RPC: start_daily_workout
-- Single-transaction instantiation of a routine day session from a template.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_daily_workout(
    p_template_day_id UUID,
    p_workout_date DATE,
    p_start_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_template RECORD;
    v_new_day_id UUID;
    v_last_workout_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Fetch template day
    SELECT id, rutina_semanal_id, nombre_dia, descripcion
    INTO v_template
    FROM public.rutinas_diarias
    WHERE id = p_template_day_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template day % not found', p_template_day_id;
    END IF;

    -- 2. Find last completed workout for same day name to copy weights
    SELECT id INTO v_last_workout_id
    FROM public.rutinas_diarias
    WHERE rutina_semanal_id = v_template.rutina_semanal_id
      AND nombre_dia = v_template.nombre_dia
      AND completada = true
      AND fecha_dia IS NOT NULL
      AND fecha_dia < p_workout_date
    ORDER BY fecha_dia DESC
    LIMIT 1;

    -- 3. Insert new routine day
    INSERT INTO public.rutinas_diarias (
        rutina_semanal_id,
        nombre_dia,
        fecha_dia,
        hora_inicio,
        completada,
        descripcion
    ) VALUES (
        v_template.rutina_semanal_id,
        v_template.nombre_dia,
        p_workout_date,
        p_start_time,
        false,
        v_template.descripcion
    ) RETURNING id INTO v_new_day_id;

    -- 4. Copy scheduled exercises and corresponding series in set-based DML
    WITH inserted_ep AS (
        INSERT INTO public.ejercicios_programados (
            rutina_diaria_id,
            ejercicio_id,
            orden_ejecucion,
            tipo_peso,
            notas_sesion
        )
        SELECT
            v_new_day_id,
            tep.ejercicio_id,
            tep.orden_ejecucion,
            tep.tipo_peso,
            tep.notas_sesion
        FROM public.ejercicios_programados tep
        WHERE tep.rutina_diaria_id = p_template_day_id
        RETURNING id AS new_ep_id, ejercicio_id
    )
    INSERT INTO public.series (
        ejercicio_programado_id,
        numero_serie,
        peso_utilizado,
        repeticiones,
        descanso_segundos,
        tipo_serie
    )
    SELECT
        iep.new_ep_id,
        src_s.numero_serie,
        COALESCE(src_s.peso_utilizado, 0),
        0, -- Fresh session starts with 0 completed reps
        src_s.descanso_segundos,
        COALESCE(src_s.tipo_serie, 'normal')
    FROM inserted_ep iep
    CROSS JOIN LATERAL (
        -- Select series from previous completed workout if available, else template series
        SELECT s.numero_serie, s.peso_utilizado, s.descanso_segundos, s.tipo_serie
        FROM public.series s
        JOIN public.ejercicios_programados prev_ep ON s.ejercicio_programado_id = prev_ep.id
        WHERE v_last_workout_id IS NOT NULL
          AND prev_ep.rutina_diaria_id = v_last_workout_id
          AND prev_ep.ejercicio_id = iep.ejercicio_id
        UNION ALL
        SELECT ts.numero_serie, ts.peso_utilizado, ts.descanso_segundos, ts.tipo_serie
        FROM public.series ts
        JOIN public.ejercicios_programados tep ON ts.ejercicio_programado_id = tep.id
        WHERE tep.rutina_diaria_id = p_template_day_id
          AND tep.ejercicio_id = iep.ejercicio_id
          AND NOT EXISTS (
              SELECT 1 FROM public.series ps
              JOIN public.ejercicios_programados pep ON ps.ejercicio_programado_id = pep.id
              WHERE v_last_workout_id IS NOT NULL
                AND pep.rutina_diaria_id = v_last_workout_id
                AND pep.ejercicio_id = iep.ejercicio_id
          )
    ) src_s;

    -- 5. Construct full nested JSON result in 1 query
    SELECT to_jsonb(rd.*) INTO v_result
    FROM public.rutinas_diarias rd
    WHERE rd.id = v_new_day_id;

    RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------------------
-- 8. Table: user_streaks & Trigger on Workout Completion
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_streaks (
    usuario_id UUID PRIMARY KEY REFERENCES public.usuarios(id) ON DELETE CASCADE,
    current_streak_days INT NOT NULL DEFAULT 0,
    best_streak_days INT NOT NULL DEFAULT 0,
    current_streak_weeks INT NOT NULL DEFAULT 0,
    best_streak_weeks INT NOT NULL DEFAULT 0,
    total_workouts INT NOT NULL DEFAULT 0,
    total_tonnage NUMERIC(12,2) NOT NULL DEFAULT 0,
    last_workout_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden leer sus propias rachas"
ON public.user_streaks FOR SELECT TO authenticated
USING (auth.uid() = usuario_id);

CREATE OR REPLACE FUNCTION public.trg_workout_completed_update_streaks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_user_id UUID;
    v_session_tonnage NUMERIC := 0;
    v_streak RECORD;
    v_new_streak INT;
    v_new_best INT;
BEGIN
    -- Only trigger when a workout transitions to completed
    IF NEW.completada = true AND (OLD.completada IS DISTINCT FROM true) AND NEW.fecha_dia IS NOT NULL THEN
        -- Find owner
        SELECT usuario_id INTO v_user_id
        FROM public.rutinas_semanales
        WHERE id = NEW.rutina_semanal_id;

        IF v_user_id IS NULL THEN
            RETURN NEW;
        END IF;

        -- Calculate session tonnage
        SELECT COALESCE(SUM(s.peso_utilizado * s.repeticiones), 0)
        INTO v_session_tonnage
        FROM public.series s
        JOIN public.ejercicios_programados ep ON s.ejercicio_programado_id = ep.id
        WHERE ep.rutina_diaria_id = NEW.id
          AND s.peso_utilizado > 0
          AND s.repeticiones > 0;

        -- Ensure user_streaks record exists
        INSERT INTO public.user_streaks (usuario_id, current_streak_days, best_streak_days, total_workouts, total_tonnage, last_workout_date)
        VALUES (v_user_id, 0, 0, 0, 0, NULL)
        ON CONFLICT (usuario_id) DO NOTHING;

        SELECT * INTO v_streak
        FROM public.user_streaks
        WHERE usuario_id = v_user_id
        FOR UPDATE;

        IF v_streak.last_workout_date IS NULL THEN
            v_new_streak := 1;
        ELSIF v_streak.last_workout_date = NEW.fecha_dia THEN
            v_new_streak := v_streak.current_streak_days; -- Same day, preserve streak
        ELSIF v_streak.last_workout_date = NEW.fecha_dia - INTERVAL '1 day' THEN
            v_new_streak := v_streak.current_streak_days + 1; -- Consecutive day
        ELSE
            v_new_streak := 1; -- Streak broken, start anew
        END IF;

        v_new_best := GREATEST(v_new_streak, v_streak.best_streak_days);

        UPDATE public.user_streaks
        SET current_streak_days = v_new_streak,
            best_streak_days = v_new_best,
            total_workouts = v_streak.total_workouts + 1,
            total_tonnage = ROUND((v_streak.total_tonnage + v_session_tonnage)::NUMERIC, 2),
            last_workout_date = NEW.fecha_dia,
            updated_at = NOW()
        WHERE usuario_id = v_user_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workout_completed ON public.rutinas_diarias;
CREATE TRIGGER trg_workout_completed
AFTER UPDATE OF completada ON public.rutinas_diarias
FOR EACH ROW
EXECUTE FUNCTION public.trg_workout_completed_update_streaks();

-- ----------------------------------------------------------------------------
-- 9. Scheduled Background Job (pg_cron)
-- Daily midnight evaluation for streak breaks on inactive accounts
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'pressfit_daily_streak_maintenance',
            '0 2 * * *',
            $cron$
            UPDATE public.user_streaks
            SET current_streak_days = 0,
                updated_at = NOW()
            WHERE last_workout_date < CURRENT_DATE - INTERVAL '1 day'
              AND current_streak_days > 0;
            $cron$
        );
    END IF;
END $$;
