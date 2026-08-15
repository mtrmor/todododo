import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Manrope_700Bold } from "@expo-google-fonts/manrope/700Bold";

export const colors = Object.freeze({
  paper: "#FFFFFF",
  railFog: "#F4F3F8",
  softLine: "#E7E5EC",
  routeViolet: "#6254D8",
  routeVioletPressed: "#5143C3",
  lavenderSelection: "#EAE7FA",
  ink: "#1D1A2B",
  mutedInk: "#6E697B",
  placeholder: "#9B96A5",
  focusRing: "#8175EA",
  danger: "#B3261E",
  dangerLine: "#F2C7C3",
  dangerSurface: "#FFF1F0",
  inkOnDarkMuted: "#C8C2D9",
  inkRaised: "#2C283D",
  white: "#FFFFFF",
  success: "#2F7A4B",
  warning: "#A96715",
});

export const fonts = Object.freeze({
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemibold: "Inter_600SemiBold",
  heading: "Manrope_700Bold",
});

export const fontAssets = Object.freeze({
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Manrope_700Bold,
});

export const spacing = Object.freeze({
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
});

export const radii = Object.freeze({
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
});

export const layout = Object.freeze({
  desktopSidebarWidth: 216,
  tabletRailWidth: 72,
  contentWidth: 624,
  modalWidth: 560,
  mobileBreakpoint: 720,
  tabletBreakpoint: 1040,
  minimumTargetSize: 44,
});

export const shadows = Object.freeze({
  subtle: "0 1px 2px rgba(29, 26, 43, 0.06)",
  floating: "0 18px 48px rgba(29, 26, 43, 0.14)",
});

export const motion = Object.freeze({ routePulseMs: 200 });

export const theme = Object.freeze({
  colors,
  fonts,
  spacing,
  radii,
  layout,
  shadows,
  motion,
});
