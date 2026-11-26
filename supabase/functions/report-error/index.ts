// @ts-nocheck -- Deno Edge Function runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sanitizeErrorReportPayload } from "../../../src/utils/errorReportUtils.ts";

const MAX_BODY_BYTES = 65_536;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

function isAuthorizedRequest(req: Request, expectedAnonKey: string): boolean {
  const apiKeyHeader = req.headers.get("apikey")?.trim() || "";
  const authHeader = req.headers.get("authorization")?.trim() || "";
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!expectedAnonKey) {
    return Boolean(apiKeyHeader || bearerToken);
  }
  return apiKeyHeader === expectedAnonKey || bearerToken === expectedAnonKey;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

  if (!isAuthorizedRequest(req, anonKey)) {
    return jsonResponse({ error: "Unauthorized: missing or invalid apikey" }, 401);
  }

  const rawBody = await req.text();
  if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
    return jsonResponse({ error: "Payload too large (max 64KB)" }, 413);
  }

  let parsedBody: Record<string, unknown>;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "Invalid JSON payload" }, 400);
  }

  const sanitized = sanitizeErrorReportPayload(parsedBody);
  if (!sanitized) {
    return jsonResponse({ error: "Validation failed: error_message is required" }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Resolve user id from JWT when caller provides a real user session token
  let resolvedUserId = sanitized.affected_user_id;
  const authHeader = req.headers.get("authorization")?.trim() || "";
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (bearerToken && bearerToken !== anonKey) {
    try {
      const { data: userData } = await supabase.auth.getUser(bearerToken);
      if (userData?.user?.id) {
        resolvedUserId = userData.user.id;
      }
    } catch {
      // Keep client-supplied affected_user_id on token lookup failure
    }
  }

  const nowIso = new Date().toISOString();

  const { data: existing, error: lookupErr } = await supabase
    .from("production_errors")
    .select("id, occurrences_count, status, resolved_in_version")
    .eq("sentry_issue_id", sanitized.issue_key)
    .maybeSingle();

  if (lookupErr) {
    return jsonResponse({ error: lookupErr.message }, 500);
  }

  const commonColumns = {
    sentry_event_id: null,
    sentry_short_id: sanitized.short_id,
    sentry_url: null,
    fingerprint: sanitized.fingerprint,
    level: sanitized.level,
    environment: sanitized.environment,
    error_type: sanitized.error_type,
    error_message: sanitized.error_message,
    culprit: sanitized.culprit,
    handled: sanitized.handled,
    stacktrace: sanitized.stacktrace,
    breadcrumbs: sanitized.breadcrumbs,
    app_version: sanitized.app_version,
    app_build: sanitized.app_build,
    release: sanitized.release,
    runtime_name: sanitized.runtime_name,
    os_name: sanitized.os_name,
    os_version: sanitized.os_version,
    device_model: sanitized.device_model,
    device_brand: sanitized.device_brand,
    device_manufacturer: sanitized.device_manufacturer,
    device_family: sanitized.device_family,
    is_emulator: sanitized.is_emulator,
    locale: sanitized.locale,
    timezone: sanitized.timezone,
    network_type: sanitized.network_type,
    affected_user_id: resolvedUserId,
    tags: sanitized.tags,
    contexts: sanitized.contexts,
    extra_data: sanitized.extra_data,
    raw_payload: parsedBody,
    last_seen_at: nowIso,
    updated_at: nowIso,
  };

  if (existing) {
    const newCount = (existing.occurrences_count || 1) + 1;
    const isRegression =
      existing.status === "resolved" &&
      sanitized.app_version !== "unknown" &&
      existing.resolved_in_version &&
      sanitized.app_version !== existing.resolved_in_version;

    const { error: updateErr } = await supabase
      .from("production_errors")
      .update({
        ...commonColumns,
        occurrences_count: newCount,
        ...(isRegression ? { status: "pending", resolved_at: null } : {}),
      })
      .eq("id", existing.id);

    if (updateErr) {
      return jsonResponse({ error: updateErr.message }, 500);
    }

    return jsonResponse(
      {
        ok: true,
        action: "updated",
        id: existing.id,
        issue_key: sanitized.issue_key,
        short_id: sanitized.short_id,
        occurrences_count: newCount,
      },
      200
    );
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("production_errors")
    .insert({
      sentry_issue_id: sanitized.issue_key,
      status: "pending",
      occurrences_count: 1,
      first_seen_at: nowIso,
      ...commonColumns,
    })
    .select("id")
    .single();

  if (insertErr) {
    return jsonResponse({ error: insertErr.message }, 500);
  }

  return jsonResponse(
    {
      ok: true,
      action: "created",
      id: inserted?.id || null,
      issue_key: sanitized.issue_key,
      short_id: sanitized.short_id,
      occurrences_count: 1,
    },
    201
  );
});
