-- Rollback for 20261115000000_create_production_errors.sql

DROP INDEX IF EXISTS public.idx_production_errors_app_version;
DROP INDEX IF EXISTS public.idx_production_errors_ticket_id;
DROP INDEX IF EXISTS public.idx_production_errors_last_seen;
DROP INDEX IF EXISTS public.idx_production_errors_status;

DROP TABLE IF EXISTS public.production_errors;
