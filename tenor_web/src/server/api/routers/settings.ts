import { SettingsSchema, TagSchema } from "~/lib/types/zodFirebaseSchema";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import z from "zod";
import type { Firestore } from "firebase-admin/firestore";
import { Tag } from "~/lib/types/firebaseSchemas";

/**
 * @function getProjectSettingsRef
 * @description Gets a reference to the project settings document
 * @param {string} projectId - The ID of the project
 * @param {Firestore} firestore - The Firestore instance
 * @returns {FirebaseFirestore.DocumentReference} A reference to the project settings document
 */
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

/**
 * @function getProjectSettings
 * @description Retrieves the settings for a specific project
 * @param {string} projectId - The ID of the project
 * @param {Firestore} firestore - The Firestore instance
 * @returns {Promise<any>} The project settings validated by SettingsSchema
 */
const getProjectSettings = async (projectId: string, firestore: Firestore) => {
  const settings = await getProjectSettingsRef(projectId, firestore).get();

  return SettingsSchema.parse(settings.data());
};

/**
 * @function getPriorityTag
 * @description Retrieves a priority tag from the priorityTypes collection based on its ID
 * @param {FirebaseFirestore.DocumentReference} settingsRef - Reference to the settings document
 * @param {string} priorityId - The ID of the priority tag to retrieve
 * @returns {Promise<Tag | undefined>} The priority tag object or undefined if not found
 */
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

/**
 * @function getBacklogTag
 * @description Retrieves a backlog tag from the backlogTags collection based on its ID
 * @param {FirebaseFirestore.DocumentReference} settingsRef - Reference to the settings document
 * @param {string} taskId - The ID of the backlog tag to retrieve
 * @returns {Promise<Tag | undefined>} The backlog tag object or undefined if not found
 */
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

/**
 * @function getTaskProgress
 * @description Retrieves the progress of a task (placeholder for future implementation)
 * @returns {[number | undefined, number | undefined]} A tuple containing task progress values
 * @todo Fetch from db
 */
// TODO: Fetch from db
export const getTaskProgress = () => {
  return [0, 0] as [number | undefined, number | undefined];
};

const settingsRouter = createTRPCRouter({
  /**
   * @procedure getPriorityTypes
   * @description Retrieves all priority types for a project
   * @input {object} input - Input parameters
   * @input {string} input.projectId - The ID of the project
   * @returns {Tag[]} An array of priority type tags
   */
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

  /**
   * @procedure getStatusTypes
   * @description Retrieves all status types for a project
   * @input {object} input - Input parameters
   * @input {string} input.projectId - The ID of the project
   * @returns {Tag[]} An array of status type tags
   */
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

  /**
   * @procedure getBacklogTags
   * @description Retrieves all non-deleted backlog tags for a project
   * @input {object} input - Input parameters
   * @input {string} input.projectId - The ID of the project
   * @returns {Tag[]} An array of backlog tags
   */
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

  /**
   * @procedure createBacklogTag
   * @description Creates a new backlog tag for a project
   * @input {object} input - Input parameters
   * @input {string} input.projectId - The ID of the project
   * @input {object} input.tag - The tag data conforming to TagSchema
   * @returns {Tag & {id: string}} The created tag with its ID
   */
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

  /**
   * @procedure createRequirementType
   * @description Creates a new requirement type tag for a project
   * @input {object} input - Input parameters
   * @input {string} input.projectId - The ID of the project
   * @input {object} input.tag - The tag data conforming to TagSchema
   * @returns {Tag & {id: string}} The created requirement type tag with its ID
   */
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

  /**
   * @procedure createRequirementFocus
   * @description Creates a new requirement focus tag for a project
   * @input {object} input - Input parameters
   * @input {string} input.projectId - The ID of the project
   * @input {object} input.tag - The tag data conforming to TagSchema
   * @returns {Tag & {id: string}} The created requirement focus tag with its ID
   */
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
});

export default settingsRouter;
