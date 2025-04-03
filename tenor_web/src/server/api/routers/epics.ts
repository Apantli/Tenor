import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { EpicSchema, EpicOverviewSchema } from "~/lib/types/zodFirebaseSchema";
import { z } from "zod";
import { FieldPath } from "firebase-admin/firestore";

export const epicsRouter = createTRPCRouter({
  getProjectEpicsOverview: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const epicsSnapshot = await ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("epics")
        .select("scrumId", "name")
        .orderBy("scrumId")
        .get();

      const epics = epicsSnapshot.docs.map((doc) =>
        EpicOverviewSchema.parse({
          ...doc.data(),
        }),
      );

      return epics;
    }),

  getEpic: protectedProcedure
    .input(z.object({ projectId: z.string(), epicId: z.string() }))
    .query(async ({ ctx, input }) => {
      const epicDoc = await ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("epics")
        .doc(input.epicId)
        .get();

      if (!epicDoc.exists) {
        throw new Error("Epic not found");
      }

      return { id: epicDoc.id, ...epicDoc.data() };
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

      if (input.scrumId) {
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
