-- Migration: Create production_errors table for Sentry -> Supabase -> Raspberry Pi pipeline
-- Access policy: Strictly private (RLS enabled, NO policies for anon/authenticated; service_role only)

CREATE TABLE IF NOT EXISTS public.production_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sentry_issue_id TEXT NOT NULL UNIQUE,
    sentry_event_id TEXT,
    sentry_short_id TEXT,
    sentry_url TEXT,
    fingerprint TEXT,

    -- Lifecycle & resolution tracking
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'ticketed', 'in_progress', 'resolved', 'ignored')),
    ticket_id TEXT,
    occurrences_count INTEGER NOT NULL DEFAULT 1,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_in_version TEXT,
    resolution_notes TEXT,

    -- Error classification & full context
    level TEXT NOT NULL DEFAULT 'error',
    environment TEXT NOT NULL DEFAULT 'production',
    error_type TEXT,
    error_message TEXT NOT NULL,
    culprit TEXT,
    handled BOOLEAN,
    stacktrace TEXT,
    breadcrumbs JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- App & Build metadata
    app_version TEXT,
    app_build TEXT,
    release TEXT,
    runtime_name TEXT,

    -- Device & OS metadata
    os_name TEXT,
    os_version TEXT,
    device_model TEXT,
    device_brand TEXT,
    device_manufacturer TEXT,
    device_family TEXT,
    is_emulator BOOLEAN,
    locale TEXT,
    timezone TEXT,
    network_type TEXT,

    -- User & raw contexts
    affected_user_id TEXT,
    tags JSONB NOT NULL DEFAULT '{}'::jsonb,
    contexts JSONB NOT NULL DEFAULT '{}'::jsonb,
    extra_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_errors_status ON public.production_errors(status);
CREATE INDEX IF NOT EXISTS idx_production_errors_last_seen ON public.production_errors(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_errors_ticket_id ON public.production_errors(ticket_id);
CREATE INDEX IF NOT EXISTS idx_production_errors_app_version ON public.production_errors(app_version);

ALTER TABLE public.production_errors ENABLE ROW LEVEL SECURITY;

-- Explicitly revoke all privileges from public/anon/authenticated; only service_role may access.
REVOKE ALL ON TABLE public.production_errors FROM PUBLIC, anon, authenticated;
