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
  SettingsSchema,
  StatusTagSchema,
  TagSchema,
} from "~/lib/types/zodFirebaseSchema";
import z from "zod";
import { fetchHTML } from "~/server/api/lib/webcontent";
import { fetchMultipleFiles } from "~/lib/helpers/filecontent";
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
  getUserRole,
} from "../shortcuts/general";
import { emptyRole } from "~/lib/defaultValues/roles";
import { countTokens } from "~/lib/aiTools/aiGeneration";
import { internalServerError } from "~/server/errors";

export interface Links {
  link: string;
  content: string | null;
}

/**
 * Retrieves all priority types for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns Array of priority type tags
 *
 * @http GET /api/trpc/settings.getPriorityTypes
 */
const getPriorityTypesProcedure = roleRequiredProcedure(
  generalPermissions,
  "read",
)
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    return await getPriorities(ctx.firestore, projectId);
  });

/**
 * Retrieves a specific priority type by its ID within a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - priorityId - String ID of the priority type
 *
 * @returns The priority type tag
 *
 * @http GET /api/trpc/settings.getPriorityType
 */
const getPriorityTypeProcedure = roleRequiredProcedure(
  generalPermissions,
  "read",
)
  .input(z.object({ projectId: z.string(), priorityId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId, priorityId } = input;
    return await getPriority(ctx.firestore, projectId, priorityId);
  });

/**
 * Retrieves all status types for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - showAwaitingReview - Optional boolean to control visibility of awaiting review status
 *
 * @returns Array of status type tags
 *
 * @http GET /api/trpc/settings.getStatusTypes
 */
const getStatusTypesProcedure = roleRequiredProcedure(
  generalPermissions,
  "read",
)
  .input(
    z.object({
      projectId: z.string(),
      showAwaitingReview: z.boolean().default(false),
    }),
  )
  .query(async ({ ctx, input }) => {
    const { projectId, showAwaitingReview } = input;
    return await getStatusTypes(ctx.firestore, projectId, showAwaitingReview);
  });

/**
 * Retrieves a specific status type by its ID within a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - statusId - String ID of the status type
 *
 * @returns The status type tag
 *
 * @http GET /api/trpc/settings.getStatusType
 */
const getStatusTypeProcedure = roleRequiredProcedure(generalPermissions, "read")
  .input(z.object({ projectId: z.string(), statusId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId, statusId } = input;
    return await getStatusType(ctx.firestore, projectId, statusId);
  });

/**
 * Creates a new status type tag for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - tagData - The tag data conforming to StatusTagSchema
 *
 * @returns The created status type tag with its ID
 *
 * @http POST /api/trpc/settings.createStatusType
 */
const createStatusTypeProcedure = roleRequiredProcedure(tagPermissions, "write")
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
  });

/**
 * Reorders status types within a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - statusIds - Array of status type IDs in their new order
 *
 * @returns void
 *
 * @http POST /api/trpc/settings.reorderStatusTypes
 */
const reorderStatusTypesProcedure = roleRequiredProcedure(
  tagPermissions,
  "write",
)
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
  });

/**
 * Modifies an existing status type.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - statusId - String ID of the status type to modify
 * - status - Updated status type data
 *
 * @returns The updated status type with its ID
 *
 * @http POST /api/trpc/settings.modifyStatusType
 */
const modifyStatusTypeProcedure = roleRequiredProcedure(tagPermissions, "write")
  .input(
    z.object({
      projectId: z.string(),
      statusId: z.string(),
      status: StatusTagSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, statusId, status } = input;
    const statusTypeRef = getStatusTypeRef(ctx.firestore, projectId, statusId);
    await statusTypeRef.update(status);
    const updatedStatus = await statusTypeRef.get();
    return { ...status, id: updatedStatus.id } as WithId<StatusTag>;
  });

/**
 * Marks a status type as deleted and reorders remaining status types.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - statusId - String ID of the status type to delete
 *
 * @returns void
 *
 * @http POST /api/trpc/settings.deleteStatusType
 */
const deleteStatusTypeProcedure = roleRequiredProcedure(tagPermissions, "write")
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

    const activeStatusTypes = await getStatusTypesRef(ctx.firestore, projectId)
      .where("deleted", "==", false)
      .orderBy("orderIndex")
      .get();

    const batch = ctx.firestore.batch();
    activeStatusTypes.docs.forEach((doc, index) => {
      batch.update(doc.ref, { orderIndex: index });
    });
    await batch.commit();
  });

/**
 * Retrieves all non-deleted backlog tags for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns Array of backlog tags
 *
 * @http GET /api/trpc/settings.getBacklogTags
 */
const getBacklogTagsProcedure = roleRequiredProcedure(tagPermissions, "read")
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    return await getBacklogTags(ctx.firestore, projectId);
  });

/**
 * Retrieves a specific backlog tag by its ID within a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - tagId - String ID of the backlog tag
 *
 * @returns The backlog tag or null if not found
 *
 * @http GET /api/trpc/settings.getBacklogTag
 */
const getBacklogTagProcedure = roleRequiredProcedure(tagPermissions, "read")
  .input(z.object({ projectId: z.string(), tagId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId, tagId } = input;
    return await getBacklogTag(ctx.firestore, projectId, tagId);
  });

/**
 * Creates a new backlog tag for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - tagData - The tag data conforming to TagSchema
 *
 * @returns The created backlog tag with its ID
 *
 * @http POST /api/trpc/settings.createBacklogTag
 */
const createBacklogTagProcedure = roleRequiredProcedure(tagPermissions, "write")
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
  });

/**
 * Modifies an existing backlog tag.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - tagId - String ID of the backlog tag to modify
 * - tagData - Updated backlog tag data
 *
 * @returns void
 *
 * @http POST /api/trpc/settings.modifyBacklogTag
 */
const modifyBacklogTagProcedure = roleRequiredProcedure(tagPermissions, "write")
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
  });

/**
 * Marks a backlog tag as deleted.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - tagId - String ID of the backlog tag to delete
 *
 * @returns void
 *
 * @http POST /api/trpc/settings.deleteBacklogTag
 */
const deleteBacklogTagProcedure = roleRequiredProcedure(tagPermissions, "write")
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
  });

/**
 * Retrieves size types from project settings.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns Array of size types
 *
 * @http GET /api/trpc/settings.getSizeTypes
 */
const getSizeTypesProcedure = roleRequiredProcedure(tagPermissions, "read")
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    const settingsSnap = await getSettingsRef(ctx.firestore, projectId).get();
    const settingsData = SettingsSchema.parse(settingsSnap.data());
    return Array.isArray(settingsData.Size) ? settingsData.Size : [];
  });

/**
 * Updates size types in project settings.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - size - Array of number values representing sizes
 *
 * @returns void
 *
 * @http POST /api/trpc/settings.changeSize
 */
const changeSizeProcedure = roleRequiredProcedure(tagPermissions, "write")
  .input(z.object({ projectId: z.string(), size: z.array(z.number()) }))
  .mutation(async ({ ctx, input }) => {
    const { projectId, size } = input;
    const projectSettingsRef = getSettingsRef(ctx.firestore, projectId);
    await projectSettingsRef.update({
      Size: size,
    });
  });

/**
 * Retrieves detailed role information for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns Array of role objects with detailed information
 *
 * @http GET /api/trpc/settings.getDetailedRoles
 */
const getDetailedRolesProcedure = roleRequiredProcedure(
  settingsPermissions,
  "read",
)
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const rolesData = await getProjectDetailedRoles(
      ctx.firestore,
      input.projectId,
    );
    return rolesData;
  });

/**
 * Adds a new role to a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - label - Name of the new role
 *
 * @returns void
 *
 * @http POST /api/trpc/settings.addRole
 */
const addRoleProcedure = roleRequiredProcedure(settingsPermissions, "write")
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
  });

/**
 * Removes a role from a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - roleId - String ID of the role to remove
 *
 * @returns void
 *
 * @http POST /api/trpc/settings.removeRole
 */
const removeRoleProcedure = roleRequiredProcedure(settingsPermissions, "write")
  .input(
    z.object({
      projectId: z.string(),
      roleId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, roleId } = input;
    await getRoleRef(ctx.firestore, projectId, roleId).delete();
  });

/**
 * Updates permissions for a specific tab/feature for a role.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - roleId - String ID of the role
 * - parameter - The tab/feature name to update permissions for
 * - permission - Permission object with read/write access levels
 *
 * @returns void
 *
 * @http POST /api/trpc/settings.updateRoleTabPermissions
 */
const updateRoleTabPermissionsProcedure = roleRequiredProcedure(
  settingsPermissions,
  "write",
)
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
  });

/**
 * Retrieves the current user's role in a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns The user's role information
 *
 * @http GET /api/trpc/settings.getMyRole
 */
const getMyRoleProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const userId = ctx.session.uid;
    return getUserRole(ctx.firestore, input.projectId, userId);
  });

/**
 * Retrieves the Todo status tag for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns The Todo status tag object
 *
 * @http GET /api/trpc/settings.getTodoTag
 */
const getTodoTagProcedure = roleRequiredProcedure(tagPermissions, "read")
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    return await getTodoStatusTag(ctx.firestore, projectId);
  });

/**
 * Fetches sprint settings for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns Sprint settings object with duration information
 *
 * @http GET /api/trpc/settings.fetchScrumSettings
 */
const fetchScrumSettingsProcedure = roleRequiredProcedure(
  settingsPermissions,
  "read",
)
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    const settingsDocs = await getSettingsRef(ctx.firestore, projectId).get();
    const data = settingsDocs.data();
    const scrumSettings = {
      sprintDuration: (data?.sprintDuration ?? defaultSprintDuration) as number,
    };
    return scrumSettings;
  });

/**
 * Updates sprint duration settings for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - days - Number of days for sprint duration
 *
 * @returns void
 *
 * @http POST /api/trpc/settings.updateScrumSettings
 */
const updateScrumSettingsProcedure = roleRequiredProcedure(
  settingsPermissions,
  "read",
)
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
  });

/**
 * Retrieves context links from project settings.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns Array of links with validation status
 *
 * @http GET /api/trpc/settings.getContextLinks
 */
const getContextLinksProcedure = roleRequiredProcedure(
  settingsPermissions,
  "read",
)
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
  });

/**
 * Retrieves context files from project settings.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns Array of file objects with content and token counts
 *
 * @http GET /api/trpc/settings.getContextFiles
 */
const getContextFilesProcedure = roleRequiredProcedure(
  settingsPermissions,
  "read",
)
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
  });

/**
 * Retrieves context dialog text from project settings.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns Context dialog text string
 *
 * @http GET /api/trpc/settings.getContextDialog
 */
const getContextDialogProcedure = roleRequiredProcedure(
  settingsPermissions,
  "read",
)
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    const settings = await getSettings(ctx.firestore, projectId);
    const text: string = settings.aiContext.text;
    return text;
  });

/**
 * Updates text context in project settings.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - text - New context text
 *
 * @returns void
 *
 * @http POST /api/trpc/settings.updateTextContext
 */
const updateTextContextProcedure = roleRequiredProcedure(
  settingsPermissions,
  "write",
)
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
  });

/**
 * Adds a link to project context.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - link - URL to add to context
 *
 * @returns void
 *
 * @http POST /api/trpc/settings.addLink
 */
const addLinkProcedure = roleRequiredProcedure(settingsPermissions, "write")
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
        ...settingsData.aiContext.links.filter((l) => l.link !== newLink.link),
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
  });

/**
 * Removes a link from project context.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - link - URL to remove from context
 *
 * @returns void
 *
 * @http POST /api/trpc/settings.removeLink
 */
const removeLinkProcedure = roleRequiredProcedure(settingsPermissions, "write")
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
  });

/**
 * Adds files to project context.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - files - Array of file objects with name, type, content and size
 *
 * @returns void
 *
 * @http POST /api/trpc/settings.addFiles
 */
const addFilesProcedure = roleRequiredProcedure(settingsPermissions, "write")
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
  });

/**
 * Removes a file from project context.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - file - Name of the file to remove
 *
 * @returns void
 *
 * @http POST /api/trpc/settings.removeFile
 */
const removeFileProcedure = roleRequiredProcedure(settingsPermissions, "write")
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
  });

/**
 * Settings Router - Centralizes all settings-related procedures.
 * Provides a structured interface for managing project settings across the application.
 */
const settingsRouter = createTRPCRouter({
  getPriorityTypes: getPriorityTypesProcedure,
  getPriorityType: getPriorityTypeProcedure,
  getStatusTypes: getStatusTypesProcedure,
  getStatusType: getStatusTypeProcedure,
  createStatusType: createStatusTypeProcedure,
  reorderStatusTypes: reorderStatusTypesProcedure,
  modifyStatusType: modifyStatusTypeProcedure,
  deleteStatusType: deleteStatusTypeProcedure,
  getBacklogTags: getBacklogTagsProcedure,
  getBacklogTag: getBacklogTagProcedure,
  createBacklogTag: createBacklogTagProcedure,
  modifyBacklogTag: modifyBacklogTagProcedure,
  deleteBacklogTag: deleteBacklogTagProcedure,
  getSizeTypes: getSizeTypesProcedure,
  changeSize: changeSizeProcedure,
  getDetailedRoles: getDetailedRolesProcedure,
  addRole: addRoleProcedure,
  removeRole: removeRoleProcedure,
  updateRoleTabPermissions: updateRoleTabPermissionsProcedure,
  getMyRole: getMyRoleProcedure,
  getTodoTag: getTodoTagProcedure,
  fetchScrumSettings: fetchScrumSettingsProcedure,
  updateScrumSettings: updateScrumSettingsProcedure,
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
