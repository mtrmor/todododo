import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(() =>
    process.env.EXPO_OS === "web" &&
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setReducedMotion(enabled);
      }
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
  return reducedMotion;
}
