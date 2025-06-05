import { TRPCError } from "@trpc/server";

export const notFound = (type?: string) => {
  return new TRPCError({
    code: "NOT_FOUND",
    message: type ? `${type} not found` : "Resource not found",
  });
};

export const cyclicReference = () => {
  return new TRPCError({
    code: "BAD_REQUEST",
    message: "Circular dependency detected.",
  });
};

export const forbidden = (message?: string) => {
  return new TRPCError({
    code: "FORBIDDEN",
    message: message ?? "You do not have permission to perform this action.",
  });
};

export const badRequest = (message?: string) => {
  return new TRPCError({
    code: "BAD_REQUEST",
    message: message ?? "Invalid request data.",
  });
};
