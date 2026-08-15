import { Animated } from "react-native";
import { usePulseOpacity } from "@/modules/sidebar/components/pulse-segment/hooks/use-pulse-opacity";
import { styles } from "@/modules/sidebar/components/pulse-segment/styles";

export function PulseSegment({
  active,
  reducedMotion,
}: {
  active: boolean;
  reducedMotion: boolean;
}) {
  const opacity = usePulseOpacity(active, reducedMotion);
  return (
    <Animated.View
      style={[styles.segment, active ? styles.active : styles.inactive, { opacity }]}
    />
  );
}
