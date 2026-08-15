import { Text, View } from "react-native";
import { styles } from "@/modules/task-detail/components/task-field/styles";
export function TaskField({
  label,
  children,
  error,
  hint,
  counter,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  counter?: string;
  required?: boolean;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {label}
          {required ? " (required)" : ""}
        </Text>
        {counter || hint ? <Text style={styles.hint}>{counter ?? hint}</Text> : null}
      </View>
      {children}
      {error ? (
        <Text accessibilityLiveRegion="polite" selectable style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
