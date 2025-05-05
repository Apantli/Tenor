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

/**
 * Retrieves all priority types for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to fetch priority types from
 *
 * @returns Array of priority type tags.
 *
 * @http GET /api/trpc/settings.getPriorityTypes
 */
export const getPriorityTypesProcedure = protectedProcedure
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
  });

/**
 * Retrieves all status types for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to fetch status types from
 *
 * @returns Array of status type tags.
 *
 * @http GET /api/trpc/settings.getStatusTypes
 */
export const getStatusTypesProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const projectSettingsRef = getProjectSettingsRef(
      input.projectId,
      ctx.firestore,
    );
    const statusTypes = await projectSettingsRef
      .collection("statusTypes")
      .where("deleted", "==", false)
      .orderBy("orderIndex")
      .get();

    const statusTypesData = statusTypes.docs.map((doc) => ({
      id: doc.id,
      ...StatusTagSchema.parse(doc.data()),
    }));

    return statusTypesData;
  });

/**
 * Retrieves a specific status type by its ID.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the status type
 * - statusId — ID of the status type to fetch
 *
 * @returns Status type object with its details.
 *
 * @http GET /api/trpc/settings.getStatusTypeById
 */
export const getStatusTypeByIdProcedure = protectedProcedure
  .input(z.object({ projectId: z.string(), statusId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId, statusId } = input;
    const projectSettingsRef = getProjectSettingsRef(projectId, ctx.firestore);
    const statusType = await projectSettingsRef
      .collection("statusTypes")
      .doc(statusId)
      .get();
    if (!statusType.exists) {
      throw new Error("Status not found");
    }
    const statusTypeData = StatusTagSchema.parse(statusType.data());
    return { id: statusType.id, ...statusTypeData };
  });

/**
 * Creates a new status type for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to create the status type in
 * - name — Name of the status type
 * - color — Color of the status type
 * - marksTaskAsDone — Whether the status marks a task as done
 *
 * @returns Object containing the created status type with its ID.
 *
 * @http POST /api/trpc/settings.createStatusType
 */
export const createStatusTypeProcedure = protectedProcedure
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

    const activeStatusTypes = await statusCollectionRef
      .where("deleted", "==", false)
      .orderBy("orderIndex")
      .get();

    const newOrderIndex = activeStatusTypes.size;

    const newStatus = {
      name,
      color: color.toUpperCase(),
      marksTaskAsDone,
      deleted: false,
      orderIndex: newOrderIndex,
    };

    const docRef = await statusCollectionRef.add(newStatus);

    return {
      id: docRef.id,
      ...newStatus,
    };
  });

/**
 * Reorders status types for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to reorder status types in
 * - statusIds — Array of status type IDs in the desired order
 *
 * @returns Void.
 *
 * @http PUT /api/trpc/settings.reorderStatusTypes
 */
export const reorderStatusTypesProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      statusIds: z.array(z.string()),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, statusIds } = input;
    const projectRef = getProjectSettingsRef(projectId, ctx.firestore);
    const batch = ctx.firestore.batch();

    statusIds.forEach((statusId, index) => {
      const statusTypeRef = projectRef.collection("statusTypes").doc(statusId);
      batch.update(statusTypeRef, { orderIndex: index });
    });

    await batch.commit();
  });

/**
 * Modifies an existing status type in a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the status type
 * - statusId — ID of the status type to modify
 * - status — Updated status type data
 *
 * @returns Object containing the updated status type with its ID.
 *
 * @http PUT /api/trpc/settings.modifyStatusType
 */
export const modifyStatusTypeProcedure = protectedProcedure
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
  });

/**
 * Deletes a status type from a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the status type
 * - statusId — ID of the status type to delete
 *
 * @returns Object containing the ID of the deleted status type.
 *
 * @http DELETE /api/trpc/settings.deleteStatusType
 */
export const deleteStatusTypeProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      statusId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, statusId } = input;
    const projectRef = getProjectSettingsRef(projectId, ctx.firestore);
    const statusCollectionRef = projectRef.collection("statusTypes");

    await statusCollectionRef.doc(statusId).update({
      deleted: true,
      orderIndex: -1,
    });

    const activeStatusTypes = await statusCollectionRef
      .where("deleted", "==", false)
      .orderBy("orderIndex")
      .get();

    const batch = ctx.firestore.batch();

    activeStatusTypes.docs.forEach((doc, index) => {
      batch.update(doc.ref, { orderIndex: index });
    });

    await batch.commit();
    return { id: statusId };
  });

/**
 * Retrieves all backlog tags for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to fetch backlog tags from
 *
 * @returns Array of backlog tags.
 *
 * @http GET /api/trpc/settings.getBacklogTags
 */
export const getBacklogTagsProcedure = protectedProcedure
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
  });

/**
 * Retrieves a specific backlog tag by its ID.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the backlog tag
 * - tagId — ID of the backlog tag to fetch
 *
 * @returns Backlog tag object with its details.
 *
 * @http GET /api/trpc/settings.getBacklogTagById
 */
export const getBacklogTagByIdProcedure = protectedProcedure
  .input(z.object({ projectId: z.string(), tagId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId, tagId } = input;
    const projectSettingsRef = getProjectSettingsRef(projectId, ctx.firestore);
    const backlogTag = await projectSettingsRef
      .collection("backlogTags")
      .doc(tagId)
      .get();
    if (!backlogTag.exists) {
      throw new Error("Tag not found");
    }
    const backlogTagData = TagSchema.parse(backlogTag.data());
    return { id: backlogTag.id, ...backlogTagData };
  });

/**
 * Creates a new backlog tag for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to create the backlog tag in
 * - tag — Tag data conforming to TagSchema
 *
 * @returns Object containing the created backlog tag with its ID.
 *
 * @http POST /api/trpc/settings.createBacklogTag
 */
export const createBacklogTagProcedure = protectedProcedure
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
  });

/**
 * Modifies an existing backlog tag in a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the backlog tag
 * - tagId — ID of the backlog tag to modify
 * - tag — Updated tag data conforming to TagSchema
 *
 * @returns Object containing the updated backlog tag with its ID.
 *
 * @http PUT /api/trpc/settings.modifyBacklogTag
 */
export const modifyBacklogTagProcedure = protectedProcedure
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
  });

/**
 * Deletes a backlog tag from a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the backlog tag
 * - tagId — ID of the backlog tag to delete
 *
 * @returns Object containing the ID of the deleted backlog tag.
 *
 * @http DELETE /api/trpc/settings.deleteBacklogTag
 */
export const deleteBacklogTagProcedure = protectedProcedure
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
  });

/**
 * Creates a new requirement type tag for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to create the requirement type tag in
 * - tag — Tag data conforming to TagSchema
 *
 * @returns Object containing the created requirement type tag with its ID.
 *
 * @http POST /api/trpc/settings.createRequirementType
 */
export const createRequirementTypeProcedure = protectedProcedure
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
  });

/**
 * Creates a new requirement focus tag for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to create the requirement focus tag in
 * - tag — Tag data conforming to TagSchema
 *
 * @returns Object containing the created requirement focus tag with its ID.
 *
 * @http POST /api/trpc/settings.createRequirementFocus
 */
export const createRequirementFocusProcedure = protectedProcedure
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
  });

/**
 * Retrieves all size types for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to fetch size types from
 *
 * @returns Array of size types.
 *
 * @http GET /api/trpc/settings.getSizeTypes
 */
export const getSizeTypesProcedure = protectedProcedure
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
  });

/**
 * Updates the size types for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to update size types in
 * - size — Array of size values
 *
 * @returns Void.
 *
 * @http PUT /api/trpc/settings.changeSize
 */
export const changeSizeProcedure = protectedProcedure
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
  });

/**
 * Retrieves detailed roles for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to fetch roles from
 *
 * @returns Array of roles with their details.
 *
 * @http GET /api/trpc/settings.getDetailedRoles
 */
export const getDetailedRolesProcedure = protectedProcedure
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
  });

/**
 * Adds a new role to a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to add the role to
 * - label — Label of the new role
 *
 * @returns Void.
 *
 * @http POST /api/trpc/settings.addRole
 */
export const addRoleProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      label: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, label } = input;
    // add the role document to the roles collection
    const projectSettingsRef = getProjectSettingsRef(projectId, ctx.firestore);
    const roleDoc = await projectSettingsRef.collection("userTypes").add({
      ...emptyRole,
      label,
      id: undefined,
    });
  });

/**
 * Removes a role from a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the role
 * - roleId — ID of the role to remove
 *
 * @returns Void.
 *
 * @http DELETE /api/trpc/settings.removeRole
 */
export const removeRoleProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      roleId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, roleId } = input;
    // remove the role document from the roles collection
    const projectSettingsRef = getProjectSettingsRef(projectId, ctx.firestore);

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
  });

/**
 * Updates role tab permissions for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the role
 * - roleId — ID of the role to update
 * - parameter — The permission parameter to update
 * - permission — The new permission value
 *
 * @returns Void.
 *
 * @http PUT /api/trpc/settings.updateRoleTabPermissions
 */
export const updateRoleTabPermissionsProcedure = protectedProcedure
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
  });

/**
 * Updates the view performance permission for a role.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the role
 * - roleId — ID of the role to update
 * - newValue — The new permission value
 *
 * @returns Void.
 *
 * @http PUT /api/trpc/settings.updateViewPerformance
 */
export const updateViewPerformanceProcedure = protectedProcedure
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
  });

/**
 * Updates the control sprints permission for a role.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the role
 * - roleId — ID of the role to update
 * - newValue — The new permission value
 *
 * @returns Void.
 *
 * @http PUT /api/trpc/settings.updateControlSprints
 */
export const updateControlSprintsProcedure = protectedProcedure
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
  });

/**
 * Retrieves the current user's role for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to fetch the role from
 *
 * @returns Role object with its details.
 *
 * @http GET /api/trpc/settings.getMyRole
 */
export const getMyRoleProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const userId = ctx.session.uid;

    if (!input.projectId) return ownerRole;

    const userRef = getProjectUserRef(input.projectId, userId, ctx.firestore);
    const userDoc = await userRef.get();

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
  });

/**
 * Retrieves the "to do" status tag for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to fetch the todo tag from
 *
 * @returns Todo status tag object with its details.
 *
 * @http GET /api/trpc/settings.getTodoTag
 */
export const getTodoTagProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    const todoStatus = await getTodoStatusTag(
      getProjectSettingsRef(projectId, ctx.firestore),
    );
    return todoStatus;
  });

/**
 * Retrieves Scrum settings for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to fetch Scrum settings from
 *
 * @returns Object containing Scrum settings:
 * - sprintDuration — Duration of sprints in days
 * - maximumSprintStoryPoints — Maximum story points per sprint
 *
 * @http GET /api/trpc/settings.fetchScrumSettings
 */
export const fetchScrumSettingsProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    const settingsDocs = await getProjectSettingsRef(
      projectId,
      ctx.firestore,
    ).get();
    const data = settingsDocs.data();
    const scrumSettings = {
      sprintDuration: (data?.sprintDuration ?? defaultSprintDuration) as number,
      maximumSprintStoryPoints: (data?.maximumSprintStoryPoints ??
        defaultMaximumSprintStoryPoints) as number,
    };

    return scrumSettings;
  });

/**
 * Updates Scrum settings for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to update Scrum settings for
 * - days — New sprint duration in days
 * - points — New maximum story points per sprint
 *
 * @returns Object indicating success status.
 *
 * @http PUT /api/trpc/settings.updateScrumSettings
 */
export const updateScrumSettingsProcedure = protectedProcedure
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
  });

/**
 * Retrieves the default sprint duration for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to fetch the default sprint duration from
 *
 * @returns Default sprint duration in days.
 *
 * @http GET /api/trpc/settings.fetchDefaultSprintDuration
 */
export const fetchDefaultSprintDurationProcedure = protectedProcedure
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
  });

/**
 * Retrieves all context links for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to fetch context links from
 *
 * @returns Array of context links.
 *
 * @http GET /api/trpc/settings.getContextLinks
 */
export const getContextLinksProcedure = protectedProcedure
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
  });

/**
 * Retrieves all context files for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to fetch context files from
 *
 * @returns Array of context files with their name, type, and size.
 *
 * @http GET /api/trpc/settings.getContextFiles
 */
export const getContextFilesProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const projectSettingsRef = getProjectSettingsRef(
      input.projectId,
      ctx.firestore,
    );
    const settings = await projectSettingsRef.get();
    const settingsData = SettingsSchema.parse(settings.data());
    const files: { name: string; type: string; size: number }[] =
      settingsData.aiContext.files.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
      }));
    return files;
  });

/**
 * Retrieves the context dialog text for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to fetch context dialog text from
 *
 * @returns Context dialog text.
 *
 * @http GET /api/trpc/settings.getContextDialog
 */
export const getContextDialogProcedure = protectedProcedure
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
  });

/**
 * Updates the context dialog text for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to update context dialog text in
 * - text — New context dialog text
 *
 * @returns Void.
 *
 * @http PUT /api/trpc/settings.updateTextContext
 */
export const updateTextContextProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      text: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, text } = input;
    const projectSettingsRef = getProjectSettingsRef(projectId, ctx.firestore);
    const settings = await projectSettingsRef.get();
    const settingsData = SettingsSchema.parse(settings.data());
    await projectSettingsRef.update({
      aiContext: {
        ...settingsData.aiContext,
        text,
      },
    });
  });

/**
 * Adds a new link to the context of a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to add the link to
 * - link — URL of the link to add
 *
 * @returns Void.
 *
 * @http POST /api/trpc/settings.addLink
 */
export const addLinkProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      link: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, link } = input;
    const projectSettingsRef = getProjectSettingsRef(projectId, ctx.firestore);
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
  });

/**
 * Removes a link from the context of a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to remove the link from
 * - link — URL of the link to remove
 *
 * @returns Void.
 *
 * @http DELETE /api/trpc/settings.removeLink
 */
export const removeLinkProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      link: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, link } = input;
    const projectSettingsRef = getProjectSettingsRef(projectId, ctx.firestore);
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
  });

/**
 * Adds new files to the context of a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to add files to
 * - files — Array of files to add, each containing:
 *   - name — Name of the file
 *   - type — Type of the file
 *   - content — Base64-encoded content of the file
 *   - size — Size of the file in bytes
 *
 * @returns Void.
 *
 * @http POST /api/trpc/settings.addFiles
 */
export const addFilesProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      files: z.array(
        z.object({
          name: z.string(),
          type: z.string(),
          content: z.string(),
          size: z.number(),
        }),
      ),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, files } = input;
    const projectSettingsRef = getProjectSettingsRef(projectId, ctx.firestore);

    const b64Files = files.map((file) => file.content);
    const fileText = await fetchMultipleFiles(b64Files);

    const filesDecoded = files.map((file, index) => ({
      name: file.name,
      type: file.type,
      content: fileText[index] ?? "",
      size: file.size,
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
  });

/**
 * Removes a file from the context of a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to remove the file from
 * - file — Name of the file to remove
 *
 * @returns Void.
 *
 * @http DELETE /api/trpc/settings.removeFile
 */
export const removeFileProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      file: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, file } = input;
    const projectSettingsRef = getProjectSettingsRef(projectId, ctx.firestore);
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
  });

const settingsRouter = createTRPCRouter({
  getPriorityTypes: getPriorityTypesProcedure,
  getStatusTypes: getStatusTypesProcedure,
  getStatusTypeById: getStatusTypeByIdProcedure,
  createStatusType: createStatusTypeProcedure,
  reorderStatusTypes: reorderStatusTypesProcedure,
  modifyStatusType: modifyStatusTypeProcedure,
  deleteStatusType: deleteStatusTypeProcedure,
  getBacklogTags: getBacklogTagsProcedure,
  getBacklogTagById: getBacklogTagByIdProcedure,
  createBacklogTag: createBacklogTagProcedure,
  modifyBacklogTag: modifyBacklogTagProcedure,
  deleteBacklogTag: deleteBacklogTagProcedure,
  createRequirementType: createRequirementTypeProcedure,
  createRequirementFocus: createRequirementFocusProcedure,
  getSizeTypes: getSizeTypesProcedure,
  changeSize: changeSizeProcedure,
  getDetailedRoles: getDetailedRolesProcedure,
  addRole: addRoleProcedure,
  removeRole: removeRoleProcedure,
  updateRoleTabPermissions: updateRoleTabPermissionsProcedure,
  updateViewPerformance: updateViewPerformanceProcedure,
  updateControlSprints: updateControlSprintsProcedure,
  getMyRole: getMyRoleProcedure,
  getTodoTag: getTodoTagProcedure,
  fetchScrumSettings: fetchScrumSettingsProcedure,
  updateScrumSettings: updateScrumSettingsProcedure,
  fetchDefaultSprintDuration: fetchDefaultSprintDurationProcedure,
  getContextLinks: getContextLinksProcedure,
  getContextFiles: getContextFilesProcedure,
  getContextDialog: getContextDialogProcedure,
  updateTextContext: updateTextContextProcedure,
  addLink: addLinkProcedure,
  removeLink: removeLinkProcedure,
  addFiles: addFilesProcedure,
  removeFile: removeFileProcedure,
});

export default settingsRouter;
