/**
 * Epics Router - Tenor API Endpoints for Epic Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing Epics in the Tenor application.
 * It provides endpoints to create, modify, and retrieve epic data within projects.
 *
 * The router includes procedures for:
 * - Creating and retrieving epics
 * - Modifying epic details
 * - Deleting epics by marking them as deleted
 *
 * @category API
 */

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { EpicSchema } from "~/lib/types/zodFirebaseSchema";
import { z } from "zod";
import { getEpic, getEpicRef, getEpics, getEpicsRef } from "../shortcuts/epics";
import { LogProjectActivity } from "~/server/api/lib/projectEventLogger";

/**
 * Retrieves all epics for a given project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project to retrieve epics for
 *
 * @returns Array of epic objects containing epic details
 *
 * @http GET /api/trpc/epics.getEpics
 */
export const getEpicsProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    return await getEpics(ctx.firestore, projectId);
  });

/**
 * Retrieves a specific epic by its ID within a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - epicId - String ID of the epic to retrieve
 *
 * @returns Epic object containing details or null if not found
 *
 * @http GET /api/trpc/epics.getEpic
 */
export const getEpicProcedure = protectedProcedure
  .input(z.object({ projectId: z.string(), epicId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId, epicId } = input;
    return await getEpic(ctx.firestore, projectId, epicId);
  });

/**
 * Creates a new epic or modifies an existing one.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - epicData - Object containing epic details conforming to EpicSchema
 * - projectId - String ID of the project
 * - epicId - Optional string ID of the epic to modify (when updating)
 *
 * @returns None
 *
 * @http POST /api/trpc/epics.createOrModifyEpic
 */
export const createOrModifyEpicProcedure = protectedProcedure
  .input(
    z.object({
      epicData: EpicSchema,
      projectId: z.string(),
      epicId: z.string().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, epicId, epicData } = input;

    if (epicId) {
      const epicDoc = await getEpicRef(ctx.firestore, projectId, epicId).get();
      await epicDoc?.ref.update(epicData);
      await LogProjectActivity({
        firestore: ctx.firestore,
        projectId: input.projectId,
        userId: ctx.session.user.uid,
        itemId: epicId,
        type: "EP",
        action: "update",
      });
    } else {
      const { id: newEpicId } = await ctx.firestore.runTransaction(
        async (transaction) => {
          const epicsRef = getEpicsRef(ctx.firestore, projectId);

          const epicCount = await transaction.get(epicsRef.count());

          const epicDataUpdated = EpicSchema.parse({
            ...epicData,
            scrumId: epicCount.data().count + 1,
          });
          const docRef = epicsRef.doc();

          transaction.create(docRef, epicDataUpdated);

          return {
            id: docRef.id,
          };
        },
      );

      await LogProjectActivity({
        firestore: ctx.firestore,
        projectId: input.projectId,
        userId: ctx.session.user.uid,
        itemId: newEpicId,
        type: "EP",
        action: "create",
      });
    }
  });

/**
 * Retrieves the number of epics inside a given project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns Number of epics in the project regardless of deleted status
 *
 * @http GET /api/trpc/epics.getEpicCount
 */
export const getEpicCountProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    const epicsRef = getEpicsRef(ctx.firestore, projectId);
    const countSnapshot = await epicsRef.count().get();
    return countSnapshot.data().count;
  });

/**
 * Marks an epic as deleted in the database.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - epicId - String ID of the epic to delete
 *
 * @returns None
 *
 * @http POST /api/trpc/epics.deleteEpic
 */
export const deleteEpicProcedure = protectedProcedure
  .input(z.object({ projectId: z.string(), epicId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { projectId, epicId } = input;
    const epicRef = getEpicRef(ctx.firestore, projectId, epicId);
    await epicRef.update({ deleted: true });
    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: epicId,
      type: "EP",
      action: "delete",
    });
  });

export const epicsRouter = createTRPCRouter({
  getEpics: getEpicsProcedure,
  getEpic: getEpicProcedure,
  createOrModifyEpic: createOrModifyEpicProcedure,
  getEpicCount: getEpicCountProcedure,
  deleteEpic: deleteEpicProcedure,
});
