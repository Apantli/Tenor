/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod";

import { dbAdmin, firebaseAdmin } from "~/utils/firebaseAdmin";
import { supabase } from "~/utils/supabase";
import { auth } from "../auth";
import { Permission, Role } from "~/lib/types/firebaseSchemas";
import { emptyRole, ownerRole } from "~/lib/defaultTags";
import { RoleSchema } from "~/lib/types/zodFirebaseSchema";
import { getProjectRoleRef, getProjectUserRef } from "./routers/settings";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth();

  return {
    session,
    firebaseAdmin,
    firestore: dbAdmin,
    supabase,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.emailVerified) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session },
    },
  });
});

interface PermissionsRequired {
  flags: (
    | "settings"
    | "performance"
    | "sprints"
    | "scrumboard"
    | "issues"
    | "backlog"
  )[];
  permission: Permission;
}

export const roleRequiredProcedure = (permissions: PermissionsRequired) =>
  protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .use(async ({ ctx, next, input }) => {
      // Check if there is a projectId
      if (!input.projectId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // By deafult, no permission
      const userId = ctx.session.uid;
      let role: Role = emptyRole;

      const userDoc = await getProjectUserRef(
        input.projectId,
        userId,
        ctx.firestore,
      ).get();

      // Check if the user is in the project
      if (!userDoc.exists) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Check if the user is the owner
      const userData = userDoc.data();
      if (!userData) {
        throw new TRPCError({ code: "FORBIDDEN" });
      } else if (userData.roleId === "owner") {
        role = ownerRole;
      } else if (userData.roleId != null) {
        // Check if the user has a role
        const roleDoc = await getProjectRoleRef(
          input.projectId,
          userData.roleId as string,
          ctx.firestore,
        ).get();

        // Check if the role exists
        if (!roleDoc.exists) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        // Check if the role is valid
        const roleData = roleDoc.data();
        if (!roleData) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        // Check if the role is valid
        const roleSchema = RoleSchema.parse(roleData);
        const roleId = roleDoc.id;

        // Parse the role data
        role = {
          id: roleId,
          ...roleSchema,
          settings: roleSchema.settings as Permission,
          performance: roleSchema.performance as Permission,
          sprints: roleSchema.sprints as Permission,
          scrumboard: roleSchema.scrumboard as Permission,
          issues: roleSchema.issues as Permission,
          backlog: roleSchema.backlog as Permission,
        };
      }

      let userPermission = 2;
      // Go through the flags and get the minimum permission
      permissions.flags.forEach((flag) => {
        if ((role[flag as keyof Role] as number) < userPermission) {
          userPermission = role[flag as keyof Role] as number;
        }
      });

      if (permissions.permission > userPermission) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return next({ ctx });
    });
