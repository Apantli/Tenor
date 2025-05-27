/**
 * Sprint Retrospective Router - API Endpoints for managing Retrospective records.
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for retrieving or creating Retrospective entries
 * associated with sprints. It ensures that a retrospective exists per sprint and returns its ID.
 *
 * @category API
 */

import { createTRPCRouter, roleRequiredProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { getPreviousSprint } from "~/utils/helpers/shortcuts/sprints";
import { reviewPermissions } from "~/lib/defaultValues/permission";
import { askAiToGenerate } from "~/utils/aiTools/aiGeneration";
import { TRPCError } from "@trpc/server";
import { getSprintRetrospectiveTextAnswersContext } from "~/utils/helpers/shortcuts/sprintRetrospectives";

type RetrospectiveAnswers = Record<string, string>;

/**
 * Retrieves the ID of a retrospective associated with a given sprint.
 * If the retrospective does not exist, it is created automatically.
 *
 * @param input - Object containing the `sprintId` (string).
 * @returns The ID of the existing or newly created retrospective (number).
 *
 * @http GET /api/trpc/sprintRetrospectives.getRetrospectiveId
 */
export const getRetrospectiveIdProcedure = roleRequiredProcedure(
  reviewPermissions,
  "read",
)
  .input(z.object({ sprintId: z.string() }))
  .query(async ({ ctx, input }) => {
    const response = await ctx.supabase.rpc("get_review_id", {
      sprint_id_input: input.sprintId,
    });

    if (response.error) {
      throw new Error(
        `Failed to get or create retrospective: ${response.error.message}`,
      );
    }

    return response.data as number;
  });

export const getRetrospectiveAnswersProcedure = roleRequiredProcedure(
  reviewPermissions,
  "read",
)
  .input(z.object({ reviewId: z.number(), userId: z.string() }))
  .query(async ({ ctx, input }) => {
    const response = await ctx.supabase.rpc("get_review_answers", {
      p_review_id: input.reviewId,
      p_user_id: input.userId,
    });
    if (response.error) {
      throw new Error(
        `Failed to get retrospective answers: ${response.error.message}`,
      );
    }
    return response.data as RetrospectiveAnswers;
  });

export const saveRetrospectiveAnswersProcedure = roleRequiredProcedure(
  reviewPermissions,
  "write",
)
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
      throw new Error(
        `Failed to save retrospective answer: ${response.error.message}`,
      );
    }
    return response.data as boolean;
  });

/**
 * Router for managing sprint retrospective.
 */
export const sprintRetrospectivesRouter = createTRPCRouter({
  getRetrospectiveId: getRetrospectiveIdProcedure,
  getRetrospectiveAnswers: getRetrospectiveAnswersProcedure,
  saveRetrospectiveAnswers: saveRetrospectiveAnswersProcedure,
  getPreviousSprint: roleRequiredProcedure(reviewPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const previousSprint = await getPreviousSprint(
        ctx.firestore,
        input.projectId,
      );
      return previousSprint ?? null;
    }),
  getProcessedRetrospectiveAnswers: roleRequiredProcedure(
    reviewPermissions,
    "write",
  )
    .input(
      z.object({
        projectId: z.string(),
        data: z.object({
          textAnswers: z.array(z.string()),
        }),
      }),
    )
    .query(async ({ input }) => {
      const { data } = input;

      if (data.textAnswers.length < 3) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Not enough answers provided.",
        });
      }

      const synthesizedResponses = await askAiToGenerate(
        getSprintRetrospectiveTextAnswersContext(data.textAnswers),
        z.object({
          answers: z.array(z.string()),
          happinessRating: z.number(),
          happinessAnalysis: z.string(),
        }),
      );

      return synthesizedResponses;
    }),
  sendReport: roleRequiredProcedure(reviewPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        reviewId: z.number(),
        data: z.object({
          textAnswers: z.array(z.string()),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data } = input;
      if (data.textAnswers.length < 3) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Not enough answers provided.",
        });
      }

      const synthesizedResponses = await askAiToGenerate(
        getSprintRetrospectiveTextAnswersContext(data.textAnswers),
        z.object({
          answers: z.array(z.string()),
          happinessRating: z.number(),
          happinessAnalysis: z.string(),
        }),
      );

      await Promise.all(
        synthesizedResponses.answers.map(
          async (answer, index) =>
            await ctx.supabase.rpc("save_review_answer", {
              p_review_id: input.reviewId,
              p_user_id: ctx.session.user.uid,
              p_question_num: index + 1,
              p_response_text: answer,
            }),
        ),
      );
      return { success: true };
    }),
});
