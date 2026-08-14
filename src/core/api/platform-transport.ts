export type PlatformRequestContext = Readonly<{
  baseUrl: string;
  credentials?: RequestCredentials;
  headers: Readonly<Record<string, string>>;
  cookieAuth: boolean;
}>;

export async function getPlatformRequestContext(): Promise<PlatformRequestContext> {
  return {
    baseUrl: "",
    credentials: "include",
    headers: {},
    cookieAuth: true,
  };
}
