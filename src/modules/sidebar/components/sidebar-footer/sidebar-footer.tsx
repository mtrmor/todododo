import { Archive, GearSix, SignOut, WarningCircle } from "phosphor-react-native";
import { ActivityIndicator, Text, View } from "react-native";
import { colors } from "@/platform";
import { NavigationButton } from "@/modules/sidebar/components/navigation-button/navigation-button";
import { styles } from "@/modules/sidebar/components/sidebar-footer/styles";
import type { SidebarRoute } from "@/modules/sidebar/sidebar-module";

type Props = {
  activeRoute: SidebarRoute;
  compact: boolean;
  error: string | null;
  summaryError: string | null;
  signingOut: boolean;
  onNavigate: (route: SidebarRoute) => void;
  onSignOut: () => void;
};
export function SidebarFooter({
  activeRoute,
  compact,
  error,
  summaryError,
  signingOut,
  onNavigate,
  onSignOut,
}: Props) {
  return (
    <View style={styles.container}>
      {summaryError && !compact ? (
        <Text accessibilityLiveRegion="polite" selectable style={styles.summaryError}>
          {summaryError}
        </Text>
      ) : null}
      <NavigationButton
        active={activeRoute === "archived"}
        compact={compact}
        icon={Archive}
        label="Archived"
        onPress={() => onNavigate("archived")}
      />
      <NavigationButton
        active={activeRoute === "settings"}
        compact={compact}
        icon={GearSix}
        label="Settings"
        onPress={() => onNavigate("settings")}
      />
      {error ? (
        !compact ? (
          <Text
            accessibilityLiveRegion="assertive"
            accessibilityRole="alert"
            selectable
            style={styles.signOutError}
          >
            {error}
          </Text>
        ) : (
          <View
            accessibilityLabel={error}
            accessibilityLiveRegion="assertive"
            accessibilityRole="alert"
            style={styles.compactError}
          >
            <WarningCircle aria-hidden color={colors.danger} size={18} weight="fill" />
          </View>
        )
      ) : null}
      <NavigationButton
        compact={compact}
        disabled={signingOut}
        icon={SignOut}
        label="Sign out"
        onPress={onSignOut}
      />
      {signingOut ? <ActivityIndicator color={colors.routeViolet} size="small" /> : null}
    </View>
  );
}
