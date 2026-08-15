import {
  Archive,
  Bell,
  CalendarBlank,
  CalendarDots,
  GearSix,
  HouseLine,
  ListChecks,
  MagnifyingGlass,
  Plus,
  PathIcon,
  SignOut,
  SquaresFour,
  WarningCircle,
  X,
} from "phosphor-react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import {
  colors,
  fonts,
  getErrorMessage,
  shadows,
  useAuth,
} from "@/core";
import {
  closeTask,
  openCreateTask,
  useTaskSummary,
} from "@/shared-state";
import { sidebarController } from "@/modules/sidebar/sidebar-controller";

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

const ROUTES: Record<SidebarRoute, string> = {
  inbox: "/inbox",
  search: "/search",
  today: "/today",
  upcoming: "/upcoming",
  projects: "/projects",
  archived: "/archived",
  settings: "/settings",
};

export function SidebarModule({
  activeRoute,
  compact = false,
  mobile = false,
  onNavigate,
  onClose,
}: SidebarModuleProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { data: summary, error: summaryError } = useTaskSummary();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  useEffect(() => sidebarController.connect(), []);

  const routeProgress =
    summary.total === 0
      ? 0
      : Math.max(0, Math.min(1, summary.completed / summary.total));

  function navigate(route: SidebarRoute) {
    if (onNavigate) {
      onNavigate(route);
    } else {
      router.push(ROUTES[route] as never);
    }
    onClose?.();
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(null);
    try {
      closeTask();
      await signOut();
      router.replace("/sign-in");
    } catch (error) {
      setSignOutError(getErrorMessage(error, "Sign out could not be completed."));
    } finally {
      setSigningOut(false);
    }
  }

  const showLabels = !compact || mobile;
  const sidebarWidth = mobile ? "100%" : compact ? 72 : 216;

  return (
    <View
      accessibilityLabel="Primary navigation"
      accessibilityRole="menu"
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        height: "100%",
        borderRightWidth: mobile ? 0 : 1,
        borderRightColor: colors.softLine,
        backgroundColor: colors.railFog,
      }}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          minHeight: "100%",
          justifyContent: "space-between",
          gap: 24,
          paddingHorizontal: compact && !mobile ? 10 : 12,
          paddingTop: 14,
          paddingBottom: 14,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 16 }}>
          <View
            style={{
              minHeight: 44,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: showLabels ? "space-between" : "center",
              paddingHorizontal: showLabels ? 4 : 0,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
              <View
                style={{
                  width: 31,
                  height: 31,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 9,
                  borderCurve: "continuous",
                  backgroundColor: colors.routeViolet,
                  boxShadow: shadows.subtle,
                }}
              >
                <PathIcon aria-hidden color={colors.paper} size={18} weight="bold" />
              </View>
              {showLabels ? (
                <Text
                  style={{
                    color: colors.ink,
                    fontFamily: fonts.heading,
                    fontSize: 14,
                    fontWeight: "700",
                    letterSpacing: -0.2,
                  }}
                >
                  TodoDodo
                </Text>
              ) : null}
            </View>

            {mobile ? (
              <Pressable
                accessibilityLabel="Close navigation"
                accessibilityRole="button"
                onPress={onClose}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 12,
                  opacity: pressed ? 0.58 : 1,
                  cursor: "pointer",
                  outlineColor: colors.focusRing,
                })}
              >
                <X aria-hidden color={colors.mutedInk} size={20} />
              </Pressable>
            ) : null}
          </View>

          {showLabels ? (
            <View style={{ gap: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 9,
                  paddingHorizontal: 5,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 9,
                    borderCurve: "continuous",
                    backgroundColor: colors.paper,
                    borderWidth: 1,
                    borderColor: colors.softLine,
                  }}
                >
                  <Text
                    style={{
                      color: colors.routeViolet,
                      fontFamily: fonts.heading,
                      fontSize: 12,
                      fontWeight: "700",
                    }}
                  >
                    {user?.email?.slice(0, 1).toUpperCase() ?? "T"}
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    color: colors.ink,
                    fontFamily: fonts.body,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {user?.email ?? "Your route"}
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
                style={{
                  gap: 10,
                  paddingHorizontal: 11,
                  paddingVertical: 11,
                  borderWidth: 1,
                  borderColor: colors.softLine,
                  borderRadius: 12,
                  borderCurve: "continuous",
                  backgroundColor: colors.paper,
                  boxShadow: shadows.subtle,
                }}
              >
                <View style={{ gap: 2 }}>
                  <Text
                    style={{
                      color: colors.ink,
                      fontFamily: fonts.body,
                      fontSize: 11,
                      fontWeight: "600",
                    }}
                  >
                    Inbox route
                  </Text>
                  <Text
                    style={{
                      color: colors.mutedInk,
                      fontFamily: fonts.body,
                      fontSize: 10,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {summary.open} open {summary.open === 1 ? "task" : "tasks"}
                  </Text>
                </View>
                <RoutePulse progress={routeProgress} />
              </View>
            </View>
          ) : null}

          <View style={{ gap: 4 }}>
            <NavigationButton
              compact={!showLabels}
              icon={Plus}
              label="Add task"
              onPress={() => openCreateTask()}
              prominent
            />
            <NavigationButton
              active={activeRoute === "search"}
              compact={!showLabels}
              icon={MagnifyingGlass}
              label="Search"
              onPress={() => navigate("search")}
            />
            <NavigationButton
              active={activeRoute === "inbox"}
              compact={!showLabels}
              count={summary.open}
              icon={HouseLine}
              label="Inbox"
              onPress={() => navigate("inbox")}
            />
            <NavigationButton
              active={activeRoute === "today"}
              compact={!showLabels}
              icon={CalendarBlank}
              label="Today"
              onPress={() => navigate("today")}
            />
            <NavigationButton
              active={activeRoute === "upcoming"}
              compact={!showLabels}
              icon={CalendarDots}
              label="Upcoming"
              onPress={() => navigate("upcoming")}
            />

            {showLabels ? (
              <Text
                style={{
                  paddingTop: 16,
                  paddingBottom: 5,
                  paddingHorizontal: 8,
                  color: colors.placeholder,
                  fontFamily: fonts.body,
                  fontSize: 10,
                  fontWeight: "600",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}
              >
                Workspace
              </Text>
            ) : null}

            <NavigationButton
              active={activeRoute === "projects"}
              compact={!showLabels}
              icon={SquaresFour}
              label="Projects"
              onPress={() => navigate("projects")}
            />
          </View>
        </View>

        <View style={{ gap: 4 }}>
          {summaryError && showLabels ? (
            <Text
              accessibilityLiveRegion="polite"
              selectable
              style={{
                paddingHorizontal: 9,
                paddingBottom: 6,
                color: colors.warning,
                fontFamily: fonts.body,
                fontSize: 10,
                lineHeight: 14,
              }}
            >
              {summaryError}
            </Text>
          ) : null}
          <NavigationButton
            active={activeRoute === "archived"}
            compact={!showLabels}
            icon={Archive}
            label="Archived"
            onPress={() => navigate("archived")}
          />
          <NavigationButton
            active={activeRoute === "settings"}
            compact={!showLabels}
            icon={GearSix}
            label="Settings"
            onPress={() => navigate("settings")}
          />
          {signOutError ? (
            showLabels ? (
              <Text
                accessibilityLiveRegion="assertive"
                accessibilityRole="alert"
                selectable
                style={{
                  paddingHorizontal: 9,
                  paddingVertical: 6,
                  color: colors.danger,
                  fontFamily: fonts.body,
                  fontSize: 10,
                  lineHeight: 14,
                }}
              >
                {signOutError}
              </Text>
            ) : (
              <View
                accessibilityLabel={signOutError}
                accessibilityLiveRegion="assertive"
                accessibilityRole="alert"
                style={{ minHeight: 32, alignItems: "center", justifyContent: "center" }}
              >
                <WarningCircle aria-hidden color={colors.danger} size={18} weight="fill" />
              </View>
            )
          ) : null}
          <NavigationButton
            compact={!showLabels}
            disabled={signingOut}
            icon={SignOut}
            label="Sign out"
            onPress={() => void handleSignOut()}
          />
          {signingOut ? (
            <ActivityIndicator color={colors.routeViolet} size="small" />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function RoutePulse({ progress }: { progress: number }) {
  const completedSegments = Math.round(progress * 6);
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (
      process.env.EXPO_OS === "web" &&
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function"
    ) {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotion(enabled);
    });

    if (
      process.env.EXPO_OS === "web" &&
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function"
    ) {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      const handleChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
      media.addEventListener?.("change", handleChange);
      return () => {
        mounted = false;
        media.removeEventListener?.("change", handleChange);
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {Array.from({ length: 6 }, (_, index) => (
        <PulseSegment
          active={index < completedSegments}
          key={index}
          reducedMotion={reducedMotion}
        />
      ))}
    </View>
  );
}

function PulseSegment({
  active,
  reducedMotion,
}: {
  active: boolean;
  reducedMotion: boolean;
}) {
  const [opacity] = useState(() => new Animated.Value(active ? 1 : 0.28));

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(active ? 1 : 0.28);
      return;
    }
    Animated.timing(opacity, {
      toValue: active ? 1 : 0.28,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [active, opacity, reducedMotion]);

  return (
    <Animated.View
      style={{
        flex: 1,
        height: 3,
        borderRadius: 999,
        backgroundColor: active ? colors.routeViolet : colors.placeholder,
        opacity,
      }}
    />
  );
}

type NavigationButtonProps = {
  label: string;
  icon: typeof ListChecks;
  onPress: () => void;
  active?: boolean;
  compact?: boolean;
  count?: number;
  prominent?: boolean;
  disabled?: boolean;
};

function NavigationButton({
  label,
  icon: Icon,
  onPress,
  active = false,
  compact = false,
  count,
  prominent = false,
  disabled = false,
}: NavigationButtonProps) {
  const [hovered, setHovered] = useState(false);
  const foreground = prominent || active ? colors.routeViolet : colors.mutedInk;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: compact ? "center" : "flex-start",
        gap: 10,
        paddingHorizontal: compact ? 0 : 9,
        borderRadius: 10,
        borderCurve: "continuous",
        backgroundColor: active
          ? colors.lavenderSelection
          : hovered || pressed
            ? colors.paper
            : "transparent",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "auto" : "pointer",
        outlineColor: colors.focusRing,
        outlineOffset: 1,
      })}
    >
      <Icon aria-hidden color={foreground} size={18} weight={active ? "fill" : "regular"} />
      {!compact ? (
        <>
          <Text
            style={{
              flex: 1,
              color: active ? colors.routeViolet : colors.ink,
              fontFamily: fonts.body,
              fontSize: 12,
              fontWeight: active || prominent ? "600" : "500",
            }}
          >
            {label}
          </Text>
          {typeof count === "number" ? (
            <Text
              style={{
                color: colors.mutedInk,
                fontFamily: fonts.body,
                fontSize: 10,
                fontVariant: ["tabular-nums"],
              }}
            >
              {count}
            </Text>
          ) : null}
        </>
      ) : null}
    </Pressable>
  );
}
