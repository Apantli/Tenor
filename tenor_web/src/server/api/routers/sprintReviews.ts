/**
 * Sprint Reviews Router - API Endpoints for managing Review records.
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for retrieving or creating Review entries
 * associated with sprints. It ensures that a review exists per sprint and returns its ID.
 *
 * @category API
 */

import { createTRPCRouter, roleRequiredProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { getPreviousSprint } from "~/utils/helpers/shortcuts/sprints";
import { sprintPermissions } from "~/lib/permission";

type ReviewAnswers = Record<string, string>;

/**
 * Retrieves the ID of a review associated with a given sprint.
 * If the review does not exist, it is created automatically.
 *
 * @param input - Object containing the `sprintId` (string).
 * @returns The ID of the existing or newly created review (number).
 *
 * @http GET /api/trpc/sprintReviews.getReviewId
 */
export const getReviewIdProcedure = roleRequiredProcedure(sprintPermissions, "read")
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

export const getReviewAnswersProcedure = roleRequiredProcedure(sprintPermissions, "read")
  .input(z.object({ reviewId: z.number(), userId: z.string() }))
  .query(async ({ ctx, input }) => {
    const response = await ctx.supabase.rpc("get_review_answers", {
      p_review_id: input.reviewId,
      p_user_id: input.userId,
    });
    if (response.error) {
      throw new Error(`Failed to get review answers: ${response.error.message}`);
    }
    return response.data as ReviewAnswers;
  });

export const saveReviewAnswersProcedure = roleRequiredProcedure(sprintPermissions, "write")
  .input(
    z.object({
      reviewId: z.number(),
      userId: z.string(),
      questionNum: z.number(),
      answerText: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const response = await ctx.supabase.rpc("save_review_answer", {
      p_review_id: input.reviewId,
      p_user_id: input.userId,
      p_question_num: input.questionNum,
      p_response_text: input.answerText,
    });
    if (response.error) {
      throw new Error(`Failed to save review answer: ${response.error.message}`);
    }
    return response.data as boolean;
  });

/**
 * Router for managing sprint reviews.
 */
export const sprintReviewsRouter = createTRPCRouter({
  getReviewId: getReviewIdProcedure,
  getReviewAnswers: getReviewAnswersProcedure,
  saveReviewAnswers: saveReviewAnswersProcedure,
  getPreviousSprint: roleRequiredProcedure(sprintPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const previousSprint = await getPreviousSprint(
        ctx.firestore,
        input.projectId,
      );
      return previousSprint ?? null;
    }),
});
