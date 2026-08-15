import { ApiError } from "@/platform/api/api-error";
import type { SessionEnvelope } from "@/platform/auth/auth-adapter";
import { getNativeSupabaseClient } from "@/platform/auth/native-supabase.native";

function toSessionEnvelope(user: { id: string; email?: string } | null): SessionEnvelope {
  return {
    user: user ? { id: user.id, email: user.email ?? null } : null,
    csrfToken: null,
  };
}

export const authAdapter = {
  async getSession(): Promise<SessionEnvelope> {
    const { data: sessionData, error: sessionError } =
      await getNativeSupabaseClient().auth.getSession();

    if (sessionError) {
      throw new ApiError(sessionError.message, {
        status: sessionError.status ?? 0,
        code: sessionError.code ?? "NATIVE_SESSION_ERROR",
        cause: sessionError,
      });
    }

    if (!sessionData.session) {
      return toSessionEnvelope(null);
    }

    const { data, error } = await getNativeSupabaseClient().auth.getUser(
      sessionData.session.access_token,
    );

    if (error) {
      throw new ApiError(error.message, {
        status: error.status ?? 401,
        code: error.code ?? "NATIVE_USER_ERROR",
        cause: error,
      });
    }

    return toSessionEnvelope(data.user);
  },

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await getNativeSupabaseClient().auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new ApiError(error.message, {
        status: error.status ?? 400,
        code: error.code ?? "SIGN_IN_FAILED",
        cause: error,
      });
    }
  },

  async signUp(email: string, password: string): Promise<void> {
    const { error } = await getNativeSupabaseClient().auth.signUp({ email, password });

    if (error) {
      throw new ApiError(error.message, {
        status: error.status ?? 400,
        code: error.code ?? "SIGN_UP_FAILED",
        cause: error,
      });
    }
  },

  async signOut(): Promise<void> {
    const { error } = await getNativeSupabaseClient().auth.signOut({ scope: "local" });

    if (error) {
      throw new ApiError(error.message, {
        status: error.status ?? 400,
        code: error.code ?? "SIGN_OUT_FAILED",
        cause: error,
      });
    }
  },
};
