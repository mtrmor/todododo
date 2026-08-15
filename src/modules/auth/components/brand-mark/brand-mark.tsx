import { PathIcon } from "phosphor-react-native";
import { Text, View } from "react-native";

import { colors } from "@/platform";
import { styles } from "@/modules/auth/components/brand-mark/styles";

export function BrandMark({ inverted = false }: { inverted?: boolean }) {
  return (
    <View accessibilityLabel="TodoDodo" accessibilityRole="header" style={styles.container}>
      <View style={[styles.icon, inverted ? styles.iconInverted : styles.iconDefault]}>
        <PathIcon
          aria-hidden
          color={inverted ? colors.paper : colors.routeViolet}
          size={20}
          weight="bold"
        />
      </View>
      <Text style={[styles.label, inverted ? styles.labelInverted : styles.labelDefault]}>
        TodoDodo
      </Text>
    </View>
  );
}
