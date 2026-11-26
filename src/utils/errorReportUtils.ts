export type ErrorLevel = 'fatal' | 'error' | 'warning' | 'info';

export interface ErrorReportBreadcrumb {
    timestamp: string;
    category: string;
    message: string;
    level?: ErrorLevel;
    data?: Record<string, unknown>;
}

export interface ErrorReportPayload {
    level?: ErrorLevel | string;
    environment?: string;
    error_type?: string | null;
    error_message: string;
    culprit?: string | null;
    handled?: boolean;
    stacktrace?: string | null;
    breadcrumbs?: ErrorReportBreadcrumb[];
    app_version?: string | null;
    app_build?: string | null;
    release?: string | null;
    runtime_name?: string | null;
    os_name?: string | null;
    os_version?: string | null;
    device_model?: string | null;
    device_brand?: string | null;
    device_manufacturer?: string | null;
    device_family?: string | null;
    is_emulator?: boolean | null;
    locale?: string | null;
    timezone?: string | null;
    network_type?: string | null;
    affected_user_id?: string | null;
    tags?: Record<string, unknown>;
    contexts?: Record<string, unknown>;
    extra_data?: Record<string, unknown>;
}

export interface SanitizedErrorReport {
    fingerprint: string;
    issue_key: string;
    short_id: string;
    level: ErrorLevel;
    environment: string;
    error_type: string;
    error_message: string;
    culprit: string;
    handled: boolean;
    stacktrace: string;
    breadcrumbs: ErrorReportBreadcrumb[];
    app_version: string;
    app_build: string;
    release: string;
    runtime_name: string;
    os_name: string;
    os_version: string;
    device_model: string;
    device_brand: string;
    device_manufacturer: string;
    device_family: string;
    is_emulator: boolean;
    locale: string;
    timezone: string;
    network_type: string;
    affected_user_id: string | null;
    tags: Record<string, unknown>;
    contexts: Record<string, unknown>;
    extra_data: Record<string, unknown>;
}

const VALID_LEVELS: ReadonlySet<string> = new Set(['fatal', 'error', 'warning', 'info']);
const MAX_MESSAGE_LEN = 1000;
const MAX_STACKTRACE_LEN = 8192;
const MAX_BREADCRUMBS = 30;

export function sanitizeString(value: unknown, maxLen: number): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.slice(0, maxLen);
}

export function normalizeLevel(level: unknown): ErrorLevel {
    if (typeof level === 'string') {
        const lower = level.trim().toLowerCase();
        if (VALID_LEVELS.has(lower)) {
            return lower as ErrorLevel;
        }
    }
    return 'error';
}

/**
 * Normalizes dynamic tokens (UUIDs, timestamps, large numeric IDs) so identical bugs
 * collapse to a single deterministic fingerprint.
 */
export function normalizeErrorMessage(message: string): string {
    return message
        .trim()
        .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<uuid>')
        .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/g, '<timestamp>')
        .replace(/\b\d{4,}\b/g, '<num>')
        .replace(/\s+/g, ' ')
        .slice(0, 500);
}

/**
 * Extracts a concise culprit location from a JS/React Native stacktrace when not explicitly set.
 */
export function extractCulprit(stacktrace?: string | null, explicitCulprit?: string | null): string {
    const explicit = sanitizeString(explicitCulprit, 200);
    if (explicit) return explicit;

    if (typeof stacktrace === 'string' && stacktrace.trim()) {
        const lines = stacktrace.split('\n').map((l) => l.trim()).filter(Boolean);
        for (const line of lines) {
            if (!line.startsWith('at ') && !/\.(tsx?|jsx?):\d+/.test(line)) {
                continue;
            }
            const clean = line.replace(/^at\s+/, '').slice(0, 200);
            if (clean) return clean;
        }
    }
    return 'unknown';
}

function fnv1a32(input: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Deterministic 16-char hex fingerprint shared between client throttling and Edge Function deduplication.
 */
export function computeSyncFingerprint(
    errorType: string,
    errorMessage: string,
    culprit: string
): string {
    const canonical = `${(errorType || 'Error').trim()}|${normalizeErrorMessage(errorMessage)}|${(culprit || 'unknown').trim()}`;
    return `${fnv1a32(canonical)}${fnv1a32(`pf2:${canonical}`)}`;
}

function sanitizeRecord(val: unknown): Record<string, unknown> {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
        return val as Record<string, unknown>;
    }
    return {};
}

function sanitizeBreadcrumbs(raw: unknown): ErrorReportBreadcrumb[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .slice(-MAX_BREADCRUMBS)
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .map((item) => ({
            timestamp: sanitizeString(item.timestamp, 40) || new Date().toISOString(),
            category: sanitizeString(item.category, 64) || 'app',
            message: sanitizeString(item.message, 500) || '',
            ...(item.level ? { level: normalizeLevel(item.level) } : {}),
            ...(item.data && typeof item.data === 'object' ? { data: sanitizeRecord(item.data) } : {}),
        }));
}

/**
 * Validates and normalizes an incoming error report payload, ensuring zero avoidable nulls.
 */
export function sanitizeErrorReportPayload(
    raw: Partial<ErrorReportPayload> | null | undefined
): SanitizedErrorReport | null {
    if (!raw || typeof raw !== 'object') return null;

    const errorMessage = sanitizeString(raw.error_message, MAX_MESSAGE_LEN);
    if (!errorMessage) return null;

    const level = normalizeLevel(raw.level);
    const errorType = sanitizeString(raw.error_type, 120) || (level === 'warning' || level === 'info' ? 'CapturedMessage' : 'Error');
    const stacktrace = sanitizeString(raw.stacktrace, MAX_STACKTRACE_LEN) || errorMessage;
    const culprit = extractCulprit(stacktrace, raw.culprit);
    const fingerprint = computeSyncFingerprint(errorType, errorMessage, culprit);

    const appVersion = sanitizeString(raw.app_version, 40) || 'unknown';
    const appBuild = sanitizeString(raw.app_build, 40) || 'unknown';
    const release = sanitizeString(raw.release, 120) || `${appVersion}+${appBuild}`;

    return {
        fingerprint,
        issue_key: `pf-${fingerprint}`,
        short_id: `PF-ERR-${fingerprint.slice(0, 6).toUpperCase()}`,
        level,
        environment: sanitizeString(raw.environment, 40) || 'production',
        error_type: errorType,
        error_message: errorMessage,
        culprit,
        handled: typeof raw.handled === 'boolean' ? raw.handled : level !== 'fatal',
        stacktrace,
        breadcrumbs: sanitizeBreadcrumbs(raw.breadcrumbs),
        app_version: appVersion,
        app_build: appBuild,
        release,
        runtime_name: sanitizeString(raw.runtime_name, 60) || 'react-native',
        os_name: sanitizeString(raw.os_name, 60) || 'unknown',
        os_version: sanitizeString(raw.os_version, 60) || 'unknown',
        device_model: sanitizeString(raw.device_model, 100) || 'unknown',
        device_brand: sanitizeString(raw.device_brand, 80) || 'unknown',
        device_manufacturer: sanitizeString(raw.device_manufacturer, 80) || 'unknown',
        device_family: sanitizeString(raw.device_family, 80) || 'unknown',
        is_emulator: typeof raw.is_emulator === 'boolean' ? raw.is_emulator : false,
        locale: sanitizeString(raw.locale, 40) || 'unknown',
        timezone: sanitizeString(raw.timezone, 64) || 'UTC',
        network_type: sanitizeString(raw.network_type, 40) || 'unknown',
        affected_user_id: sanitizeString(raw.affected_user_id, 128),
        tags: sanitizeRecord(raw.tags),
        contexts: sanitizeRecord(raw.contexts),
        extra_data: sanitizeRecord(raw.extra_data),
    };
}
