export type StoreListener = () => void;

export abstract class ExternalStore<TSnapshot extends object> {
  readonly #serverSnapshot: TSnapshot;
  readonly #listeners = new Set<StoreListener>();
  #snapshot: TSnapshot;

  protected constructor(initialSnapshot: TSnapshot, serverSnapshot = initialSnapshot) {
    this.#snapshot = initialSnapshot;
    this.#serverSnapshot = serverSnapshot;
  }

  readonly subscribe = (listener: StoreListener): (() => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  readonly getSnapshot = (): TSnapshot => this.#snapshot;

  readonly getServerSnapshot = (): TSnapshot => this.#serverSnapshot;

  protected publish(nextSnapshot: TSnapshot): boolean {
    if (Object.is(this.#snapshot, nextSnapshot)) {
      return false;
    }

    this.#snapshot = nextSnapshot;
    for (const listener of this.#listeners) {
      listener();
    }
    return true;
  }

  protected resetSnapshot(): boolean {
    return this.publish(this.#serverSnapshot);
  }

  clearListenersForTests(): void {
    this.#listeners.clear();
  }
}
