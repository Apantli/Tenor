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
import { FieldPath } from "firebase-admin/firestore";
import {
  getEpic,
  getEpicNewId,
  getEpicRef,
  getEpics,
  getEpicsRef,
} from "~/utils/helpers/shortcuts";
import { get } from "node_modules/cypress/types/lodash";
import { WithId } from "~/lib/types/firebaseSchemas";

export const epicsRouter = createTRPCRouter({
  getEpics: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      return await getEpics(ctx.firestore, projectId);
    }),

  getEpic: protectedProcedure
    .input(z.object({ projectId: z.string(), epicId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId, epicId } = input;
      return await getEpic(ctx.firestore, projectId, epicId);
    }),

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
        await epicDoc?.ref.update(input);
      } else {
        epicData.scrumId = await getEpicNewId(ctx.firestore, projectId);
        await getEpicsRef(ctx.firestore, projectId).add(input);
      }
    }),
});
