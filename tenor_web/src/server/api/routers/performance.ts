/**
 * Performance - Tenor API Endpoints for Performance metrics
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing Performance in the Tenor application.
 * It provides endpoints to compute performance metrics.
 *
 * The router includes procedures for:
 * - Computing productivity metrics for projects over different time periods
 * - Tracking user contributions and activity
 * - Measuring team performance and happiness trends
 *
 * @category API
 */

import { z } from "zod";
import { createTRPCRouter, roleRequiredProcedure } from "~/server/api/trpc";
import { performancePermissions } from "~/lib/defaultValues/permission";
import {
  PerformanceTime,
  UserHappinessSchema,
} from "~/lib/types/zodFirebaseSchema";
import type {
  Issue,
  Sprint,
  UserStory,
  WithId,
} from "~/lib/types/firebaseSchemas";
import {
  getSprintUserStories,
  getUserStoriesAfter,
} from "../shortcuts/userStories";
import { getIssuesAfter, getSprintIssues } from "../shortcuts/issues";
import { getStatusTypes } from "../shortcuts/tags";
import { getCurrentSprint } from "../shortcuts/sprints";
import {
  getActivityPartition,
  getContributionOverview,
} from "../shortcuts/performance";
import { getWritableUsers } from "../shortcuts/users";
import { defaultPerformanceData } from "~/lib/defaultValues/performance";

/**
 * Retrieves productivity metrics for a project over a specified time period.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - time - Time period for performance calculation
 *
 * @returns Performance metrics for the specified time period
 *
 * @http GET /api/trpc/performance.getProductivity
 */
export const getProductivityProcedure = roleRequiredProcedure(
  performancePermissions,
  "read",
)
  .input(
    z.object({
      projectId: z.string(),
      time: PerformanceTime,
    }),
  )
  .query(async ({ ctx, input }) => {
    return await computePerformanceTime(ctx, input.projectId, input.time);
  });

/**
 * Retrieves contribution metrics for a specific user in a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - userId - String ID of the user
 * - time - Time period for contribution calculation
 * - timezone - Optional timezone for date calculations
 *
 * @returns User contribution metrics for the specified time period
 *
 * @http GET /api/trpc/performance.getUserContributions
 */
export const getUserContributionsProcedure = roleRequiredProcedure(
  performancePermissions,
  "read",
)
  .input(
    z.object({
      projectId: z.string(),
      userId: z.string(),
      time: z.string(),
      timezone: z.string().optional(),
    }),
  )
  .query(async ({ ctx, input }) => {
    let sprint: WithId<Sprint> | null = null;
    if (input.time === "Sprint") {
      sprint = await getCurrentSprint(ctx.firestore, input.projectId);
      if (!sprint) {
        return null;
      }
    }

    const activities = await getActivityPartition(
      ctx.firestore,
      input.projectId,
      input.userId,
      input.time,
      sprint?.id,
      input.timezone,
    );

    if (!activities) {
      return null;
    }

    return activities;
  });

/**
 * Retrieves an overview of a user's contributions to a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - userId - String ID of the user
 * - time - Time period for contribution overview calculation
 *
 * @returns Contribution overview metrics for the specified user and time period
 *
 * @http GET /api/trpc/performance.getContributionOverview
 */
export const getContributionOverviewProcedure = roleRequiredProcedure(
  performancePermissions,
  "read",
)
  .input(
    z.object({ projectId: z.string(), userId: z.string(), time: z.string() }),
  )
  .query(async ({ ctx, input }) => {
    let sprintId: string | undefined = undefined;
    if (input.time == "Sprint") {
      sprintId = (await getCurrentSprint(ctx.firestore, input.projectId))?.id;
      if (!sprintId) {
        return defaultPerformanceData;
      }
    }
    const contributionOverview = await getContributionOverview(
      ctx.firestore,
      input.projectId,
      input.userId,
      input.time,
      sprintId,
    );
    return contributionOverview;
  });

/**
 * Retrieves the most recent sentiment/happiness data for a specific user in a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - userId - String ID of the user
 *
 * @returns The most recent happiness record for the specified user, or null if none exists
 *
 * @http GET /api/trpc/performance.getLastUserSentiment
 */
export const getLastUserSentimentProcedure = roleRequiredProcedure(
  performancePermissions,
  "read",
)
  .input(z.object({ projectId: z.string(), userId: z.string() }))
  .query(async ({ ctx, input }) => {
    const result = await ctx.supabase.rpc("get_last_user_happiness", {
      project_id_input: input.projectId,
      user_id_input: input.userId,
    });

    const userHappiness = UserHappinessSchema.safeParse(result.data);
    return userHappiness.data?.[0] ?? null;
  });

/**
 * Retrieves the most recent sentiment/happiness data for all team members in a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns An array of user IDs and their corresponding happiness metrics
 *
 * @http GET /api/trpc/performance.getUsersSentiment
 */
export const getUsersSentimentProcedure = roleRequiredProcedure(
  performancePermissions,
  "read",
)
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const teamMembers = await getWritableUsers(
      ctx.firestore,
      ctx.firebaseAdmin.app(),
      input.projectId,
    );

    const usersSentiment = await Promise.all(
      teamMembers.map(async (user) => {
        const result = await ctx.supabase.rpc("get_last_user_happiness", {
          project_id_input: input.projectId,
          user_id_input: user.id,
        });

        const userHappiness = UserHappinessSchema.safeParse(result.data);
        return {
          userId: user.id,
          happiness: userHappiness.data?.[0]?.happiness ?? null,
        };
      }),
    );

    return usersSentiment;
  });

export const performanceRouter = createTRPCRouter({
  getProductivity: getProductivityProcedure,
  getUserContributions: getUserContributionsProcedure,
  getContributionOverview: getContributionOverviewProcedure,
  getLastUserSentiment: getLastUserSentimentProcedure,
  getUsersSentiment: getUsersSentimentProcedure,
});

/**
 * Computes performance metrics for a project over a specified time period.
 *
 * This function calculates the number of completed user stories and issues
 * versus the total number for the given time period. For "Week" and "Month"
 * periods, it looks at items after a specific date. For other periods (like "Sprint"),
 * it uses the current sprint's data.
 *
 * @param ctx - Context object containing Firestore instance
 * @param projectId - ID of the project to analyze
 * @param time - Time period for calculations ("Week", "Month", or "Sprint")
 *
 * @returns Performance metrics including completed and total counts for user stories and issues,
 * or null if no current sprint is found (when necessary)
 */
const computePerformanceTime = async (
  ctx: { firestore: FirebaseFirestore.Firestore },
  projectId: string,
  time: string,
) => {
  // Get which status types are completed
  const statusTypes = await getStatusTypes(ctx.firestore, projectId);

  const completedStatusTypes = statusTypes
    .filter((statusType) => statusType.marksTaskAsDone == true)
    .map((statusType) => statusType.id);

  // Compute the time if needed
  let afterDate: Date | null = null;
  let userStories: WithId<UserStory>[] = [];
  let issues: WithId<Issue>[] = [];

  if (time === "Week") {
    afterDate = new Date();
    afterDate.setDate(afterDate.getDate() - 7);
  } else if (time === "Month") {
    afterDate = new Date();
    afterDate.setMonth(afterDate.getMonth() - 1);
  }

  if (afterDate) {
    userStories = await getUserStoriesAfter(
      ctx.firestore,
      projectId,
      afterDate,
    );
    issues = await getIssuesAfter(ctx.firestore, projectId, afterDate);
  } else {
    const currentSprint = await getCurrentSprint(ctx.firestore, projectId);
    if (!currentSprint) {
      return null;
    }
    userStories = await getSprintUserStories(
      ctx.firestore,
      projectId,
      currentSprint.id,
    );
    issues = await getSprintIssues(ctx.firestore, projectId, currentSprint.id);
  }

  // Fetch completed items
  const completedUserStories = userStories.filter((userStory) =>
    completedStatusTypes.includes(userStory.statusId),
  );

  const completedIssues = issues.filter((issue) =>
    completedStatusTypes.includes(issue.statusId),
  );

  return {
    userStoryCompleted: completedUserStories.length,
    userStoryTotal: userStories.length,
    issueCompleted: completedIssues.length,
    issueTotal: issues.length,
    time: PerformanceTime.parse(time),
  };
};
