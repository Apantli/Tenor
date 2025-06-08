/**
 * Backlog Items - Tenor API Endpoints for Backlog Item Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing Backlog Items in the Tenor application.
 * It provides endpoints to create, modify, and retrieve backlog items within projects.
 *
 * The router includes procedures for:
 * - Creating and modifying backlog items
 * - Retrieving backlog item details and counts
 * - Deleting backlog items
 * - Managing backlog item tags and properties
 *
 * @category API
 */

import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  roleRequiredProcedure,
} from "~/server/api/trpc";
import { BacklogItemSchema } from "~/lib/types/zodFirebaseSchema";
import {
  backlogPermissions,
  tagPermissions,
} from "~/lib/defaultValues/permission";
import type { BacklogItem, WithId } from "~/lib/types/firebaseSchemas";
import {
  deleteBacklogItemAndGetModified,
  getBacklogItemDetail,
  getBacklogItemRef,
  getBacklogItems,
  getBacklogItemsRef,
} from "../shortcuts/backlogItems";
import { LogProjectActivity } from "../lib/projectEventLogger";
import { badRequest, notFound } from "~/server/errors";

/**
 * Retrieves all backlog items for a given project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project to retrieve backlog items for
 *
 * @returns Array of backlog items for the specified project
 *
 * @http GET /api/trpc/backlogItems.getBacklogItems
 */
export const getBacklogItemsProcedure = roleRequiredProcedure(
  backlogPermissions,
  "read",
)
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    return await getBacklogItems(ctx.firestore, projectId);
  });

/**
 * Retrieves detailed information about a specific backlog item.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - backlogItemId - String ID of the backlog item to retrieve
 *
 * @returns Detailed backlog item object with relationships and metadata
 *
 * @http GET /api/trpc/backlogItems.getBacklogItemDetail
 */
export const getBacklogItemDetailProcedure = roleRequiredProcedure(
  backlogPermissions,
  "read",
)
  .input(z.object({ backlogItemId: z.string(), projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { backlogItemId, projectId } = input;
    return await getBacklogItemDetail(
      ctx.firebaseAdmin.app(),
      ctx.firestore,
      projectId,
      backlogItemId,
    );
  });

/**
 * Creates a new backlog item with automatic scrum ID assignment.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - backlogItemData - Data for the backlog item to create
 *
 * @returns The created backlog item with its newly assigned ID
 *
 * @http POST /api/trpc/backlogItems.createBacklogItem
 */
export const createBacklogItemProcedure = roleRequiredProcedure(
  backlogPermissions,
  "write",
)
  .input(
    z.object({
      projectId: z.string(),
      backlogItemData: BacklogItemSchema.omit({ scrumId: true }),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, backlogItemData: backlogItemDataRaw } = input;

    const { backlogItemData, id: newBacklogItemId } =
      await ctx.firestore.runTransaction(async (transaction) => {
        const backlogItemsRef = getBacklogItemsRef(ctx.firestore, projectId);

        const backlogItemCount = await transaction.get(backlogItemsRef.count());

        const backlogItemData = BacklogItemSchema.parse({
          ...backlogItemDataRaw,
          scrumId: backlogItemCount.data().count + 1,
        });
        const docRef = backlogItemsRef.doc();

        transaction.create(docRef, backlogItemData);

        return {
          backlogItemData,
          id: docRef.id,
        };
      });

    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: newBacklogItemId,
      type: "IT",
      action: "create",
    });

    return {
      id: newBacklogItemId,
      ...backlogItemData,
    } as WithId<BacklogItem>;
  });

/**
 * Retrieves the count of backlog items within a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns The total number of backlog items in the project
 *
 * @http GET /api/trpc/backlogItems.getBacklogItemCount
 */
export const getBacklogItemCountProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    const backlogItemsRef = getBacklogItemsRef(ctx.firestore, projectId);
    const countSnapshot = await backlogItemsRef.count().get();
    return countSnapshot.data().count;
  });

/**
 * Modifies an existing backlog item with provided data.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - backlogItemId - String ID of the backlog item to modify
 * - backlogItemData - Updated data for the backlog item
 *
 * @returns Object containing IDs of updated backlog items
 *
 * @http POST /api/trpc/backlogItems.modifyBacklogItem
 */
export const modifyBacklogItemProcedure = roleRequiredProcedure(
  backlogPermissions,
  "write",
)
  .input(
    z.object({
      projectId: z.string(),
      backlogItemId: z.string(),
      backlogItemData: BacklogItemSchema.omit({
        scrumId: true,
        deleted: true,
      }),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, backlogItemId, backlogItemData } = input;

    if (backlogItemData.statusId === "awaits_review") {
      throw badRequest("Backlog items can't have that status");
    }

    await getBacklogItemRef(ctx.firestore, projectId, backlogItemId).update(
      backlogItemData,
    );

    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: backlogItemId,
      type: "IT",
      action: "update",
    });

    return {
      updatedBacklogItemIds: [backlogItemId],
    };
  });

/**
 * Deletes a backlog item by marking it as deleted and handling related tasks.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - backlogItemId - String ID of the backlog item to delete
 *
 * @returns Object indicating success and IDs of modified items and tasks
 *
 * @http POST /api/trpc/backlogItems.deleteBacklogItem
 */
export const deleteBacklogItemProcedure = roleRequiredProcedure(
  backlogPermissions,
  "write",
)
  .input(
    z.object({
      projectId: z.string(),
      backlogItemId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, backlogItemId } = input;
    const { modifiedBacklogItems, modifiedTasks } =
      await deleteBacklogItemAndGetModified(
        ctx.firestore,
        projectId,
        backlogItemId,
      );

    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: backlogItemId,
      type: "IT",
      action: "delete",
    });

    return {
      success: true,
      updatedBacklogItemIds: modifiedBacklogItems,
      modifiedTaskIds: modifiedTasks,
    };
  });

/**
 * Modifies specific tag properties of an existing backlog item.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - backlogItemId - String ID of the backlog item to modify
 * - priorityId - Optional string ID of the priority tag to set
 * - size - Optional string size value to set
 * - statusId - Optional string ID of the status tag to set
 *
 * @returns Void on success
 *
 * @http POST /api/trpc/backlogItems.modifyBacklogItemTags
 */
export const modifyBacklogItemTagsProcedure = roleRequiredProcedure(
  tagPermissions,
  "write",
)
  .input(
    z.object({
      projectId: z.string(),
      backlogItemId: z.string(),
      priorityId: z.string().optional(),
      size: z.string().optional(),
      statusId: z.string().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, backlogItemId, priorityId, size, statusId } = input;
    if (
      priorityId === undefined &&
      size === undefined &&
      statusId === undefined
    ) {
      return;
    }

    if (statusId === "awaits_review") {
      throw badRequest("Backlog items can't have that status");
    }

    const backlogItemRef = getBacklogItemRef(
      ctx.firestore,
      projectId,
      backlogItemId,
    );
    const backlogItemSnapshot = await backlogItemRef.get();
    if (!backlogItemSnapshot.exists) {
      throw notFound("Backlog Item");
    }

    await backlogItemRef.update({
      priorityId: priorityId,
      size: size,
      statusId: statusId,
    });

    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: backlogItemId,
      type: "IT",
      action: "update",
    });
  });

/**
 * Backlog Items Router - Centralizes all backlog item-related procedures.
 * Provides a structured interface for backlog item management across the application.
 */
export const backlogItemsRouter = createTRPCRouter({
  getBacklogItems: getBacklogItemsProcedure,
  getBacklogItemDetail: getBacklogItemDetailProcedure,
  createBacklogItem: createBacklogItemProcedure,
  getBacklogItemCount: getBacklogItemCountProcedure,
  modifyBacklogItem: modifyBacklogItemProcedure,
  deleteBacklogItem: deleteBacklogItemProcedure,
  modifyBacklogItemTags: modifyBacklogItemTagsProcedure,
});
