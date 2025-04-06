import { SettingsSchema, TagSchema } from "~/lib/types/zodFirebaseSchema";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import z from "zod";
import { FieldValue, Firestore } from "firebase-admin/firestore";

export const getProjectSettingsRef = (
  projectId: string,
  firestore: Firestore,
) => {
  return firestore
    .collection("projects")
    .doc(projectId)
    .collection("settings")
    .doc("settings");
};

const getProjectSettings = async (projectId: string, firestore: Firestore) => {
  const settings = await getProjectSettingsRef(projectId, firestore).get();

  return SettingsSchema.parse(settings.data());
};

const settingsRouter = createTRPCRouter({
  getPriorityTypes: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const projectSettingsRef = getProjectSettingsRef(
        input.projectId,
        ctx.firestore,
      );
      const priorityTypes = await projectSettingsRef
        .collection("priorityTypes")
        .get();
      const priorityTypesData = priorityTypes.docs.map((doc) => ({
        id: doc.id,
        ...TagSchema.parse(doc.data()),
      }));

      return priorityTypesData;
    }),
  getBacklogTags: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const projectSettingsRef = getProjectSettingsRef(
        input.projectId,
        ctx.firestore,
      );
      const backlogTags = await projectSettingsRef
        .collection("backlogTags")
        .get();
      const backlogTagsData = backlogTags.docs.map((doc) => ({
        id: doc.id,
        ...TagSchema.parse(doc.data()),
      }));

      return backlogTagsData;
    }),
  createBacklogTag: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        tag: TagSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, tag } = input;
      const projectRef = getProjectSettingsRef(projectId, ctx.firestore);
      const added = await projectRef.collection("backlogTags").add(tag);
      return { ...tag, id: added.id };
    }),
});

export default settingsRouter;
