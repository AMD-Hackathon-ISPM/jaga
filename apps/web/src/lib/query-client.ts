import { QueryClient } from "@tanstack/react-query";

/** Single QueryClient factory. Used by the future single triage mutation. */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 60_000,
      },
    },
  });
}
