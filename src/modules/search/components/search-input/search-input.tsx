import { MagnifyingGlass, X } from "phosphor-react-native";
import { useRef } from "react";
import { TextInput } from "react-native";

import { styles } from "@/modules/search/components/search-input/styles";
import { TextField } from "@/platform/ui";

export function SearchInput({
  query,
  onChange,
}: {
  query: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<TextInput>(null);
  return (
    <TextField
      accessibilityLabel="Search tasks"
      autoCapitalize="none"
      autoCorrect={false}
      clearButtonMode="never"
      elevated
      inputRef={inputRef}
      inputStyle={styles.input}
      leadingIcon={MagnifyingGlass}
      onChangeText={onChange}
      placeholder="Search every title and note"
      returnKeyType="search"
      trailingAction={
        query
          ? {
              icon: X,
              label: "Clear search",
              onPress: () => {
                onChange("");
                inputRef.current?.focus();
              },
            }
          : undefined
      }
      value={query}
    />
  );
}
