import { useAuth } from "@/platform";
import { Redirect, Slot } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function AuthLayout() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          accessibilityLabel="Checking your session"
          color="#6254D8"
        />
      </View>
    );
  }

  if (status === "authenticated") {
    return <Redirect href="/inbox" />;
  }

  return <Slot />;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    backgroundColor: "#F4F3F8",
    flex: 1,
    justifyContent: "center",
  },
});
