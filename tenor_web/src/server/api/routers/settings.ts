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
import { fetchMultipleFiles, fetchText } from "~/utils/helpers/filecontent";
import { emptyRole, ownerRole } from "~/lib/defaultProjectValues";
import { remove } from "node_modules/cypress/types/lodash";
import { type RoleDetail } from "~/lib/types/detailSchemas";
import { TRPCError } from "@trpc/server";
import {
  defaultMaximumSprintStoryPoints,
  defaultSprintDuration,
} from "~/lib/defaultProjectValues";
import {
  createTRPCRouter,
  protectedProcedure,
  roleRequiredProcedure,
} from "../trpc";
import {
  getProjectRoleRef,
  getProjectSettingsRef,
  getProjectUserRef,
  getTodoStatusTag,
} from "~/utils/helpers/shortcuts";

const settingsRouter = createTRPCRouter({
  /**
   * @procedure getPriorityTypes
   * @description Retrieves all priority types for a project
   * @input {object} input - Input parameters
   * @input {string} input.projectId - The ID of the project
   * @returns {Tag[]} An array of priority type tags
   */
  getPriorityTypes: roleRequiredProcedure(
    {
      flags: [
        "backlog",
        "settings",
        "issues",
        "scrumboard",
        "performance",
        "sprints",
      ],

      optimistic: true,
    },
    "read",
  )
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const projectSettingsRef = getProjectSettingsRef(
        ctx.firestore,
        input.projectId,
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

  getStatusTypes: roleRequiredProcedure(
    {
      flags: [
        "backlog",
        "settings",
        "issues",
        "scrumboard",
        "performance",
        "sprints",
      ],

      optimistic: true,
    },
    "read",
  )
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const projectSettingsRef = getProjectSettingsRef(
        ctx.firestore,
        input.projectId,
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
    }),

  getStatusTypeById: roleRequiredProcedure(
    {
      flags: [
        "backlog",
        "settings",
        "issues",
        "scrumboard",
        "performance",
        "sprints",
      ],

      optimistic: true,
    },
    "read",
  )
    .input(z.object({ projectId: z.string(), statusId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId, statusId } = input;
      const projectSettingsRef = getProjectSettingsRef(
        ctx.firestore,
        projectId,
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

  createStatusType: roleRequiredProcedure(
    {
      flags: ["backlog", "settings", "issues", "scrumboard"],
      optimistic: true,
    },
    "write",
  )
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
        ctx.firestore,
        input.projectId,
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
    }),

  reorderStatusTypes: roleRequiredProcedure(
    {
      flags: ["backlog", "settings", "issues", "scrumboard"],
      optimistic: true,
    },
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
      const projectRef = getProjectSettingsRef(ctx.firestore, projectId);
      const batch = ctx.firestore.batch();

      statusIds.forEach((statusId, index) => {
        const statusTypeRef = projectRef
          .collection("statusTypes")
          .doc(statusId);
        batch.update(statusTypeRef, { orderIndex: index });
      });

      await batch.commit();
    }),

  modifyStatusType: roleRequiredProcedure(
    {
      flags: ["backlog", "settings", "issues", "scrumboard"],
      optimistic: true,
    },
    "write",
  )
    .input(
      z.object({
        projectId: z.string(),
        statusId: z.string(),
        status: StatusTagSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, statusId, status } = input;
      const projectRef = getProjectSettingsRef(ctx.firestore, projectId);
      const statusTypeRef = projectRef.collection("statusTypes").doc(statusId);
      await statusTypeRef.update(status);
      const updatedStatus = await statusTypeRef.get();
      return { ...status, id: updatedStatus.id };
    }),

  deleteStatusType: roleRequiredProcedure(
    {
      flags: ["backlog", "settings", "issues", "scrumboard"],
      optimistic: true,
    },
    "write",
  )
    .input(
      z.object({
        projectId: z.string(),
        statusId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, statusId } = input;
      const projectRef = getProjectSettingsRef(ctx.firestore, projectId);
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
    }),

  /**
   * @procedure getBacklogTags
   * @description Retrieves all non-deleted backlog tags for a project
   * @input {object} input - Input parameters
   * @input {string} input.projectId - The ID of the project
   * @returns {Tag[]} An array of backlog tags
   */
  getBacklogTags: roleRequiredProcedure(
    {
      flags: [
        "backlog",
        "settings",
        "issues",
        "scrumboard",
        "performance",
        "sprints",
      ],

      optimistic: true,
    },
    "read",
  )
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const projectSettingsRef = getProjectSettingsRef(
        ctx.firestore,
        input.projectId,
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

  getBacklogTagById: roleRequiredProcedure(
    {
      flags: [
        "backlog",
        "settings",
        "issues",
        "scrumboard",
        "performance",
        "sprints",
      ],

      optimistic: true,
    },
    "read",
  )
    .input(z.object({ projectId: z.string(), tagId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId, tagId } = input;
      const projectSettingsRef = getProjectSettingsRef(
        ctx.firestore,
        projectId,
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
  createBacklogTag: roleRequiredProcedure(
    {
      flags: ["backlog", "settings", "issues", "scrumboard"],
      optimistic: true,
    },
    "write",
  )
    .input(
      z.object({
        projectId: z.string(),
        tagData: TagSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, tagData } = input;
      const projectRef = getProjectSettingsRef(ctx.firestore, projectId);
      const added = await projectRef.collection("backlogTags").add(tagData);
      return { ...tagData, id: added.id };
    }),

  modifyBacklogTag: roleRequiredProcedure(
    {
      flags: ["backlog", "settings", "issues", "scrumboard"],
      optimistic: true,
    },
    "write",
  )
    .input(
      z.object({
        projectId: z.string(),
        tagId: z.string(),
        tag: TagSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, tagId, tag } = input;
      const projectRef = getProjectSettingsRef(ctx.firestore, projectId);
      const backlogTagRef = projectRef.collection("backlogTags").doc(tagId);
      await backlogTagRef.update(tag);
      const updatedTag = await backlogTagRef.get();
      return { ...tag, id: updatedTag.id };
    }),

  deleteBacklogTag: roleRequiredProcedure(
    {
      flags: ["backlog", "settings", "issues", "scrumboard"],
      optimistic: true,
    },
    "write",
  )
    .input(
      z.object({
        projectId: z.string(),
        tagId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, tagId } = input;
      const projectRef = getProjectSettingsRef(ctx.firestore, projectId);
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
  createRequirementType: roleRequiredProcedure(
    {
      flags: ["backlog", "settings", "issues", "scrumboard"],
      optimistic: true,
    },
    "write",
  )
    .input(
      z.object({
        projectId: z.string(),
        tag: TagSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, tag } = input;
      const projectRef = getProjectSettingsRef(ctx.firestore, projectId);
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
  createRequirementFocus: roleRequiredProcedure(
    {
      flags: ["backlog", "settings", "issues", "scrumboard"],
      optimistic: true,
    },
    "write",
  )
    .input(
      z.object({
        projectId: z.string(),
        tag: TagSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, tag } = input;
      const projectRef = getProjectSettingsRef(ctx.firestore, projectId);
      const added = await projectRef.collection("requirementFocus").add(tag);
      return { ...tag, id: added.id };
    }),
  getContextLinks: roleRequiredProcedure(
    {
      flags: ["settings"],
    },
    "read",
  )
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const projectSettingsRef = getProjectSettingsRef(
        ctx.firestore,
        input.projectId,
      );
      const settings = await projectSettingsRef.get();
      const settingsData = SettingsSchema.parse(settings.data());
      const links: string[] = settingsData.aiContext.links.map(
        (link) => link.link,
      );
      return links;
    }),
  getContextFiles: roleRequiredProcedure(
    {
      flags: ["settings"],
    },
    "read",
  )
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const projectSettingsRef = getProjectSettingsRef(
        ctx.firestore,
        input.projectId,
      );
      const settings = await projectSettingsRef.get();
      const settingsData = SettingsSchema.parse(settings.data());
      const files: { name: string; type: string; size: number }[] =
        settingsData.aiContext.files.map((file) => ({
          name: file.name,
          type: file.type,
          size: Buffer.byteLength(file.content ?? "", "utf-8"),
        }));
      return files;
    }),
  getContextDialog: roleRequiredProcedure(
    {
      flags: ["settings"],
    },
    "read",
  )
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const projectSettingsRef = getProjectSettingsRef(
        ctx.firestore,
        input.projectId,
      );
      const settings = await projectSettingsRef.get();
      const settingsData = SettingsSchema.parse(settings.data());
      const text: string = settingsData.aiContext.text;
      return text;
    }),
  updateTextContext: roleRequiredProcedure(
    {
      flags: ["settings"],
    },
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
      const projectSettingsRef = getProjectSettingsRef(
        ctx.firestore,
        projectId,
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
  addLink: roleRequiredProcedure(
    {
      flags: ["settings"],
    },
    "write",
  )
    .input(
      z.object({
        projectId: z.string(),
        link: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, link } = input;
      const projectSettingsRef = getProjectSettingsRef(
        ctx.firestore,
        projectId,
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
  removeLink: roleRequiredProcedure(
    {
      flags: ["settings"],
    },
    "write",
  )
    .input(
      z.object({
        projectId: z.string(),
        link: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, link } = input;
      const projectSettingsRef = getProjectSettingsRef(
        ctx.firestore,
        projectId,
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
  addFiles: roleRequiredProcedure(
    {
      flags: ["settings"],
    },
    "write",
  )
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
      const projectSettingsRef = getProjectSettingsRef(
        ctx.firestore,
        projectId,
      );

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
    }),
  removeFile: roleRequiredProcedure(
    {
      flags: ["settings"],
    },
    "write",
  )
    .input(
      z.object({
        projectId: z.string(),
        file: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, file } = input;
      const projectSettingsRef = getProjectSettingsRef(
        ctx.firestore,
        projectId,
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

  getSizeTypes: roleRequiredProcedure(
    {
      flags: [
        "backlog",
        "settings",
        "issues",
        "scrumboard",
        "performance",
        "sprints",
      ],

      optimistic: true,
    },
    "read",
  )
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

  changeSize: roleRequiredProcedure(
    {
      flags: ["backlog", "settings", "issues", "scrumboard"],
      optimistic: true,
    },
    "write",
  )
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
    }),
  getDetailedRoles: roleRequiredProcedure(
    {
      flags: ["settings"],
    },
    "read",
  )
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
  addRole: roleRequiredProcedure(
    {
      flags: ["settings"],
    },
    "write",
  )
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
        ctx.firestore,
        projectId,
      );
      const roleDoc = await projectSettingsRef.collection("userTypes").add({
        ...emptyRole,
        label,
        id: undefined,
      });
    }),
  removeRole: roleRequiredProcedure(
    {
      flags: ["settings"],
    },
    "write",
  )
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
        ctx.firestore,
        projectId,
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
  updateRoleTabPermissions: roleRequiredProcedure(
    {
      flags: ["settings"],
    },
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

      const roleDoc = getProjectRoleRef(ctx.firestore, input.projectId, roleId);

      const roleData = await roleDoc.get();
      const role = RoleSchema.parse(roleData.data());
      await roleDoc.update({
        ...role,
        [parameter]: permission,
      });
    }),
  getMyRole: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.uid;

      if (!input.projectId) return ownerRole;

      const userRef = getProjectUserRef(ctx.firestore, input.projectId, userId);
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
      const role = RoleSchema.parse(roleData);
      const roleId = roleDoc.id;
      return {
        id: roleId,
        ...role,
      };
    }),
  getTodoTag: roleRequiredProcedure(
    {
      flags: [
        "backlog",
        "settings",
        "issues",
        "scrumboard",
        "performance",
        "sprints",
      ],

      optimistic: true,
    },
    "read",
  )
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      const todoStatus = await getTodoStatusTag(ctx.firestore, projectId);
      return todoStatus;
    }),
  fetchScrumSettings: roleRequiredProcedure(
    {
      flags: ["settings"],
    },
    "read",
  )
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      const settingsDocs = await getProjectSettingsRef(
        ctx.firestore,
        projectId,
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
  updateScrumSettings: roleRequiredProcedure(
    {
      flags: ["settings"],
    },
    "read",
  )
    .input(
      z.object({
        projectId: z.string(),
        days: z.number(),
        points: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, days, points } = input;
      const settingsRef = getProjectSettingsRef(ctx.firestore, projectId);
      await settingsRef.update({
        maximumSprintStoryPoints: points,
        sprintDuration: days,
      });

      return { success: true };
    }),
  fetchDefaultSprintDuration: roleRequiredProcedure(
    {
      flags: ["settings", "sprints"],

      optimistic: true,
    },
    "read",
  )
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
