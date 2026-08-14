import { requestJson } from "@/core/api/request";
import type { SafeUser } from "@/core/types";

export type SessionEnvelope = Readonly<{
  user: SafeUser | null;
  csrfToken: string | null;
}>;

export const authAdapter = {
  getSession(signal?: AbortSignal): Promise<SessionEnvelope> {
    return requestJson<SessionEnvelope>("/api/v1/session", {
      signal,
      skipAuthRefresh: true,
    });
  },

  async signIn(email: string, password: string, signal?: AbortSignal): Promise<void> {
    await requestJson("/api/v1/auth/sign-in", {
      method: "POST",
      body: { email, password },
      signal,
      skipAuthRefresh: true,
    });
  },

  async signUp(email: string, password: string, signal?: AbortSignal): Promise<void> {
    await requestJson("/api/v1/auth/sign-up", {
      method: "POST",
      body: { email, password },
      signal,
      skipAuthRefresh: true,
    });
  },

  async signOut(signal?: AbortSignal): Promise<void> {
    await requestJson("/api/v1/auth/sign-out", {
      method: "POST",
      body: {},
      signal,
      skipAuthRefresh: true,
    });
  },
};
