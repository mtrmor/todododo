import { Text } from "react-native";
import { styles } from "@/modules/auth/components/auth-text/styles";

export type AuthTextVariant =
  | "route-title"
  | "route-description"
  | "route-footer"
  | "form-title"
  | "compact-title"
  | "form-description";
export function AuthText({
  variant,
  children,
}: {
  variant: AuthTextVariant;
  children: React.ReactNode;
}) {
  const style = {
    "route-title": styles.routeTitle,
    "route-description": styles.routeDescription,
    "route-footer": styles.routeFooter,
    "form-title": styles.formTitle,
    "compact-title": styles.compactTitle,
    "form-description": styles.formDescription,
  }[variant];
  return (
    <Text selectable style={style}>
      {children}
    </Text>
  );
}
