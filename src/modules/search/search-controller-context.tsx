import type { SearchController } from "@/modules/search/search-controller";
import { createRequiredContext } from "@/platform/react/create-required-context";

export const [SearchControllerProvider, useSearchController] =
  createRequiredContext<SearchController>("useSearchController");
