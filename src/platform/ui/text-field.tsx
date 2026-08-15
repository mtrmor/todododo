import type { Icon } from "phosphor-react-native";
import { useId, type RefObject } from "react";
import {
  StyleSheet,
  TextInput,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewStyle,
  type StyleProp,
} from "react-native";

import { colors, fonts, radii, shadows } from "@/platform/theme";
import { Field } from "@/platform/ui/field";
import { IconButton } from "@/platform/ui/icon-button";

export type TextFieldAction = Readonly<{ icon: Icon; label: string; onPress: () => void }>;

export type TextFieldProps = Omit<TextInputProps, "style"> & {
  label?: string;
  error?: string | null;
  hint?: string;
  counter?: string;
  required?: boolean;
  inputRef?: RefObject<TextInput | null>;
  leadingIcon?: Icon;
  trailingAction?: TextFieldAction;
  elevated?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export function TextField({
  label,
  error,
  hint,
  counter,
  required,
  inputRef,
  leadingIcon: LeadingIcon,
  trailingAction,
  elevated = false,
  containerStyle,
  inputStyle,
  multiline,
  accessibilityLabel,
  accessibilityHint,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const errorId = `${generatedId}-error`;
  const TrailingIcon = trailingAction?.icon;

  return (
    <Field
      counter={counter}
      error={error}
      errorId={errorId}
      hint={hint}
      label={label}
      required={required}
    >
      <View style={[styles.control, containerStyle]}>
        {LeadingIcon ? (
          <LeadingIcon aria-hidden color={colors.mutedInk} size={17} style={styles.leadingIcon} />
        ) : null}
        <TextInput
          {...props}
          accessibilityHint={error ?? accessibilityHint}
          accessibilityLabel={accessibilityLabel ?? label}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          multiline={multiline}
          placeholderTextColor={colors.placeholder}
          ref={inputRef}
          selectionColor={colors.routeViolet}
          style={[
            styles.input,
            multiline && styles.multiline,
            LeadingIcon && styles.withLeading,
            trailingAction && styles.withTrailing,
            elevated && styles.elevated,
            error && styles.error,
            inputStyle,
          ]}
        />
        {trailingAction && TrailingIcon ? (
          <IconButton
            icon={TrailingIcon}
            label={trailingAction.label}
            onPress={trailingAction.onPress}
            style={styles.trailingAction}
          />
        ) : null}
      </View>
    </Field>
  );
}

const styles = StyleSheet.create({
  control: { position: "relative", justifyContent: "center" },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.softLine,
    borderRadius: radii.md,
    borderCurve: "continuous",
    backgroundColor: colors.paper,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    outlineColor: colors.focusRing,
    outlineOffset: 1,
  },
  multiline: { minHeight: 112, paddingVertical: 12, textAlignVertical: "top" },
  withLeading: { paddingLeft: 43 },
  withTrailing: { paddingRight: 50 },
  elevated: { boxShadow: shadows.subtle },
  error: { borderColor: colors.danger },
  leadingIcon: { position: "absolute", left: 14, zIndex: 1 },
  trailingAction: { position: "absolute", right: 2 },
});
