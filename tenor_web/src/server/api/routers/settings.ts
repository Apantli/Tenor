import {
  PermissionSchema,
  RoleSchema,
  SettingsSchema,
  StatusTagSchema,
  TagSchema,
} from "~/lib/types/zodFirebaseSchema";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import z, { number } from "zod";
import type { Firestore } from "firebase-admin/firestore";
import { Tag, WithId } from "~/lib/types/firebaseSchemas";
import { fetchHTML } from "~/utils/webcontent";
import { fetchMultipleFiles, fetchText } from "~/utils/filecontent";
import { emptyRole, ownerRole } from "~/lib/defaultProjectValues";
import { remove } from "node_modules/cypress/types/lodash";
import { RoleDetail } from "~/lib/types/detailSchemas";
import { TRPCError } from "@trpc/server";
import {
  defaultMaximumSprintStoryPoints,
  defaultSprintDuration,
} from "~/lib/defaultProjectValues";
import { getTodoStatusTag } from "./tasks";

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

export const getProjectRef = (projectId: string, firestore: Firestore) => {
  return firestore.collection("projects").doc(projectId);
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
  return { id: tag.id, ...TagSchema.parse(tag.data()) } as WithId<Tag>;
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
        .orderBy("name")
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
        .orderBy("orderIndex")
        .get();
      const statusTypesData = statusTypes.docs.map((doc) => ({
        id: doc.id,
        ...StatusTagSchema.parse(doc.data()),
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
      const newLink = await fetchHTML(link).then(
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
  removeLink: protectedProcedure
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
  addFiles: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        files: z.array(
          z.object({
            name: z.string(),
            type: z.string(),
            content: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, files } = input;
      const projectSettingsRef = getProjectSettingsRef(
        projectId,
        ctx.firestore,
      );

      const b64Files = files.map((file) => file.content);
      const fileText = await fetchMultipleFiles(b64Files);

      const filesDecoded = files.map((file, index) => ({
        name: file.name,
        type: file.type,
        content: fileText[index] ?? "",
      }));

      const settings = await projectSettingsRef.get();
      const settingsData = SettingsSchema.parse(settings.data());
      const newFiles = [...settingsData.aiContext.files, ...filesDecoded];
      await projectSettingsRef.update({
        aiContext: {
          ...settingsData.aiContext,
          files: newFiles,
        },
      });
    }),
  removeFile: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        file: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, file } = input;
      const projectSettingsRef = getProjectSettingsRef(
        projectId,
        ctx.firestore,
      );
      const settings = await projectSettingsRef.get();
      const settingsData = SettingsSchema.parse(settings.data());
      // remove file from settingsData
      const newFiles = settingsData.aiContext.files.filter(
        (f) => f.name !== file,
      );
      await projectSettingsRef.update({
        aiContext: {
          ...settingsData.aiContext,
          files: newFiles,
        },
      });
    }),

  getSizeTypes: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const projectSettingsRef = ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("settings")
        .doc("settings");

      const settingsSnap = await projectSettingsRef.get();

      const settingsData = SettingsSchema.parse(settingsSnap.data());

      return Array.isArray(settingsData.Size) ? settingsData.Size : [];
    }),
  
  changeSize: protectedProcedure
    .input(z.object({ projectId: z.string(), size: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      const { projectId, size } = input;
      const projectSettingsRef = ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("settings")
        .doc("settings");

      const settingsSnap = await projectSettingsRef.get();

      const settingsData = SettingsSchema.parse(settingsSnap.data());

      await projectSettingsRef.update({
        Size: size,
      });
    }
  ),
  getDetailedRoles: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const roles = await ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("settings")
        .doc("settings")
        .collection("userTypes")
        .orderBy("label")
        .get();

      const rolesData = roles.docs.map((doc) => {
        const data = doc.data();
        const role = RoleSchema.parse(data);
        return {
          id: doc.id,
          ...role,
          ...role.tabs,
        } as RoleDetail;
      });
      return rolesData;
    }),
  addRole: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        label: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, label } = input;
      // add the role document to the roles collection
      const projectSettingsRef = getProjectSettingsRef(
        projectId,
        ctx.firestore,
      );
      const roleDoc = await projectSettingsRef.collection("userTypes").add({
        ...emptyRole,
        label,
        id: undefined,
      });
    }),
  removeRole: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        roleId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, roleId } = input;
      // remove the role document from the roles collection
      const projectSettingsRef = getProjectSettingsRef(
        projectId,
        ctx.firestore,
      );

      // Check if any user has this role
      const usersWithRole = await ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("users")
        .where("roleId", "==", roleId)
        .get();

      if (!usersWithRole.empty) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      await projectSettingsRef.collection("userTypes").doc(roleId).delete();
    }),
  updateRoleTabPermissions: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        roleId: z.string(),
        tabId: z.string(),
        permission: PermissionSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, roleId, tabId, permission } = input;

      const roleDoc = ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("settings")
        .doc("settings")
        .collection("userTypes")
        .doc(roleId);

      const roleData = await roleDoc.get();
      const role = RoleSchema.parse(roleData.data());
      const updatedTabs = {
        ...role.tabs,
        [tabId]: permission,
      };
      await roleDoc.update({
        tabs: updatedTabs,
      });
    }),
  updateViewPerformance: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        roleId: z.string(),
        newValue: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, roleId, newValue } = input;

      const roleDoc = ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("settings")
        .doc("settings")
        .collection("userTypes")
        .doc(roleId);

      const roleData = await roleDoc.get();
      const role = RoleSchema.parse(roleData.data());
      await roleDoc.update({
        canViewPerformance: newValue,
      });
    }),
  updateControlSprints: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        roleId: z.string(),
        newValue: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, roleId, newValue } = input;

      const roleDoc = ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("settings")
        .doc("settings")
        .collection("userTypes")
        .doc(roleId);

      const roleData = await roleDoc.get();
      const role = RoleSchema.parse(roleData.data());
      await roleDoc.update({
        canControlSprints: newValue,
      });
    }),
  getMyRole: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.uid;

      if (!input.projectId) return ownerRole;

      const userDoc = await ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("users")
        .doc(userId)
        .get();
      if (!userDoc.exists) {
        throw new Error("User not found");
      }
      const userData = userDoc.data();
      if (!userData) {
        throw new Error("User data not found");
      }

      if (userData.roleId == null) {
        return emptyRole;
      }

      if (userData.roleId === "owner") {
        return ownerRole;
      }

      // Get role
      const roleDoc = await ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("settings")
        .doc("settings")
        .collection("userTypes")
        .doc(userData.roleId as string)
        .get();
      if (!roleDoc.exists) {
        throw new Error("Role not found");
      }
      const roleData = roleDoc.data();
      if (!roleData) {
        throw new Error("Role data not found");
      }
      const role = RoleSchema.parse(roleData);
      const roleId = roleDoc.id;
      return {
        id: roleId,
        ...role,
      };
    }),
  getTodoTag: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      const todoStatus = await getTodoStatusTag(
        getProjectSettingsRef(projectId, ctx.firestore),
      );
      return todoStatus;
    }),
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

    fetchDefaultSprintDuration: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const projectSprintDuration = await ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("settings")
        .select("sprintDuration")
        .limit(1)
        .get();

      return (
        (projectSprintDuration.docs[0]?.data().sprintDuration as number) ?? 7
      );
    }),
});

export default settingsRouter;
