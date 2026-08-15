import { useId, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { spacing } from "@/platform/theme";
import { AppText } from "@/platform/ui/app-text";

export type FieldProps = {
  label?: string;
  children: ReactNode;
  error?: string | null;
  hint?: string;
  counter?: string;
  required?: boolean;
  errorId?: string;
};

export function Field({
  label,
  children,
  error,
  hint,
  counter,
  required = false,
  errorId,
}: FieldProps) {
  const generatedId = useId();
  const resolvedErrorId = errorId ?? `${generatedId}-error`;

  return (
    <View style={styles.container}>
      {label || hint || counter ? (
        <View style={styles.header}>
          {label ? (
            <AppText selectable={false} variant="label">
              {label}
              {required ? " (required)" : ""}
            </AppText>
          ) : (
            <View />
          )}
          {counter || hint ? (
            <AppText style={styles.hint} tone="muted" variant="micro">
              {counter ?? hint}
            </AppText>
          ) : null}
        </View>
      ) : null}
      {children}
      {error ? (
        <AppText
          accessibilityLiveRegion="polite"
          nativeID={resolvedErrorId}
          tone="danger"
          variant="caption"
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 7 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  hint: { fontVariant: ["tabular-nums"] },
});
