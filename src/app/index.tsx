import { useAuth } from "@/core";
import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function IndexRoute() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          accessibilityLabel="Loading TodoDodo"
          color="#6254D8"
        />
      </View>
    );
  }

  return <Redirect href={status === "authenticated" ? "/inbox" : "/sign-in"} />;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    backgroundColor: "#F4F3F8",
    flex: 1,
    justifyContent: "center",
  },
});
