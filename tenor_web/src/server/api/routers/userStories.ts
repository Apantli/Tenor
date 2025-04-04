import { z } from "zod";
import type { WithId, Tag } from "~/lib/types/firebaseSchemas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { UserStory } from "~/lib/types/firebaseSchemas";

export interface UserStoryCol {
  id: number;
  title: string;
  epicId: number;
  priority: Tag;
  size: Tag;
  sprintId: number;
  taskProgress: [number | undefined, number | undefined];
}

function getRandomInt(min: number, max: number): number {
  if (min > max) {
    throw new Error("Min must be less than or equal to max");
  }

  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

export const userStoriesRouter = createTRPCRouter({
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
});
