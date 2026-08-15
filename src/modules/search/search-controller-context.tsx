import { createContext, useContext, type PropsWithChildren } from "react";

import type { SearchController } from "@/modules/search/search-controller";

const SearchControllerContext = createContext<SearchController | null>(null);

export function SearchControllerProvider({
  children,
  controller,
}: PropsWithChildren<{ controller: SearchController }>) {
  return (
    <SearchControllerContext.Provider value={controller}>
      {children}
    </SearchControllerContext.Provider>
  );
}

export function useSearchController(): SearchController {
  const controller = useContext(SearchControllerContext);

  if (!controller) {
    throw new Error("useSearchController must be used inside AppServicesProvider");
  }

  return controller;
}
