import { createContext, useContext, type PropsWithChildren } from "react";

export function createRequiredContext<T>(name: string) {
  const Context = createContext<T | null>(null);

  function Provider({ children, value }: PropsWithChildren<{ value: T }>) {
    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  function useRequiredContext(): T {
    const value = useContext(Context);

    if (!value) {
      throw new Error(`${name} must be used inside AppServicesProvider`);
    }

    return value;
  }

  Provider.displayName = `${name}Provider`;
  return [Provider, useRequiredContext] as const;
}
