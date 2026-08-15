import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { styles } from "@/modules/auth/components/auth-switch-link/styles";

export function AuthSwitchLink({ isSignUp }: { isSignUp: boolean }) {
  const label = isSignUp ? "Sign in" : "Create an account";
  return (
    <View style={styles.container}>
      <Text selectable style={styles.copy}>
        {isSignUp ? "Already have an account? " : "New to TodoDodo? "}
      </Text>
      <Link href={isSignUp ? "/sign-in" : "/sign-up"} asChild>
        <Pressable
          accessibilityLabel={label}
          accessibilityRole="link"
          style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
        >
          <Text style={styles.linkLabel}>{label}</Text>
        </Pressable>
      </Link>
    </View>
  );
}
