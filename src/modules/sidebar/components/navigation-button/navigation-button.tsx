import { ListChecks } from "phosphor-react-native";
import { Pressable, Text } from "react-native";
import { colors } from "@/platform";
import { useHovered } from "@/modules/sidebar/components/navigation-button/hooks/use-hovered";
import { styles } from "@/modules/sidebar/components/navigation-button/styles";

type Props = {
  label: string;
  icon: typeof ListChecks;
  onPress: () => void;
  active?: boolean;
  compact?: boolean;
  count?: number;
  prominent?: boolean;
  disabled?: boolean;
};
export function NavigationButton({
  label,
  icon: Icon,
  onPress,
  active = false,
  compact = false,
  count,
  prominent = false,
  disabled = false,
}: Props) {
  const hover = useHovered();
  const foreground = prominent || active ? colors.routeViolet : colors.mutedInk;
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      onHoverIn={hover.onHoverIn}
      onHoverOut={hover.onHoverOut}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact ? styles.compact : styles.expanded,
        active && styles.active,
        (hover.hovered || pressed) && !active && styles.hovered,
        disabled && styles.disabled,
      ]}
    >
      <Icon aria-hidden color={foreground} size={18} weight={active ? "fill" : "regular"} />
      {!compact ? (
        <>
          <Text
            style={[
              styles.label,
              active && styles.activeLabel,
              (active || prominent) && styles.emphasizedLabel,
            ]}
          >
            {label}
          </Text>
          {typeof count === "number" ? <Text style={styles.count}>{count}</Text> : null}
        </>
      ) : null}
    </Pressable>
  );
}
