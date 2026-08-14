import { createClient, processLock, type SupabaseClient } from "@supabase/supabase-js";
import { AppState } from "react-native";

import { ApiError } from "@/core/api/api-error";
import { secureStoreAdapter } from "@/core/auth/secure-store-adapter.native";

let nativeClient: SupabaseClient | null = null;
let appStateListenerInstalled = false;

export function getNativeSupabaseClient(): SupabaseClient {
  if (nativeClient) {
    return nativeClient;
  }

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new ApiError("Native Supabase configuration is missing", {
      status: 0,
      code: "MISSING_NATIVE_AUTH_CONFIG",
    });
  }

  nativeClient = createClient(url, publishableKey, {
    auth: {
      storage: secureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  });

  if (!appStateListenerInstalled) {
    appStateListenerInstalled = true;
    AppState.addEventListener("change", (state) => {
      if (state === "active") {
        nativeClient?.auth.startAutoRefresh();
      } else {
        nativeClient?.auth.stopAutoRefresh();
      }
    });
  }

  return nativeClient;
}

export async function getNativeAccessToken(): Promise<string | null> {
  const { data, error } = await getNativeSupabaseClient().auth.getSession();
  if (error) {
    throw new ApiError(error.message, {
      status: error.status ?? 0,
      code: error.code ?? "NATIVE_SESSION_ERROR",
      cause: error,
    });
  }

  return data.session?.access_token ?? null;
}
