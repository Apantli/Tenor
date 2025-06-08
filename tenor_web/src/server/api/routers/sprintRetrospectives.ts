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
import { getPreviousSprint } from "../shortcuts/sprints";
import { retrospectivePermissions } from "~/lib/defaultValues/permission";
import { askAiToGenerate } from "~/lib/aiTools/aiGeneration";
import {
  getSprintRetrospectiveTextAnswersContext,
  getSprintTeamProgress,
  getSprintPersonalProgress,
  ensureSprintTeamProgress,
  ensureSprintPersonalProgress,
} from "../shortcuts/sprintRetrospectives";
import { badRequest } from "~/server/errors";

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
  retrospectivePermissions,
  "read",
)
  .input(z.object({ projectId: z.string(), sprintId: z.string() }))
  .query(async ({ ctx, input }) => {
    const response = await ctx.supabase.rpc("get_retrospective_id", {
      project_id_input: input.projectId,
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
  retrospectivePermissions,
  "read",
)
  .input(
    z.object({
      projectId: z.string(),
      reviewId: z.number(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const response = await ctx.supabase.rpc("get_retrospective_answers", {
      p_review_id: input.reviewId,
      p_user_id: ctx.session.uid,
    });
    if (response.error) {
      throw new Error(
        `Failed to get retrospective answers: ${response.error.message}`,
      );
    }
    return response.data as RetrospectiveAnswers;
  });

export const saveRetrospectiveAnswersProcedure = roleRequiredProcedure(
  retrospectivePermissions,
  "write",
)
  .input(
    z.object({
      projectId: z.string(),
      reviewId: z.number(),
      userId: z.string(),
      questionNum: z.number(),
      answerText: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const response = await ctx.supabase.rpc("save_retrospective_answer", {
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
  saveHappiness: roleRequiredProcedure(retrospectivePermissions, "write")
    .input(
      z.object({
        reviewId: z.number(),
        happiness: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { reviewId, happiness } = input;

      if (happiness < 1 || happiness > 10) {
        throw badRequest("Happiness rating must be between 1 and 10.");
      }

      const response = await ctx.supabase.rpc("save_happiness", {
        review_id_input: reviewId,
        happiness_input: happiness,
        user_id_input: ctx.session.user.uid,
      });

      if (response.error) {
        throw new Error(
          `Failed to save happiness rating: ${response.error.message}`,
        );
      }

      return { success: true };
    }),
  getPreviousSprint: roleRequiredProcedure(retrospectivePermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const previousSprint = await getPreviousSprint(
        ctx.firestore,
        input.projectId,
      );
      return previousSprint ?? null;
    }),
  getProcessedRetrospectiveAnswers: roleRequiredProcedure(
    retrospectivePermissions,
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
    .mutation(async ({ input }) => {
      const { data } = input;

      if (data.textAnswers.length < 3) {
        throw badRequest("Not enough answers provided.");
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
  sendReport: roleRequiredProcedure(retrospectivePermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        reviewId: z.number(),
        data: z.object({
          textAnswers: z.array(z.string()),
        }),
        summarize: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data, summarize } = input;
      if (data.textAnswers.length < 3) {
        throw badRequest("Not enough answers provided.");
      }

      const synthesizedResponses = await askAiToGenerate(
        getSprintRetrospectiveTextAnswersContext(data.textAnswers),
        z.object({
          answers: z.array(z.string()),
          happinessRating: z.number(),
          happinessAnalysis: z.string(),
        }),
      );

      const textAnswers = summarize
        ? synthesizedResponses.answers
        : data.textAnswers;

      await Promise.all([
        ...textAnswers.map(
          async (answer, index) =>
            await ctx.supabase.rpc("save_retrospective_answer", {
              p_review_id: input.reviewId,
              p_user_id: ctx.session.user.uid,
              p_question_num: index + 1,
              p_response_text: answer,
            }),
        ),
        ctx.supabase.rpc("save_happiness", {
          review_id_input: input.reviewId,
          happiness_input: synthesizedResponses.happinessRating,
          user_id_input: ctx.session.user.uid,
        }),
      ]);
      return { success: true };
    }),
  getRetrospectiveTeamProgress: roleRequiredProcedure(
    retrospectivePermissions,
    "read",
  )
    .input(
      z.object({
        projectId: z.string(),
        sprintId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const progress = await getSprintTeamProgress(
        ctx.firestore,
        input.projectId,
        input.sprintId,
      );
      return progress;
    }),
  getRetrospectivePersonalProgress: roleRequiredProcedure(
    retrospectivePermissions,
    "read",
  )
    .input(
      z.object({
        projectId: z.string(),
        sprintId: z.string(),
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const personalProgress = await getSprintPersonalProgress(
        ctx.firestore,
        input.projectId,
        input.sprintId,
        input.userId,
      );
      return personalProgress;
    }),
  ensureRetrospectiveTeamProgress: roleRequiredProcedure(
    retrospectivePermissions,
    "read",
  )
    .input(
      z.object({
        projectId: z.string(),
        sprintId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ensureSprintTeamProgress(
        ctx.firestore,
        input.projectId,
        input.sprintId,
      );
      return { success: true };
    }),

  ensureRetrospectivePersonalProgress: roleRequiredProcedure(
    retrospectivePermissions,
    "read",
  )
    .input(
      z.object({
        projectId: z.string(),
        sprintId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ensureSprintPersonalProgress(
        ctx.firestore,
        input.projectId,
        input.sprintId,
        input.userId,
      );
      return { success: true };
    }),
});
