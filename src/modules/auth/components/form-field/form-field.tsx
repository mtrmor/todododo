import { Eye } from "phosphor-react-native";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";

import { colors } from "@/platform";
import { styles } from "@/modules/auth/components/form-field/styles";

type FormFieldProps = Pick<
  TextInputProps,
  "autoCapitalize" | "autoComplete" | "keyboardType" | "returnKeyType" | "secureTextEntry"
> & {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  onSubmitEditing: () => void;
  error?: string;
  inputRef?: React.RefObject<TextInput | null>;
  trailingAction?: { icon: typeof Eye; label: string; onPress: () => void };
};

export function FormField({
  label,
  value,
  placeholder,
  onChangeText,
  onSubmitEditing,
  error,
  inputRef,
  trailingAction,
  ...inputProps
}: FormFieldProps) {
  const TrailingIcon = trailingAction?.icon;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          {...inputProps}
          accessibilityLabel={label}
          aria-invalid={Boolean(error)}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          ref={inputRef}
          selectionColor={colors.routeViolet}
          style={[
            styles.input,
            trailingAction && styles.inputWithAction,
            error && styles.inputError,
          ]}
          value={value}
        />
        {trailingAction && TrailingIcon ? (
          <Pressable
            accessibilityLabel={trailingAction.label}
            accessibilityRole="button"
            hitSlop={4}
            onPress={trailingAction.onPress}
            style={({ pressed }) => [
              styles.trailingAction,
              pressed && styles.trailingActionPressed,
            ]}
          >
            <TrailingIcon aria-hidden color={colors.mutedInk} size={19} weight="regular" />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" selectable style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
