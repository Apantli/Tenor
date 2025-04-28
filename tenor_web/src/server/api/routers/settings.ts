import { SettingsSchema, TagSchema } from "~/lib/types/zodFirebaseSchema";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import z, { number } from "zod";
import type { Firestore } from "firebase-admin/firestore";
import { Tag } from "~/lib/types/firebaseSchemas";
import {
  defaultMaximumSprintStoryPoints,
  defaultSprintDuration,
} from "~/lib/defaultProjectValues";

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

export const getPriorityTag = async (
  settingsRef: FirebaseFirestore.DocumentReference,
  priorityId: string,
) => {
  if (priorityId === undefined) {
    return undefined;
  }
  const tag = await settingsRef
    .collection("priorityTypes")
    .doc(priorityId)
    .get();
  if (!tag.exists) {
    return undefined;
  }
  return { id: tag.id, ...TagSchema.parse(tag.data()) } as Tag;
};

export const getBacklogTag = async (
  settingsRef: FirebaseFirestore.DocumentReference,
  taskId: string,
) => {
  if (taskId === undefined) {
    return undefined;
  }
  const tag = await settingsRef.collection("backlogTags").doc(taskId).get();
  if (!tag.exists) {
    return undefined;
  }
  return { id: tag.id, ...TagSchema.parse(tag.data()) } as Tag;
};

// TODO: Fetch from db
export const getTaskProgress = () => {
  return [0, 0] as [number | undefined, number | undefined];
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

  getStatusTypes: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const projectSettingsRef = getProjectSettingsRef(
        input.projectId,
        ctx.firestore,
      );
      const statusTypes = await projectSettingsRef
        .collection("statusTypes")
        .get();
      const statusTypesData = statusTypes.docs.map((doc) => ({
        id: doc.id,
        ...TagSchema.parse(doc.data()),
      }));

      return statusTypesData;
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
        .where("deleted", "==", false)
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
  createRequirementType: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        tag: TagSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, tag } = input;
      const projectRef = getProjectSettingsRef(projectId, ctx.firestore);
      const added = await projectRef.collection("requirementTypes").add(tag);
      return { ...tag, id: added.id };
    }),
  createRequirementFocus: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        tag: TagSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, tag } = input;
      const projectRef = getProjectSettingsRef(projectId, ctx.firestore);
      const added = await projectRef.collection("requirementFocus").add(tag);
      return { ...tag, id: added.id };
    }),
  // fetchDefaultSprintDuration: protectedProcedure
  //   .input(z.object({ projectId: z.string() }))
  //   .query(async ({ ctx, input }) => {
  //     const { projectId } = input;
  //     const settingsDocs = await getProjectSettingsRef(
  //       projectId,
  //       ctx.firestore,
  //     ).get();
  //     const sprintDuration = settingsDocs.data()?.sprintDuration as number;

  //     return sprintDuration ?? defaultSprintDuration;
  //   }),
  // fetchMaximumSprintStoryPoints: protectedProcedure
  //   .input(z.object({ projectId: z.string() }))
  //   .query(async ({ ctx, input }) => {
  //     const { projectId } = input;
  //     const settingsDocs = await getProjectSettingsRef(
  //       projectId,
  //       ctx.firestore,
  //     ).get();
  //     const maximumSprintStoryPoints = settingsDocs.data()
  //       ?.maximumSprintStoryPoints as number;

  //     return maximumSprintStoryPoints ?? defaultMaximumSprintStoryPoints;
  //   }),
  fetchScrumSettings: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      const settingsDocs = await getProjectSettingsRef(
        projectId,
        ctx.firestore,
      ).get();
      const data = settingsDocs.data();
      const scrumSettings = {
        sprintDuration: (data?.sprintDuration ??
          defaultSprintDuration) as number,
        maximumSprintStoryPoints: (data?.maximumSprintStoryPoints ??
          defaultMaximumSprintStoryPoints) as number,
      };

      return scrumSettings;
    }),

  updateScrumSettings: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        days: z.number(),
        points: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, days, points } = input;
      const settingsRef = getProjectSettingsRef(projectId, ctx.firestore);
      await settingsRef.update({
        maximumSprintStoryPoints: points,
        sprintDuration: days,
      });

      return { success: true };
    }),
});

export default settingsRouter;
