// @ts-nocheck -- Deno Edge Function runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

interface SentryFrame {
  filename?: string;
  abs_path?: string;
  function?: string;
  lineno?: number;
  colno?: number;
  in_app?: boolean;
}

function formatStacktrace(event: Record<string, any>): string | null {
  const exceptionValues = event?.exception?.values;
  if (!Array.isArray(exceptionValues) || exceptionValues.length === 0) {
    return typeof event?.message === "string" ? event.message : null;
  }

  const sections: string[] = [];
  for (const ex of exceptionValues) {
    const header = `${ex.type || "Error"}: ${ex.value || ""}`.trim();
    const frames: SentryFrame[] = ex.stacktrace?.frames || [];
    const formattedFrames = [...frames]
      .reverse()
      .slice(0, 25)
      .map((f) => {
        const file = f.filename || f.abs_path || "<unknown>";
        const loc = f.lineno ? `:${f.lineno}${f.colno ? `:${f.colno}` : ""}` : "";
        const fn = f.function || "<anonymous>";
        const mark = f.in_app ? " [in_app]" : "";
        return `  at ${fn} (${file}${loc})${mark}`;
      });
    sections.push([header, ...formattedFrames].join("\n"));
  }
  return sections.join("\n\n");
}

function tagsToObject(tags: unknown): Record<string, string> {
  if (!tags) return {};
  if (Array.isArray(tags)) {
    const out: Record<string, string> = {};
    for (const pair of tags) {
      if (Array.isArray(pair) && pair.length >= 2) {
        out[String(pair[0])] = String(pair[1]);
      }
    }
    return out;
  }
  if (typeof tags === "object") {
    return tags as Record<string, string>;
  }
  return {};
}

async function verifySentrySignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expectedHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expectedHex.toLowerCase() === signatureHeader.trim().toLowerCase();
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rawBody = await req.text();

  const sentrySecret = Deno.env.get("SENTRY_CLIENT_SECRET");
  if (sentrySecret) {
    const sigHeader = req.headers.get("sentry-hook-signature");
    const valid = await verifySentrySignature(rawBody, sigHeader, sentrySecret);
    if (!valid) {
      return new Response(JSON.stringify({ error: "Invalid Sentry signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const resource = req.headers.get("sentry-hook-resource") || "";
  const issue = payload?.data?.issue || payload?.issue || {};
  const event = payload?.data?.event || payload?.event || {};

  // Ignore non-issue/non-error webhooks cleanly
  const issueId = String(issue.id || event.issue_id || event.groupID || payload?.id || "");
  if (!issueId) {
    return new Response(
      JSON.stringify({ ok: true, ignored: true, reason: `No issue id (${resource})` }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const contexts = event.contexts || {};
  const osCtx = contexts.os || {};
  const deviceCtx = contexts.device || {};
  const appCtx = contexts.app || {};
  const runtimeCtx = contexts.runtime || {};
  const tagsObj = tagsToObject(event.tags);

  const exceptionList = Array.isArray(event?.exception?.values) ? event.exception.values : [];
  const primaryEx = exceptionList[0] || {};
  const handledVal =
    typeof primaryEx?.mechanism?.handled === "boolean"
      ? primaryEx.mechanism.handled
      : tagsObj.handled === "yes"
      ? true
      : tagsObj.handled === "no"
      ? false
      : null;

  const breadcrumbsRaw = event?.breadcrumbs?.values || event?.breadcrumbs || [];
  const breadcrumbs = Array.isArray(breadcrumbsRaw) ? breadcrumbsRaw.slice(-30) : [];

  const release = String(event.release || issue.firstRelease?.version || "");
  const releaseMatch = release.match(/@([^+]+)(?:\+(.+))?$/);
  const appVersion = String(
    appCtx.app_version || tagsObj["app.version"] || releaseMatch?.[1] || ""
  ) || null;
  const appBuild = String(
    appCtx.app_build || tagsObj["app.build"] || event.dist || releaseMatch?.[2] || ""
  ) || null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: existing } = await supabase
    .from("production_errors")
    .select("id, occurrences_count, status, resolved_in_version")
    .eq("sentry_issue_id", issueId)
    .maybeSingle();

  const nowIso = new Date().toISOString();
  const errorMessage = String(
    issue.title || primaryEx.value || event.title || event.message || "Unknown Sentry error"
  );

  const commonFields = {
    sentry_event_id: event.event_id ? String(event.event_id) : null,
    sentry_short_id: issue.shortId ? String(issue.shortId) : null,
    sentry_url: issue.permalink || payload.url || null,
    fingerprint: Array.isArray(event.fingerprint) ? event.fingerprint.join("|") : null,
    level: String(issue.level || event.level || tagsObj.level || "error"),
    environment: String(event.environment || tagsObj.environment || "production"),
    error_type: primaryEx.type ? String(primaryEx.type) : issue.type ? String(issue.type) : null,
    error_message: errorMessage,
    culprit: issue.culprit || event.culprit || null,
    handled: handledVal,
    stacktrace: formatStacktrace(event),
    breadcrumbs,
    app_version: appVersion,
    app_build: appBuild,
    release: release || null,
    runtime_name: runtimeCtx.name || tagsObj.runtime || null,
    os_name: osCtx.name || tagsObj.os_name || null,
    os_version: osCtx.version || tagsObj["os.version"] || null,
    device_model: deviceCtx.model || tagsObj.device || null,
    device_brand: deviceCtx.brand || null,
    device_manufacturer: deviceCtx.manufacturer || null,
    device_family: deviceCtx.family || null,
    is_emulator: typeof deviceCtx.simulator === "boolean" ? deviceCtx.simulator : null,
    locale: contexts.culture?.locale || deviceCtx.language || null,
    timezone: contexts.culture?.timezone || deviceCtx.timezone || null,
    network_type: deviceCtx.connection_type || null,
    affected_user_id: event.user?.id ? String(event.user.id) : null,
    tags: tagsObj,
    contexts,
    extra_data: event.extra || {},
    raw_payload: payload,
    last_seen_at: nowIso,
    updated_at: nowIso,
  };

  if (existing) {
    const isRegression =
      existing.status === "resolved" &&
      appVersion &&
      existing.resolved_in_version &&
      appVersion !== existing.resolved_in_version;

    const { error: updateErr } = await supabase
      .from("production_errors")
      .update({
        ...commonFields,
        occurrences_count: (existing.occurrences_count || 1) + 1,
        ...(isRegression ? { status: "pending", resolved_at: null } : {}),
      })
      .eq("id", existing.id);

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, action: "updated", sentry_issue_id: issueId }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const { error: insertErr } = await supabase.from("production_errors").insert({
    sentry_issue_id: issueId,
    status: "pending",
    occurrences_count: 1,
    first_seen_at: nowIso,
    ...commonFields,
  });

  if (insertErr) {
    return new Response(JSON.stringify({ error: insertErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ ok: true, action: "created", sentry_issue_id: issueId }),
    { status: 201, headers: { "Content-Type": "application/json" } }
  );
});
