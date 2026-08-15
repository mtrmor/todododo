import { getNativeAccessToken } from "@/platform/auth/native-supabase.native";
import type { PlatformRequestContext } from "@/platform/api/platform-transport";

export async function getPlatformRequestContext(): Promise<PlatformRequestContext> {
  const accessToken = await getNativeAccessToken();
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const functionUrl =
    process.env.EXPO_PUBLIC_SUPABASE_FUNCTION_URL ??
    (supabaseUrl ? `${supabaseUrl.replace(/\/$/, "")}/functions/v1/todododo-api` : "");

  return {
    baseUrl: functionUrl,
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(publishableKey ? { apikey: publishableKey } : {}),
    },
    cookieAuth: false,
  };
}
