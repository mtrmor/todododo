export { ApiError, getErrorMessage, isAbortError } from "@/core/api/api-error";
export { createTask, deleteTask, getTask, getTaskSummary, getTasks, setTaskCompleted, updateTask } from "@/core/api/tasks";
export { AuthProvider, useAuth, type AuthContextValue, type AuthStatus } from "@/core/auth/auth-provider";
export { colors, fontAssets, fonts, layout, motion, radii, shadows, spacing, theme } from "@/core/theme";
export type { GetTasksOptions, RequestOptions, SafeUser, TaskDraft, TaskPage, TaskRecord, TaskSummary } from "@/core/types";
