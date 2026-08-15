import { useId } from "react";
import { TextInput, View, type TextInputProps } from "react-native";

import { AppText } from "@/root/ui/app-text";
import { colors, fonts, layout, radii, spacing } from "@/platform/theme";

type TextFieldProps = TextInputProps & { label?: string; error?: string | null };

export function TextField({ label, error, style, ...props }: TextFieldProps) {
  const generatedId = useId();
  const errorId = `${generatedId}-error`;

  return (
    <View style={{ gap: spacing.xs }}>
      {label ? <AppText variant="bodyMedium">{label}</AppText> : null}
      <TextInput
        accessibilityLabel={props.accessibilityLabel ?? label}
        accessibilityHint={error ?? props.accessibilityHint}
        aria-describedby={error ? errorId : undefined}
        placeholderTextColor={colors.placeholder}
        {...props}
        style={[
          {
            minHeight: props.multiline ? 112 : layout.minimumTargetSize,
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.softLine,
            borderRadius: radii.md,
            borderCurve: "continuous",
            backgroundColor: colors.paper,
            color: colors.ink,
            fontFamily: fonts.body,
            fontSize: 15,
            lineHeight: 22,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            textAlignVertical: props.multiline ? "top" : "center",
          },
          style,
        ]}
      />
      {error ? <AppText nativeID={errorId} variant="caption" tone="danger">{error}</AppText> : null}
    </View>
  );
}
