/**
 * Settings - Tenor API Endpoints for Settings Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing Settings in the Tenor application.
 * It provides endpoints to create, modify, and retrieve settings.
 *
 * @category API
 */

import {
  PermissionSchema,
  RoleSchema,
  SettingsSchema,
  StatusTagSchema,
  TagSchema,
} from "~/lib/types/zodFirebaseSchema";
import z from "zod";
import { fetchHTML } from "~/server/api/lib/webcontent";
import { fetchMultipleFiles } from "~/lib/helpers/filecontent";
import { type RoleDetail } from "~/lib/types/detailSchemas";
import { defaultSprintDuration } from "~/lib/defaultValues/project";
import {
  createTRPCRouter,
  protectedProcedure,
  roleRequiredProcedure,
} from "../trpc";
import {
  generalPermissions,
  settingsPermissions,
  tagPermissions,
} from "~/lib/defaultValues/permission";
import type {
  StatusTag,
  Tag,
  WithId,
  FileWithTokens,
} from "~/lib/types/firebaseSchemas";
import {
  getBacklogTag,
  getBacklogTagRef,
  getBacklogTags,
  getBacklogTagsRef,
  getPriorities,
  getPriority,
  getStatusType,
  getStatusTypeRef,
  getStatusTypes,
  getStatusTypesRef,
  getTodoStatusTag,
} from "../shortcuts/tags";
import {
  getProjectDetailedRoles,
  getRoleRef,
  getRolesRef,
  getSettings,
  getSettingsRef,
} from "../shortcuts/general";
import { getUserRef } from "../shortcuts/users";
import { emptyRole, ownerRole } from "~/lib/defaultValues/roles";
import { countTokens } from "~/lib/aiTools/aiGeneration";
import { internalServerError } from "~/server/errors";

export interface Links {
  link: string;
  content: string | null;
}

const settingsRouter = createTRPCRouter({
  /**
   * @procedure getPriorityTypes
   * @description Retrieves all priority types for a project
   * @input {object} input - Input parameters
   * @input {string} input.projectId - The ID of the project
   * @returns {Tag[]} An array of priority type tags
   */
  getPriorityTypes: roleRequiredProcedure(generalPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      return await getPriorities(ctx.firestore, projectId);
    }),

  /**
   * @procedure getPriorityType
   * @description Retrieves a specific priority type by its ID within a project
   * @input {object} input - Input parameters
   * @input {string} input.projectId - The ID of the project
   * @input {string} input.priorityId - The ID of the priority type
   * @returns {Tag} The priority type tag
   */
  getPriorityType: roleRequiredProcedure(generalPermissions, "read")
    .input(z.object({ projectId: z.string(), priorityId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId, priorityId } = input;
      return await getPriority(ctx.firestore, projectId, priorityId);
    }),

  /**
   * @procedure getStatusTypes
   * @description Retrieves all status types for a project
   * @input {object} input - Input parameters
   * @input {string} input.projectId - The ID of the project
   * @returns {WithId<StatusTag>[]} An array of status type tags
   */
  getStatusTypes: roleRequiredProcedure(generalPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      return await getStatusTypes(ctx.firestore, projectId);
    }),

  /**
   * @procedure getStatusType
   * @description Retrieves a specific status type by its ID within a project
   * @input {object} input - Input parameters
   * @input {string} input.projectId - The ID of the project
   * @input {string} input.statusId - The ID of the status type
   * @returns {WithId<StatusTag>} The status type tag
   */
  getStatusType: roleRequiredProcedure(generalPermissions, "read")
    .input(z.object({ projectId: z.string(), statusId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId, statusId } = input;
      return await getStatusType(ctx.firestore, projectId, statusId);
    }),

  /**
   * @procedure createStatusType
   * @description Creates a new status type tag for a project
   * @input {object} input - Input parameters
   * @input {string} input.projectId - The ID of the project
   * @input {object} input.tagData - The tag data conforming to StatusTagSchema
   * @returns {WithId<StatusTag>} The created status type tag with its ID
   */
  createStatusType: roleRequiredProcedure(tagPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        tagData: StatusTagSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, tagData } = input;
      const statusTypesRef = getStatusTypesRef(ctx.firestore, projectId);
      const activeStatusTypes = await statusTypesRef
        .where("deleted", "==", false)
        .orderBy("orderIndex")
        .get();

      // FIXME: Does this work?
      const newOrderIndex = activeStatusTypes.size;

      const newStatus = {
        ...tagData,
        orderIndex: newOrderIndex,
      };

      const docRef = await statusTypesRef.add(newStatus);

      return {
        id: docRef.id,
        ...newStatus,
      } as WithId<StatusTag>;
    }),

  reorderStatusTypes: roleRequiredProcedure(tagPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        statusIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, statusIds } = input;

      const batch = ctx.firestore.batch();
      statusIds.forEach((statusId, index) => {
        const statusTypeRef = getStatusTypeRef(
          ctx.firestore,
          projectId,
          statusId,
        );
        batch.update(statusTypeRef, { orderIndex: index });
      });
      await batch.commit();
    }),

  modifyStatusType: roleRequiredProcedure(tagPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        statusId: z.string(),
        status: StatusTagSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, statusId, status } = input;
      const statusTypeRef = getStatusTypeRef(
        ctx.firestore,
        projectId,
        statusId,
      );
      await statusTypeRef.update(status);
      const updatedStatus = await statusTypeRef.get();
      return { ...status, id: updatedStatus.id } as WithId<StatusTag>;
    }),

  deleteStatusType: roleRequiredProcedure(tagPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        statusId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, statusId } = input;

      await getStatusTypeRef(ctx.firestore, projectId, statusId).update({
        deleted: true,
        orderIndex: -1,
      });

      const activeStatusTypes = await getStatusTypesRef(
        ctx.firestore,
        projectId,
      )
        .where("deleted", "==", false)
        .orderBy("orderIndex")
        .get();

      const batch = ctx.firestore.batch();
      activeStatusTypes.docs.forEach((doc, index) => {
        batch.update(doc.ref, { orderIndex: index });
      });
      await batch.commit();
    }),

  /**
   * @procedure getBacklogTags
   * @description Retrieves all non-deleted backlog tags for a project
   * @input {object} input - Input parameters
   * @input {string} input.projectId - The ID of the project
   * @returns {WithId<Tag>[]} An array of backlog tags
   */
  getBacklogTags: roleRequiredProcedure(tagPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      return await getBacklogTags(ctx.firestore, projectId);
    }),

  getBacklogTag: roleRequiredProcedure(tagPermissions, "read")
    .input(z.object({ projectId: z.string(), tagId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId, tagId } = input;
      return await getBacklogTag(ctx.firestore, projectId, tagId);
    }),

  /**
   * @procedure createBacklogTag
   * @description Creates a new backlog tag for a project
   * @input {object} input - Input parameters
   * @input {string} input.projectId - The ID of the project
   * @input {object} input.tag - The tag data conforming to TagSchema
   * @returns {WithId<Tag>} The created backlog tag with its ID
   */
  createBacklogTag: roleRequiredProcedure(tagPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        tagData: TagSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, tagData } = input;
      const backlogTagsRef = getBacklogTagsRef(ctx.firestore, projectId);
      const backlogTagDoc = await backlogTagsRef.add({
        ...tagData,
        deleted: false,
      });
      return {
        id: backlogTagDoc.id,
        ...tagData,
      } as WithId<Tag>;
    }),

  modifyBacklogTag: roleRequiredProcedure(tagPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        tagId: z.string(),
        tagData: TagSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, tagId, tagData } = input;
      const backlogTagRef = getBacklogTagRef(ctx.firestore, projectId, tagId);
      await backlogTagRef.update(tagData);
    }),

  deleteBacklogTag: roleRequiredProcedure(tagPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        tagId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, tagId } = input;
      const backlogTagRef = getBacklogTagRef(ctx.firestore, projectId, tagId);
      await backlogTagRef.update({
        deleted: true,
      });
    }),

  getSizeTypes: roleRequiredProcedure(tagPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      const settingsSnap = await getSettingsRef(ctx.firestore, projectId).get();
      const settingsData = SettingsSchema.parse(settingsSnap.data());
      return Array.isArray(settingsData.Size) ? settingsData.Size : [];
    }),

  changeSize: roleRequiredProcedure(tagPermissions, "write")
    .input(z.object({ projectId: z.string(), size: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      const { projectId, size } = input;
      const projectSettingsRef = getSettingsRef(ctx.firestore, projectId);
      await projectSettingsRef.update({
        Size: size,
      });
    }),
  getDetailedRoles: roleRequiredProcedure(settingsPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const rolesData = await getProjectDetailedRoles(
        ctx.firestore,
        input.projectId,
      );
      return rolesData;
    }),
  addRole: roleRequiredProcedure(settingsPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        label: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, label } = input;
      // add the role document to the roles collection
      await getRolesRef(ctx.firestore, projectId).add({
        ...emptyRole,
        id: undefined,
        label,
      });
    }),
  removeRole: roleRequiredProcedure(settingsPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        roleId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, roleId } = input;
      await getRoleRef(ctx.firestore, projectId, roleId).delete();
    }),
  updateRoleTabPermissions: roleRequiredProcedure(settingsPermissions, "write")
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
      const roleDoc = getRoleRef(ctx.firestore, projectId, roleId);
      await roleDoc.update({
        [parameter]: permission,
      });
    }),
  getMyRole: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.uid;

      if (!input.projectId) return ownerRole;

      const userRef = getUserRef(ctx.firestore, input.projectId, userId);
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
      const roleDoc = await getRoleRef(
        ctx.firestore,
        input.projectId,
        userData.roleId as string,
      ).get();
      if (!roleDoc.exists) {
        throw new Error("Role not found");
      }
      const roleData = roleDoc.data();
      if (!roleData) {
        throw new Error("Role data not found");
      }

      return {
        id: roleDoc.id,
        ...RoleSchema.parse(roleData),
      } as WithId<RoleDetail>;
    }),
  getTodoTag: roleRequiredProcedure(tagPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      return await getTodoStatusTag(ctx.firestore, projectId);
    }),
  fetchScrumSettings: roleRequiredProcedure(settingsPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      const settingsDocs = await getSettingsRef(ctx.firestore, projectId).get();
      const data = settingsDocs.data();
      const scrumSettings = {
        sprintDuration: (data?.sprintDuration ??
          defaultSprintDuration) as number,
      };
      return scrumSettings;
    }),
  updateScrumSettings: roleRequiredProcedure(settingsPermissions, "read")
    .input(
      z.object({
        projectId: z.string(),
        days: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, days } = input;
      const settingsRef = getSettingsRef(ctx.firestore, projectId);
      await settingsRef.update({
        sprintDuration: days,
      });
    }),

  getContextLinks: roleRequiredProcedure(settingsPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const projectSettingsRef = getSettingsRef(ctx.firestore, input.projectId);
      const settings = await projectSettingsRef.get();
      const settingsData = SettingsSchema.parse(settings.data());
      const links = settingsData.aiContext.links.map((link) => ({
        link: link.link,
        valid: link.content !== null,
      }));
      return links;
    }),

  getContextFiles: roleRequiredProcedure(settingsPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      const settings = await getSettings(ctx.firestore, projectId);

      const files: FileWithTokens[] = await Promise.all(
        settings.aiContext.files.map(async (file) => {
          return {
            name: file.name,
            type: file.type,
            content: file.content,
            tokenCount: await countTokens(file.content),
            // Dummy File properties to satisfy the File interface
            size: file.content.length,
            lastModified: Date.now(),
            webkitRelativePath: "",
            arrayBuffer: async () => new ArrayBuffer(0),
            bytes: async () => new Uint8Array(0),
            slice: () => new Blob(),
            stream: () => new ReadableStream(),
            text: async () => file.content,
          };
        }),
      );

      return files;
    }),
  getContextDialog: roleRequiredProcedure(settingsPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      const settings = await getSettings(ctx.firestore, projectId);
      const text: string = settings.aiContext.text;
      return text;
    }),
  updateTextContext: roleRequiredProcedure(settingsPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        text: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, text } = input;
      const projectSettingsRef = getSettingsRef(ctx.firestore, projectId);
      await projectSettingsRef.update({
        aiContext: {
          text,
        },
      });
    }),
  addLink: roleRequiredProcedure(settingsPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        link: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, link } = input;
      const settingsData = await getSettings(ctx.firestore, projectId);

      const newLink = await fetchHTML(link).then(
        (content) => ({ link, content }),
        (error) => {
          console.error("Error fetching HTML:", error);
          return { link, content: null };
        },
      );

      // FIXME: Use FieldValue.arrayUnion to update
      const newLinks = [...settingsData.aiContext.links, newLink];
      try {
        await getSettingsRef(ctx.firestore, projectId).update({
          aiContext: {
            ...settingsData.aiContext,
            links: newLinks,
          },
        });
      } catch {
        const newLinks = [
          ...settingsData.aiContext.links.filter(
            (l) => l.link !== newLink.link,
          ),
          { link: newLink.link, content: null },
        ];

        await getSettingsRef(ctx.firestore, projectId).update({
          aiContext: {
            ...settingsData.aiContext,
            links: newLinks,
          },
        });
        throw internalServerError(`Failed to add link ${link}`);
      }
    }),
  removeLink: roleRequiredProcedure(settingsPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        link: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, link } = input;
      const settingsData = await getSettings(ctx.firestore, projectId);
      const newLinks = settingsData.aiContext.links.filter(
        (l) => l.link !== link,
      );
      await getSettingsRef(ctx.firestore, projectId).update({
        aiContext: {
          ...settingsData.aiContext,
          links: newLinks,
        },
      });
    }),
  addFiles: roleRequiredProcedure(settingsPermissions, "write")
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
      const settingsData = await getSettings(ctx.firestore, projectId);

      const b64Files = files.map((file) => file.content);
      const fileText = await fetchMultipleFiles(b64Files);

      const filesDecoded = files.map((file, index) => ({
        name: file.name,
        type: file.type,
        content: fileText[index] ?? "",
        size: file.size,
      }));

      const newFiles = [...settingsData.aiContext.files, ...filesDecoded];
      await getSettingsRef(ctx.firestore, projectId).update({
        aiContext: {
          ...settingsData.aiContext,
          files: newFiles,
        },
      });
    }),
  removeFile: roleRequiredProcedure(settingsPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        file: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, file } = input;
      const settingsData = await getSettings(ctx.firestore, projectId);
      const newFiles = settingsData.aiContext.files.filter(
        (f) => f.name !== file,
      );
      await getSettingsRef(ctx.firestore, projectId).update({
        aiContext: {
          ...settingsData.aiContext,
          files: newFiles,
        },
      });
    }),
});

export default settingsRouter;
