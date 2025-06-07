/**
 * Issues Router - Tenor API Endpoints for Issue Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing Issues in the Tenor application.
 * It provides endpoints to create, modify, and retrieve issue data within projects.
 *
 * The router includes procedures for:
 * - Creating and tracking issues within projects
 * - Retrieving issue data in various formats
 * - Modifying and deleting issues
 *
 * @category API
 */

import { z } from "zod";
import { IssueSchema } from "~/lib/types/zodFirebaseSchema";
import {
  createTRPCRouter,
  protectedProcedure,
  roleRequiredProcedure,
} from "../trpc";
import {
  deleteIssueAndGetModified,
  getIssue,
  getIssueDetail,
  getIssueRef,
  getIssues,
  getIssuesRef,
  getIssueTable,
} from "../shortcuts/issues";
import { LogProjectActivity } from "~/server/api/lib/projectEventLogger";
import { issuePermissions } from "~/lib/defaultValues/permission";
import { badRequest, internalServerError, notFound } from "~/server/errors";
import { getUserRole } from "../shortcuts/general";

/**
 * @function getIssueTableProcedure
 * @description Retrieves all issues for a given project.
 * @param {string} projectId - The ID of the project to retrieve issues for.
 * @returns {Promise<IssueCol[]>} - A promise that resolves to an array of issues.
 */
export const getIssueTableProcedure = roleRequiredProcedure(
  issuePermissions,
  "read",
)
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    return await getIssueTable(
      ctx.firebaseAdmin.app(),
      ctx.firestore,
      input.projectId,
    );
  });

/**
 * @function getIssueProcedure
 * @description Retrieves a specific issue by its ID within a project.
 * @param {string} projectId - The ID of the project.
 * @param {string} issueId - The ID of the issue to retrieve.
 * @returns {Promise<WithId<Issue>>} - A promise that resolves to the issue data or null if not found.
 */
export const getIssueProcedure = roleRequiredProcedure(issuePermissions, "read")
  .input(z.object({ projectId: z.string(), issueId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId, issueId } = input;
    return await getIssue(ctx.firestore, projectId, issueId);
  });

/**
 * @function createIssueProcedure
 * @description Creates a new issue within a project.
 * @param {string} projectId - The ID of the project to create the issue in.
 * @param {Issue} issueData - The data for the issue to create.
 */
export const createIssueProcedure = roleRequiredProcedure(
  issuePermissions,
  "write",
)
  .input(
    z.object({
      projectId: z.string(),
      issueData: IssueSchema.omit({ scrumId: true }),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, issueData: issueDataRaw } = input;
    try {
      const { id: newIssueId } = await ctx.firestore.runTransaction(
        async (transaction) => {
          const issuesRef = getIssuesRef(ctx.firestore, projectId);

          const issueCount = await transaction.get(issuesRef.count());

          const issueData = IssueSchema.parse({
            ...issueDataRaw,
            scrumId: issueCount.data().count + 1,
          });
          const docRef = issuesRef.doc();

          transaction.create(docRef, issueData);

          return {
            id: docRef.id,
          };
        },
      );

      await LogProjectActivity({
        firestore: ctx.firestore,
        projectId: input.projectId,
        userId: ctx.session.user.uid,
        itemId: newIssueId,
        type: "IS",
        action: "create",
      });

      return { issueId: newIssueId };
    } catch {
      throw internalServerError();
    }
  });

/**
 * @function getIssueDetailProcedure
 * @description Retrieves detailed information about a specific issue within a project.
 * @param {string} projectId - The ID of the project.
 * @param {string} issueId - The ID of the issue to retrieve details for.
 * @returns {Promise<IssueDetail>} - A promise that resolves to the detailed issue data.
 */
export const getIssueDetailProcedure = protectedProcedure
  .input(z.object({ issueId: z.string(), projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId, issueId } = input;
    return await getIssueDetail(
      ctx.firebaseAdmin.app(),
      ctx.firestore,
      projectId,
      issueId,
    );
  });

/**
 * @function modifyIssueProcedure
 * @description Modifies an existing issue within a project.
 * @param {string} projectId - The ID of the project.
 * @param {string} issueId - The ID of the issue to modify.
 * @param {Issue} issueData - The data for the issue to modify.
 */
export const modifyIssueProcedure = protectedProcedure
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

    const role = await getUserRole(
      ctx.firestore,
      projectId,
      ctx.session.user.uid,
    );
    const prevIssueData = await getIssue(ctx.firestore, projectId, issueId);

    if (
      role.id !== "owner" &&
      ctx.session.user.uid !== prevIssueData.reviewerId &&
      prevIssueData.reviewerId !== issueData.reviewerId
    ) {
      throw badRequest("You're not allowed to change the reviewer");
    }
    if (
      ctx.session.user.uid !== prevIssueData.reviewerId &&
      prevIssueData.statusId !== issueData.statusId
    ) {
      throw badRequest("You're not allowed to change the status");
    }

    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: issueId,
      type: "IS",
      action: "update",
    });

    await issueRef.update(issueData);
  });

/**
 * @function deleteIssueProcedure
 * @description Deletes an issue within a project.
 * @param {string} projectId - The ID of the project.
 * @param {string} issueId - The ID of the issue to delete.
 */
export const deleteIssueProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      issueId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, issueId } = input;
    const { modifiedTasks } = await deleteIssueAndGetModified(
      ctx.firestore,
      projectId,
      issueId,
    );

    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: issueId,
      type: "IS",
      action: "delete",
    });

    return { success: true, modifiedTaskIds: modifiedTasks };
  });

/**
 * @function modifyIssuesTagsProcedure
 * @description Modifies the tags of an issue within a project.
 * @param {string} projectId - The ID of the project.
 * @param {string} issueId - The ID of the issue to modify.
 * @param {string} [size] - The size of the issue (optional).
 * @param {string} [priorityId] - The ID of the priority (optional).
 * @param {string} [statusId] - The ID of the status (optional).
 */
export const modifyIssuesTagsProcedure = protectedProcedure
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
    const prevIssueData = await getIssue(ctx.firestore, projectId, issueId);

    if (
      ctx.session.user.uid !== prevIssueData.reviewerId &&
      prevIssueData.statusId !== statusId
    ) {
      throw badRequest("You're not allowed to change the status");
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
  });

/**
 * @function modifyIssuesRelatedUserStoryProcedure
 * @description Modifies the related user story of an issue within a project.
 * @param {string} projectId - The ID of the project.
 * @param {string} issueId - The ID of the issue to modify.
 * @param {string} [relatedUserStoryId] - The ID of the related user story (optional).
 */
export const modifyIssuesRelatedUserStoryProcedure = protectedProcedure
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
      throw notFound("Issue");
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
  });

/**
 * @function getIssueCountProcedure
 * @description Retrieves the number of issues inside a given project, regardless of their deleted status.
 * @param {string} projectId - The ID of the project.
 * @returns {number} - The number of issues in the project.
 */
export const getIssueCountProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    const issuesRef = getIssuesRef(ctx.firestore, projectId);
    const countSnapshot = await issuesRef.count().get();
    return countSnapshot.data().count;
  });

/**
 * @function getAllIssuesProcedure
 * @description Retrieves all issues for a given project.
 * @param {string} projectId - The ID of the project to retrieve issues for.
 * @returns {Promise<IssueCol[]>} - A promise that resolves to an array of issues.
 */
export const getAllIssuesProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    return await getIssues(ctx.firestore, projectId);
  });

export const issuesRouter = createTRPCRouter({
  getIssueTable: getIssueTableProcedure,
  getIssue: getIssueProcedure,
  createIssue: createIssueProcedure,
  getIssueDetail: getIssueDetailProcedure,
  modifyIssue: modifyIssueProcedure,
  deleteIssue: deleteIssueProcedure,
  modifyIssuesTags: modifyIssuesTagsProcedure,
  modifyIssuesRelatedUserStory: modifyIssuesRelatedUserStoryProcedure,
  getIssueCount: getIssueCountProcedure,
  getAllIssues: getAllIssuesProcedure,
});
