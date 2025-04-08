import { TRPCError } from "@trpc/server";
import { FieldPath, FieldValue } from "firebase-admin/firestore";
import type { Project, Sprint } from "~/lib/types/firebaseSchemas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  SprintInfoSchema,
  SprintSchema,
  SprintSnapshotSchema,
} from "~/lib/types/zodFirebaseSchema";
import { z } from "zod";

export const sprintsRouter = createTRPCRouter({
  getProjectSprintsOverview: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const sprintsSnapshot = await ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("sprints")
        .select("number", "description", "startDate", "endDate")
        .orderBy("number")
        .get();

      const sprints = sprintsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...SprintInfoSchema.parse(doc.data()),
      }));

      console.log("Sprints: ", sprints);

      return sprints;
    }),
  getSprint: protectedProcedure
    .input(z.object({ projectId: z.string(), sprintNumber: z.number() }))
    .query(async ({ ctx, input }) => {
      const snapshot = await ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("sprints")
        .where("number", "==", input.sprintNumber)
        .limit(1)
        .get();

      if (snapshot.empty) {
        throw new Error("Sprint not found");
      }

      const sprintDoc = snapshot.docs[0];

      return SprintSchema.parse({ ...sprintDoc?.data() });
    }),
  createOrModifySprint: protectedProcedure
    .input(SprintInfoSchema.extend({ projectId: z.string() }))
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

      const sprintsRef = ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("sprints");

      if (input.number !== -1) {
        const sprintDocs = await sprintsRef
          .where("number", "==", input.number)
          .get();

        if (sprintDocs.empty) {
          throw new Error("Epic not found");
        }

        const sprintDoc = sprintDocs.docs[0];
        await sprintDoc?.ref.update(input);
        return "Sprint updated successfully";
      } else {
        const existingSprintsCount = (await sprintsRef.count().get()).data()
          .count;
        input.number = existingSprintsCount + 1;
        await sprintsRef.add(input);
        return "Sprint created successfully";
      }
    }),
});
