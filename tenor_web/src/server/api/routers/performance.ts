/**
 * Performance - Tenor API Endpoints for Performance metrics
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing Performance in the Tenor application.
 * It provides endpoints to compute performance metrics.
 *
 * @category API
 */

import { z } from "zod";
import { createTRPCRouter, roleRequiredProcedure } from "~/server/api/trpc";
import { performancePermissions } from "~/lib/permission";

export const performanceRouter = createTRPCRouter({
  getUserContributions: roleRequiredProcedure(performancePermissions, "read")
    .input(z.object({ projectId: z.string(), time: z.string() }))
    .query(async ({ ctx }) => {
      const useruid = ctx.session.user.uid;
      console.log("useruid", useruid);
      return [];
      // const projects = await fetchUserProjects(useruid, ctx.firestore);
      // return projects;
    }),
});
