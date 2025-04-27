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
import { defaultRoleList } from "~/lib/defaultTags";

const emptySettings: Settings = {
  sprintDuration: 0,
  maximumSprintStoryPoints: 0,
  aiContext: {
    text: "",
    files: [],
    links: [],
  },
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

export const projectsRouter = createTRPCRouter({
  listProjects: protectedProcedure.query(async ({ ctx }) => {
    const useruid = ctx.session.user.uid;
    const projects = await fetchUserProjects(useruid, ctx.firestore);
    return projects;
  }),
  createProject: protectedProcedure
    .input(ProjectSchemaCreator.extend({ settings: SettingsSchema }))
    .mutation(async ({ ctx, input }) => {
      const newProjectRef = ctx.firestore.collection("projects").doc();

      // FIXME: remove duplicated users from input.users
      // FIXME: get ids from input.users, use ids to add users to project
      // FIXME: validate valid links before fetching html

      // Add creator as project admin
      input.users.push({
        userId: ctx.session.uid,
        roleId: "admin",
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
            userRef.update(
              "projectIds",
              FieldValue.arrayUnion(newProjectRef.id),
            ),
          ),
        );
        // FIXME: Create proper default settings in the project
        await newProjectRef
          .collection("settings")
          .doc("settings")
          .set(settings);

        const userTypesCollection = newProjectRef
          .collection("settings")
          .doc("settings")
          .collection("userTypes");

        // go over defaultRoleList and create roles
        const userTypesMap: Record<string, string> = {};
        for (const role of defaultRoleList) {
          const roleDoc = await userTypesCollection.add({
            label: role.label,
            deleted: false,
          });

          userTypesMap[role.id] = roleDoc.id;
        }

        // change users roleId to the new role id
        users.forEach((user) => {
          if (userTypesMap[user.roleId]) {
            user.roleId = userTypesMap[user.roleId]!;
          } else {
            console.error(
              `Role ID ${user.roleId} not found in userTypesMap`,
              user,
            );
            user.roleId = "";
          }
        });

        const usersCollection = newProjectRef.collection("users");

        await Promise.all(
          users.map((user) => usersCollection.doc(user.userId).set(user)),
        );

        const priorityTypesCollection = newProjectRef
          .collection("settings")
          .doc("settings")
          .collection("priorityTypes");

        await priorityTypesCollection.add({
          name: "P2",
          color: "#2c7817",
          deleted: false,
        });
        await priorityTypesCollection.add({
          name: "P1",
          color: "#d1b01d",
          deleted: false,
        });
        await priorityTypesCollection.add({
          name: "P0",
          color: "#FF0000",
          deleted: false,
        });

        const requirementTypesCollection = newProjectRef
          .collection("settings")
          .doc("settings")
          .collection("requirementTypes");

        await requirementTypesCollection.add({
          name: "Functional",
          color: "#24A5BC",
          deleted: false,
        });
        await requirementTypesCollection.add({
          name: "Non Functional",
          color: "#CD4EC0",
          deleted: false,
        });

        const statusCollection = newProjectRef
          .collection("settings")
          .doc("settings")
          .collection("statusTypes");

        await statusCollection.add({
          name: "Todo",
          color: "#0737E3",
          deleted: false,
        });

        await statusCollection.add({
          name: "Doing",
          color: "#AD7C00",
          deleted: false,
        });

        await statusCollection.add({
          name: "Done",
          color: "#009719",
          deleted: false,
        });

        return { success: true, projectId: newProjectRef.id };
      } catch (error) {
        console.error("Error adding document: ", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  getGeneralConfig: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      const project = await ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .get();

      return ProjectSchema.parse(project.data());
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
    }),
  deleteProject: protectedProcedure
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
    }),
  getProjectName: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      const project = await ctx.firestore
        .collection("projects")
        .doc(projectId)
        .get();
      const projectData = ProjectSchema.parse(project.data());
      return { projectName: projectData.name };
    }),

  getUserTypes: protectedProcedure
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
    }),
});
