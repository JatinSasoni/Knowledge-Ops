import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError, session } from "./api";

// A 401 that survives api()'s refresh-and-retry means the session is over: show "signed out".
const onError = (error: Error) => {
  if (error instanceof ApiError && error.status === 401) {
    session.clear();
    queryClient.setQueryData(["me"], null);
  }
};

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError }),
  mutationCache: new MutationCache({ onError }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // 4xx won't change on retry; only retry server/network errors, at most twice.
      retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
    },
  },
});
