import { Check } from "phosphor-react-native";
import { Text, View } from "react-native";

import { colors } from "@/platform";
import { styles } from "@/modules/auth/components/route-step/styles";

export function RouteStep({ label, index }: { label: string; index: number }) {
  const active = index === 1;
  return (
    <View style={styles.container}>
      <View style={[styles.icon, active ? styles.iconActive : styles.iconInactive]}>
        <Check
          aria-hidden
          color={active ? colors.paper : colors.inkOnDarkMuted}
          size={13}
          weight="bold"
        />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
