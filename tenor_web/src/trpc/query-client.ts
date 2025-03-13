import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import { TRPCClientError } from '@trpc/client';
import SuperJSON from "superjson";

// eslint-disable-next-line
const isTRPCError = (error: any): error is TRPCClientError<any> => {
  return error instanceof TRPCClientError;
};

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
        retry: (failureCount, err) => {
          // eslint-disable-next-line
          if (isTRPCError(err) && err.data?.code == 'UNAUTHORIZED') {
            return false; // do not retry, trigger error
          }
  
          const defaultRetry = new QueryClient().getDefaultOptions().queries?.retry;
          if (typeof defaultRetry === 'function') {
            return defaultRetry(failureCount, err);
          }
  
          if (typeof defaultRetry === 'boolean') {
            return defaultRetry; // If true, retry indefinitely; if false, don't retry
          }
  
          if (typeof defaultRetry === 'number') {
            return failureCount < defaultRetry;
          }
  
          return false; // Default: do not retry if type is unknown
      },
    },
    dehydrate: {
      serializeData: SuperJSON.serialize,
      shouldDehydrateQuery: (query) =>
        defaultShouldDehydrateQuery(query) ||
        query.state.status === "pending",
    },
    hydrate: {
      deserializeData: SuperJSON.deserialize,
    },
  },
});
