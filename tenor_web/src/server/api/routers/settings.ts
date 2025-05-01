import {
  PermissionSchema,
  RoleSchema,
  SettingsSchema,
  StatusTagSchema,
  TagSchema,
} from "~/lib/types/zodFirebaseSchema";
import z, { number } from "zod";
import type { Firestore } from "firebase-admin/firestore";
import { Tag, WithId } from "~/lib/types/firebaseSchemas";
import { fetchHTML } from "~/utils/webcontent";
import { fetchMultipleFiles, fetchText } from "~/utils/filecontent";
import { emptyRole, ownerRole } from "~/lib/defaultProjectValues";
import { remove } from "node_modules/cypress/types/lodash";
import { type RoleDetail } from "~/lib/types/detailSchemas";
import { TRPCError } from "@trpc/server";
import {
  defaultMaximumSprintStoryPoints,
  defaultSprintDuration,
} from "~/lib/defaultProjectValues";
import { getTodoStatusTag } from "./tasks";
import {
  createTRPCRouter,
  protectedProcedure,
  roleRequiredProcedure,
} from "../trpc";

export const getProjectUserRef = (
  projectId: string,
  userId: string,
  firestore: Firestore,
) => {
  return firestore
    .collection("projects")
    .doc(projectId)
    .collection("users")
    .doc(userId);
};

export const getProjectRoleRef = (
  projectId: string,
  roleId: string,
  firestore: Firestore,
) => {
  return firestore
    .collection("projects")
    .doc(projectId)
    .collection("settings")
    .doc("settings")
    .collection("userTypes")
    .doc(roleId);
};

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

  getStatusTypeById: protectedProcedure
    .input(z.object({ projectId: z.string(), statusId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId, statusId } = input;
      const projectSettingsRef = getProjectSettingsRef(
        projectId,
        ctx.firestore,
      );
      const statusType = await projectSettingsRef
        .collection("statusTypes")
        .doc(statusId)
        .get();
      if (!statusType.exists) {
        throw new Error("Status not found");
      }
      const statusTypeData = StatusTagSchema.parse(statusType.data());
      return { id: statusType.id, ...statusTypeData };
    }),

  createStatusType: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string(),
        color: z.string(),
        marksTaskAsDone: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, name, color, marksTaskAsDone } = input;

      const projectSettingsRef = getProjectSettingsRef(
        input.projectId,
        ctx.firestore,
      );

      const statusCollectionRef = projectSettingsRef.collection("statusTypes");

      const statusTypes = await statusCollectionRef.get();

      const statusTypesData = statusTypes.docs.map((doc) => ({
        id: doc.id,
        ...StatusTagSchema.parse(doc.data()),
      }));
      const biggestOrderIndex = Math.max(
        ...statusTypesData.map((status) => status.orderIndex),
        0,
      );

      const newStatus = {
        name,
        color: color.toUpperCase(),
        marksTaskAsDone,
        deleted: false,
        orderIndex: biggestOrderIndex + 1,
      };

      const docRef = await statusCollectionRef.add(newStatus);
      return {
        id: docRef.id,
        ...newStatus,
      };
    }),

  modifyStatusType: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        statusId: z.string(),
        status: StatusTagSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, statusId, status } = input;
      const projectRef = getProjectSettingsRef(projectId, ctx.firestore);
      const statusTypeRef = projectRef.collection("statusTypes").doc(statusId);
      await statusTypeRef.update(status);
      const updatedStatus = await statusTypeRef.get();
      return { ...status, id: updatedStatus.id };
    }),

  deleteStatusType: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        statusId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, statusId } = input;
      const projectRef = getProjectSettingsRef(projectId, ctx.firestore);
      const statusTypeRef = projectRef.collection("statusTypes").doc(statusId);
      await statusTypeRef.update({ deleted: true });
      return { id: statusId };
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

  getBacklogTagById: protectedProcedure
    .input(z.object({ projectId: z.string(), tagId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId, tagId } = input;
      const projectSettingsRef = getProjectSettingsRef(
        projectId,
        ctx.firestore,
      );
      const backlogTag = await projectSettingsRef
        .collection("backlogTags")
        .doc(tagId)
        .get();
      if (!backlogTag.exists) {
        throw new Error("Tag not found");
      }
      const backlogTagData = TagSchema.parse(backlogTag.data());
      return { id: backlogTag.id, ...backlogTagData };
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

  modifyBacklogTag: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        tagId: z.string(),
        tag: TagSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, tagId, tag } = input;
      const projectRef = getProjectSettingsRef(projectId, ctx.firestore);
      const backlogTagRef = projectRef.collection("backlogTags").doc(tagId);
      await backlogTagRef.update(tag);
      const updatedTag = await backlogTagRef.get();
      return { ...tag, id: updatedTag.id };
    }),

  deleteBacklogTag: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        tagId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, tagId } = input;
      const projectRef = getProjectSettingsRef(projectId, ctx.firestore);
      const backlogTagRef = projectRef.collection("backlogTags").doc(tagId);
      await backlogTagRef.update({ deleted: true });
      return { id: tagId };
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
        parameter: z.string(),
        permission: PermissionSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, roleId, parameter, permission } = input;

      const roleDoc = getProjectRoleRef(input.projectId, roleId, ctx.firestore);

      const roleData = await roleDoc.get();
      const role = RoleSchema.parse(roleData.data());
      await roleDoc.update({
        ...role,
        [parameter]: permission,
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

      const roleDoc = getProjectRoleRef(input.projectId, roleId, ctx.firestore);

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

      const roleDoc = getProjectRoleRef(input.projectId, roleId, ctx.firestore);

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

      const userDoc = await getProjectUserRef(
        input.projectId,
        userId,
        ctx.firestore,
      ).get();

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
      const roleDoc = await getProjectRoleRef(
        input.projectId,
        userData.roleId as string,
        ctx.firestore,
      ).get();
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
  testingMutationWrite: roleRequiredProcedure({
    flags: ["settings"],
    permission: "write",
  })
    .input(z.object({ projectId: z.string() }))
    .mutation(
      async ({
        ctx,
        input,
      }: {
        ctx: { firestore: Firestore };
        input: { projectId: string };
      }) => {
        const projectSettingsRef = getProjectSettingsRef(
          input.projectId,
          ctx.firestore,
        );
        const settings = await projectSettingsRef.get();
        const settingsData = SettingsSchema.parse(settings.data());
        return settingsData;
      },
    ),
  testingMutationRead: roleRequiredProcedure({
    flags: ["settings"],
    permission: "read",
  })
    .input(z.object({ projectId: z.string() }))
    .mutation(
      async ({
        ctx,
        input,
      }: {
        ctx: { firestore: Firestore };
        input: { projectId: string };
      }) => {
        const projectSettingsRef = getProjectSettingsRef(
          input.projectId,
          ctx.firestore,
        );
        const settings = await projectSettingsRef.get();
        const settingsData = SettingsSchema.parse(settings.data());
        return settingsData;
      },
    ),
});

export default settingsRouter;
