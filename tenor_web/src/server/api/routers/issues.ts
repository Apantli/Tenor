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
import { TRPCError } from "@trpc/server";
import { IssueSchema } from "~/lib/types/zodFirebaseSchema";
import {
  createTRPCRouter,
  protectedProcedure,
  roleRequiredProcedure,
} from "../trpc";
import { issuePermissions } from "~/lib/permission";
import {
  getIssue,
  getIssueDetail,
  getIssueNewId,
  getIssueRef,
  getIssues,
  getIssuesRef,
  getIssueTable,
} from "~/utils/helpers/shortcuts/issues";
import { LogProjectActivity } from "~/server/middleware/projectEventLogge";

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
      return await getIssueTable(
        ctx.firebaseAdmin.app(),
        ctx.firestore,
        input.projectId,
      );
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

        await LogProjectActivity({
          firestore: ctx.firestore,
          projectId: input.projectId,
          userId: ctx.session.user.uid,
          itemId: issue.id,
          type: "IS",
          action: "create",
        });

        return { issueId: issue.id };
      } catch {
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
      return await getIssueDetail(
        ctx.firebaseAdmin.app(),
        ctx.firestore,
        projectId,
        issueId,
      );
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

      await LogProjectActivity({
        firestore: ctx.firestore,
        projectId: input.projectId,
        userId: ctx.session.user.uid,
        itemId: issueId,
        type: "IS",
        action: "update",
      });

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

      await LogProjectActivity({
        firestore: ctx.firestore,
        projectId: input.projectId,
        userId: ctx.session.user.uid,
        itemId: issueId,
        type: "IS",
        action: "delete",
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

      await LogProjectActivity({
        firestore: ctx.firestore,
        projectId: input.projectId,
        userId: ctx.session.user.uid,
        itemId: issueId,
        type: "IS",
        action: "update",
      });

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

      await LogProjectActivity({
        firestore: ctx.firestore,
        projectId: input.projectId,
        userId: ctx.session.user.uid,
        itemId: issueId,
        type: "IS",
        action: "update",
      });
      
      await issueRef.update(updatedIssueData);
    }),

  /**
   * @function getIssueCount
   * @description Retrieves the number of issues inside a given project, regardless of their deleted status.
   * @param {string} projectId - The ID of the project.
   * @returns {number} - The number of issues in the project.
   */
  getIssueCount: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      const issuesRef = getIssuesRef(ctx.firestore, projectId);
      const countSnapshot = await issuesRef.count().get();
      return countSnapshot.data().count;
    }),

  /**
   * @function getIssues
   * @description Retrieves all issues for a given project.
   * @param {string} projectId - The ID of the project to retrieve issues for.
   * @returns {Promise<IssueCol[]>} - A promise that resolves to an array of issues.
  */
  getAllIssues: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      return await getIssues(ctx.firestore, projectId);
    }),
});
