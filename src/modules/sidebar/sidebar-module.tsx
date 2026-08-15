import { ScrollView, View } from "react-native";

import { NavigationSection } from "@/modules/sidebar/components/navigation-section/navigation-section";
import { SidebarFooter } from "@/modules/sidebar/components/sidebar-footer/sidebar-footer";
import { SidebarHeader } from "@/modules/sidebar/components/sidebar-header/sidebar-header";
import { UserSummary } from "@/modules/sidebar/components/user-summary/user-summary";
import { useSidebar } from "@/modules/sidebar/hooks/use-sidebar";
import { styles } from "@/modules/sidebar/styles";

export type SidebarRoute =
  | "inbox"
  | "search"
  | "today"
  | "upcoming"
  | "projects"
  | "archived"
  | "settings";

export type SidebarModuleProps = {
  activeRoute: SidebarRoute;
  compact?: boolean;
  mobile?: boolean;
  onNavigate?: (route: SidebarRoute) => void;
  onClose?: () => void;
};

export function SidebarModule({
  activeRoute,
  compact = false,
  mobile = false,
  onNavigate,
  onClose,
}: SidebarModuleProps) {
  const sidebar = useSidebar({ onNavigate, onClose });
  const showLabels = !compact || mobile;
  const width = mobile ? "100%" : compact ? 72 : 216;

  return (
    <View
      accessibilityLabel="Primary navigation"
      accessibilityRole="menu"
      style={[styles.sidebar, !mobile && styles.sidebarBorder, { width, minWidth: width }]}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, compact && !mobile && styles.contentCompact]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.primaryContent}>
          <SidebarHeader mobile={mobile} onClose={onClose} showLabels={showLabels} />
          {showLabels ? <UserSummary email={sidebar.email} summary={sidebar.summary} /> : null}
          <NavigationSection
            activeRoute={activeRoute}
            compact={!showLabels}
            openCount={sidebar.summary.open}
            onNavigate={sidebar.navigate}
          />
        </View>
        <SidebarFooter
          activeRoute={activeRoute}
          compact={!showLabels}
          error={sidebar.signOutError}
          onNavigate={sidebar.navigate}
          onSignOut={() => void sidebar.signOut()}
          signingOut={sidebar.signingOut}
          summaryError={sidebar.summaryError}
        />
      </ScrollView>
    </View>
  );
}
