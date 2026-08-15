import {
  CalendarBlank,
  CalendarDots,
  HouseLine,
  MagnifyingGlass,
  Plus,
  SquaresFour,
} from "phosphor-react-native";
import { Text, View } from "react-native";
import { NavigationButton } from "@/modules/sidebar/components/navigation-button/navigation-button";
import { styles } from "@/modules/sidebar/components/navigation-section/styles";
import type { SidebarRoute } from "@/modules/sidebar/sidebar-module";
import { useTaskDialogActions } from "@/shared-state";

export function NavigationSection({
  activeRoute,
  compact,
  openCount,
  onNavigate,
}: {
  activeRoute: SidebarRoute;
  compact: boolean;
  openCount: number;
  onNavigate: (route: SidebarRoute) => void;
}) {
  const { openCreateTask } = useTaskDialogActions();
  return (
    <View style={styles.container}>
      <NavigationButton
        compact={compact}
        icon={Plus}
        label="Add task"
        onPress={() => openCreateTask()}
        prominent
      />
      <NavigationButton
        active={activeRoute === "search"}
        compact={compact}
        icon={MagnifyingGlass}
        label="Search"
        onPress={() => onNavigate("search")}
      />
      <NavigationButton
        active={activeRoute === "inbox"}
        compact={compact}
        count={openCount}
        icon={HouseLine}
        label="Inbox"
        onPress={() => onNavigate("inbox")}
      />
      <NavigationButton
        active={activeRoute === "today"}
        compact={compact}
        icon={CalendarBlank}
        label="Today"
        onPress={() => onNavigate("today")}
      />
      <NavigationButton
        active={activeRoute === "upcoming"}
        compact={compact}
        icon={CalendarDots}
        label="Upcoming"
        onPress={() => onNavigate("upcoming")}
      />
      {!compact ? <Text style={styles.workspace}>Workspace</Text> : null}
      <NavigationButton
        active={activeRoute === "projects"}
        compact={compact}
        icon={SquaresFour}
        label="Projects"
        onPress={() => onNavigate("projects")}
      />
    </View>
  );
}
