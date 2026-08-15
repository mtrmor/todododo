import { useEffect, useState } from "react";
import { Animated } from "react-native";
import { isNativeDriverApplicable } from "@/platform";

export function usePulseOpacity(active: boolean, reducedMotion: boolean) {
  const [opacity] = useState(() => new Animated.Value(active ? 1 : 0.28));
  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(active ? 1 : 0.28);
      return;
    }

    Animated.timing(opacity, {
      toValue: active ? 1 : 0.28,
      duration: 200,
      useNativeDriver: isNativeDriverApplicable,
    }).start();
  }, [active, opacity, reducedMotion]);
  return opacity;
}
