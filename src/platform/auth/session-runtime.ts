import { ApiError } from "@/platform/api/api-error";
import type { SafeUser } from "@/platform/types";

type SessionRefreshHandler = () => Promise<SafeUser | null>;

let csrfToken: string | null = null;
let refreshHandler: SessionRefreshHandler | null = null;
let activeRefresh: Promise<SafeUser | null> | null = null;

export function getCsrfToken(): string | null {
  return csrfToken;
}

export function setCsrfToken(nextToken: string | null): void {
  csrfToken = nextToken;
}

export function registerSessionRefresh(handler: SessionRefreshHandler): () => void {
  refreshHandler = handler;

  return () => {
    if (refreshHandler === handler) {
      refreshHandler = null;
    }
  };
}

export async function refreshSessionSerialized(): Promise<SafeUser | null> {
  if (!refreshHandler) {
    return null;
  }

  if (!activeRefresh) {
    activeRefresh = refreshHandler().finally(() => {
      activeRefresh = null;
    });
  }

  return activeRefresh;
}

export function refreshSessionAfterUnauthorized(): Promise<SafeUser | null> {
  return refreshSessionSerialized();
}

export async function ensureCsrfTokenForCookieMutation(): Promise<void> {
  if (csrfToken) {
    return;
  }

  await refreshSessionSerialized();

  if (!csrfToken) {
    throw new ApiError("A secure browser session could not be prepared", {
      status: 0,
      code: "CSRF_UNAVAILABLE",
    });
  }
}
