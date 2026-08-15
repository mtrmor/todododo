export { ApiError, getErrorMessage, isAbortError } from "@/platform/api/api-error";
export {
  createTask,
  deleteTask,
  getTask,
  getTaskSummary,
  getTasks,
  setTaskCompleted,
  updateTask,
} from "@/platform/api/tasks";
export {
  AuthProvider,
  useAuth,
  type AuthContextValue,
  type AuthStatus,
} from "@/platform/auth/auth-provider";
export {
  colors,
  fontAssets,
  fonts,
  layout,
  motion,
  radii,
  shadows,
  spacing,
  theme,
} from "@/platform/theme";
export type {
  GetTasksOptions,
  RequestOptions,
  SafeUser,
  TaskDraft,
  TaskPage,
  TaskRecord,
  TaskSummary,
} from "@/platform/types";
