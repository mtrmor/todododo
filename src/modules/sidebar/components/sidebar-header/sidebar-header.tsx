import { PathIcon, X } from "phosphor-react-native";
import { Text, View } from "react-native";

import { colors } from "@/platform";
import { styles } from "@/modules/sidebar/components/sidebar-header/styles";
import { IconButton } from "@/platform/ui";

export function SidebarHeader({
  showLabels,
  mobile,
  onClose,
}: {
  showLabels: boolean;
  mobile: boolean;
  onClose?: () => void;
}) {
  return (
    <View style={[styles.header, showLabels ? styles.headerExpanded : styles.headerCompact]}>
      <View style={styles.brand}>
        <View style={styles.icon}>
          <PathIcon aria-hidden color={colors.paper} size={18} weight="bold" />
        </View>
        {showLabels ? <Text style={styles.label}>TodoDodo</Text> : null}
      </View>
      {mobile ? <IconButton icon={X} label="Close navigation" onPress={onClose} /> : null}
    </View>
  );
}
