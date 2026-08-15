import {
  createContext,
  use,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

import { authAdapter } from "@/platform/auth/auth-adapter";
import {
  ensureCsrfTokenForCookieMutation,
  registerSessionRefresh,
  refreshSessionSerialized,
  setCsrfToken,
} from "@/platform/auth/session-runtime";
import type { SafeUser } from "@/platform/types";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export type AuthContextValue = Readonly<{
  status: AuthStatus;
  user: SafeUser | null;
  csrfToken: string | null;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  refreshSession(): Promise<SafeUser | null>;
}>;

const AuthContext = createContext<AuthContextValue | null>(null);

function refreshSession(): Promise<SafeUser | null> {
  return refreshSessionSerialized();
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<SafeUser | null>(null);
  const [csrfToken, setProviderCsrfToken] = useState<string | null>(null);
  const sessionRecoveryNeededRef = useRef(false);

  function applySession(
    session: Awaited<ReturnType<typeof authAdapter.getSession>>,
  ): SafeUser | null {
    sessionRecoveryNeededRef.current = false;
    setUser(session.user);
    setStatus(session.user ? "authenticated" : "anonymous");
    setProviderCsrfToken(session.csrfToken);
    setCsrfToken(session.csrfToken);
    return session.user;
  }

  const loadSession = useEffectEvent(async (
    signal?: AbortSignal,
  ): Promise<SafeUser | null> => {
    try {
      const session = await authAdapter.getSession(signal);
      return applySession(session);
    } catch (error) {
      if (!signal?.aborted) {
        sessionRecoveryNeededRef.current = true;
      }
      throw error;
    }
  });

  useEffect(() => registerSessionRefresh(loadSession), []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      void loadSession(controller.signal).catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setStatus("anonymous");
        setUser(null);
        setProviderCsrfToken(null);
        setCsrfToken(null);
        console.warn("Unable to restore the TodoDodo session", error);
      });
    }, 0);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (
      process.env.EXPO_OS !== "web" ||
      typeof window === "undefined" ||
      typeof document === "undefined"
    ) {
      return;
    }

    const retrySessionRecovery = () => {
      if (
        !sessionRecoveryNeededRef.current ||
        document.visibilityState !== "visible"
      ) {
        return;
      }

      void refreshSession().catch((error: unknown) => {
        console.warn("Unable to recover the TodoDodo session", error);
      });
    };

    window.addEventListener("focus", retrySessionRecovery);
    window.addEventListener("online", retrySessionRecovery);
    document.addEventListener("visibilitychange", retrySessionRecovery);

    return () => {
      window.removeEventListener("focus", retrySessionRecovery);
      window.removeEventListener("online", retrySessionRecovery);
      document.removeEventListener("visibilitychange", retrySessionRecovery);
    };
  }, []);

  async function ensureWebCookieMutationReady(): Promise<void> {
    if (process.env.EXPO_OS === "web") {
      await ensureCsrfTokenForCookieMutation();
    }
  }

  async function signIn(email: string, password: string): Promise<void> {
    await ensureWebCookieMutationReady();
    await authAdapter.signIn(email, password);
    await refreshSession();
  }

  async function signUp(email: string, password: string): Promise<void> {
    await ensureWebCookieMutationReady();
    await authAdapter.signUp(email, password);
    await refreshSession();
  }

  async function signOut(): Promise<void> {
    await ensureWebCookieMutationReady();
    await authAdapter.signOut();
    setUser(null);
    setStatus("anonymous");
    setProviderCsrfToken(null);
    setCsrfToken(null);

    // A fresh anonymous CSRF pair is useful for the next sign-in attempt.
    try {
      await refreshSession();
    } catch {
      // Sign-out already succeeded; a network failure must not restore local auth state.
    }
  }

  const value: AuthContextValue = {
    status,
    user,
    csrfToken,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const value = use(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}
