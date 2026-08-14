import { parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';

import type { AppConfig } from './config.ts';
import { constantTimeEqual, reuseOrCreateCsrfToken, verifyCsrfToken } from './csrf.ts';
import { HttpError, type ResponseState } from './http.ts';

export const CSRF_COOKIE_NAME = 'todododo-csrf';
const CSRF_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function cookieValue(request: Request, name: string): string | undefined {
  return parseCookieHeader(request.headers.get('cookie') ?? '')
    .find((cookie) => cookie.name === name)?.value;
}

function csrfCookie(
  value: string,
  config: AppConfig,
  maxAge: number,
): string {
  return serializeCookieHeader(CSRF_COOKIE_NAME, value, {
    expires: maxAge === 0 ? new Date(0) : undefined,
    httpOnly: true,
    maxAge,
    path: '/api',
    sameSite: 'lax',
    secure: config.cookieSecure,
  });
}

export async function csrfTokenForSession(
  request: Request,
  state: ResponseState,
  config: AppConfig,
): Promise<string> {
  const result = await reuseOrCreateCsrfToken(
    cookieValue(request, CSRF_COOKIE_NAME),
    config.csrfSecret,
  );
  if (result.created) {
    state.setCookies.push(
      csrfCookie(result.token, config, CSRF_COOKIE_MAX_AGE),
    );
  }
  return result.token;
}

export function clearCsrfCookie(
  state: ResponseState,
  config: AppConfig,
): void {
  state.setCookies.push(csrfCookie('', config, 0));
}

export async function requireCookieMutationProtection(
  request: Request,
  config: AppConfig,
): Promise<void> {
  const origin = request.headers.get('origin');
  if (!origin || !config.allowedOrigins.has(origin)) {
    throw new HttpError(403, 'invalid_origin', 'Request origin is not allowed.');
  }

  const headerToken = request.headers.get('x-csrf-token') ?? '';
  const cookieToken = cookieValue(request, CSRF_COOKIE_NAME) ?? '';
  if (
    !headerToken ||
    !cookieToken ||
    !constantTimeEqual(headerToken, cookieToken) ||
    !await verifyCsrfToken(cookieToken, config.csrfSecret)
  ) {
    throw new HttpError(403, 'invalid_csrf', 'CSRF validation failed.');
  }
}

export function applyCorsForAllowedOrigin(
  request: Request,
  state: ResponseState,
  config: AppConfig,
): void {
  const origin = request.headers.get('origin');
  if (!origin || !config.allowedOrigins.has(origin)) {
    return;
  }

  state.headers.set('Access-Control-Allow-Credentials', 'true');
  state.headers.set('Access-Control-Allow-Origin', origin);
  state.headers.set(
    'Access-Control-Allow-Headers',
    'authorization, apikey, content-type, x-csrf-token',
  );
  state.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, DELETE, OPTIONS',
  );
  state.headers.append('Vary', 'Origin');
}
