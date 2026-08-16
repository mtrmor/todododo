/* eslint-disable import/first */
import { createElement } from "react";
import { act, create } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: {
    status: "anonymous" as "authenticated" | "anonymous",
    signIn: vi.fn(async () => undefined),
    signUp: vi.fn(async () => undefined),
  },
  router: { replace: vi.fn() },
  dialog: { mode: "create" } as { mode: "create" } | { mode: "edit"; taskId: string } | null,
  task: null as null | {
    id: string;
    title: string;
    notes: string;
    dueDate: string | null;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
  },
  closeTask: vi.fn(),
  controller: {
    load: vi.fn(),
    cancelLoad: vi.fn(),
    create: vi.fn(async () => undefined),
    update: vi.fn(async () => undefined),
    delete: vi.fn(async () => undefined),
  },
}));

vi.mock("react-native", () => ({
  TextInput: function TextInput() {
    return null;
  },
  useWindowDimensions: () => ({ width: 1024, height: 768 }),
}));
vi.mock("expo-router", () => ({ useRouter: () => mocks.router }));
vi.mock("@/platform", () => ({
  getErrorMessage: (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback,
  useAuth: () => mocks.auth,
}));
vi.mock("@/modules/task-detail/task-detail-controller-context", () => ({
  useTaskDetailController: () => mocks.controller,
}));
vi.mock("@/shared-state", () => ({
  useTask: () => mocks.task,
  useTaskDialog: () => mocks.dialog,
  useTaskDialogActions: () => ({ closeTask: mocks.closeTask }),
}));

import { useAuthForm } from "@/modules/auth/hooks/use-auth-form";
import { useTaskDetailForm } from "@/modules/task-detail/hooks/use-task-detail-form";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe("Mutative-backed form state", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.dialog = { mode: "create" };
    mocks.task = null;
    mocks.auth.status = "anonymous";
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("updates one Task Detail field, clears its error and resets on task change", async () => {
    let form!: ReturnType<typeof useTaskDetailForm>;

    function Probe() {
      form = useTaskDetailForm();
      return null;
    }

    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(createElement(Probe));
    });
    await act(async () => {
      vi.runOnlyPendingTimers();
    });
    await act(async () => form.save());
    expect(form.fieldErrors.title).toBe("Add a task title.");

    act(() => form.updateField("title", "Draft"));
    expect(form.values).toEqual({ title: "Draft", notes: "", dueDate: "" });
    expect(form.fieldErrors.title).toBeUndefined();

    mocks.dialog = { mode: "edit", taskId: "one" };
    mocks.task = {
      id: "one",
      title: "Stored",
      notes: "Notes",
      dueDate: "2026-08-20",
      completed: false,
      createdAt: "2026-08-15T08:00:00.000Z",
      updatedAt: "2026-08-15T08:00:00.000Z",
      completedAt: null,
    };
    act(() => {
      renderer.update(createElement(Probe));
    });
    await act(async () => {
      vi.runOnlyPendingTimers();
    });

    expect(form.values).toEqual({ title: "Stored", notes: "Notes", dueDate: "2026-08-20" });
    expect(form.fieldErrors).toEqual({});
    act(() => renderer.unmount());
  });

  it("keeps Auth primitives separate while clearing only the edited field error", async () => {
    let form!: ReturnType<typeof useAuthForm>;

    function Probe() {
      form = useAuthForm("sign-up");
      return null;
    }

    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(createElement(Probe));
    });
    await act(async () => form.submit());
    expect(form.fieldErrors).toEqual({
      email: "Enter a valid email address.",
      password: "Use at least 8 characters.",
    });

    act(() => form.setEmail("person@example.com"));
    expect(form.email).toBe("person@example.com");
    expect(form.fieldErrors.email).toBeUndefined();
    expect(form.fieldErrors.password).toBe("Use at least 8 characters.");
    act(() => renderer.unmount());
  });
});
