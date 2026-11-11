-- ============================================================================
-- PressFit Rollback: Revert Analytics, Workout RPC Offloading & Streaks
-- Migration ID: 20261006120000_rollback_analytics_and_workout_rpc_offloading
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.unschedule('pressfit_daily_streak_maintenance');
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore if cron job not found
END $$;

DROP TRIGGER IF EXISTS trg_workout_completed ON public.rutinas_diarias;
DROP FUNCTION IF EXISTS public.trg_workout_completed_update_streaks();
DROP TABLE IF EXISTS public.user_streaks;

DROP FUNCTION IF EXISTS public.start_daily_workout(UUID, DATE, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.get_weekly_fatigue_analysis(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS public.get_exercise_history(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_personal_record(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_exercise_prs(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_exercise_1rm_history(UUID, UUID);
DROP FUNCTION IF EXISTS public.calculate_1rm(NUMERIC, INT);
