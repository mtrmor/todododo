import { ClockCountdown } from "phosphor-react-native";
import { Text, View } from "react-native";

import { colors } from "@/platform";
import { BackAction } from "@/modules/placeholder-screen/components/back-action/back-action";
import { styles } from "@/modules/placeholder-screen/components/placeholder-card/styles";

type PlaceholderCardProps = { title: string; description: string; onBack: () => void };

export function PlaceholderCard({ title, description, onBack }: PlaceholderCardProps) {
  return (
    <View accessibilityRole="summary" style={styles.card}>
      <View style={styles.iconContainer}>
        <ClockCountdown aria-hidden color={colors.routeViolet} size={26} weight="duotone" />
      </View>
      <View style={styles.copy}>
        <Text selectable style={styles.title}>
          {title}
        </Text>
        <Text selectable style={styles.description}>
          {description}
        </Text>
      </View>
      <BackAction onPress={onBack} />
    </View>
  );
}
