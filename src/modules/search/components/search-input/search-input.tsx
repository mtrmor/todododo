import { MagnifyingGlass, X } from "phosphor-react-native";
import { useRef } from "react";
import { Pressable, TextInput, View } from "react-native";
import { colors } from "@/platform";
import { styles } from "@/modules/search/components/search-input/styles";
export function SearchInput({
  query,
  onChange,
}: {
  query: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<TextInput>(null);
  return (
    <View style={styles.container}>
      <MagnifyingGlass aria-hidden color={colors.mutedInk} size={17} style={styles.searchIcon} />
      <TextInput
        accessibilityLabel="Search tasks"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        onChangeText={onChange}
        placeholder="Search every title and note"
        placeholderTextColor={colors.placeholder}
        ref={inputRef}
        returnKeyType="search"
        selectionColor={colors.routeViolet}
        style={[styles.input, query && styles.inputWithClear]}
        value={query}
      />
      {query ? (
        <Pressable
          accessibilityLabel="Clear search"
          accessibilityRole="button"
          onPress={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          style={({ pressed }) => [styles.clear, pressed && styles.clearPressed]}
        >
          <X aria-hidden color={colors.mutedInk} size={17} />
        </Pressable>
      ) : null}
    </View>
  );
}
