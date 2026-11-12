import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError, tokenStore } from "./api";

// One place for "session is no longer valid": any 401 from any request logs the user out.
const onError = (error: Error) => {
  if (error instanceof ApiError && error.status === 401) {
    tokenStore.clear();
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
