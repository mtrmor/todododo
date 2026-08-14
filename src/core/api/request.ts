import { ApiError, isAbortError } from "@/core/api/api-error";
import { getPlatformRequestContext } from "@/core/api/platform-transport";
import {
  getCsrfToken,
  refreshSessionAfterUnauthorized,
} from "@/core/auth/session-runtime";

type JsonRequestOptions = Readonly<{
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  skipAuthRefresh?: boolean;
}>;

type ErrorPayload = Readonly<{
  message?: unknown;
  code?: unknown;
  details?: unknown;
}>;

function isMutation(method: string): boolean {
  return method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
}

function joinUrl(baseUrl: string, path: string): string {
  if (!baseUrl) {
    return path;
  }

  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

async function parseError(response: Response): Promise<ApiError> {
  let payload: ErrorPayload = {};

  try {
    payload = (await response.json()) as ErrorPayload;
  } catch {
    // A stable fallback is safer than leaking an upstream HTML error page.
  }

  return new ApiError(
    typeof payload.message === "string" && payload.message.trim()
      ? payload.message
      : `Request failed (${response.status})`,
    {
      status: response.status,
      code: typeof payload.code === "string" ? payload.code : "HTTP_ERROR",
      details: payload.details,
    },
  );
}

async function waitBeforeRetry(signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    throw signal.reason ?? new DOMException("The operation was aborted", "AbortError");
  }

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => signal?.removeEventListener("abort", onAbort);
    const timeout = setTimeout(() => {
      cleanup();
      resolve();
    }, 180);
    const onAbort = () => {
      clearTimeout(timeout);
      cleanup();
      reject(signal?.reason ?? new DOMException("The operation was aborted", "AbortError"));
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function requestJson<T>(
  path: string,
  options: JsonRequestOptions = {},
): Promise<T> {
  const method = options.method ?? "GET";
  let transientRetried = false;
  let authRetried = false;

  while (true) {
    const context = await getPlatformRequestContext();
    const headers = new Headers({
      Accept: "application/json",
      ...context.headers,
    });

    if (options.body !== undefined) {
      headers.set("Content-Type", "application/json");
    }

    if (context.cookieAuth && isMutation(method)) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers.set("X-CSRF-Token", csrfToken);
      }
    }

    let response: Response;
    try {
      const platformPath = context.cookieAuth ? path : path.replace(/^\/api(?=\/)/, "");
      response = await fetch(joinUrl(context.baseUrl, platformPath), {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        credentials: context.credentials,
        signal: options.signal,
      });
    } catch (error) {
      if (isAbortError(error) || options.signal?.aborted) {
        throw error;
      }

      if (method === "GET" && !transientRetried) {
        transientRetried = true;
        await waitBeforeRetry(options.signal);
        continue;
      }

      throw new ApiError("Unable to reach TodoDodo", {
        status: 0,
        code: "NETWORK_ERROR",
        cause: error,
      });
    }

    if (response.status === 401 && !options.skipAuthRefresh) {
      await refreshSessionAfterUnauthorized();

      if (method === "GET" && !authRetried) {
        authRetried = true;
        continue;
      }
    }

    if (method === "GET" && response.status >= 500 && !transientRetried) {
      transientRetried = true;
      await waitBeforeRetry(options.signal);
      continue;
    }

    if (!response.ok) {
      throw await parseError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}
