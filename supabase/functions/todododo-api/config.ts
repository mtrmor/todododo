export type AppConfig = Readonly<{
  supabaseUrl: string;
  supabasePublishableKey: string;
  csrfSecret: string;
  allowedOrigins: ReadonlySet<string>;
  cookieSecure: boolean;
}>;

function requireValue(name: string, value: string | undefined): string {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`Missing required configuration: ${name}`);
  }

  return normalized;
}

function parseAllowedOrigins(value: string | undefined): ReadonlySet<string> {
  const origins = new Set<string>();

  for (const candidate of value?.split(',') ?? []) {
    const origin = candidate.trim();

    if (!origin) {
      continue;
    }

    const parsed = new URL(origin);
    if (parsed.origin !== origin) {
      throw new Error('TODODODO_ALLOWED_ORIGINS must contain exact URL origins');
    }

    origins.add(origin);
  }

  return origins;
}

export function loadConfig(): AppConfig {
  const csrfSecret = requireValue(
    'TODODODO_CSRF_SECRET',
    Deno.env.get('TODODODO_CSRF_SECRET'),
  );

  if (new TextEncoder().encode(csrfSecret).byteLength < 32) {
    throw new Error('TODODODO_CSRF_SECRET must be at least 32 bytes');
  }

  return Object.freeze({
    supabaseUrl: requireValue('SUPABASE_URL', Deno.env.get('SUPABASE_URL')),
    supabasePublishableKey: requireValue(
      'TODODODO_SUPABASE_PUBLISHABLE_KEY',
      Deno.env.get('TODODODO_SUPABASE_PUBLISHABLE_KEY') ??
        Deno.env.get('SUPABASE_ANON_KEY'),
    ),
    csrfSecret,
    allowedOrigins: parseAllowedOrigins(
      Deno.env.get('TODODODO_ALLOWED_ORIGINS'),
    ),
    cookieSecure: Deno.env.get('TODODODO_COOKIE_SECURE') !== 'false',
  });
}
