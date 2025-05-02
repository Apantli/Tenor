import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { getAuth } from "firebase/auth";
import SuperJSON from "superjson";
import { trpcClient } from "./react";

// eslint-disable-next-line
const isTRPCError = (error: any): error is TRPCClientError<any> => {
  return error instanceof TRPCClientError;
};

const refreshToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) return false;

  const newToken = await user.getIdToken(true);
  const response = await trpcClient.auth.refreshSession.mutate({
    token: newToken,
  });
  return response.success;
};

export const createQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
        retry: (failureCount, err) => {
          // eslint-disable-next-line
          if (isTRPCError(err) && err.data?.code == "UNAUTHORIZED") {
            if (failureCount > 0) {
              return false; // prevent infinite loops.
            }

            void refreshToken().then(async (success) => {
              if (success) {
                await queryClient.invalidateQueries();
              }
            });
          }

          const defaultRetry = new QueryClient().getDefaultOptions().queries
            ?.retry;
          if (typeof defaultRetry === "function") {
            return defaultRetry(failureCount, err);
          }

          if (typeof defaultRetry === "boolean") {
            return defaultRetry; // If true, retry indefinitely; if false, don't retry
          }

          if (typeof defaultRetry === "number") {
            return failureCount < defaultRetry;
          }

          return false; // Default: do not retry if type is unknown
        },
      },
      mutations: {
        retry: (failureCount, err) => {
          // eslint-disable-next-line
          if (isTRPCError(err) && err.data?.code === "BAD_REQUEST") {
            return false;
          }

          // eslint-disable-next-line
          if (isTRPCError(err) && err.data?.code === "FORBIDDEN") {
            return false;
          }

          if (failureCount > 3) {
            return false;
            // eslint-disable-next-line
          } else if (isTRPCError(err) && err.data?.code == "UNAUTHORIZED") {
            void refreshToken();
          }
          return true; // Retry up to 3 times
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
  return queryClient;
};
