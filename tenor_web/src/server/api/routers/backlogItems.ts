/**
 * Backlog Items Router - Tenor API Endpoints for Backlog Item Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing Backlog Items in the Tenor application.
 * It provides endpoints to create, modify, and retrieve backlog items.
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
import { backlogPermissions } from "~/lib/defaultValues/permission";
import type { BacklogItem, WithId } from "~/lib/types/firebaseSchemas";
import {
  getBacklogItemNewId,
  getBacklogItems,
  getBacklogItemsRef,
} from "../shortcuts/backlogItems";
import { LogProjectActivity } from "../lib/projectEventLogger";

export const backlogItemsRouter = createTRPCRouter({
  /**
   * @function getBacklogItems
   * @description Retrieves all backlog items for a given project.
   * @param {string} projectId - The ID of the project to retrieve backlog items for.
   * @returns {Promise<WithId<BacklogItem>[]>} - A promise that resolves to an array of backlog items.
   */
  getBacklogItems: roleRequiredProcedure(backlogPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      return await getBacklogItems(ctx.firestore, projectId);
    }),

  /**
   * @function getBacklogItemDetail
   * @description Retrieves detailed information about a specific backlog item.
   * @param {string} projectId - The ID of the project to which the backlog item belongs.
   * @param {string} backlogItemId - The ID of the backlog item to retrieve.
   * @returns {Promise<BacklogItemDetail>} - A promise that resolves to the detailed backlog item information.
   */
  //   getBacklogItemDetail: roleRequiredProcedure(backlogPermissions, "read")
  //     .input(z.object({ backlogItemId: z.string(), projectId: z.string() }))
  //     .query(async ({ ctx, input }) => {
  //       const { backlogItemId, projectId } = input;
  //       return await getBacklogItemDetail(
  //         ctx.firebaseAdmin.app(),
  //         ctx.firestore,
  //         projectId,
  //         backlogItemId,
  //       );
  //     }),

  /**
   * @function createBacklogItem
   * @description Creates a new backlog item or modifies an existing one.
   * @param {BacklogItemSchema} backlogItemData - The data for the backlog item to create or modify.
   * @param {string} projectId - The ID of the project to which the backlog item belongs.
   * @param {string} [backlogItemId] - The ID of the backlog item to modify (optional).
   * @returns {Promise<WithId<BacklogItem>>} - A promise that resolves to the created or modified backlog item.
   */
  createBacklogItem: roleRequiredProcedure(backlogPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        backlogItemData: BacklogItemSchema.omit({ scrumId: true }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, backlogItemData: backlogItemDataRaw } = input;
      const backlogItemData = BacklogItemSchema.parse({
        ...backlogItemDataRaw,
        scrumId: await getBacklogItemNewId(ctx.firestore, projectId),
      });

      const backlogItem = await getBacklogItemsRef(
        ctx.firestore,
        projectId,
      ).add(backlogItemData);

      await LogProjectActivity({
        firestore: ctx.firestore,
        projectId: input.projectId,
        userId: ctx.session.user.uid,
        itemId: backlogItem.id,
        type: "IT",
        action: "create",
      });

      return {
        id: backlogItem.id,
        ...backlogItemData,
      } as WithId<BacklogItem>;
    }),

  /**
   * @function getBacklogItemCount
   * @description Retrieves the number of backlog items inside a given project, regardless of their deleted status.
   * @param {string} projectId - The ID of the project.
   * @returns {number} - The number of backlog items in the project.
   */
  getBacklogItemCount: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      const backlogItemsRef = getBacklogItemsRef(ctx.firestore, projectId);
      const countSnapshot = await backlogItemsRef.count().get();
      return countSnapshot.data().count;
    }),
  /**
   * @function modifyBacklogItem
   * @description Modifies an existing backlog item.
   * @param {string} projectId - The ID of the project to which the backlog item belongs.
   * @param {string} backlogItemId - The ID of the backlog item to modify.
   * @param {BacklogItemSchema} backlogItemData - The data for the backlog item to modify.
   * @returns {Promise<{ success: boolean, updatedBacklogItemIds: string[] }>} - A promise that resolves to an object indicating success and the IDs of updated backlog items.
   */
  //   modifyBacklogItem: roleRequiredProcedure(backlogPermissions, "write")
  //     .input(
  //       z.object({
  //         projectId: z.string(),
  //         backlogItemId: z.string(),
  //         backlogItemData: BacklogItemSchema.omit({ scrumId: true, deleted: true }),
  //       }),
  //     )
  //     .mutation(async ({ ctx, input }) => {
  //       const { projectId, backlogItemId, backlogItemData } = input;
  //       const oldBacklogItemData = await getBacklogItem(
  //         ctx.firestore,
  //         projectId,
  //         backlogItemId,
  //       );

  //       await getBacklogItemRef(ctx.firestore, projectId, backlogItemId).update(
  //         backlogItemData,
  //       );

  //       await LogProjectActivity({
  //         firestore: ctx.firestore,
  //         projectId: input.projectId,
  //         userId: ctx.session.user.uid,
  //         itemId: backlogItemId,
  //         type: "US",
  //         action: "update",
  //       });

  //       return {
  //         updatedBacklogItemIds: [
  //           ...addedDependencies,
  //           ...removedDependencies,
  //           ...addedRequiredBy,
  //           ...removedRequiredBy,
  //         ],
  //       };
  //     }),
  /**
   * @function deleteBacklogItem
   * @description Deletes a backlog item by marking it as deleted.
   * @param {string} projectId - The ID of the project to which the backlog item belongs.
   * @param {string} backlogItemId - The ID of the backlog item to delete.
   */
  //   deleteBacklogItem: roleRequiredProcedure(backlogPermissions, "write")
  //     .input(
  //       z.object({
  //         projectId: z.string(),
  //         backlogItemId: z.string(),
  //       }),
  //     )
  //     .mutation(async ({ ctx, input }) => {
  //       const { projectId, backlogItemId } = input;
  //       const { modifiedBacklogItems, modifiedTasks } =
  //         await deleteBacklogItemAndGetModified(
  //           ctx.firestore,
  //           projectId,
  //           backlogItemId,
  //         );

  //       await LogProjectActivity({
  //         firestore: ctx.firestore,
  //         projectId: input.projectId,
  //         userId: ctx.session.user.uid,
  //         itemId: backlogItemId,
  //         type: "US",
  //         action: "delete",
  //       });

  //       return {
  //         success: true,
  //         updatedBacklogItemIds: modifiedBacklogItems,
  //         modifiedTaskIds: modifiedTasks,
  //       };
  //     }),

  /**
   * @function deleteBacklogItems
   * @description Deletes multiple backlog items by marking them as deleted.
   * @param {string} projectId - The ID of the project
   * @param {string[]} backlogItemIds - The IDs of the backlog items to delete
   */
  //   deleteBacklogItems: roleRequiredProcedure(backlogPermissions, "write")
  //     .input(
  //       z.object({
  //         projectId: z.string(),
  //         backlogItemIds: z.array(z.string()),
  //       }),
  //     )
  //     .mutation(async ({ ctx, input }) => {
  //       const { projectId, backlogItemIds } = input;

  //       const allModifiedBacklogItemIds = new Set<string>();
  //       const allModifiedTaskIds = new Set<string>();

  //       await Promise.all(
  //         backlogItemIds.map(async (backlogItemId) => {
  //           const { modifiedBacklogItems, modifiedTasks } =
  //             await deleteBacklogItemAndGetModified(
  //               ctx.firestore,
  //               projectId,
  //               backlogItemId,
  //             );
  //           modifiedBacklogItems.forEach((id) => allModifiedBacklogItemIds.add(id));
  //           modifiedTasks.forEach((id) => allModifiedTaskIds.add(id));
  //         }),
  //       );

  //       return {
  //         success: true,
  //         updatedBacklogItemIds: Array.from(allModifiedBacklogItemIds),
  //         modifiedTaskIds: Array.from(allModifiedTaskIds),
  //       };
  //     }),
  /**
   * @function modifyBacklogItemTags
   * @description Modifies the tags of an existing backlog item.
   * @param {string} projectId - The ID of the project to which the backlog item belongs.
   * @param {string} backlogItemId - The ID of the backlog item to modify.
   * @param {string} [priorityId] - The ID of the priority tag to set (optional).
   * @param {string} [size] - The size of the backlog item (optional).
   * @param {string} [statusId] - The ID of the status tag to set (optional).
   */
  //   modifyBacklogItemTags: roleRequiredProcedure(tagPermissions, "write")
  //     .input(
  //       z.object({
  //         projectId: z.string(),
  //         backlogItemId: z.string(),
  //         priorityId: z.string().optional(),
  //         size: z.string().optional(),
  //         statusId: z.string().optional(),
  //       }),
  //     )
  //     .mutation(async ({ ctx, input }) => {
  //       const { projectId, backlogItemId, priorityId, size, statusId } = input;
  //       if (
  //         priorityId === undefined &&
  //         size === undefined &&
  //         statusId === undefined
  //       ) {
  //         return;
  //       }

  //       const backlogItemRef = getBacklogItemRef(
  //         ctx.firestore,
  //         projectId,
  //         backlogItemId,
  //       );
  //       const backlogItemSnapshot = await backlogItemRef.get();
  //       if (!backlogItemSnapshot.exists) {
  //         throw new TRPCError({ code: "NOT_FOUND" });
  //       }

  //       await backlogItemRef.update({
  //         priorityId: priorityId,
  //         size: size,
  //         statusId: statusId,
  //       });

  //       await LogProjectActivity({
  //         firestore: ctx.firestore,
  //         projectId: input.projectId,
  //         userId: ctx.session.user.uid,
  //         itemId: backlogItemId,
  //         type: "US",
  //         action: "update",
  //       });
  //     }),
});
