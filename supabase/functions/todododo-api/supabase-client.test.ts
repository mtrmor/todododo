import type { AppConfig } from './config.ts';
import { secureCookieOptions } from './supabase-client.ts';

const CONFIG: AppConfig = Object.freeze({
  supabaseUrl: 'https://project.supabase.co',
  supabasePublishableKey: 'sb_publishable_test',
  csrfSecret: '0123456789abcdef0123456789abcdef',
  allowedOrigins: new Set<string>(),
  cookieSecure: true,
});

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

Deno.test('Supabase session cookies are forced to host-only HttpOnly settings', () => {
  const options = secureCookieOptions(
    {
      domain: '.example.test',
      httpOnly: false,
      path: '/',
      sameSite: 'none',
      secure: false,
    },
    CONFIG,
  );

  assert(options.domain === undefined, 'domain should be removed');
  assert(options.httpOnly === true, 'HttpOnly should be forced');
  assert(options.path === '/api', 'path should be limited to /api');
  assert(options.sameSite === 'lax', 'SameSite should be Lax');
  assert(options.secure === true, 'Secure should follow deployed configuration');
});
