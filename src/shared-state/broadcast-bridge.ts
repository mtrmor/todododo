import { markTasksChangedLocal, subscribeLocal } from "@/shared-state/store";

const CHANNEL_NAME = "todododo:tasks-revision";
const MESSAGE_TYPE = "tasks-changed";
let channel: BroadcastChannel | null = null;

function ensureChannel(): BroadcastChannel | null {
  if (channel || typeof window === "undefined" || typeof globalThis.BroadcastChannel !== "function") {
    return channel;
  }

  channel = new globalThis.BroadcastChannel(CHANNEL_NAME);
  channel.addEventListener("message", (event: MessageEvent<unknown>) => {
    if (typeof event.data === "object" && event.data !== null && "type" in event.data && event.data.type === MESSAGE_TYPE) {
      markTasksChangedLocal();
    }
  });
  return channel;
}

export function subscribe(listener: () => void): () => void {
  ensureChannel();
  return subscribeLocal(listener);
}

export function markTasksChanged(): void {
  markTasksChangedLocal();
  ensureChannel()?.postMessage({ type: MESSAGE_TYPE });
}
