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
import { PerformanceTime } from "~/lib/types/zodFirebaseSchema";
import { getProductivityRef } from "~/utils/helpers/shortcuts/general";
import type { Productivity } from "~/lib/types/firebaseSchemas";
import { getUserStoriesAfter } from "~/utils/helpers/shortcuts/userStories";
import { getIssuesAfter } from "~/utils/helpers/shortcuts/issues";
import { Timestamp } from "firebase-admin/firestore";

const shouldRecompute = ({
  data,
  time,
  refreshHours = 0.0,
}: {
  data: Productivity | undefined;
  time: string;
  refreshHours?: number;
}) => {
  if (!data) return true;

  const cacheTarget = data.cached.find((cached) => cached.time === time);
  if (!cacheTarget) return true;

  const currentTime = new Date();
  const lastFetchDate = cacheTarget.fetchDate.toDate();
  const timeDifference = currentTime.getTime() - lastFetchDate.getTime();

  // Hours to milliseconds
  const refreshTime = refreshHours * 60 * 60 * 1000;

  return timeDifference > refreshTime;
};

export const performanceRouter = createTRPCRouter({
  getProductivity: roleRequiredProcedure(performancePermissions, "read")
    .input(z.object({ projectId: z.string(), time: PerformanceTime }))
    .query(async ({ ctx, input }) => {
      // Fetch productivity data from the database
      let productivityData = (
        await getProductivityRef(ctx.firestore, input.projectId).get()
      ).data() as Productivity | undefined;

      if (!productivityData) {
        productivityData = {
          cached: [],
        };
      }

      if (shouldRecompute({ data: productivityData, time: input.time })) {
        const afterDate = new Date();
        if (input.time === "Week") {
          afterDate.setDate(afterDate.getDate() - 7);
        } else if (input.time === "Month") {
          afterDate.setMonth(afterDate.getMonth() - 1);
        } else {
          afterDate.setDate(afterDate.getDate() - 7);
        }
        // Recompute productivity data
        const userStories = await getUserStoriesAfter(
          ctx.firestore,
          input.projectId,
          afterDate,
        );

        console.log("userStories", userStories);
        const completedUserStories = userStories.filter(
          (userStory) => userStory.complete == true,
        );
        const issues = await getIssuesAfter(
          ctx.firestore,
          input.projectId,
          afterDate,
        );
        const completedIssues = issues.filter(
          (issue) => issue.complete == true,
        );

        productivityData.cached = productivityData.cached.filter(
          (cached) => cached.time !== input.time,
        );
        productivityData.cached.push({
          userStoryCompleted: completedUserStories.length,
          userStoryTotal: userStories.length,
          fetchDate: Timestamp.now(),
          time: input.time,
          issueCompleted: completedIssues.length,
          issueTotal: issues.length,
        });
        await getProductivityRef(ctx.firestore, input.projectId).set(
          productivityData,
        );
      }

      const cacheTarget = productivityData?.cached.find(
        (cached) => cached.time === input.time,
      );
      return cacheTarget;
    }),

  getUserContributions: roleRequiredProcedure(performancePermissions, "read")
    .input(z.object({ projectId: z.string(), time: z.string() }))
    .query(async ({ ctx }) => {
      const useruid = ctx.session.user.uid;
      console.log("useruid", useruid);
      return [];
      // return projects;
    }),
});
