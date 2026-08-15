import { ArrowRight, MagnifyingGlass, Plus, WarningCircle, X } from "phosphor-react-native";
import { ActivityIndicator, Pressable, TextInput } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

import { Button, Field, IconButton, NoticeBanner, ScreenState, TextField } from "@/platform/ui";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

function render(element: React.ReactElement): ReactTestRenderer {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(element);
  });
  return renderer;
}

describe("Platform UI", () => {
  it.each(["primary", "secondary", "ghost", "danger", "dangerOutline"] as const)(
    "renders the %s Button variant",
    (variant) => {
      const renderer = render(<Button variant={variant}>{variant}</Button>);
      expect(renderer.root.findByProps({ accessibilityLabel: variant })).toBeTruthy();
      act(() => renderer.unmount());
    },
  );

  it("disables Button while loading and supports both icon positions", () => {
    const leading = render(<Button icon={Plus}>Add</Button>);
    expect(leading.root.findAllByType(Plus)).toHaveLength(1);

    const trailing = render(
      <Button icon={ArrowRight} iconPosition="trailing">
        Continue
      </Button>,
    );
    expect(trailing.root.findAllByType(ArrowRight)).toHaveLength(1);

    const loading = render(<Button loading>Save</Button>);
    const pressable = loading.root.findByType(Pressable);
    expect(pressable.props.disabled).toBe(true);
    expect(pressable.props.accessibilityState).toEqual({ disabled: true, busy: true });
    expect(loading.root.findAllByType(ActivityIndicator)).toHaveLength(1);

    act(() => {
      leading.unmount();
      trailing.unmount();
      loading.unmount();
    });
  });

  it("requires an accessible IconButton label and exposes its disabled state", () => {
    const renderer = render(<IconButton disabled icon={X} label="Close dialog" />);
    const pressable = renderer.root.findByType(Pressable);
    expect(pressable.props.accessibilityLabel).toBe("Close dialog");
    expect(pressable.props.accessibilityState).toEqual({ disabled: true });
    act(() => renderer.unmount());
  });

  it("renders Field metadata and associates TextField errors with the input", () => {
    const field = render(
      <Field counter="2 / 10" error="Required value" label="Name" required>
        <TextInput />
      </Field>,
    );
    expect(field.root.findByProps({ accessibilityLiveRegion: "polite" })).toBeTruthy();

    const textField = render(<TextField error="Invalid title" label="Title" value="" />);
    const input = textField.root.findByType(TextInput);
    expect(input.props["aria-invalid"]).toBe(true);
    expect(input.props["aria-describedby"]).toMatch(/-error$/);
    expect(textField.root.findByProps({ nativeID: input.props["aria-describedby"] })).toBeTruthy();

    act(() => {
      field.unmount();
      textField.unmount();
    });
  });

  it("renders TextField adornments and calls its trailing action", () => {
    const onPress = vi.fn();
    const renderer = render(
      <TextField
        label="Search"
        leadingIcon={MagnifyingGlass}
        trailingAction={{ icon: X, label: "Clear", onPress }}
        value="route"
      />,
    );
    expect(renderer.root.findAllByType(MagnifyingGlass)).toHaveLength(1);
    act(() => renderer.root.findByProps({ accessibilityLabel: "Clear" }).props.onPress());
    expect(onPress).toHaveBeenCalledOnce();
    act(() => renderer.unmount());
  });

  it.each(["neutral", "warning", "error"] as const)(
    "gives the %s NoticeBanner alert semantics",
    (tone) => {
      const renderer = render(
        <NoticeBanner icon={WarningCircle} message={`${tone} notice`} tone={tone} />,
      );
      const banner = renderer.root.findByProps({ accessibilityRole: "alert" });
      expect(banner.props.accessibilityLiveRegion).toBe(tone === "error" ? "assertive" : "polite");
      act(() => renderer.unmount());
    },
  );

  it("renders ScreenState loading and action configurations", () => {
    const loading = render(<ScreenState loading message="Loading tasks…" />);
    expect(loading.root.findByProps({ accessibilityRole: "progressbar" })).toBeTruthy();
    expect(loading.root.findAllByType(ActivityIndicator)).toHaveLength(1);

    const onPress = vi.fn();
    const action = render(
      <ScreenState
        action={{ icon: Plus, label: "Create task", onPress }}
        icon={MagnifyingGlass}
        message="Nothing here"
        title="Empty"
      />,
    );
    act(() => action.root.findByProps({ accessibilityLabel: "Create task" }).props.onPress());
    expect(onPress).toHaveBeenCalledOnce();

    act(() => {
      loading.unmount();
      action.unmount();
    });
  });
});
