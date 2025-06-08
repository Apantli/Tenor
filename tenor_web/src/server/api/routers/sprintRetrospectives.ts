/**
 * Sprint Retrospective Router - API Endpoints for managing Retrospective records.
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for retrieving or creating Retrospective entries
 * associated with sprints. It ensures that a retrospective exists per sprint and returns its ID.
 *
 * The router includes procedures for:
 * - Managing sprint retrospective entries and their answers
 * - Tracking team and individual progress
 * - Processing happiness ratings and textual feedback
 * - Generating AI-assisted retrospective summaries
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

/**
 * Retrieves all retrospective answers for a specific user and review.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - reviewId - Numeric ID of the retrospective review
 * - userId - String ID of the user
 *
 * @returns Record of retrospective answers keyed by question identifier
 * @throws {Error} - If there's a problem retrieving answers from the database
 *
 * @http GET /api/trpc/sprintRetrospectives.getRetrospectiveAnswers
 */
export const getRetrospectiveAnswersProcedure = roleRequiredProcedure(
  retrospectivePermissions,
  "read",
)
  .input(
    z.object({
      projectId: z.string(),
      reviewId: z.number(),
      userId: z.string(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const response = await ctx.supabase.rpc("get_retrospective_answers", {
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

/**
 * Saves a single retrospective answer for a specific question.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - reviewId - Numeric ID of the retrospective review
 * - userId - String ID of the user
 * - questionNum - Number identifying the question
 * - answerText - Text response to the question
 *
 * @returns Boolean indicating success of the operation
 * @throws {Error} - If there's a problem saving the answer to the database
 *
 * @http POST /api/trpc/sprintRetrospectives.saveRetrospectiveAnswers
 */
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
 * Saves a happiness rating for a retrospective.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - reviewId - Numeric ID of the retrospective review
 * - happiness - Numeric rating between 1 and 10
 *
 * @returns Object indicating success status
 * @throws {TRPCError} - If the happiness rating is not between 1 and 10
 *
 * @http POST /api/trpc/sprintRetrospectives.saveHappiness
 */
export const saveHappinessProcedure = roleRequiredProcedure(
  retrospectivePermissions,
  "write",
)
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
  });

/**
 * Retrieves the previous sprint for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns Previous sprint object or null if none exists
 *
 * @http GET /api/trpc/sprintRetrospectives.getPreviousSprint
 */
export const getPreviousSprintProcedure = roleRequiredProcedure(
  retrospectivePermissions,
  "read",
)
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const previousSprint = await getPreviousSprint(
      ctx.firestore,
      input.projectId,
    );
    return previousSprint ?? null;
  });

/**
 * Processes retrospective answers and generates AI-assisted analysis.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - data - Object containing text answers
 *
 * @returns Object containing processed answers, happiness rating and analysis
 * @throws {TRPCError} - If not enough answers are provided
 *
 * @http POST /api/trpc/sprintRetrospectives.getProcessedRetrospectiveAnswers
 */
export const getProcessedRetrospectiveAnswersProcedure = roleRequiredProcedure(
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
  });

/**
 * Sends a retrospective report, optionally summarizing text answers with AI assistance.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - reviewId - Numeric ID of the retrospective review
 * - data - Object containing text answers array
 * - summarize - Boolean flag to determine if answers should be summarized by AI
 *
 * @returns Object indicating success status
 * @throws {TRPCError} - If not enough answers are provided
 *
 * @http POST /api/trpc/sprintRetrospectives.sendReport
 */
export const sendReportProcedure = roleRequiredProcedure(
  retrospectivePermissions,
  "write",
)
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
  });
/**
 * Retrieves team progress metrics for a sprint retrospective.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - sprintId - String ID of the sprint
 *
 * @returns Team progress metrics for the specified sprint
 *
 * @http GET /api/trpc/sprintRetrospectives.getRetrospectiveTeamProgress
 */
export const getRetrospectiveTeamProgressProcedure = roleRequiredProcedure(
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
  });

/**
 * Retrieves personal progress metrics for an individual in a sprint.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - sprintId - String ID of the sprint
 * - userId - String ID of the user
 *
 * @returns Personal progress metrics for the specified user and sprint
 *
 * @http GET /api/trpc/sprintRetrospectives.getRetrospectivePersonalProgress
 */
export const getRetrospectivePersonalProgressProcedure = roleRequiredProcedure(
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
  });

/**
 * Ensures team progress metrics exist for a sprint, creating them if needed.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - sprintId - String ID of the sprint
 *
 * @returns Object indicating success status
 *
 * @http POST /api/trpc/sprintRetrospectives.ensureRetrospectiveTeamProgress
 */
export const ensureRetrospectiveTeamProgressProcedure = roleRequiredProcedure(
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
  });

/**
 * Ensures personal progress metrics exist for an individual in a sprint, creating them if needed.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - sprintId - String ID of the sprint
 * - userId - String ID of the user
 *
 * @returns Object indicating success status
 *
 * @http POST /api/trpc/sprintRetrospectives.ensureRetrospectivePersonalProgress
 */
export const ensureRetrospectivePersonalProgressProcedure =
  roleRequiredProcedure(retrospectivePermissions, "read")
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
    });

/**
 * TRPC Router for managing sprint retrospectives.
 *
 * This router provides endpoints for creating, retrieving, and updating retrospective data,
 * including answers to retrospective questions, happiness ratings, and progress metrics.
 * It supports both individual and team retrospective activities, and includes AI-assisted
 * summarization capabilities for retrospective reports.
 *
 * @category API
 * @subcategory Routers
 */
export const sprintRetrospectivesRouter = createTRPCRouter({
  getRetrospectiveId: getRetrospectiveIdProcedure,
  getRetrospectiveAnswers: getRetrospectiveAnswersProcedure,
  saveRetrospectiveAnswers: saveRetrospectiveAnswersProcedure,
  saveHappiness: saveHappinessProcedure,
  getPreviousSprint: getPreviousSprintProcedure,
  getProcessedRetrospectiveAnswers: getProcessedRetrospectiveAnswersProcedure,
  sendReport: sendReportProcedure,
  getRetrospectiveTeamProgress: getRetrospectiveTeamProgressProcedure,
  getRetrospectivePersonalProgress: getRetrospectivePersonalProgressProcedure,
  ensureRetrospectiveTeamProgress: ensureRetrospectiveTeamProgressProcedure,
  ensureRetrospectivePersonalProgress:
    ensureRetrospectivePersonalProgressProcedure,
});
