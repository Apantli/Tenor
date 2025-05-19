/**
 * Epics Router - Tenor API Endpoints for Epic Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing Epics in the Tenor application.
 * It provides endpoints to create, modify, and retrieve epic data within projects.
 *
 * @category API
 */

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { EpicSchema } from "~/lib/types/zodFirebaseSchema";
import { z } from "zod";
import {
  getEpic,
  getEpicNewId,
  getEpicRef,
  getEpics,
  getEpicsRef,
} from "~/utils/helpers/shortcuts/epics";

export const epicsRouter = createTRPCRouter({
  /**
   * @function getEpics
   * @description Retrieves all epics for a given project.
   * @param {string} projectId - The ID of the project to retrieve epics for.
   * @returns {Promise<EpicSchema[]>} - A promise that resolves to an array of epics.
   */
  getEpics: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      return await getEpics(ctx.firestore, projectId);
    }),

  /**
   * @function getEpic
   * @description Retrieves a specific epic by its ID within a project.
   * @param {string} projectId - The ID of the project.
   * @param {string} epicId - The ID of the epic to retrieve.
   * @returns {Promise<EpicSchema>} - A promise that resolves to the epic data or null if not found.
   */
  getEpic: protectedProcedure
    .input(z.object({ projectId: z.string(), epicId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId, epicId } = input;
      return await getEpic(ctx.firestore, projectId, epicId);
    }),

  /**
   * @function createOrModifyEpic
   * @description Creates a new epic or modifies an existing one.
   * @param {EpicSchema} epicData - The data for the epic to create or modify.
   * @param {string} projectId - The ID of the project to which the epic belongs.
   * @param {string} [epicId] - The ID of the epic to modify (optional).
   */
  createOrModifyEpic: protectedProcedure
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
        const epicDoc = await getEpicRef(
          ctx.firestore,
          projectId,
          epicId,
        ).get();
        await epicDoc?.ref.update(epicData);
      } else {
        epicData.scrumId = await getEpicNewId(ctx.firestore, projectId);
        await getEpicsRef(ctx.firestore, projectId).add(epicData);
      }
    }),

  /**
   * @function getEpicCount
   * @description Retrieves the number of epics inside a given project, regardless of their deleted status.
   * @param {string} projectId - The ID of the project.
   * @returns {number} - The number of epics in the project.
   */
  getEpicCount: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      const epicsRef = getEpicsRef(ctx.firestore, projectId);
      const countSnapshot = await epicsRef.count().get();
      return countSnapshot.data().count;
    }),

  /**
   * @function deleteEpic
   * @description Marks an epic as deleted in the database.
   * @param {string} projectId - The ID of the project.
   * @param {string} epicId - The ID of the epic to delete.
   */
  deleteEpic: protectedProcedure
    .input(z.object({ projectId: z.string(), epicId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { projectId, epicId } = input;
      const epicRef = getEpicRef(ctx.firestore, projectId, epicId);
      await epicRef.update({ deleted: true });
    }),
});
