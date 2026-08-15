import { afterEach, describe, expect, it, vi } from "vitest";

import { requestJson } from "@/platform/api/request";
import {
  ensureCsrfTokenForCookieMutation,
  refreshSessionSerialized,
  registerSessionRefresh,
  setCsrfToken,
} from "@/platform/auth/session-runtime";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  setCsrfToken(null);
  vi.restoreAllMocks();
});

describe("API request policy", () => {
  it("retries a transient GET exactly once", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ message: "upstream" }, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ ok: true }));
    globalThis.fetch = fetchMock;

    await expect(requestJson<{ ok: boolean }>("/api/v1/tasks")).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a mutation", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ message: "upstream", code: "UPSTREAM" }, { status: 503 }));
    globalThis.fetch = fetchMock;

    await expect(
      requestJson("/api/v1/tasks", { method: "POST", body: { title: "One" } }),
    ).rejects.toMatchObject({ status: 503, code: "UPSTREAM" });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("serializes session refreshes after concurrent 401 GET responses", async () => {
    let releaseRefresh: (() => void) | undefined;
    const refreshHandler = vi.fn(
      () =>
        new Promise<null>((resolve) => {
          releaseRefresh = () => resolve(null);
        }),
    );
    const unregister = registerSessionRefresh(refreshHandler);
    const counts = new Map<string, number>();
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      const count = counts.get(url) ?? 0;
      counts.set(url, count + 1);
      return count === 0
        ? Response.json({ message: "unauthorized" }, { status: 401 })
        : Response.json({ ok: true });
    });
    globalThis.fetch = fetchMock;

    const first = requestJson<{ ok: boolean }>("/api/v1/tasks");
    const second = requestJson<{ ok: boolean }>("/api/v1/tasks/summary");
    await vi.waitFor(() => expect(refreshHandler).toHaveBeenCalledOnce());
    releaseRefresh?.();

    await expect(Promise.all([first, second])).resolves.toEqual([{ ok: true }, { ok: true }]);
    expect(refreshHandler).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(4);
    unregister();
  });

  it("refreshes state but never replays a 401 mutation", async () => {
    const refreshHandler = vi.fn(async () => null);
    const unregister = registerSessionRefresh(refreshHandler);
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ message: "expired" }, { status: 401 }));
    globalThis.fetch = fetchMock;

    await expect(
      requestJson("/api/v1/tasks/task-1", { method: "DELETE", body: {} }),
    ).rejects.toMatchObject({ status: 401 });
    expect(refreshHandler).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledOnce();
    unregister();
  });

  it("keeps CSRF only in request memory", async () => {
    setCsrfToken("csrf-test");
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ ok: true }));
    globalThis.fetch = fetchMock;

    await requestJson("/api/v1/tasks", { method: "POST", body: {} });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(new Headers(init?.headers).get("X-CSRF-Token")).toBe("csrf-test");
  });

  it("recovers a failed session bootstrap and serializes CSRF readiness", async () => {
    let unavailable = true;
    const refreshHandler = vi.fn(async () => {
      if (unavailable) {
        throw new Error("session endpoint unavailable");
      }

      setCsrfToken("csrf-recovered");
      return null;
    });
    const unregister = registerSessionRefresh(refreshHandler);

    try {
      await expect(refreshSessionSerialized()).rejects.toThrow("session endpoint unavailable");

      unavailable = false;
      await expect(
        Promise.all([ensureCsrfTokenForCookieMutation(), ensureCsrfTokenForCookieMutation()]),
      ).resolves.toEqual([undefined, undefined]);

      expect(refreshHandler).toHaveBeenCalledTimes(2);
    } finally {
      unregister();
    }
  });
});
