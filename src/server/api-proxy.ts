const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "DELETE", "OPTIONS"]);

const MUTATION_METHODS = new Set(["POST", "PATCH", "DELETE"]);
const MAX_BODY_BYTES = 16_384;
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
const SUPABASE_AUTH_COOKIE_PATTERN = /^sb-[A-Za-z0-9_-]+-auth-token(?:\.\d+)?$/u;

const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "authorization",
  "content-type",
  "cookie",
  "origin",
  "x-csrf-token",
] as const;

const FORWARDED_RESPONSE_HEADERS = ["content-type", "expires", "pragma", "x-request-id"] as const;

type HeadersWithSetCookie = Headers & {
  getSetCookie?: () => string[];
};

type ServerEnvironment = Readonly<{
  functionUrl: string;
  publishableKey: string;
  publicOrigins: ReadonlySet<string> | null;
}>;

class PayloadTooLargeError extends Error {}

export function splitSetCookieHeader(value: string): string[] {
  return value
    .split(/,(?=\s*[^;,=\s]+=[^;,]*)/g)
    .map((cookie) => cookie.trim())
    .filter(Boolean);
}

function getSetCookieValues(headers: Headers): string[] {
  const values = (headers as HeadersWithSetCookie).getSetCookie?.();

  if (values?.length) {
    return values;
  }

  const combined = headers.get("set-cookie");
  return combined ? splitSetCookieHeader(combined) : [];
}

function jsonError(status: number, code: string, message: string): Response {
  return Response.json(
    { code, message },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        Pragma: "no-cache",
      },
    },
  );
}

function parsePublicOrigins(value: string | undefined): ReadonlySet<string> | null {
  if (value === undefined) {
    return null;
  }

  const origins = new Set<string>();
  for (const candidate of value.split(",")) {
    const origin = candidate.trim();

    if (!origin) {
      continue;
    }

    const parsed = new URL(origin);

    if ((parsed.protocol !== "https:" && parsed.protocol !== "http:") || parsed.origin !== origin) {
      throw new Error("TODODODO_PUBLIC_ORIGINS must contain exact HTTP origins");
    }

    origins.add(origin);
  }

  return origins;
}

function getServerEnvironment(): ServerEnvironment | null {
  const functionUrl = process.env.SUPABASE_FUNCTION_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!functionUrl || !publishableKey) {
    return null;
  }

  try {
    return {
      functionUrl,
      publishableKey,
      publicOrigins: parsePublicOrigins(process.env.TODODODO_PUBLIC_ORIGINS),
    };
  } catch {
    return null;
  }
}

function localFallbackOrigin(request: Request): string | null {
  const url = new URL(request.url);

  if (
    (url.protocol === "http:" || url.protocol === "https:") &&
    LOCAL_HOSTNAMES.has(url.hostname)
  ) {
    return url.origin;
  }

  return null;
}

function isCrossOriginBrowserMutation(
  request: Request,
  configuredOrigins: ReadonlySet<string> | null,
): boolean {
  if (!MUTATION_METHODS.has(request.method.toUpperCase())) {
    return false;
  }

  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  if (configuredOrigins) {
    return !configuredOrigins.has(origin);
  }

  return origin !== localFallbackOrigin(request);
}

function declaredBodyIsTooLarge(request: Request): boolean {
  const value = request.headers.get("content-length");

  if (!value || !/^\d+$/u.test(value)) {
    return false;
  }

  const length = Number(value);
  return !Number.isSafeInteger(length) || length > MAX_BODY_BYTES;
}

async function readBodyWithinLimit(request: Request): Promise<string | undefined> {
  if (request.body === null) {
    return undefined;
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let byteLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      byteLength += value.byteLength;

      if (byteLength > MAX_BODY_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // The request is rejected even if its stream cannot be cancelled.
        }
        throw new PayloadTooLargeError();
      }

      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();

    if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
      throw new PayloadTooLargeError();
    }

    return body;
  } finally {
    reader.releaseLock();
  }
}

function isAllowedCookieName(name: string): boolean {
  return name === "todododo-csrf" || SUPABASE_AUTH_COOKIE_PATTERN.test(name);
}

export function filterForwardedCookieHeader(value: string): string | null {
  const cookies = value
    .split(";")
    .map((cookie) => cookie.trim())
    .filter((cookie) => {
      const separatorIndex = cookie.indexOf("=");
      return separatorIndex > 0 && isAllowedCookieName(cookie.slice(0, separatorIndex).trim());
    });

  return cookies.length > 0 ? cookies.join("; ") : null;
}

function createTargetUrl(requestUrl: URL, functionUrl: string): URL {
  const path = requestUrl.pathname.replace(/^\/api(?=\/|$)/, "");
  const target = new URL(`${functionUrl.replace(/\/$/, "")}${path}`);
  target.search = requestUrl.search;
  return target;
}

function createUpstreamHeaders(request: Request, publishableKey: string) {
  const headers = new Headers({ apikey: publishableKey });

  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);

    if (!value) {
      continue;
    }

    if (name === "cookie") {
      const filtered = filterForwardedCookieHeader(value);

      if (filtered) {
        headers.set(name, filtered);
      }
    } else {
      headers.set(name, value);
    }
  }

  headers.set("x-todododo-proxy", "expo");
  return headers;
}

function createDownstreamHeaders(upstream: Response): Headers {
  const headers = new Headers({
    "Cache-Control": "private, no-store",
    Pragma: "no-cache",
  });

  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);

    if (value) {
      headers.set(name, value);
    }
  }

  for (const cookie of getSetCookieValues(upstream.headers)) {
    headers.append("Set-Cookie", cookie);
  }

  return headers;
}

export async function proxyTodoDodoApi(request: Request): Promise<Response> {
  const method = request.method.toUpperCase();

  if (!ALLOWED_METHODS.has(method)) {
    return jsonError(405, "method_not_allowed", "Method not allowed.");
  }

  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        Allow: "GET, POST, PATCH, DELETE, OPTIONS",
        "Cache-Control": "private, no-store",
      },
    });
  }

  if (MUTATION_METHODS.has(method)) {
    const contentType = request.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().startsWith("application/json")) {
      return jsonError(415, "json_required", "Mutations require an application/json body.");
    }

    if (declaredBodyIsTooLarge(request)) {
      return jsonError(413, "payload_too_large", "Request body is too large.");
    }
  }

  const environment = getServerEnvironment();

  if (!environment) {
    return jsonError(
      503,
      "api_not_configured",
      "The TodoDodo API is not configured for this environment.",
    );
  }

  if (isCrossOriginBrowserMutation(request, environment.publicOrigins)) {
    return jsonError(403, "origin_mismatch", "Request origin is not allowed.");
  }

  const target = createTargetUrl(new URL(request.url), environment.functionUrl);

  try {
    const body = MUTATION_METHODS.has(method) ? await readBodyWithinLimit(request) : undefined;
    const upstream = await fetch(target, {
      method,
      headers: createUpstreamHeaders(request, environment.publishableKey),
      body,
      redirect: "manual",
    });

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: createDownstreamHeaders(upstream),
    });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return jsonError(413, "payload_too_large", "Request body is too large.");
    }

    return jsonError(502, "upstream_unavailable", "The TodoDodo API is temporarily unavailable.");
  }
}
