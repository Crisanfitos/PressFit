import React from 'react';
import { Platform } from 'react-native';
import {
    ErrorLevel,
    ErrorReportBreadcrumb,
    ErrorReportPayload,
    SanitizedErrorReport,
    sanitizeErrorReportPayload,
} from '../utils/errorReportUtils';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const appConfig = require('../../app.json');

export interface ErrorUserContext {
    id: string;
    email?: string;
    username?: string;
}

export interface CaptureOptions {
    handled?: boolean;
    level?: ErrorLevel;
    culprit?: string;
}

const MAX_BREADCRUMBS = 30;
const THROTTLE_WINDOW_MS = 15_000;

let currentUser: ErrorUserContext | null = null;
let breadcrumbsBuffer: ErrorReportBreadcrumb[] = [];
const recentFingerprints = new Map<string, number>();
let globalHandlerInstalled = false;

function isTestEnvironment(): boolean {
    return (
        typeof process !== 'undefined' &&
        (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined)
    );
}

function isDevEnvironment(): boolean {
    return typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
}

function getPlatformConstants(): Record<string, any> {
    return ((Platform as any)?.constants as Record<string, any>) || {};
}

function detectEmulator(constants: Record<string, any>): boolean {
    const fingerprint = String(constants.Fingerprint || constants.fingerprint || '').toLowerCase();
    const model = String(constants.Model || constants.model || '').toLowerCase();
    const brand = String(constants.Brand || constants.brand || '').toLowerCase();
    return (
        fingerprint.includes('generic') ||
        fingerprint.includes('vbox') ||
        fingerprint.includes('sdk_gphone') ||
        fingerprint.includes('emulator') ||
        model.includes('emulator') ||
        model.includes('android sdk built for') ||
        model.includes('simulator') ||
        brand === 'generic'
    );
}

function collectRuntimeMetadata(): Omit<ErrorReportPayload, 'error_message' | 'error_type' | 'level' | 'handled' | 'stacktrace' | 'culprit' | 'extra_data'> {
    const constants = getPlatformConstants();
    const expo = appConfig?.expo || {};

    const appVersion = String(expo.version || 'unknown');
    const appBuild =
        Platform.OS === 'ios'
            ? String(expo.ios?.buildNumber || 'unknown')
            : String(expo.android?.versionCode || 'unknown');

    const osName =
        Platform.OS === 'android'
            ? 'Android'
            : Platform.OS === 'ios'
                ? String(constants.systemName || 'iOS')
                : Platform.OS || 'unknown';

    const osVersion =
        Platform.OS === 'android'
            ? String(constants.Release || Platform.Version || 'unknown')
            : String(constants.osVersion || Platform.Version || 'unknown');

    const deviceModel = String(
        constants.Model ||
        constants.model ||
        (Platform.OS === 'ios' ? ((Platform as any).isPad ? 'iPad' : 'iPhone') : Platform.OS || 'unknown')
    );
    const deviceBrand = String(constants.Brand || constants.brand || (Platform.OS === 'ios' ? 'Apple' : 'unknown'));
    const deviceManufacturer = String(
        constants.Manufacturer || constants.manufacturer || (Platform.OS === 'ios' ? 'Apple' : deviceBrand)
    );
    const deviceFamily = String(
        Platform.OS === 'ios'
            ? ((Platform as any).isPad ? 'iPad' : 'iPhone')
            : deviceBrand !== 'unknown'
                ? deviceBrand
                : 'Android'
    );

    let locale = 'unknown';
    let timezone = 'UTC';
    try {
        const resolved = Intl.DateTimeFormat().resolvedOptions();
        if (resolved?.locale) locale = resolved.locale;
        if (resolved?.timeZone) timezone = resolved.timeZone;
    } catch {
        // Fallback already set
    }

    const runtimeName =
        typeof (globalThis as any)?.HermesInternal !== 'undefined'
            ? 'hermes'
            : Platform.OS === 'web'
                ? 'browser'
                : 'react-native';

    return {
        environment: process.env.EXPO_PUBLIC_APP_ENV || (isDevEnvironment() ? 'development' : 'production'),
        app_version: appVersion,
        app_build: appBuild,
        release: `com.crisanfitos.PressFit_Expo@${appVersion}+${appBuild}`,
        runtime_name: runtimeName,
        os_name: osName,
        os_version: osVersion,
        device_model: deviceModel,
        device_brand: deviceBrand,
        device_manufacturer: deviceManufacturer,
        device_family: deviceFamily,
        is_emulator: detectEmulator(constants),
        locale,
        timezone,
        network_type:
            Platform.OS === 'web' && typeof navigator !== 'undefined'
                ? (navigator.onLine ? 'ONLINE' : 'NONE')
                : 'UNKNOWN',
        affected_user_id: currentUser?.id || null,
        breadcrumbs: [...breadcrumbsBuffer],
        tags: {
            platform: Platform.OS,
            ...(constants.Version ? { android_api: String(constants.Version) } : {}),
        },
        contexts: {
            app: { app_version: appVersion, app_build: appBuild },
            os: { name: osName, version: osVersion },
            device: { model: deviceModel, brand: deviceBrand, manufacturer: deviceManufacturer },
            runtime: { name: runtimeName },
        },
    };
}

function getEndpointConfig(): { url: string; anonKey: string } | null {
    const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
    const anonKey =
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
        process.env.EXPO_PUBLIC_SUPABASE_KEY?.trim() ||
        '';
    if (!baseUrl || !anonKey) return null;
    return {
        url: `${baseUrl}/functions/v1/report-error`,
        anonKey,
    };
}

async function dispatchReport(
    payload: SanitizedErrorReport,
    forceSend = false
): Promise<boolean> {
    if (!forceSend && (isTestEnvironment() || isDevEnvironment())) {
        return false;
    }

    const endpoint = getEndpointConfig();
    if (!endpoint || typeof fetch !== 'function') {
        return false;
    }

    const now = Date.now();
    const lastSentAt = recentFingerprints.get(payload.fingerprint);
    if (lastSentAt !== undefined && now - lastSentAt < THROTTLE_WINDOW_MS) {
        return false;
    }
    recentFingerprints.set(payload.fingerprint, now);

    // Keep map bounded
    if (recentFingerprints.size > 100) {
        const oldestKey = recentFingerprints.keys().next().value;
        if (oldestKey) recentFingerprints.delete(oldestKey);
    }

    try {
        const res = await fetch(endpoint.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: endpoint.anonKey,
                Authorization: `Bearer ${endpoint.anonKey}`,
            },
            body: JSON.stringify(payload),
        });
        return res.ok;
    } catch {
        return false;
    }
}

export const ErrorReportingService = {
    isInitialized: false,

    init(options?: { installGlobalHandler?: boolean }) {
        try {
            this.isInitialized = true;
            const shouldInstall = options?.installGlobalHandler ?? !isTestEnvironment();
            const errorUtils = (globalThis as any)?.ErrorUtils;

            if (shouldInstall && !globalHandlerInstalled && errorUtils?.setGlobalHandler) {
                globalHandlerInstalled = true;
                const previousHandler =
                    typeof errorUtils.getGlobalHandler === 'function'
                        ? errorUtils.getGlobalHandler()
                        : null;

                errorUtils.setGlobalHandler((err: any, isFatal?: boolean) => {
                    this.captureException(
                        err,
                        { isFatal: Boolean(isFatal) },
                        { handled: false, level: isFatal ? 'fatal' : 'error' }
                    );
                    if (typeof previousHandler === 'function') {
                        previousHandler(err, isFatal);
                    }
                });
            }
        } catch (error) {
            console.error('[ErrorReportingService] Failed to initialize:', error);
        }
    },

    captureException(
        error: unknown,
        extraInfo?: Record<string, any>,
        options?: CaptureOptions & { forceSend?: boolean }
    ) {
        try {
            const errObj =
                error instanceof Error
                    ? error
                    : new Error(typeof error === 'string' ? error : 'Unknown error');

            const meta = collectRuntimeMetadata();
            const sanitized = sanitizeErrorReportPayload({
                ...meta,
                level: options?.level || (options?.handled === false ? 'fatal' : 'error'),
                error_type: errObj.name || 'Error',
                error_message: errObj.message || 'Unknown error',
                culprit: options?.culprit,
                handled: options?.handled ?? true,
                stacktrace: errObj.stack || errObj.message,
                extra_data: extraInfo || {},
            });

            if (sanitized) {
                void dispatchReport(sanitized, Boolean(options?.forceSend));
            }
        } catch (e) {
            console.error('[ErrorReportingService] Failed to capture exception:', e);
        }
    },

    captureMessage(
        message: string,
        level: ErrorLevel = 'info',
        extraInfo?: Record<string, any>,
        options?: { forceSend?: boolean }
    ) {
        try {
            const meta = collectRuntimeMetadata();
            const syntheticStack = new Error(message).stack || message;
            const sanitized = sanitizeErrorReportPayload({
                ...meta,
                level,
                error_type: level === 'warning' ? 'CapturedWarning' : 'CapturedMessage',
                error_message: message,
                handled: true,
                stacktrace: syntheticStack,
                extra_data: extraInfo || {},
            });

            if (sanitized) {
                void dispatchReport(sanitized, Boolean(options?.forceSend));
            }
        } catch (e) {
            console.error('[ErrorReportingService] Failed to capture message:', e);
        }
    },

    setUser(user: ErrorUserContext | null) {
        currentUser = user;
    },

    getUser(): ErrorUserContext | null {
        return currentUser;
    },

    addBreadcrumb(breadcrumb: {
        message: string;
        category?: string;
        level?: ErrorLevel;
        data?: Record<string, any>;
    }) {
        try {
            if (!breadcrumb?.message) return;
            breadcrumbsBuffer.push({
                timestamp: new Date().toISOString(),
                category: breadcrumb.category || 'app',
                message: breadcrumb.message,
                level: breadcrumb.level || 'info',
                ...(breadcrumb.data ? { data: breadcrumb.data } : {}),
            });
            if (breadcrumbsBuffer.length > MAX_BREADCRUMBS) {
                breadcrumbsBuffer = breadcrumbsBuffer.slice(-MAX_BREADCRUMBS);
            }
        } catch (e) {
            console.error('[ErrorReportingService] Failed to add breadcrumb:', e);
        }
    },

    getBreadcrumbs(): ErrorReportBreadcrumb[] {
        return [...breadcrumbsBuffer];
    },

    wrap<T extends React.ComponentType<any>>(component: T): T {
        return component;
    },

    /** Testing utility */
    resetForTests() {
        this.isInitialized = false;
        currentUser = null;
        breadcrumbsBuffer = [];
        recentFingerprints.clear();
    },
};
