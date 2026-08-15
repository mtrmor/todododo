import { AuthProvider, fontAssets } from "@/core";
import { TasksDataProvider } from "@/root";
import { Stack } from "expo-router";
import Head from "expo-router/head";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontAssets);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <TasksDataProvider>
        <Head>
          <title>TodoDodo</title>
          <meta
            content="A quiet route through the work ahead."
            name="description"
          />
        </Head>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </TasksDataProvider>
    </AuthProvider>
  );
}
