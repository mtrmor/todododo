import {
  type CookieOptions,
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from '@supabase/ssr';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

import type { AppConfig } from './config.ts';
import { HttpError, type ResponseState } from './http.ts';
import type { SafeUser } from './types.ts';

export type AuthMode = 'cookie' | 'bearer';

export type RequestSupabase = Readonly<{
  client: SupabaseClient;
  mode: AuthMode;
  accessToken: string | null;
}>;

export function secureCookieOptions(
  options: CookieOptions,
  config: AppConfig,
): CookieOptions {
  const result: CookieOptions = {
    ...options,
    httpOnly: true,
    path: '/api',
    sameSite: 'lax',
    secure: config.cookieSecure,
  };
  delete result.domain;
  return result;
}

function appendCookie(
  state: ResponseState,
  name: string,
  value: string,
  options: CookieOptions,
  config: AppConfig,
): void {
  state.setCookies.push(
    serializeCookieHeader(name, value, secureCookieOptions(options, config)),
  );
}

function parseBearerToken(header: string): string {
  const match = /^Bearer ([^\s]+)$/u.exec(header);
  if (!match) {
    throw new HttpError(401, 'unauthorized', 'Authentication is required.');
  }
  return match[1];
}

function createBearerClient(
  authorization: string,
  config: AppConfig,
): RequestSupabase {
  const accessToken = parseBearerToken(authorization);
  const client = createClient(
    config.supabaseUrl,
    config.supabasePublishableKey,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    },
  );

  return { client, mode: 'bearer', accessToken };
}

function createCookieClient(
  request: Request,
  state: ResponseState,
  config: AppConfig,
): RequestSupabase {
  const requestCookies = new Map(
    parseCookieHeader(request.headers.get('cookie') ?? '').map((cookie) => [
      cookie.name,
      cookie.value,
    ]),
  );

  const client = createServerClient(
    config.supabaseUrl,
    config.supabasePublishableKey,
    {
      cookieOptions: {
        httpOnly: true,
        path: '/api',
        sameSite: 'lax',
        secure: config.cookieSecure,
      },
      cookies: {
        getAll() {
          return Array.from(requestCookies, ([name, value]) => ({ name, value }));
        },
        setAll(cookiesToSet, headersToSet) {
          for (const { name, value, options } of cookiesToSet) {
            requestCookies.set(name, value);
            appendCookie(state, name, value, options, config);
          }
          for (const [name, value] of Object.entries(headersToSet ?? {})) {
            state.headers.set(name, value);
          }
        },
      },
    },
  );

  return {
    client: client as unknown as SupabaseClient,
    mode: 'cookie',
    accessToken: null,
  };
}

export function createRequestSupabase(
  request: Request,
  state: ResponseState,
  config: AppConfig,
  allowBearer = true,
): RequestSupabase {
  const authorization = request.headers.get('authorization');
  if (authorization && allowBearer) {
    return createBearerClient(authorization, config);
  }
  if (authorization && !allowBearer) {
    throw new HttpError(
      400,
      'unsupported_auth_mode',
      'This endpoint requires cookie authentication.',
    );
  }

  return createCookieClient(request, state, config);
}

export async function authenticatedUser(
  supabase: RequestSupabase,
): Promise<User> {
  const { data, error } = await supabase.client.auth.getUser(
    supabase.accessToken ?? undefined,
  );
  if (error || !data.user) {
    throw new HttpError(401, 'unauthorized', 'Authentication is required.');
  }

  return data.user;
}

export async function optionalUser(
  supabase: RequestSupabase,
): Promise<User | null> {
  const { data, error } = await supabase.client.auth.getUser(
    supabase.accessToken ?? undefined,
  );
  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export function toSafeUser(user: User): SafeUser {
  return Object.freeze({ id: user.id, email: user.email ?? null });
}
