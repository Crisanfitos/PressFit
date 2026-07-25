import { parseOAuthCallbackUrl } from '../../../src/utils/parseOAuthCallbackUrl';

describe('parseOAuthCallbackUrl', () => {
  // --- PKCE Flow ---
  it('should extract code from query string (PKCE flow)', () => {
    const url = 'pressfit://auth/callback?code=abc123';
    const result = parseOAuthCallbackUrl(url);
    expect(result).toEqual({ code: 'abc123' });
  });

  it('should extract code from HTTP URL (PKCE flow)', () => {
    const url = 'https://example.com/auth/callback?code=def456';
    const result = parseOAuthCallbackUrl(url);
    expect(result).toEqual({ code: 'def456' });
  });

  // --- Implicit Flow ---
  it('should extract access_token and refresh_token from hash fragment (Implicit flow)', () => {
    const url = 'pressfit://auth/callback#access_token=eyJhbGci&refresh_token=dGVzdA';
    const result = parseOAuthCallbackUrl(url);
    expect(result).toEqual({
      accessToken: 'eyJhbGci',
      refreshToken: 'dGVzdA',
    });
  });

  // --- Tokens with '=' base64 padding ---
  it('should preserve tokens containing "=" characters (base64 padding)', () => {
    const accessToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature==';
    const refreshToken = 'cmVmcmVzaF90b2tlbl92YWx1ZQ==';
    const url = `pressfit://auth/callback#access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;
    const result = parseOAuthCallbackUrl(url);
    expect(result.accessToken).toBe(accessToken);
    expect(result.refreshToken).toBe(refreshToken);
  });

  it('should handle unencoded "=" in token values', () => {
    const url = 'pressfit://auth/callback#access_token=abc123==&refresh_token=xyz789=';
    const result = parseOAuthCallbackUrl(url);
    expect(result.accessToken).toBe('abc123==');
    expect(result.refreshToken).toBe('xyz789=');
  });

  // --- Deeplink nativo ---
  it('should handle native deeplink scheme URLs', () => {
    const url = 'pressfit://auth/callback?code=native_code_123';
    const result = parseOAuthCallbackUrl(url);
    expect(result).toEqual({ code: 'native_code_123' });
  });

  // --- Error OAuth ---
  it('should extract error from OAuth error response', () => {
    const url = 'pressfit://auth/callback?error=access_denied&error_description=The%20user%20denied%20access';
    const result = parseOAuthCallbackUrl(url);
    expect(result).toEqual({ error: 'The user denied access' });
  });

  it('should extract error without error_description', () => {
    const url = 'pressfit://auth/callback#error=server_error';
    const result = parseOAuthCallbackUrl(url);
    expect(result).toEqual({ error: 'server_error' });
  });

  // --- Edge cases ---
  it('should return empty object for empty string', () => {
    expect(parseOAuthCallbackUrl('')).toEqual({});
  });

  it('should return empty object for null/undefined', () => {
    expect(parseOAuthCallbackUrl(null as any)).toEqual({});
    expect(parseOAuthCallbackUrl(undefined as any)).toEqual({});
  });

  it('should return empty object for URL without params', () => {
    const url = 'pressfit://auth/callback';
    expect(parseOAuthCallbackUrl(url)).toEqual({});
  });

  it('should return empty object for URL with empty query string', () => {
    const url = 'pressfit://auth/callback?';
    expect(parseOAuthCallbackUrl(url)).toEqual({});
  });

  // --- Priority: hash over query ---
  it('should prioritize hash params over query params when both present', () => {
    const url = 'pressfit://auth/callback?code=query_code#code=hash_code';
    const result = parseOAuthCallbackUrl(url);
    expect(result.code).toBe('hash_code');
  });

  // --- URL-encoded values ---
  it('should properly decode URL-encoded values', () => {
    const url = 'pressfit://auth/callback?error_description=Invalid%20scope%3A%20openid';
    const result = parseOAuthCallbackUrl(url);
    expect(result.error).toBe('Invalid scope: openid');
  });

  // --- Mixed query + hash ---
  it('should extract code from query and tokens from hash simultaneously', () => {
    const url = 'pressfit://auth/callback?code=pkce_code#access_token=implicit_token&refresh_token=refresh_val';
    const result = parseOAuthCallbackUrl(url);
    expect(result.code).toBe('pkce_code');
    expect(result.accessToken).toBe('implicit_token');
    expect(result.refreshToken).toBe('refresh_val');
  });

  // --- Malformed percent encoding ---
  it('should handle malformed percent-encoded values gracefully', () => {
    const url = 'pressfit://auth/callback?code=%E0%A4%A';
    const result = parseOAuthCallbackUrl(url);
    // Should not throw, returns original malformed value
    expect(result.code).toBe('%E0%A4%A');
  });
});
