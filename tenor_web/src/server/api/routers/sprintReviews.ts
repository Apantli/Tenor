/**
 * Sprint Reviews Router - API Endpoints for managing Review records.
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for retrieving or creating Review entries
 * associated with sprints. It ensures that a review exists per sprint and returns its ID.
 *
 * @category API
 */

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";

/**
 * Retrieves the ID of a review associated with a given sprint.
 * If the review does not exist, it is created automatically.
 *
 * @param input - Object containing the `sprintId` (string).
 * @returns The ID of the existing or newly created review (number).
 *
 * @http GET /api/trpc/sprintReviews.getReviewId
 */
export const getReviewIdProcedure = protectedProcedure
  .input(z.object({ sprintId: z.string() }))
  .query(async ({ ctx, input }) => {
    const response = await ctx.supabase.rpc("get_review_id", {
      sprint_id_input: input.sprintId,
    });

    if (response.error) {
      throw new Error(`Failed to get or create review: ${response.error.message}`);
    }

    return response.data as number;
  });

/**
 * Router for managing sprint reviews.
 */
export const sprintReviewsRouter = createTRPCRouter({
  getReviewId: getReviewIdProcedure,
});
