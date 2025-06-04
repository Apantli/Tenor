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
  ProjectStatusCache,
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
} from "~/lib/types/zodFirebaseSchema";
import { z } from "zod";
import { isBase64Valid } from "~/lib/helpers/base64";
import { defaultActivity, emptySettings } from "~/lib/defaultValues/project";
import {
  getItemActivityDetails,
  computeTopProjectStatus,
  getProject,
  getProjectActivities,
  getProjectRef,
  getProjectsRef,
  getProjectStatus,
  getRoles,
  getRolesRef,
  getSettingsRef,
  getTopProjectStatusCacheRef,
  generateBurndownHistory,
  getBurndownData,
  getTopItemActivityDetails,
  getTopProjectActivities,
} from "../shortcuts/general";
import { settingsPermissions } from "~/lib/defaultValues/permission";
import { getGlobalUserRef, getUsersRef } from "../shortcuts/users";
import { getPrioritiesRef, getStatusTypesRef } from "../shortcuts/tags";
import { getRequirementTypesRef } from "../shortcuts/requirements";
import { shouldRecomputeTopProjects } from "~/lib/helpers/cache";
import { getActivityRef } from "../shortcuts/performance";
import { defaultRoleList } from "~/lib/defaultValues/roles";
import {
  defaultPriorityTypes,
  defaultRequerimentTypes,
} from "~/lib/defaultValues/tags";
import { defaultStatusTags } from "~/lib/defaultValues/status";
import { defaultProjectIconPath } from "~/lib/defaultValues/publicPaths";
import { parseISO } from "date-fns";

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

export const projectsRouter = createTRPCRouter({
  listProjects: protectedProcedure.query(async ({ ctx }) => {
    const useruid = ctx.session.user.uid;
    const projects = await fetchUserProjects(useruid, ctx.firestore);
    return projects;
  }),
  createProject: protectedProcedure
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
      const b64Files = input.settings.aiContext.files.map(
        (file) => file.content,
      );
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
            userRef.update(
              "projectIds",
              FieldValue.arrayUnion(newProjectRef.id),
            ),
          ),
        );
        // FIXME: Create proper default settings in the project
        await getSettingsRef(ctx.firestore, newProjectRef.id).set(settings);

        const userTypesCollection = getRolesRef(
          ctx.firestore,
          newProjectRef.id,
        );

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

        await Promise.all(
          defaultStatusTags.map((statusTag) => statusCollection.add(statusTag)),
        );

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
    }),

  getGeneralConfig: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { projectId } = input;
      return await getProject(ctx.firestore, projectId);
    }),

  modifyGeneralConfig: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string(),
        description: z.string(),
        logo: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
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
    }),
  deleteProject: roleRequiredProcedure(settingsPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { projectId } = input;
      const projectRef = getProjectRef(ctx.firestore, projectId);
      await projectRef.update({
        deleted: true,
      });
    }),
  getProjectName: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      return (await getProject(ctx.firestore, projectId)).name;
    }),
  getUserTypes: roleRequiredProcedure(settingsPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      return await getRoles(ctx.firestore, projectId);
    }),
  getProjectStatus: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      return await getProjectStatus(
        ctx.firestore,
        projectId,
        ctx.firebaseAdmin.app(),
      );
    }),

  getTopProjectStatus: protectedProcedure
    .input(z.object({ count: z.number() }))
    .query(async ({ ctx, input }) => {
      let topProjects = (
        await getTopProjectStatusCacheRef(ctx.firestore, ctx.session.uid).get()
      ).data() as ProjectStatusCache | undefined;

      if (
        !topProjects ||
        shouldRecomputeTopProjects({ cacheTarget: topProjects })
      ) {
        topProjects = await computeTopProjectStatus(
          ctx.firestore,
          ctx.firebaseAdmin.app(),
          ctx.session.uid,
          input.count,
        );

        if (!topProjects) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No projects found",
          });
        }
        await getTopProjectStatusCacheRef(ctx.firestore, ctx.session.uid).set(
          topProjects,
        );
      }

      const projectsWithName = await Promise.all(
        topProjects.topProjects.map(async (project) => {
          const projectData = await getProject(
            ctx.firestore,
            project.projectId,
          );
          return {
            ...project,
            name: projectData.name,
          };
        }),
      );
      topProjects.topProjects = projectsWithName;
      return topProjects;
    }),

  recomputeTopProjectStatus: protectedProcedure
    .input(z.object({ count: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const topProjects = await computeTopProjectStatus(
        ctx.firestore,
        ctx.firebaseAdmin.app(),
        ctx.session.uid,
        input.count,
      );

      if (topProjects == undefined) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No projects found",
        });
      }

      await getTopProjectStatusCacheRef(ctx.firestore, ctx.session.uid).set(
        topProjects,
      );
    }),

  getProjectActivities: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      return await getProjectActivities(ctx.firestore, projectId);
    }),

  getActivityDetails: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      return await getItemActivityDetails(ctx.firestore, projectId);
    }),

  getTopProjectActivities: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.session.user.uid;
    return await getTopProjectActivities(ctx.firestore, user);
  }),

  getTopActivityDetails: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.uid;
    return await getTopItemActivityDetails(ctx.firestore, userId);
  }),

  getBurndownData: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;

      const status = await getProjectStatus(
        ctx.firestore,
        projectId,
        ctx.firebaseAdmin.app(),
      );

      const startDate =
        typeof status.currentSprintStartDate === "string"
          ? parseISO(status.currentSprintStartDate)
          : status.currentSprintStartDate
            ? new Date(status.currentSprintStartDate)
            : new Date();

      const endDate =
        typeof status.currentSprintEndDate === "string"
          ? parseISO(status.currentSprintEndDate)
          : status.currentSprintEndDate
            ? new Date(status.currentSprintEndDate)
            : new Date();

      // Generate historical data
      const burndownHistory = await generateBurndownHistory(
        ctx.firestore,
        projectId,
        startDate,
        new Date(), // Only up to today
      );

      return getBurndownData(
        startDate,
        endDate,
        status.taskCount,
        status.completedCount,
        burndownHistory,
      );
    }),
});
