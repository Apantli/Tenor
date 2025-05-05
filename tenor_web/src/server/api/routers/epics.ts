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

/**
 * Retrieves an overview of epics for a specific project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to fetch epics for
 *
 * @returns Array of epics with their scrum IDs and names.
 *
 * @http GET /api/trpc/epics.getProjectEpicsOverview
 */
export const getProjectEpicsOverviewProcedure = protectedProcedure
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
  });

/**
 * Retrieves a specific epic by its scrum ID.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the epic
 * - epicId — Scrum ID of the epic to retrieve
 *
 * @returns Epic object with its details.
 *
 * @http GET /api/trpc/epics.getEpic
 */
export const getEpicProcedure = protectedProcedure
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
  });

/**
 * Creates a new epic or updates an existing one in a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to create or update the epic in
 * - scrumId — Scrum ID of the epic (use -1 for new epics)
 * - name — Name of the epic
 * - description — Description of the epic
 * - deleted — Boolean indicating if the epic is deleted
 *
 * @returns Success message indicating whether the epic was created or updated.
 *
 * @http POST /api/trpc/epics.createOrModifyEpic
 */
export const createOrModifyEpicProcedure = protectedProcedure
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
  });

/**
 * Retrieves the count of epics in a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to count epics for
 *
 * @returns Number of epics in the project.
 *
 * @http GET /api/trpc/epics.getEpicCount
 */
export const getEpicCountProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const epicCount = await ctx.firestore
      .collection("projects")
      .doc(input.projectId)
      .collection("epics")
      .where("deleted", "==", false)
      .count()
      .get();
    return epicCount.data().count;
  });

export const epicsRouter = createTRPCRouter({
  getProjectEpicsOverview: getProjectEpicsOverviewProcedure,
  getEpic: getEpicProcedure,
  createOrModifyEpic: createOrModifyEpicProcedure,

  getEpicCount: getEpicCountProcedure,
});
