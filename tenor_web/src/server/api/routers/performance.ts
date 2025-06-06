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
import { performancePermissions } from "~/lib/defaultValues/permission";
import {
  PerformanceTime,
  UserHappinessSchema,
} from "~/lib/types/zodFirebaseSchema";
import { getWritableUsers } from "../shortcuts/general";
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

export const performanceRouter = createTRPCRouter({
  getProductivity: roleRequiredProcedure(performancePermissions, "read")
    .input(
      z.object({
        projectId: z.string(),
        time: PerformanceTime,
      }),
    )
    .query(async ({ ctx, input }) => {
      return await computePerformanceTime(ctx, input.projectId, input.time);
    }),

  getUserContributions: roleRequiredProcedure(performancePermissions, "read")
    .input(
      z.object({ projectId: z.string(), userId: z.string(), time: z.string() }),
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
      );
      return activities;
    }),
  getContributionOverview: roleRequiredProcedure(performancePermissions, "read")
    .input(
      z.object({ projectId: z.string(), userId: z.string(), time: z.string() }),
    )
    .query(async ({ ctx, input }) => {
      let sprintId: string | undefined = undefined;
      if (input.time == "Sprint") {
        sprintId = (await getCurrentSprint(ctx.firestore, input.projectId))?.id;
        if (!sprintId) {
          return null;
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
    }),

  getLastUserSentiment: roleRequiredProcedure(performancePermissions, "read")
    .input(z.object({ projectId: z.string(), userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.supabase.rpc("get_last_user_happiness", {
        project_id_input: input.projectId,
        user_id_input: input.userId,
      });

      const userHappiness = UserHappinessSchema.safeParse(result.data);
      return userHappiness.data?.[0] ?? null;
    }),

  getUsersSentiment: roleRequiredProcedure(performancePermissions, "read")
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
    }),
});

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
