import type { AppConfig } from './config.ts';
import { createResponseState, HttpError } from './http.ts';
import { csrfTokenForSession, requireCookieMutationProtection } from './security.ts';

const ORIGIN = 'https://todo.example.test';
const CONFIG: AppConfig = Object.freeze({
  supabaseUrl: 'https://project.supabase.co',
  supabasePublishableKey: 'sb_publishable_test',
  csrfSecret: '0123456789abcdef0123456789abcdef',
  allowedOrigins: new Set([ORIGIN]),
  cookieSecure: true,
});

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

Deno.test('session CSRF cookie has the required security attributes', async () => {
  const state = createResponseState();
  const token = await csrfTokenForSession(
    new Request(`${ORIGIN}/api/v1/session`),
    state,
    CONFIG,
  );
  const cookie = state.setCookies[0];
  assert(cookie.includes(`todododo-csrf=${token}`), 'cookie should contain token');
  assert(cookie.includes('HttpOnly'), 'cookie should be HttpOnly');
  assert(cookie.includes('Path=/api'), 'cookie should be scoped to /api');
  assert(cookie.includes('SameSite=Lax'), 'cookie should be SameSite=Lax');
  assert(cookie.includes('Secure'), 'deployed cookie should be Secure');
  assert(!cookie.includes('Domain='), 'cookie should remain host-only');
});

Deno.test('cookie mutations require exact origin and matching signed token', async () => {
  const state = createResponseState();
  const token = await csrfTokenForSession(
    new Request(`${ORIGIN}/api/v1/session`),
    state,
    CONFIG,
  );
  const request = new Request(`${ORIGIN}/api/v1/tasks`, {
    method: 'POST',
    headers: {
      Cookie: `todododo-csrf=${token}`,
      Origin: ORIGIN,
      'X-CSRF-Token': token,
    },
  });
  await requireCookieMutationProtection(request, CONFIG);

  const wrongOrigin = new Request(`${ORIGIN}/api/v1/tasks`, {
    method: 'POST',
    headers: {
      Cookie: `todododo-csrf=${token}`,
      Origin: 'https://attacker.example',
      'X-CSRF-Token': token,
    },
  });
  try {
    await requireCookieMutationProtection(wrongOrigin, CONFIG);
  } catch (error) {
    assert(error instanceof HttpError, 'wrong origin should throw HttpError');
    assert(error.status === 403, 'wrong origin should be forbidden');
    return;
  }
  throw new Error('wrong origin must be rejected');
});
