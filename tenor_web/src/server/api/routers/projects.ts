/**
 * Projects Router - Tenor API Endpoints for Project Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for project management in the Tenor application.
 * It provides endpoints to create, read, update, and delete projects, as well as manage their configurations.
 * 
 * The router includes procedures for:
 * - Creating new projects with default settings
 * - Listing projects associated with a user
 * - Managing project configurations including name, description, and logo
 * - Retrieving project information and user roles
 * - Deleting projects (soft delete)
 *
 * Projects are the central organizational unit in Tenor, containing user stories, tasks, epics, and other items.
 *
 * @category API
 */

import { TRPCError } from "@trpc/server";
import { FieldValue } from "firebase-admin/firestore";
import type {
  Project,
  WithId,
  User,
  Settings,
  Requirement,
  Tag,
} from "~/lib/types/firebaseSchemas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { fetchMultipleHTML } from "~/utils/webcontent";
import { fetchMultipleFiles } from "~/utils/filecontent";
import {
  uploadBase64File,
  getLogoPath,
  deleteStartsWith,
} from "~/utils/firebaseBucket";
import {
  ProjectSchema,
  ProjectSchemaCreator,
  SettingsSchema,
} from "~/lib/types/zodFirebaseSchema";
import { z } from "zod";
import { isBase64Valid } from "~/utils/base64";
import {
  defaultRoleList,
  defaultStatusTags,
  defaultRequerimentTypes,
  defaultPriorityTypes,
} from "~/lib/defaultProjectValues";

const emptySettings: Settings = {
  sprintDuration: 0,
  maximumSprintStoryPoints: 0,
  aiContext: {
    text: "",
    files: [],
    links: [],
  },
  storyPointSizes: [
    1, // XS
    2, // S
    3, // M
    4, // L
    5, // XL
    6, // XXL
  ],
  // requirementFocusTags: [],
  // requirementTypeTags: [],
  // backlogTags: [],
  // priorityTypes: [],
  // statusTabs: [],
  // roles: [],
};

export const emptyRequeriment = (): Requirement => ({
  name: "",
  description: "",
  priorityId: "",
  requirementTypeId: "",
  requirementFocusId: "",
  size: "M",
  scrumId: 0,
  deleted: false,
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
      console.log("No matching documents.");
      return [];
    }

    const userData = querySnapshot.docs[0]?.data() as User;

    if (!userData.projectIds || userData.projectIds.length === 0) {
      console.log("No projects assigned for user", uid);
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
 * Retrieves a list of projects associated with the current user.
 *
 * @param input None
 *
 * @returns Array of projects with their details.
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
 * Creates a new project with the provided settings and users.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - name — Name of the project
 * - description — Description of the project
 * - logo — Base64 string of the project logo
 * - settings — Project settings including sprint duration, story points, etc.
 * - users — Array of users with their roles and activity status
 *
 * @returns Object containing the ID of the created project.
 *
 * @http POST /api/trpc/projects.createProject
 */
export const createProjectProcedure = protectedProcedure
  .input(ProjectSchemaCreator.extend({ settings: SettingsSchema }))
  .mutation(async ({ ctx, input }) => {
    const newProjectRef = ctx.firestore.collection("projects").doc();

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
      size: file.size,
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
      input.logo = "/defaultProject.png";
    }

    try {
      const { settings, users, ...projectData } = input;

      await newProjectRef.set(projectData);

      const userRefs = input.users.map((user) =>
        ctx.firestore.collection("users").doc(user.userId),
      );

      await Promise.all(
        userRefs.map((userRef) =>
          userRef.update("projectIds", FieldValue.arrayUnion(newProjectRef.id)),
        ),
      );
      // FIXME: Create proper default settings in the project
      await newProjectRef.collection("settings").doc("settings").set(settings);

      const userTypesCollection = newProjectRef
        .collection("settings")
        .doc("settings")
        .collection("userTypes");

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

      const usersCollection = newProjectRef.collection("users");

      await Promise.all(
        users.map((user) =>
          usersCollection.doc(user.userId).set({
            ...user,
            userId: undefined,
          }),
        ),
      );

      const priorityTypesCollection = newProjectRef
        .collection("settings")
        .doc("settings")
        .collection("priorityTypes");

      await Promise.all(
        defaultPriorityTypes.map((type) => priorityTypesCollection.add(type)),
      );

      const requirementTypesCollection = newProjectRef
        .collection("settings")
        .doc("settings")
        .collection("requirementTypes");

      await Promise.all(
        defaultRequerimentTypes.map((type) =>
          requirementTypesCollection.add(type),
        ),
      );

      const statusCollection = newProjectRef
        .collection("settings")
        .doc("settings")
        .collection("statusTypes");

      await Promise.all(
        defaultStatusTags.map((statusTag) => statusCollection.add(statusTag)),
      );

      return { success: true, projectId: newProjectRef.id };
    } catch (error) {
      console.error("Error adding document: ", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  });

/**
 * Retrieves the general configuration of a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to fetch configuration for
 *
 * @returns Object containing the project's general configuration.
 *
 * @http GET /api/trpc/projects.getGeneralConfig
 */
export const getGeneralConfigProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ input, ctx }) => {
    const project = await ctx.firestore
      .collection("projects")
      .doc(input.projectId)
      .get();

    return ProjectSchema.parse(project.data());
  });

/**
 * Modifies the general configuration of a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to modify
 * - name — New name of the project
 * - description — New description of the project
 * - logo — New base64 string of the project logo
 *
 * @returns Object indicating success status.
 *
 * @http PUT /api/trpc/projects.modifyGeneralConfig
 */
export const modifyGeneralConfigProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      name: z.string(),
      description: z.string(),
      logo: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const projectRef = ctx.firestore
      .collection("projects")
      .doc(input.projectId);

    const projectData = (await projectRef.get()).data() as Project;

    // Modify logo only if it has changed
    if (projectData.logo !== input.logo) {
      const isLogoValid = isBase64Valid(input.logo);

      if (isLogoValid && projectData.logo !== "/defaultProject.png") {
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
        input.logo = "/defaultProject.png";
      }
    }

    await projectRef.update({
      name: input.name,
      description: input.description,
      logo: input.logo,
    });

    return { success: true };
  });

/**
 * Deletes a project by marking it as deleted.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to delete
 *
 * @returns Object indicating success status.
 *
 * @http DELETE /api/trpc/projects.deleteProject
 */
export const deleteProjectProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const projectRef = ctx.firestore
      .collection("projects")
      .doc(input.projectId);

    await projectRef.update({
      deleted: true,
    });
    return { success: true };
  });

/**
 * Retrieves the name of a specific project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to fetch the name for
 *
 * @returns Object containing the project's name.
 *
 * @http GET /api/trpc/projects.getProjectName
 */
export const getProjectNameProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    const project = await ctx.firestore
      .collection("projects")
      .doc(projectId)
      .get();
    const projectData = ProjectSchema.parse(project.data());
    return { projectName: projectData.name };
  });

/**
 * Retrieves user types (roles) for a specific project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to fetch user types for
 *
 * @returns Array of user types with their labels.
 *
 * @http GET /api/trpc/projects.getUserTypes
 */
export const getUserTypesProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    const statusTypes = await ctx.firestore
      .collection("projects")
      .doc(projectId)
      .collection("settings")
      .doc("settings")
      .collection("userTypes")
      .select("label")
      .where("deleted", "==", false)
      .get();

    const statusTypesData = statusTypes.docs.map((doc) => ({
      id: doc.id,
      label: doc.data().label as string,
    }));

    return statusTypesData;
  });

export const projectsRouter = createTRPCRouter({
  listProjects: listProjectsProcedure,
  createProject: createProjectProcedure,
  getGeneralConfig: getGeneralConfigProcedure,
  modifyGeneralConfig: modifyGeneralConfigProcedure,
  deleteProject: deleteProjectProcedure,
  getProjectName: getProjectNameProcedure,
  getUserTypes: getUserTypesProcedure,
});
