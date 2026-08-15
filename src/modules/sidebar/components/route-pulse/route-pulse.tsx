import { View } from "react-native";
import { PulseSegment } from "@/modules/sidebar/components/pulse-segment/pulse-segment";
import { useReducedMotion } from "@/modules/sidebar/components/route-pulse/hooks/use-reduced-motion";
import { styles } from "@/modules/sidebar/components/route-pulse/styles";

export function RoutePulse({ progress }: { progress: number }) {
  const completedSegments = Math.round(progress * 6);
  const reducedMotion = useReducedMotion();
  return (
    <View style={styles.container}>
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
