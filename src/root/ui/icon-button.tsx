import type { ReactNode } from "react";
import { Pressable, type PressableProps } from "react-native";

import { colors, layout, radii } from "@/platform/theme";

export type IconButtonProps = Omit<PressableProps, "children"> & { label: string; children: ReactNode };

export function IconButton({ label, children, style, ...props }: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={4}
      {...props}
      style={(state) => [
        {
          width: layout.minimumTargetSize,
          height: layout.minimumTargetSize,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radii.md,
          borderCurve: "continuous",
          backgroundColor: state.pressed ? colors.lavenderSelection : "transparent",
        },
        typeof style === "function" ? style(state) : style,
      ]}
    >
      {children}
    </Pressable>
  );
}
