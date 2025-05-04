/**
 * Issues Router - Tenor API Endpoints for Issue Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing Issues in the Tenor application.
 * It provides endpoints to create, modify, and retrieve issue data within projects.
 *
 * @category API
 */

import { z } from "zod";
import type { Issue } from "~/lib/types/firebaseSchemas";
import { TRPCError } from "@trpc/server";
import {
  IssueSchema,
  SprintSchema,
  TaskSchema,
  UserStorySchema,
} from "~/lib/types/zodFirebaseSchema";
import type { IssueDetail, UserPreview } from "~/lib/types/detailSchemas";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  getBacklogTag,
  getIssues,
  getIssueTable,
  getPriority,
  getProjectSettingsRef,
  getStatusTag,
  getUserStory,
} from "~/utils/helpers/shortcuts";
import { IssueCol } from "~/lib/types/columnTypes";

export const issuesRouter = createTRPCRouter({
  getIssueTable: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await getIssueTable(ctx.firestore, input.projectId);
    }),

  getIssue: protectedProcedure
    .input(z.object({ projectId: z.string(), issueId: z.string() }))
    .query(async ({ ctx, input }) => {
      const issue = (
        await ctx.firestore
          .collection("projects")
          .doc(input.projectId)
          .collection("issues")
          .doc(input.issueId)
          .get()
      ).data();

      if (!issue) {
        throw new Error("Issue not found");
      }

      return {
        id: input.issueId,
        ...issue,
      };
    }),
  createIssue: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        issueData: IssueSchema.omit({ scrumId: true }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const issueCount = await ctx.firestore
          .collection("projects")
          .doc(input.projectId)
          .collection("issues")
          .count()
          .get();
        const issue = await ctx.firestore
          .collection("projects")
          .doc(input.projectId)
          .collection("issues")
          .add({
            ...input.issueData,
            scrumId: issueCount.data().count + 1,
          });
        return { success: true, issueId: issue.id };
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  getIssueDetail: protectedProcedure
    .input(z.object({ issueId: z.string(), projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get the necessary information to construct the IssueDetail

      const { projectId, issueId } = input;
      const issueRef = ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("issues")
        .doc(issueId);
      const issue = await issueRef.get();
      if (!issue.exists) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const issueData = IssueSchema.parse(issue.data());

      // Fetch all the task information for the issue in parallel
      const tasks = await Promise.all(
        issueData.taskIds.map(async (taskId) => {
          const taskRef = ctx.firestore
            .collection("projects")
            .doc(projectId)
            .collection("tasks")
            .doc(taskId);
          const task = await taskRef.get();
          if (!task.exists) {
            throw new TRPCError({ code: "NOT_FOUND" });
          }
          const taskData = TaskSchema.parse(task.data());

          // FIXME: Get tag information from database
          const statusTag = await getStatusTag(
            ctx.firestore,
            projectId,
            taskData.statusId,
          );

          return { ...taskData, id: taskId, status: statusTag };
        }),
      );

      const settingsRef = getProjectSettingsRef(ctx.firestore, input.projectId);

      let priorityTag = undefined;
      if (issueData.priorityId !== undefined) {
        priorityTag = await getPriority(
          ctx.firestore,
          input.projectId,
          issueData.priorityId,
        );
      }

      let statusTag = undefined;
      if (issueData.statusId !== undefined) {
        statusTag = await getStatusTag(
          ctx.firestore,
          input.projectId,
          issueData.statusId,
        );
      }

      const tags = await Promise.all(
        issueData.tagIds.map(async (tagId) => {
          return await getBacklogTag(ctx.firestore, input.projectId, tagId);
        }),
      );

      let relatedUserStory = undefined;
      if (issueData.relatedUserStoryId !== "") {
        const relatedUserStoryDoc = await ctx.firestore
          .collection("projects")
          .doc(projectId)
          .collection("userStories")
          .doc(issueData.relatedUserStoryId)
          .get();
        if (relatedUserStoryDoc.exists) {
          const relatedUserStoryData = UserStorySchema.parse(
            relatedUserStoryDoc.data(),
          );
          relatedUserStory = {
            id: issueData.relatedUserStoryId,
            name: relatedUserStoryData.name,
            scrumId: relatedUserStoryData.scrumId,
          };
        }
      }

      let sprint = undefined;
      if (issueData.sprintId !== "") {
        const sprintDoc = await ctx.firestore
          .collection("projects")
          .doc(projectId)
          .collection("sprints")
          .doc(issueData.sprintId)
          .get();
        if (sprintDoc.exists) {
          const sprintData = SprintSchema.parse(sprintDoc.data());
          sprint = {
            id: sprintDoc.id,
            number: sprintData.number,
          };
        }
      }

      const filteredTasks = tasks.filter((task) => task.deleted === false);
      return {
        id: issueId,
        scrumId: issueData.scrumId,
        name: issueData.name,
        description: issueData.description,
        stepsToRecreate: issueData.stepsToRecreate,
        completed: issueData.complete,
        size: issueData.size,
        tags: tags,
        priority: priorityTag,
        status: statusTag,
        tasks: filteredTasks,
        sprint: sprint,
        relatedUserStory: relatedUserStory,
      } as IssueDetail;
    }),

  modifyIssue: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        issueId: z.string(),
        issueData: IssueSchema.omit({ scrumId: true, deleted: true }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, issueId, issueData } = input;
      const issueRef = ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("issues")
        .doc(issueId);
      await issueRef.update(issueData);
      return { success: true };
    }),

  deleteIssue: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        issueId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, issueId } = input;
      const issueRef = ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("issues")
        .doc(issueId);
      await issueRef.update({ deleted: true });

      const tasks = await ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("tasks")
        .where("itemType", "==", "IS")
        .where("itemId", "==", issueId)
        .get();
      const batch = ctx.firestore.batch();
      tasks.docs.forEach((task) => {
        batch.update(task.ref, { deleted: true });
      });
      await batch.commit();

      return { success: true };
    }),

  modifyIssuesTags: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        issueId: z.string(),
        size: z.string().optional(),
        priorityId: z.string().optional(),
        statusId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, issueId, size, priorityId, statusId } = input;
      if (
        priorityId === undefined &&
        size === undefined &&
        statusId === undefined
      ) {
        return;
      }
      const issueRef = ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("issues")
        .doc(issueId);
      const issueDoc = await issueRef.get();
      if (!issueDoc.exists) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Issue not found" });
      }
      const issueData = issueDoc.data() as Issue;
      const updatedIssueData = {
        ...issueData,
        priorityId: priorityId ?? issueData.priorityId,
        size: size ?? issueData.size,
        statusId: statusId ?? issueData.statusId,
      };

      await issueRef.update(updatedIssueData);
      return {
        success: true,
        issueId: issueId,
        updatedIssueData: updatedIssueData,
      };
    }),

  modifyIssuesRelatedUserStory: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        issueId: z.string(),
        relatedUserStoryId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, issueId, relatedUserStoryId } = input;
      if (relatedUserStoryId === undefined) {
        return;
      }
      const issueRef = ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("issues")
        .doc(issueId);
      const issueDoc = await issueRef.get();
      if (!issueDoc.exists) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Issue not found" });
      }
      const issueData = issueDoc.data() as Issue;
      const updatedIssueData = {
        ...issueData,
        relatedUserStoryId: relatedUserStoryId ?? issueData.relatedUserStoryId,
      };
      await issueRef.update(updatedIssueData);
      return {
        success: true,
        issueId: issueId,
        updatedIssueData: updatedIssueData,
      };
    }),

  getIssueCount: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const issueCount = await ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("issues")
        .where("deleted", "==", false)
        .count()
        .get();
      return issueCount.data().count;
    }),
});
