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
import type { Issue, WithId } from "~/lib/types/firebaseSchemas";
import { TRPCError } from "@trpc/server";
import {
  IssueSchema,
  SprintSchema,
  TaskSchema,
  UserStorySchema,
} from "~/lib/types/zodFirebaseSchema";
import type { IssueDetail } from "~/lib/types/detailSchemas";
import {
  createTRPCRouter,
  protectedProcedure,
  roleRequiredProcedure,
} from "../trpc";
import {
  getBacklogTag,
  getIssue,
  getIssueDetail,
  getIssueNewId,
  getIssueRef,
  getIssues,
  getIssuesRef,
  getIssueTable,
  getPriority,
  getSettingsRef,
  getStatusType,
  getUserStory,
} from "~/utils/helpers/shortcuts";
import { issuePermissions } from "~/lib/permission";
import { get } from "node_modules/cypress/types/lodash";

export const issuesRouter = createTRPCRouter({
  /**
   * @function getIssueTable
   * @description Retrieves all issues for a given project.
   * @param {string} projectId - The ID of the project to retrieve issues for.
   * @returns {Promise<IssueCol[]>} - A promise that resolves to an array of issues.
   */
  getIssueTable: roleRequiredProcedure(issuePermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await getIssueTable(ctx.firestore, input.projectId);
    }),
  /**
   * @function getIssue
   * @description Retrieves a specific issue by its ID within a project.
   * @param {string} projectId - The ID of the project.
   * @param {string} issueId - The ID of the issue to retrieve.
   * @returns {Promise<WithId<Issue>>} - A promise that resolves to the issue data or null if not found.
   */
  getIssue: roleRequiredProcedure(issuePermissions, "read")
    .input(z.object({ projectId: z.string(), issueId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId, issueId } = input;
      return await getIssue(ctx.firestore, projectId, issueId);
    }),
  /**
   * @function createIssue
   * @description Creates a new issue within a project.
   * @param {string} projectId - The ID of the project to create the issue in.
   * @param {Issue} issueData - The data for the issue to create.
   */
  createIssue: roleRequiredProcedure(issuePermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        issueData: IssueSchema.omit({ scrumId: true }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, issueData } = input;
      try {
        const scrumId = await getIssueNewId(ctx.firestore, projectId);
        const newIssue = IssueSchema.parse({
          ...issueData,
          scrumId: scrumId,
        });
        const issue = await getIssuesRef(ctx.firestore, projectId).add(
          newIssue,
        );
        return { issueId: issue.id };
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * @function getIssueDetail
   * @description Retrieves detailed information about a specific issue within a project.
   * @param {string} projectId - The ID of the project.
   * @param {string} issueId - The ID of the issue to retrieve details for.
   * @returns {Promise<IssueDetail>} - A promise that resolves to the detailed issue data.
   */
  getIssueDetail: protectedProcedure
    .input(z.object({ issueId: z.string(), projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId, issueId } = input;
      return await getIssueDetail(ctx.firestore, projectId, issueId);

      const issueRef = getIssuesRef(ctx.firestore, projectId).doc(issueId);
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
          const statusTag = await getStatusType(
            ctx.firestore,
            projectId,
            taskData.statusId,
          );

          return { ...taskData, id: taskId, status: statusTag };
        }),
      );

      const settingsRef = getSettingsRef(ctx.firestore, input.projectId);

      let priorityTag = undefined;
      // if (issueData.priorityId !== undefined) {
      //   priorityTag = await getPriority(
      //     ctx.firestore,
      //     input.projectId,
      //     issueData.priorityId,
      //   );
      // }

      let statusTag = undefined;
      // if (issueData.statusId !== undefined) {
      //   statusTag = await getStatusTag(
      //     ctx.firestore,
      //     input.projectId,
      //     issueData.statusId,
      //   );
      // }

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

  /**
   * @function modifyIssue
   * @description Modifies an existing issue within a project.
   * @param {string} projectId - The ID of the project.
   * @param {string} issueId - The ID of the issue to modify.
   * @param {Issue} issueData - The data for the issue to modify.
   */
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
      const issueRef = getIssueRef(ctx.firestore, projectId, issueId);
      await issueRef.update(issueData);
    }),

  /**
   * @function deleteIssue
   * @description Deletes an issue within a project.
   * @param {string} projectId - The ID of the project.
   * @param {string} issueId - The ID of the issue to delete.
   */
  deleteIssue: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        issueId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, issueId } = input;
      const issueRef = getIssueRef(ctx.firestore, projectId, issueId);
      await issueRef.update({ deleted: true });

      const tasks = await getIssuesRef(ctx.firestore, projectId)
        .where("itemType", "==", "IS")
        .where("itemId", "==", issueId)
        .get();

      // NOTE: This is a batch operation, so it will not be atomic. If one of the updates fails, the others will still be applied.
      const batch = ctx.firestore.batch();
      tasks.docs.forEach((task) => {
        batch.update(task.ref, { deleted: true });
      });
      await batch.commit();
    }),

  /**
   * @function modifyIssuesTags
   * @description Modifies the tags of an issue within a project.
   * @param {string} projectId - The ID of the project.
   * @param {string} issueId - The ID of the issue to modify.
   * @param {string} [size] - The size of the issue (optional).
   * @param {string} [priorityId] - The ID of the priority (optional).
   * @param {string} [statusId] - The ID of the status (optional).
   */
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
      const issueRef = getIssueRef(ctx.firestore, projectId, issueId);
      const issueSnapshot = await issueRef.get();
      if (!issueSnapshot.exists) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Issue not found" });
      }
      await issueRef.update({
        priorityId: priorityId,
        size: size,
        statusId: statusId,
      });
    }),

  /**
   * @function modifyIssuesRelatedUserStory
   * @description Modifies the related user story of an issue within a project.
   * @param {string} projectId - The ID of the project.
   * @param {string} issueId - The ID of the issue to modify.
   * @param {string} [relatedUserStoryId] - The ID of the related user story (optional).
   */
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

      const issueRef = getIssueRef(ctx.firestore, projectId, issueId);
      const issueSnapshot = await issueRef.get();
      if (!issueSnapshot.exists) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Issue not found" });
      }
      const updatedIssueData = {
        relatedUserStoryId: relatedUserStoryId,
      };
      await issueRef.update(updatedIssueData);
    }),
});
