import { SettingsSchema, TagSchema } from "~/lib/types/zodFirebaseSchema";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import z from "zod";
import type { Firestore } from "firebase-admin/firestore";
import { Tag } from "~/lib/types/firebaseSchemas";
import { link } from "fs";
import { fetchHTML } from "~/utils/webcontent";

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
  getContextLinks: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const projectSettingsRef = getProjectSettingsRef(
        input.projectId,
        ctx.firestore,
      );
      const settings = await projectSettingsRef.get();
      const settingsData = SettingsSchema.parse(settings.data());
      const links: string[] = settingsData.aiContext.links.map(
        (link) => link.link,
      );
      return links;
    }),
  getContextFiles: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const projectSettingsRef = getProjectSettingsRef(
        input.projectId,
        ctx.firestore,
      );
      const settings = await projectSettingsRef.get();
      const settingsData = SettingsSchema.parse(settings.data());
      const files: { name: string; type: string }[] =
        settingsData.aiContext.files.map((file) => ({
          name: file.name,
          type: file.type,
        }));
      return files;
    }),
  getContextDialog: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const projectSettingsRef = getProjectSettingsRef(
        input.projectId,
        ctx.firestore,
      );
      const settings = await projectSettingsRef.get();
      const settingsData = SettingsSchema.parse(settings.data());
      const text: string = settingsData.aiContext.text;
      return text;
    }),
  updateTextContext: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        text: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, text } = input;
      const projectSettingsRef = getProjectSettingsRef(
        projectId,
        ctx.firestore,
      );
      const settings = await projectSettingsRef.get();
      const settingsData = SettingsSchema.parse(settings.data());
      await projectSettingsRef.update({
        aiContext: {
          ...settingsData.aiContext,
          text,
        },
      });
    }),
  addLink: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        link: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, link } = input;
      const projectSettingsRef = getProjectSettingsRef(
        projectId,
        ctx.firestore,
      );
      const settings = await projectSettingsRef.get();
      const settingsData = SettingsSchema.parse(settings.data());
      const newLink = fetchHTML(link).then(
        (content) => ({ link, content }),
        (error) => {
          console.error("Error fetching HTML:", error);
          return { link, content: null };
        },
      );
      const newLinks = [...settingsData.aiContext.links, newLink];
      await projectSettingsRef.update({
        aiContext: {
          ...settingsData.aiContext,
          links: newLinks,
        },
      });
    }),
  deleteLink: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        link: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, link } = input;
      const projectSettingsRef = getProjectSettingsRef(
        projectId,
        ctx.firestore,
      );
      const settings = await projectSettingsRef.get();
      const settingsData = SettingsSchema.parse(settings.data());
      // remove link from settingsData
      const newLinks = settingsData.aiContext.links.filter(
        (l) => l.link !== link,
      );
      await projectSettingsRef.update({
        aiContext: {
          ...settingsData.aiContext,
          links: newLinks,
        },
      });
    }),
});

export default settingsRouter;
