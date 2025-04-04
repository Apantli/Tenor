import { TRPCError } from "@trpc/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import type {
  Project,
  WithId,
  User,
  Settings,
  Tag,
} from "~/lib/types/firebaseSchemas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { UserStory } from "~/lib/types/firebaseSchemas";
import { ProjectSchema } from "~/lib/types/zodFirebaseSchema";

function getRandomInt(min: number, max: number): number {
  if (min > max) {
    throw new Error("Min must be less than or equal to max");
  }

  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

// TODO: Change to real new US
const createDummyUserStory = async (
  dbAdmin: FirebaseFirestore.Firestore,
  projectId: string,
) => {
  try {
    const userStoryCollectionRef = dbAdmin.collection(
      `projects/${projectId}/userStories`,
    );

    const sampleUserStory: UserStory = {
      scrumId: getRandomInt(1, 999),
      name: getRandomInt(2, 1000) + " Implement Login Feature",
      description:
        getRandomInt(2, 1000) +
        " Users should be able to log in using their email and password.",
      deleted: false,
      sprintId: "",
      tasks: [],
      complete: false,
      tagIds: [],
      size: getRandomInt(1, 2) == 1 ? "M" : "L",
      priorityId: "",
      epicId: "",
      acceptanceCriteria:
        "- Users can enter email and password.\n- System validates credentials.\n- Users are redirected to the dashboard upon successful login.",
      dependencyIds: [],
      requiredByIds: [],
    };

    await userStoryCollectionRef.add(sampleUserStory);
  } catch (e) {
    console.log("Some Error occured while creating sample US:", e);
  }
};

const getUserStoriesFromProject = async (
  dbAdmin: FirebaseFirestore.Firestore,
  projectId: string,
) => {
  const userStoryCollectionRef = dbAdmin.collection(
    `projects/${projectId}/userStories`,
  );
  const snap = await userStoryCollectionRef.get();

  const docs = snap.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
    };
  });

  const userStories: WithId<UserStory>[] = docs.filter(
    (userStory): userStory is WithId<UserStory> => userStory !== null,
  );

  return userStories;
};

// TODO: Fetch from db
const getSprintScrumId = () => {
  return getRandomInt(1, 10);
};

// TODO: Fetch from db
const getEpicScrumId = () => {
  return getRandomInt(1, 30);
};

// TODO: Fetch from db
const getPriorityTag = () => {
  const rand = getRandomInt(1, 2);
  return {
    name: rand == 1 ? "High" : "Low",
    color: rand == 1 ? "#FF4C4C" : "#009719",
    deleted: false,
  } as Tag;
};

// TODO: Color according to size. Decide if its customizable or not for correct implementation
const getSizeTag = (size: string) => {
  return {
    name: size,
    color: size == "M" ? "#8300DA" : "#AD7C00",
    deleted: false,
  } as Tag;
};

// TODO: Fetch from db
const getTaskProgress = () => {
  return [0, 0] as [number | undefined, number | undefined];
};

export interface UserStoryCol {
  id: number;
  title: string;
  epicId: number;
  priority: Tag;
  size: Tag;
  sprintId: number;
  taskProgress: [number | undefined, number | undefined];
}

const createUSTableData = (data: WithId<UserStory>[]) => {
  if (data.length === 0) return [];

  return data.map((userStory) => ({
    id: userStory.scrumId,
    title: userStory.name,
    epicId: getEpicScrumId(),
    priority: getPriorityTag(),
    size: getSizeTag(userStory.size),
    sprintId: getSprintScrumId(),
    taskProgress: getTaskProgress(),
  })) as UserStoryCol[];
};

export const projectsRouter = createTRPCRouter({
  listProjects: protectedProcedure.query(async ({ ctx }) => {
    const useruid = ctx.session.user.uid;
    const projects = await fetchUserProjects(useruid, ctx.firestore);

    return projects;
  }),

  createUserStory: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await createDummyUserStory(ctx.firestore, input);
    }),

  getUserStoriesTableFriendly: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const rawUs = await getUserStoriesFromProject(ctx.firestore, input);
      return createUSTableData(rawUs);
    }),

  createProject: protectedProcedure.mutation(async ({ ctx }) => {
    const useruid = ctx.session.uid;

    try {
      const project = createEmptyProject();
      const projectRef = await ctx.firestore
        .collection("projects")
        .add(project);
      console.log("Project added with ID: ", projectRef.id);

      const userRef = ctx.firestore.collection("users").doc(useruid);
      await userRef.update("projectIds", FieldValue.arrayUnion(projectRef.id));

      return { success: true, projectId: projectRef.id };
    } catch (error) {
      console.error("Error adding document: ", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),
  createProject2: protectedProcedure
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

        return { success: true, projectId: projectRef.id };
      } catch (error) {
        console.error("Error adding document: ", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
