import { afterEach, describe, expect, it, vi } from "vitest";

import {
  filterForwardedCookieHeader,
  proxyTodoDodoApi,
  splitSetCookieHeader,
} from "./api-proxy";

const FUNCTION_URL =
  "https://project-ref.supabase.co/functions/v1/todododo-api";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function configureProxy() {
  vi.stubEnv("SUPABASE_FUNCTION_URL", FUNCTION_URL);
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "publishable-test-key");
  vi.stubEnv("TODODODO_PUBLIC_ORIGINS", "https://todo.example");
}

describe("splitSetCookieHeader", () => {
  it("does not split the comma inside an Expires attribute", () => {
    expect(
      splitSetCookieHeader(
        "session=one; Expires=Wed, 21 Oct 2030 07:28:00 GMT; HttpOnly, csrf=two; HttpOnly",
      ),
    ).toEqual([
      "session=one; Expires=Wed, 21 Oct 2030 07:28:00 GMT; HttpOnly",
      "csrf=two; HttpOnly",
    ]);
  });
});

describe("filterForwardedCookieHeader", () => {
  it("keeps only TodoDodo CSRF and Supabase auth chunks", () => {
    expect(
      filterForwardedCookieHeader(
        [
          "analytics=do-not-forward",
          "todododo-csrf=csrf-token",
          "sb-project-ref-auth-token.0=first-chunk",
          "sb-project-ref-auth-token.1=second-chunk",
          "sb-project-ref-auth-token=single-cookie",
          "sb-project-ref-auth-token-code-verifier=do-not-forward",
        ].join("; "),
      ),
    ).toBe(
      "todododo-csrf=csrf-token; " +
        "sb-project-ref-auth-token.0=first-chunk; " +
        "sb-project-ref-auth-token.1=second-chunk; " +
        "sb-project-ref-auth-token=single-cookie",
    );
  });

  it("omits the Cookie header when no allowed cookie remains", () => {
    expect(filterForwardedCookieHeader("analytics=one; preference=quiet")).toBeNull();
  });
});

describe("proxyTodoDodoApi", () => {
  it("forwards only the allowlisted request surface", async () => {
    configureProxy();
    let upstreamRequest: Request | undefined;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        upstreamRequest = new Request(input, init);
        const headers = new Headers({
          "content-type": "application/json",
          "x-dangerous-upstream-header": "do-not-forward",
          "x-request-id": "request-123",
        });
        headers.append(
          "set-cookie",
          "sb-project-ref-auth-token.0=access; Path=/api; HttpOnly; SameSite=Lax",
        );
        headers.append(
          "set-cookie",
          "sb-project-ref-auth-token.1=refresh; Path=/api; HttpOnly; SameSite=Lax",
        );

        return new Response(JSON.stringify({ id: "task-1" }), {
          status: 201,
          headers,
        });
      }),
    );

    const response = await proxyTodoDodoApi(
      new Request("https://todo.example/api/v1/tasks?cursor=next&limit=50", {
        method: "POST",
        headers: {
          authorization: "Bearer native-token",
          cookie:
            "analytics=do-not-forward; todododo-csrf=csrf-token; " +
            "sb-project-ref-auth-token.0=first-chunk; " +
            "sb-project-ref-auth-token.1=second-chunk",
          "content-type": "application/json; charset=utf-8",
          origin: "https://todo.example",
          "x-csrf-token": "csrf-token",
          "x-dangerous-client-header": "do-not-forward",
        },
        body: JSON.stringify({ title: "Plan a quiet route" }),
      }),
    );

    expect(upstreamRequest?.url).toBe(
      `${FUNCTION_URL}/v1/tasks?cursor=next&limit=50`,
    );
    expect(upstreamRequest?.method).toBe("POST");
    expect(upstreamRequest?.headers.get("apikey")).toBe(
      "publishable-test-key",
    );
    expect(upstreamRequest?.headers.get("cookie")).toBe(
      "todododo-csrf=csrf-token; sb-project-ref-auth-token.0=first-chunk; " +
        "sb-project-ref-auth-token.1=second-chunk",
    );
    expect(upstreamRequest?.headers.get("x-csrf-token")).toBe("csrf-token");
    expect(upstreamRequest?.headers.get("x-dangerous-client-header")).toBeNull();
    await expect(upstreamRequest?.json()).resolves.toEqual({
      title: "Plan a quiet route",
    });

    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-request-id")).toBe("request-123");
    expect(response.headers.get("x-dangerous-upstream-header")).toBeNull();
    const responseHeaders = response.headers as Headers & {
      getSetCookie?: () => string[];
    };
    expect(responseHeaders.getSetCookie?.()).toEqual([
      "sb-project-ref-auth-token.0=access; Path=/api; HttpOnly; SameSite=Lax",
      "sb-project-ref-auth-token.1=refresh; Path=/api; HttpOnly; SameSite=Lax",
    ]);
  });

  it("uses the configured public origin when the worker URL is internal", async () => {
    configureProxy();
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await proxyTodoDodoApi(
      new Request("https://internal-worker.example/api/v1/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://todo.example",
        },
        body: "{}",
      }),
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("rejects cross-origin browser mutations before contacting upstream", async () => {
    configureProxy();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await proxyTodoDodoApi(
      new Request("https://todo.example/api/v1/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://attacker.example",
        },
        body: JSON.stringify({ title: "Stolen task" }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      code: "origin_mismatch",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires JSON for mutations", async () => {
    configureProxy();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await proxyTodoDodoApi(
      new Request("https://todo.example/api/v1/tasks", {
        method: "DELETE",
      }),
    );

    expect(response.status).toBe(415);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an oversized declared body before reading or forwarding it", async () => {
    configureProxy();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await proxyTodoDodoApi(
      new Request("https://todo.example/api/v1/tasks", {
        method: "POST",
        headers: {
          "content-length": "16385",
          "content-type": "application/json",
          origin: "https://todo.example",
        },
        body: "{}",
      }),
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      code: "payload_too_large",
      message: "Request body is too large.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a streamed body whose actual UTF-8 size exceeds 16 KiB", async () => {
    configureProxy();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await proxyTodoDodoApi(
      new Request("https://todo.example/api/v1/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://todo.example",
        },
        body: JSON.stringify("🙂".repeat(4_096)),
      }),
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      code: "payload_too_large",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falls back to the request origin only for local development", async () => {
    configureProxy();
    vi.stubEnv("TODODODO_PUBLIC_ORIGINS", undefined);
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const localResponse = await proxyTodoDodoApi(
      new Request("http://localhost:8081/api/v1/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:8081",
        },
        body: "{}",
      }),
    );
    expect(localResponse.status).toBe(200);

    const deployedResponse = await proxyTodoDodoApi(
      new Request("https://todo.example/api/v1/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://todo.example",
        },
        body: "{}",
      }),
    );
    expect(deployedResponse.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("fails closed when server-only configuration is absent", async () => {
    vi.stubEnv("SUPABASE_FUNCTION_URL", "");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("SUPABASE_ANON_KEY", "");

    const response = await proxyTodoDodoApi(
      new Request("https://todo.example/api/v1/session"),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
