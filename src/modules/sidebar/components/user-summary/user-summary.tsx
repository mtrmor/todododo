import { Bell } from "phosphor-react-native";
import { Text, View } from "react-native";
import { colors } from "@/platform";
import { RoutePulse } from "@/modules/sidebar/components/route-pulse/route-pulse";
import { styles } from "@/modules/sidebar/components/user-summary/styles";

type Summary = { total: number; completed: number; open: number };
export function UserSummary({ email, summary }: { email?: string | null; summary: Summary }) {
  const progress =
    summary.total === 0 ? 0 : Math.max(0, Math.min(1, summary.completed / summary.total));
  return (
    <View style={styles.container}>
      <View style={styles.userRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLabel}>{email?.slice(0, 1).toUpperCase() ?? "T"}</Text>
        </View>
        <Text numberOfLines={1} style={styles.email}>
          {email ?? "Your route"}
        </Text>
        <Bell aria-hidden color={colors.placeholder} size={17} />
      </View>
      <View
        accessibilityLabel={`${summary.completed} of ${summary.total} tasks completed`}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: summary.total,
          now: summary.completed,
          text: `${summary.completed} of ${summary.total} tasks completed`,
        }}
        style={styles.progressCard}
      >
        <View style={styles.progressCopy}>
          <Text style={styles.progressTitle}>Inbox route</Text>
          <Text style={styles.progressMeta}>
            {summary.open} open {summary.open === 1 ? "task" : "tasks"}
          </Text>
        </View>
        <RoutePulse progress={progress} />
      </View>
    </View>
  );
}
