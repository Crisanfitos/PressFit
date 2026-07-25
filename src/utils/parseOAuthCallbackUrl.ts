/**
 * Parses OAuth callback URLs to extract authentication parameters.
 *
 * Handles both PKCE flow (code in query string) and Implicit flow
 * (access_token/refresh_token in hash fragment). Correctly preserves
 * tokens containing '=' characters (base64 padding).
 *
 * Supports custom scheme deeplinks (e.g., pressfit://auth/callback)
 * and standard HTTP URLs.
 */

export interface OAuthCallbackParams {
  code?: string;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

/**
 * Safely decodes a URI component, returning the original value
 * if decoding fails (e.g., malformed percent-encoding).
 */
function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Parses a query/hash parameter string into a key-value map.
 * Uses split('=') with rejoin to preserve '=' characters within values
 * (common in base64-encoded JWT tokens).
 */
function parseParamString(str: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (!str) return params;

  str.split('&').forEach(pair => {
    const eqIndex = pair.indexOf('=');
    if (eqIndex === -1) return;

    const key = pair.substring(0, eqIndex);
    const value = pair.substring(eqIndex + 1);

    if (key) {
      params[key] = safeDecodeURIComponent(value);
    }
  });

  return params;
}

/**
 * Parses an OAuth callback URL and extracts authentication parameters.
 *
 * Looks for parameters in both the query string (after '?') and the
 * hash fragment (after '#'). Hash parameters take priority over query
 * parameters when both are present (per OAuth 2.0 implicit flow spec).
 *
 * @param url - The full callback URL from the OAuth provider
 * @returns Parsed OAuth parameters (code, tokens, or error)
 *
 * @example
 * // PKCE flow
 * parseOAuthCallbackUrl('pressfit://auth/callback?code=abc123')
 * // => { code: 'abc123' }
 *
 * @example
 * // Implicit flow with base64 tokens
 * parseOAuthCallbackUrl('pressfit://auth/callback#access_token=eyJ...%3D%3D&refresh_token=xyz')
 * // => { accessToken: 'eyJ...==', refreshToken: 'xyz' }
 */
export function parseOAuthCallbackUrl(url: string): OAuthCallbackParams {
  if (!url) return {};

  // Extract query string: everything after '?' and before '#'
  let queryStr = '';
  const questionIndex = url.indexOf('?');
  if (questionIndex !== -1) {
    const hashAfterQuery = url.indexOf('#', questionIndex);
    queryStr = hashAfterQuery !== -1
      ? url.substring(questionIndex + 1, hashAfterQuery)
      : url.substring(questionIndex + 1);
  }

  // Extract hash fragment: everything after '#'
  let hashStr = '';
  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    hashStr = url.substring(hashIndex + 1);
  }

  const queryParams = parseParamString(queryStr);
  const hashParams = parseParamString(hashStr);

  // Hash params take priority (OAuth 2.0 implicit flow convention)
  const code = hashParams.code || queryParams.code;
  const accessToken = hashParams.access_token || queryParams.access_token;
  const refreshToken = hashParams.refresh_token || queryParams.refresh_token;
  const error = hashParams.error_description || queryParams.error_description
    || hashParams.error || queryParams.error;

  const result: OAuthCallbackParams = {};
  if (code) result.code = code;
  if (accessToken) result.accessToken = accessToken;
  if (refreshToken) result.refreshToken = refreshToken;
  if (error) result.error = error;

  return result;
}
