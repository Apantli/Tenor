/**
 * Projects - Tenor API Endpoints for Projects Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing Projects in the Tenor application.
 * It provides endpoints to create, modify, and retrieve projects.
 *
 * @category API
 */

import { TRPCError } from "@trpc/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type {
  Project,
  WithId,
  User,
  Requirement,
  TopProjects,
  WithName,
} from "~/lib/types/firebaseSchemas";
import {
  createTRPCRouter,
  protectedProcedure,
  roleRequiredProcedure,
} from "~/server/api/trpc";
import { fetchMultipleHTML } from "~/server/api/lib/webcontent";
import { fetchMultipleFiles } from "~/lib/helpers/filecontent";
import {
  uploadBase64File,
  getLogoPath,
  deleteStartsWith,
} from "~/lib/db/firebaseBucket";
import {
  ProjectSchemaCreator,
  SettingsSchema,
  type UserSchema,
} from "~/lib/types/zodFirebaseSchema";
import { z } from "zod";
import { isBase64Valid } from "~/lib/helpers/base64";
import { defaultActivity, emptySettings } from "~/lib/defaultValues/project";
import {
  getItemActivityDetails,
  computeTopProjectStatus,
  getProject,
  getProjectRef,
  getProjectsRef,
  getProjectStatus,
  getRoles,
  getRolesRef,
  getSettingsRef,
  getActivityDetailsFromProjects,
} from "../shortcuts/general";
import { settingsPermissions } from "~/lib/defaultValues/permission";
import { getGlobalUserRef, getUsersRef } from "../shortcuts/users";
import { getPrioritiesRef, getStatusTypesRef } from "../shortcuts/tags";
import { getRequirementTypesRef } from "../shortcuts/requirements";
import { getActivityRef } from "../shortcuts/performance";
import { defaultRoleList } from "~/lib/defaultValues/roles";
import {
  defaultPriorityTypes,
  defaultRequerimentTypes,
} from "~/lib/defaultValues/tags";
import { awaitsReviewTag, defaultStatusTags } from "~/lib/defaultValues/status";
import { defaultProjectIconPath } from "~/lib/defaultValues/publicPaths";
import { getCurrentSprint } from "../shortcuts/sprints";
import { getBurndownData } from "../shortcuts/tasks";
import type { firestore } from "firebase-admin";

export const emptyRequeriment = (): Requirement => ({
  name: "",
  description: "",
  priorityId: "",
  requirementTypeId: "",
  requirementFocusId: "",
  size: "M",
  scrumId: 0,
  deleted: false,
  createdAt: Timestamp.now(),
});

export const createEmptyProject = (): Project => {
  return {
    name: "",
    description: "",
    logo: "",
    deleted: false,

    settings: emptySettings, // Deberías definir un `emptySettings` si `Settings` tiene valores requeridos

    users: [],

    // requirements: [],
    userStories: [],
    issues: [],
    epics: [],
    genericItems: [],

    // sprints: [],
    // sprintSnapshots: [],
    currentSprintId: "",
  };
};

const fetchProjectData = async (
  projectRef: FirebaseFirestore.DocumentReference,
  dbAdmin: FirebaseFirestore.Firestore,
): Promise<Project | null> => {
  try {
    const projectSnapshot = await dbAdmin.doc(projectRef.path).get(); // Use adminDb.doc

    if (projectSnapshot.exists) {
      return projectSnapshot.data() as Project;
    }
  } catch (error) {
    console.error("Error getting documents: ", error);
  }

  return null;
};

const fetchUserProjects = async (
  uid: string,
  dbAdmin: FirebaseFirestore.Firestore,
) => {
  try {
    // Buscar usuario en Firestore por su uid
    const usersCollection = dbAdmin.collection("users"); // Use dbAdmin.collection
    const querySnapshot = await usersCollection.where("uid", "==", uid).get(); // Use dbAdmin.collection.where

    if (querySnapshot.empty) {
      // No user found
      return [];
    }

    const userData = querySnapshot.docs[0]?.data() as User;

    if (!userData.projectIds || userData.projectIds.length === 0) {
      // No projects assigned for user
      return [];
    }

    // Transform the string to a DocumentReference
    const assignProjectRefs = userData.projectIds.map(
      (projectPath) => dbAdmin.doc(`projects/${projectPath}`), // Use dbAdmin.doc
    );

    const projectResults = await Promise.all(
      assignProjectRefs.map(async (projectRef) => {
        const projectData = await fetchProjectData(projectRef, dbAdmin); // Await the fetch
        return {
          id: projectRef.id,
          ...projectData, // Spread the resolved project data
        };
      }),
    );

    const projects: WithId<Project>[] = projectResults.filter(
      (project): project is WithId<Project> =>
        project !== null && project.deleted === false,
    );

    return projects;
  } catch (error) {
    console.error("Error getting documents: ", error);
    return [];
  }
};

/**
 * Lists all projects available to the authenticated user.
 *
 * @returns Array of projects the user has access to
 *
 * @http GET /api/trpc/projects.listProjects
 */
export const listProjectsProcedure = protectedProcedure.query(
  async ({ ctx }) => {
    const useruid = ctx.session.user.uid;
    const projects = await fetchUserProjects(useruid, ctx.firestore);
    return projects;
  },
);

/**
 * Creates a new project with the specified configuration.
 *
 * @param input Project configuration including name, description, users, and settings
 * @returns Object containing success status and the new project ID
 * @throws {TRPCError} If there's an error creating the project
 *
 * @http POST /api/trpc/projects.createProject
 */
export const createProjectProcedure = protectedProcedure
  .input(ProjectSchemaCreator.extend({ settings: SettingsSchema }))
  .mutation(async ({ ctx, input }) => {
    const newProjectRef = getProjectsRef(ctx.firestore).doc();

    // FIXME: remove duplicated users from input.users
    // FIXME: get ids from input.users, use ids to add users to project
    // FIXME: validate valid links before fetching html

    // Add creator as project admin
    input.users.push({
      userId: ctx.session.uid,
      roleId: "owner",
      active: true,
    });

    // Remove duplicated users (preserve first occurrence)
    const seen = new Map<
      string,
      z.infer<typeof ProjectSchemaCreator>["users"][number]
    >();

    for (const user of input.users) {
      if (!seen.has(user.userId)) {
        seen.set(user.userId, user);
      }
    }

    input.users = Array.from(seen.values());

    // Fetch HTML from links
    const links = input.settings.aiContext.links;
    input.settings.aiContext.links = await fetchMultipleHTML(links);

    // Fetch text from files
    const b64Files = input.settings.aiContext.files.map((file) => file.content);
    const fileText = await fetchMultipleFiles(b64Files);

    const files = input.settings.aiContext.files.map((file, index) => ({
      name: file.name,
      type: file.type,
      content: fileText[index] ?? "",
      size: Buffer.byteLength(fileText[index] ?? "", "utf-8"), // Calculate size in bytes
    }));

    input.settings.aiContext.files = files;

    // Upload logo
    const isLogoValid = isBase64Valid(input.logo);
    if (isLogoValid) {
      const logoPath = newProjectRef.id + "." + isLogoValid;
      input.logo = await uploadBase64File(
        getLogoPath({ logo: logoPath, projectId: newProjectRef.id }),
        input.logo,
      );
    } else {
      // Use default icon
      input.logo = defaultProjectIconPath;
    }

    try {
      const { settings, users, ...projectData } = input;

      await newProjectRef.set(projectData);

      const userRefs = input.users.map((user) =>
        getGlobalUserRef(ctx.firestore, user.userId),
      );

      await Promise.all(
        userRefs.map((userRef) =>
          userRef.update("projectIds", FieldValue.arrayUnion(newProjectRef.id)),
        ),
      );
      // FIXME: Create proper default settings in the project
      await getSettingsRef(ctx.firestore, newProjectRef.id).set(settings);

      const userTypesCollection = getRolesRef(ctx.firestore, newProjectRef.id);

      // go over defaultRoleList and create roles
      const userTypesMap: Record<string, string> = {};
      for (const role of defaultRoleList) {
        const roleDoc = await userTypesCollection.add({
          ...role,
          id: undefined,
        });

        userTypesMap[role.id] = roleDoc.id;
      }

      // change users roleId to the new role id
      users.forEach((user) => {
        if (userTypesMap[user.roleId]) {
          user.roleId = userTypesMap[user.roleId]!;
        } else {
          if (user.roleId !== "owner") {
            console.error(
              `Role ID ${user.roleId} not found in userTypesMap`,
              user,
            );
            user.roleId = "";
          }
        }
      });

      const usersCollection = getUsersRef(ctx.firestore, newProjectRef.id);

      await Promise.all(
        users.map((user) =>
          usersCollection.doc(user.userId).set({
            ...user,
            userId: undefined,
          }),
        ),
      );

      // Create default priority types
      const priorityTypesCollection = getPrioritiesRef(
        ctx.firestore,
        newProjectRef.id,
      );

      await Promise.all(
        defaultPriorityTypes.map((type) => priorityTypesCollection.add(type)),
      );

      // Create default status types
      const requirementTypesCollection = getRequirementTypesRef(
        ctx.firestore,
        newProjectRef.id,
      );

      await Promise.all(
        defaultRequerimentTypes.map((type) =>
          requirementTypesCollection.add(type),
        ),
      );

      // Create default status types
      const statusCollection = getStatusTypesRef(
        ctx.firestore,
        newProjectRef.id,
      );

      await Promise.all([
        ...defaultStatusTags.map((statusTag) =>
          statusCollection.add(statusTag),
        ),
        statusCollection.doc("awaits_review").set(awaitsReviewTag),
      ]);

      // Create default empty activity
      const activityCollection = getActivityRef(
        ctx.firestore,
        newProjectRef.id,
      );

      await Promise.all(
        defaultActivity.map((activity) => activityCollection.add(activity)),
      );

      return { success: true, projectId: newProjectRef.id };
    } catch (error) {
      console.error("Error adding document: ", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  });

/**
 * Gets the general configuration of a specific project.
 *
 * @param input Object containing projectId
 * @returns Project configuration data
 *
 * @http GET /api/trpc/projects.getGeneralConfig
 */
export const getGeneralConfigProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ input, ctx }) => {
    const { projectId } = input;
    return await getProject(ctx.firestore, projectId);
  });

/**
 * Modifies the general configuration of a project.
 * Requires owner permissions.
 *
 * @param input Object containing project configuration updates
 * @returns void
 * @throws {TRPCError} If the user doesn't have owner permissions
 *
 * @http POST /api/trpc/projects.modifyGeneralConfig
 */
export const modifyGeneralConfigProcedure = roleRequiredProcedure(
  settingsPermissions,
  "write",
)
  .input(
    z.object({
      projectId: z.string(),
      name: z.string(),
      description: z.string(),
      logo: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    if (ctx.roleId !== "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
      });
    }
    const projectRef = getProjectRef(ctx.firestore, input.projectId);
    const projectData = (await projectRef.get()).data() as Project;

    // Modify logo only if it has changed
    if (projectData.logo !== input.logo) {
      const isLogoValid = isBase64Valid(input.logo);

      if (isLogoValid && projectData.logo !== defaultProjectIconPath) {
        // Delete previous logo, assume the name starts with the projectId
        await deleteStartsWith(
          getLogoPath({ logo: input.projectId, projectId: input.projectId }),
        );
      }

      if (isLogoValid) {
        const logoPath = input.projectId + "." + isLogoValid;
        input.logo = await uploadBase64File(
          getLogoPath({ logo: logoPath, projectId: input.projectId }),
          input.logo,
        );
      } else {
        // Use default icon
        input.logo = defaultProjectIconPath;
      }
    }

    await projectRef.update({
      name: input.name,
      description: input.description,
      logo: input.logo,
    });
  });

/**
 * Marks a project as deleted.
 * Requires owner permissions.
 *
 * @param input Object containing projectId to delete
 * @returns void
 * @throws {TRPCError} If the user doesn't have owner permissions
 *
 * @http POST /api/trpc/projects.deleteProject
 */
export const deleteProjectProcedure = roleRequiredProcedure(
  settingsPermissions,
  "write",
)
  .input(
    z.object({
      projectId: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    if (ctx.roleId !== "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
      });
    }
    const { projectId } = input;
    const projectRef = getProjectRef(ctx.firestore, projectId);
    await projectRef.update({
      deleted: true,
    });
  });

/**
 * Gets the name of a specific project.
 *
 * @param input Object containing projectId
 * @returns Project name string
 *
 * @http GET /api/trpc/projects.getProjectName
 */
export const getProjectNameProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    return (await getProject(ctx.firestore, projectId)).name;
  });

/**
 * Gets the user types/roles defined in a project.
 *
 * @param input Object containing projectId
 * @returns Array of project roles
 *
 * @http GET /api/trpc/projects.getUserTypes
 */
export const getUserTypesProcedure = roleRequiredProcedure(
  settingsPermissions,
  "read",
)
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    return await getRoles(ctx.firestore, projectId);
  });

/**
 * Gets the current status of a specific project.
 *
 * @param input Object containing projectId
 * @returns Project status data
 *
 * @http GET /api/trpc/projects.getProjectStatus
 */
export const getProjectStatusProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    return await getProjectStatus(
      ctx.firestore,
      projectId,
      ctx.firebaseAdmin.app(),
    );
  });

/**
 * Gets the status of top projects for the current user.
 *
 * @returns Array of top project status data with names
 *
 * @http GET /api/trpc/projects.getTopProjectStatus
 */
export const getTopProjectStatusProcedure = protectedProcedure.query(
  async ({ ctx }) => {
    const topProjects = await computeTopProjectStatus(
      ctx.firestore,
      ctx.firebaseAdmin.app(),
      ctx.session.uid,
    );

    if (!topProjects) {
      return [] as WithName<TopProjects>[];
    }

    const projectsWithName = await Promise.all(
      topProjects.map(async (project) => {
        const projectData = await getProject(ctx.firestore, project.projectId);
        return {
          ...project,
          name: projectData.name,
        };
      }),
    );

    return projectsWithName as WithName<TopProjects>[];
  },
);

/**
 * Gets activity details for a specific project.
 *
 * @param input Object containing projectId
 * @returns Activity details for the specified project
 *
 * @http GET /api/trpc/projects.getActivityDetails
 */
export const getActivityDetailsProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    return await getItemActivityDetails(ctx.firestore, projectId);
  });

/**
 * Gets activity details from all projects the user has access to.
 *
 * @returns Array of activity details sorted by date
 *
 * @http GET /api/trpc/projects.getActivityDetailsFromProjects
 */
export const getActivityDetailsFromProjectsProcedure = protectedProcedure.query(
  async ({ ctx }) => {
    const user = (
      await getGlobalUserRef(ctx.firestore, ctx.session.uid).get()
    ).data() as z.infer<typeof UserSchema>;

    if (!user?.projectIds || user.projectIds.length === 0) {
      return [];
    }

    const details = await getActivityDetailsFromProjects(
      ctx.firestore,
      user.projectIds,
    );

    return details.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      // TODO: Change to use firestore.Timestamp in every call
      const a2 = a.date as unknown as firestore.Timestamp;
      const b2 = b.date as unknown as firestore.Timestamp;
      return b2.seconds - a2.seconds;
    });
  },
);

/**
 * Gets burndown chart data for the current sprint of a project.
 *
 * @param input Object containing projectId
 * @returns Burndown data or null if no current sprint exists
 *
 * @http GET /api/trpc/projects.getGraphBurndownData
 */
export const getGraphBurndownDataProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    // Get the current sprint for the project
    const currentSprint = await getCurrentSprint(ctx.firestore, projectId);
    if (!currentSprint) return null;
    return await getBurndownData(ctx.firestore, projectId, currentSprint.id);
  });

/**
 * TRPC Router for managing Projects in the Tenor application.
 *
 * This router provides endpoints for creating, retrieving, updating, and deleting projects,
 * as well as fetching project-related metadata like activity details, status, and user types.
 *
 * @category API
 * @subcategory Routers
 */
export const projectsRouter = createTRPCRouter({
  listProjects: listProjectsProcedure,
  createProject: createProjectProcedure,
  getGeneralConfig: getGeneralConfigProcedure,
  modifyGeneralConfig: modifyGeneralConfigProcedure,
  deleteProject: deleteProjectProcedure,
  getProjectName: getProjectNameProcedure,
  getUserTypes: getUserTypesProcedure,
  getProjectStatus: getProjectStatusProcedure,
  getTopProjectStatus: getTopProjectStatusProcedure,
  getActivityDetails: getActivityDetailsProcedure,
  getActivityDetailsFromProjects: getActivityDetailsFromProjectsProcedure,
  getGraphBurndownData: getGraphBurndownDataProcedure,
});
