import { createElement } from "react";

type IconProps = Record<string, unknown>;

function icon(name: string) {
  function Icon(props: IconProps) {
    return createElement(name, props);
  }

  Icon.displayName = name;
  return Icon;
}

export const ArrowRight = icon("ArrowRight");
export const MagnifyingGlass = icon("MagnifyingGlass");
export const Plus = icon("Plus");
export const WarningCircle = icon("WarningCircle");
export const X = icon("X");
