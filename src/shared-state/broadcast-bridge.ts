const CHANNEL_NAME = "todododo:tasks-invalidation";
const MESSAGE_TYPE = "tasks-invalidated";

type InvalidationListener = () => void;

export class TaskInvalidationBus {
  readonly #listeners = new Set<InvalidationListener>();
  #channel: BroadcastChannel | null = null;

  readonly subscribe = (listener: InvalidationListener): (() => void) => {
    this.#listeners.add(listener);
    this.#ensureChannel();
    return () => {
      this.#listeners.delete(listener);

      if (this.#listeners.size === 0) {
        this.#channel?.close();
        this.#channel = null;
      }
    };
  };

  publish(): void {
    for (const listener of this.#listeners) {
      listener();
    }
    this.#ensureChannel()?.postMessage({ type: MESSAGE_TYPE });
  }

  #ensureChannel(): BroadcastChannel | null {
    if (
      this.#channel ||
      typeof window === "undefined" ||
      typeof globalThis.BroadcastChannel !== "function"
    ) {
      return this.#channel;
    }

    this.#channel = new globalThis.BroadcastChannel(CHANNEL_NAME);
    this.#channel.addEventListener("message", (event: MessageEvent<unknown>) => {
      if (
        typeof event.data === "object" &&
        event.data !== null &&
        "type" in event.data &&
        event.data.type === MESSAGE_TYPE
      ) {
        for (const listener of this.#listeners) {
          listener();
        }
      }
    });
    return this.#channel;
  }

  resetForTests(): void {
    this.#listeners.clear();
    this.#channel?.close();
    this.#channel = null;
  }
}

export const taskInvalidationBus = new TaskInvalidationBus();
