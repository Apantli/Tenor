import { TRPCError } from "@trpc/server";
import { FieldValue } from "firebase-admin/firestore";
import type {
  Project,
  WithId,
  User,
  Settings,
} from "~/lib/types/firebaseSchemas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { ProjectSchema } from "~/lib/types/zodFirebaseSchema";

const emptySettings: Settings = {
  sprintDuration: 0,
  maximumSprintStoryPoints: 0,
  aiContext: {
    text: "",
    files: [],
    links: [],
  },
  requirementFocusTags: [],
  requirementTypeTags: [],
  backlogTags: [],
  priorityTypes: [],
  statusTabs: [],
  roles: [],
};

export const createEmptyProject = (): Project => {
  return {
    name: "",
    description: "",
    logoUrl: "",
    deleted: false,

    settings: emptySettings, // Deberías definir un `emptySettings` si `Settings` tiene valores requeridos

    users: [],

    requirements: [],
    userStories: [],
    issues: [],
    epics: [],
    genericItems: [],

    sprints: [],
    sprintSnapshots: [],
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
  listProjects: protectedProcedure.query(async ({ ctx }) => {
    const useruid = ctx.session.user.uid;
    const projects = await fetchUserProjects(useruid, ctx.firestore);

    return projects;
  }),
  createProject: protectedProcedure
    .input(ProjectSchema)
    .mutation(async ({ ctx }) => {
      const useruid = ctx.session.uid;

      try {
        const project = createEmptyProject();
        const projectRef = await ctx.firestore
          .collection("projects")
          .add(project);
        console.log("Project added with ID: ", projectRef.id);

        const userRef = ctx.firestore.collection("users").doc(useruid);
        await userRef.update(
          "projectIds",
          FieldValue.arrayUnion(projectRef.id),
        );

        // FIXME: Create proper default settings in the project
        await projectRef
          .collection("settings")
          .doc("settings")
          .set({
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
            // priorityTypes: [
            //   { name: "P2", color: "#2c7817", deleted: false },
            //   { name: "P1", color: "#d1b01d", deleted: false },
            //   { name: "P0", color: "#FF0000", deleted: false },
            // ],
            // statusTabs: [],
            // roles: [],
          });

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
