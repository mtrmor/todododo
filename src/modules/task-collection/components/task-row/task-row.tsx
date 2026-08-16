import { CalendarBlank, Check, CircleIcon } from "phosphor-react-native";
import { Pressable, Text, View } from "react-native";
import { colors, type TaskRecord } from "@/platform";
import { useHovered } from "@/modules/task-collection/components/task-row/hooks/use-hovered";
import { styles } from "@/modules/task-collection/components/task-row/styles";
import { useInboxController } from "@/modules/task-collection/inbox-controller-context";
import { useTaskDialogActions, useTaskMutation } from "@/shared-state";

export function ConnectedTaskRow({ task }: { task: TaskRecord }) {
  const inboxController = useInboxController();
  const { openTask } = useTaskDialogActions();
  const mutation = useTaskMutation(task.id);
  return (
    <TaskRow
      pending={mutation !== null}
      task={task}
      onOpen={() => openTask(task.id)}
      onToggle={() =>
        void inboxController.setCompleted(task.id, !task.completed).catch(() => undefined)
      }
    />
  );
}
function TaskRow({
  task,
  pending,
  onToggle,
  onOpen,
}: {
  task: TaskRecord;
  pending: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const hover = useHovered();
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel={
          task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`
        }
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed, disabled: pending }}
        disabled={pending}
        hitSlop={2}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.toggle,
          (pressed || pending) && styles.muted,
          pending && styles.disabled,
        ]}
      >
        {task.completed ? (
          <View style={styles.check}>
            <Check aria-hidden color={colors.paper} size={11} weight="bold" />
          </View>
        ) : (
          <CircleIcon aria-hidden color={colors.placeholder} size={20} weight="regular" />
        )}
      </Pressable>
      <Pressable
        accessibilityHint="Opens task details"
        accessibilityLabel={`${task.title}${task.completed ? ", completed" : ""}`}
        accessibilityRole="button"
        onHoverIn={hover.onHoverIn}
        onHoverOut={hover.onHoverOut}
        onPress={onOpen}
        style={({ pressed }) => [
          styles.content,
          (hover.hovered || pressed) && styles.contentHovered,
        ]}
      >
        <Text numberOfLines={2} style={[styles.title, task.completed && styles.titleCompleted]}>
          {task.title}
        </Text>
        {task.dueDate ? (
          <View style={styles.dueDate}>
            <CalendarBlank aria-hidden color={colors.placeholder} size={12} />
            <Text style={styles.dueDateLabel}>{formatDueDate(task.dueDate)}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}
function formatDueDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}
