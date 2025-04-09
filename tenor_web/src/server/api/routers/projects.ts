import { TRPCError } from "@trpc/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import type {
  Project,
  WithId,
  User,
  Settings,
  Requirement,
} from "~/lib/types/firebaseSchemas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { fetchMultipleHTML } from "~/utils/webcontent";
import { fetchMultipleFiles } from "~/utils/filecontent";
import { uploadBase64File } from "~/utils/firebaseBucket";
import { ProjectSchema } from "~/lib/types/zodFirebaseSchema";
import { isBase64Valid } from "~/utils/base64";
import { v4 as uuidv4 } from "uuid";
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

export const emptyRequeriment = (): Requirement  => ({
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

    activities: [],
  };
};

const fetchProjectData = async (
  projectRef: FirebaseFirestore.DocumentReference,
  dbAdmin: FirebaseFirestore.Firestore,
): Promise<Project | null> => {
  try {
    console.log("Fetching project data for", projectRef.path);
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
    console.log("User data from Firestore:", userData);

    if (!userData.projectIds || userData.projectIds.length === 0) {
      console.log("No projects assigned for user", uid);
      return [];
    }

    console.log("Project references (string) for user:", userData.projectIds);

    // Transform the string to a DocumentReference
    const assignProjectRefs = userData.projectIds.map(
      (projectPath) => dbAdmin.doc(`projects/${projectPath}`), // Use dbAdmin.doc
    );

    console.log("Converted project references:", assignProjectRefs);

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
      (project): project is WithId<Project> => project !== null,
    );

    if (projects.length === 0) {
      console.log("No projects found for user", uid);
    } else {
      console.log("Projects found for user", uid, projects);
    }

    return projects;
  } catch (error) {
    console.error("Error getting documents: ", error);
    return [];
  }
};

export const projectsRouter = createTRPCRouter({
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
  listProjects: protectedProcedure.query(async ({ ctx }) => {
    const useruid = ctx.session.user.uid;
    const projects = await fetchUserProjects(useruid, ctx.firestore);
    return projects;
  }),
  createProject: protectedProcedure
    .input(ProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const useruid = ctx.session.uid;

      // FIXME: remove duplicated users from input.users
      // FIXME: get ids from input.users, use ids to add users to project
      // FIXME: validate valid links before fetching html

      // Add creator as project admin
      input.users.push({
        userId: useruid,
        roleId: "admin",
        active: true,
      });

      // Remove duplicated users (preserve first occurrence)
      const seen = new Map<
        string,
        z.infer<typeof ProjectSchema>["users"][number]
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
        // eslint-disable-next-line
        const logoPath = uuidv4() + "." + isLogoValid;
        input.logo = await uploadBase64File(logoPath, input.logo);
      } else {
        // Use default icon
        input.logo = "/defaultProject.png";
      }

      try {
        const { settings, ...projectData } = input;

        const projectRef = await ctx.firestore
          .collection("projects")
          .add(projectData);

        const userRefs = input.users.map((user) =>
          ctx.firestore.collection("users").doc(user.userId),
        );

        await Promise.all(
          userRefs.map((userRef) =>
            userRef.update("projectIds", FieldValue.arrayUnion(projectRef.id)),
          ),
        );
        // FIXME: Create proper default settings in the project
        await projectRef.collection("settings").doc("settings").set(settings);

        const priorityTypesCollection = projectRef
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

        return { success: true, projectId: projectRef.id };
      } catch (error) {
        console.error("Error adding document: ", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
