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
import { EpicSchema, ExistingEpicSchema } from "~/lib/types/zodFirebaseSchema";
import { z } from "zod";
import { FieldPath } from "firebase-admin/firestore";

// TODO: Use this function within the epic procedures (did not do it because of possible conflicts)
export const getEpic = async (
  dbAdmin: FirebaseFirestore.Firestore,
  projectId: string,
  epicId: string,
) => {
  if (epicId === undefined || epicId === "") {
    return undefined;
  }
  const epicRef = dbAdmin
    .collection("projects")
    .doc(projectId)
    .collection("epics")
    .doc(epicId);
  const epic = await epicRef.get();

  if (!epic.exists) {
    return undefined;
  }
  return { id: epic.id, ...EpicSchema.parse(epic.data()) };
};

export const epicsRouter = createTRPCRouter({
  getProjectEpicsOverview: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const epicsSnapshot = await ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("epics")
        .select("scrumId", "name")
        .where("deleted", "==", false)
        .orderBy("scrumId")
        .get();

      const epics = epicsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...ExistingEpicSchema.parse(doc.data()),
      }));

      return epics;
    }),

  getEpic: protectedProcedure
    .input(z.object({ projectId: z.string(), epicId: z.number() }))
    .query(async ({ ctx, input }) => {
      const snapshot = await ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("epics")
        .where("scrumId", "==", input.epicId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        throw new Error("Epic not found");
      }

      const epicDoc = snapshot.docs[0];

      return EpicSchema.parse({ ...epicDoc?.data() });
    }),

  createOrModifyEpic: protectedProcedure
    .input(EpicSchema.extend({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const projectCount = (
        await ctx.firestore
          .collection("projects")
          .where(FieldPath.documentId(), "==", input.projectId)
          .count()
          .get()
      ).data().count;

      if (projectCount === 0) {
        throw new Error("Project not found");
      }

      const epicsRef = ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("epics");

      if (input.scrumId !== -1) {
        const epicDocs = await epicsRef
          .where("scrumId", "==", input.scrumId)
          .get();

        if (epicDocs.empty) {
          throw new Error("Epic not found");
        }

        const epicDoc = epicDocs.docs[0];
        await epicDoc?.ref.update(input);
        return "Epic updated successfully";
      } else {
        const existingEpicsCount = (await epicsRef.count().get()).data().count;
        input.scrumId = existingEpicsCount + 1;
        await epicsRef.add(input);
        return "Epic created successfully";
      }
    }),
});
