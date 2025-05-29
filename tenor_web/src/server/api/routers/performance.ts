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
import {
  createTRPCRouter,
  protectedProcedure,
  roleRequiredProcedure,
} from "~/server/api/trpc";
import { performancePermissions } from "~/lib/defaultValues/permission";
import { PerformanceTime } from "~/lib/types/zodFirebaseSchema";
import { getProductivityRef } from "../shortcuts/general";

import { shouldRecomputeProductivity } from "~/lib/helpers/cache";
import type {
  Issue,
  Productivity,
  UserStory,
  WithId,
} from "~/lib/types/firebaseSchemas";
import {
  getSprintUserStories,
  getUserStoriesAfter,
} from "../shortcuts/userStories";
import {
  getIssuesAfter,
  getSprintIssues,
} from "../shortcuts/issues";
import { Timestamp } from "firebase-admin/firestore";

import { getStatusTypes } from "../shortcuts/tags";
import { getCurrentSprint } from "../shortcuts/sprints";
import { TRPCError } from "@trpc/server";

export const performanceRouter = createTRPCRouter({
  getProductivity: roleRequiredProcedure(performancePermissions, "read")
    .input(
      z.object({
        projectId: z.string(),
        time: PerformanceTime,
      }),
    )
    .query(async ({ ctx, input }) => {
      return await recomputePerformance(
        ctx,
        input.projectId,
        input.time,
        false,
      );
    }),

  recomputeProductivity: roleRequiredProcedure(performancePermissions, "read")
    .input(
      z.object({
        projectId: z.string(),
        time: PerformanceTime,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await recomputePerformance(ctx, input.projectId, input.time, true);
    }),

  getUserContributions: roleRequiredProcedure(performancePermissions, "read")
    .input(z.object({ projectId: z.string(), time: z.string() }))
    .query(async ({ ctx }) => {
      const useruid = ctx.session.user.uid;
      console.log("useruid", useruid);
      // TODO: compute and return user contributions
      return [];
      // return projects;
    }),
  getProjectStatus: protectedProcedure.query(async ({ ctx }) => {
    const useruid = ctx.session.user.uid;
    console.log("useruid", useruid);
    // TODO: compute and return user contributions
    return [];
    // return projects;
  }),
});

const recomputePerformance = async (
  ctx: { firestore: FirebaseFirestore.Firestore },
  projectId: string,
  time: string,
  recompute = false,
) => {
  // Fetch productivity data from the database
  let productivityData = (
    await getProductivityRef(ctx.firestore, projectId).get()
  ).data() as Productivity | undefined;

  if (!productivityData) {
    productivityData = {
      cached: [],
    };
  }

  if (
    recompute ||
    shouldRecomputeProductivity({ data: productivityData, time: time })
  ) {
    const newProductivityData = await computePerformanceTime(
      ctx,
      projectId,
      time,
    );

    productivityData.cached = productivityData.cached.filter(
      (cached) => cached.time !== time,
    );
    productivityData.cached.push(newProductivityData);
    await getProductivityRef(ctx.firestore, projectId).set(productivityData);
  }

  const cacheTarget = productivityData?.cached.find(
    (cached) => cached.time === time,
  );

  return cacheTarget;
};

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
  let afterDate = null;
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
      throw new TRPCError({ code: "NOT_FOUND", message: "No active sprint" });
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
    fetchDate: Timestamp.now(),
    time: PerformanceTime.parse(time),
    issueCompleted: completedIssues.length,
    issueTotal: issues.length,
  };
};
