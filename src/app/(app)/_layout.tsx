import { colors, fonts, useAuth } from "@/core";
import {
  SidebarModule,
  type SidebarRoute,
} from "@/modules/sidebar";
import { TaskDetailModule } from "@/modules/task-detail";
import { List, PathIcon } from "phosphor-react-native";
import { type Href, Redirect, Slot, usePathname, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

const SIDEBAR_ROUTES = new Set<SidebarRoute>([
  "inbox",
  "search",
  "today",
  "upcoming",
  "projects",
  "archived",
  "settings",
]);

export default function AppLayout() {
  const { status } = useAuth();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mobile = width < 720;
  const compact = width >= 720 && width < 1100;
  const activeRoute = useMemo<SidebarRoute>(() => {
    const firstSegment = pathname.split("/").filter(Boolean)[0];
    return SIDEBAR_ROUTES.has(firstSegment as SidebarRoute)
      ? (firstSegment as SidebarRoute)
      : "inbox";
  }, [pathname]);

  if (status === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          accessibilityLabel="Loading your tasks"
          color={colors.routeViolet}
        />
      </View>
    );
  }

  if (status === "anonymous") {
    return <Redirect href="/sign-in" />;
  }

  const navigate = (route: SidebarRoute) => {
    setDrawerOpen(false);
    router.push(`/${route}` as Href);
  };

  return (
    <View style={[styles.page, mobile && styles.pageMobile]}>
      {!mobile ? (
        <SidebarModule
          activeRoute={activeRoute}
          compact={compact}
          onNavigate={navigate}
        />
      ) : (
        <MobileHeader onOpen={() => setDrawerOpen(true)} />
      )}

      <View style={styles.content}>
        <Slot />
      </View>

      {mobile ? (
        <Modal
          animationType="fade"
          onRequestClose={() => setDrawerOpen(false)}
          presentationStyle="overFullScreen"
          transparent
          visible={drawerOpen}
        >
          <View style={styles.drawerLayer}>
            <Pressable
              accessibilityLabel="Close navigation"
              accessibilityRole="button"
              onPress={() => setDrawerOpen(false)}
              style={styles.backdrop}
            />
            <View style={styles.drawer}>
              <SidebarModule
                activeRoute={activeRoute}
                mobile
                onClose={() => setDrawerOpen(false)}
                onNavigate={navigate}
              />
            </View>
          </View>
        </Modal>
      ) : null}

      <TaskDetailModule />
    </View>
  );
}

function MobileHeader({ onOpen }: { onOpen: () => void }) {
  return (
    <View style={styles.mobileHeader}>
      <Pressable
        accessibilityLabel="Open navigation"
        accessibilityRole="button"
        onPress={onOpen}
        style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
      >
        <List
          aria-hidden
          color={colors.ink}
          size={21}
          weight="regular"
        />
      </Pressable>
      <View style={styles.mobileBrand}>
        <View style={styles.mobileMark}>
          <PathIcon
            aria-hidden
            color={colors.routeViolet}
            size={17}
            weight="bold"
          />
        </View>
        <Text style={styles.mobileBrandText}>TodoDodo</Text>
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    bottom: 0,
    backgroundColor: "rgba(29, 26, 43, 0.28)",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  drawer: {
    bottom: 0,
    left: 0,
    maxWidth: 320,
    position: "absolute",
    top: 0,
    width: "86%",
  },
  drawerLayer: {
    flex: 1,
  },
  headerSpacer: {
    height: 44,
    width: 44,
  },
  loading: {
    alignItems: "center",
    backgroundColor: colors.railFog,
    flex: 1,
    justifyContent: "center",
  },
  menuButton: {
    alignItems: "center",
    borderRadius: 12,
    height: 44,
    justifyContent: "center",
    outlineColor: colors.focusRing,
    width: 44,
  },
  mobileBrand: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  mobileBrandText: {
    color: colors.ink,
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  mobileHeader: {
    alignItems: "center",
    backgroundColor: colors.railFog,
    borderBottomColor: colors.softLine,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    height: 64,
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  mobileMark: {
    alignItems: "center",
    backgroundColor: colors.lavenderSelection,
    borderRadius: 8,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  page: {
    backgroundColor: colors.paper,
    flex: 1,
    flexDirection: "row",
    minHeight: 0,
    minWidth: 0,
  },
  pageMobile: {
    flexDirection: "column",
  },
  pressed: {
    backgroundColor: colors.lavenderSelection,
  },
});
