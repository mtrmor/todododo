import { createElement, type ReactNode } from "react";

type HostProps = Record<string, unknown> & { children?: ReactNode };

function host(name: string) {
  function Host({ children, ...props }: HostProps) {
    return createElement(name, props, children);
  }

  Host.displayName = name;
  return Host;
}

export const ActivityIndicator = host("ActivityIndicator");
export const Pressable = host("Pressable");
export const Text = host("Text");
export const TextInput = host("TextInput");
export const View = host("View");

export const StyleSheet = {
  create: <T,>(styles: T): T => styles,
  flatten: <T,>(style: T): T => style,
  hairlineWidth: 1,
};
