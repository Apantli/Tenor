import { UserStoryCol } from "~/lib/types/columnTypes";
import { getEpic, getEpicsContext } from "./epics";
import { noTag } from "~/lib/defaultProjectValues";
import {
  getBacklogTag,
  getBacklogContext,
  getPriority,
  getPriorityContext,
  getStatusType,
} from "./tags";
import {
  Epic,
  Sprint,
  StatusTag,
  Tag,
  Task,
  UserStory,
  WithId,
} from "~/lib/types/firebaseSchemas";
import { getProjectRef } from "./general";
import { UserStorySchema } from "~/lib/types/zodFirebaseSchema";
import { TRPCError } from "@trpc/server";
import { UserStoryDetail } from "~/lib/types/detailSchemas";
import { Firestore } from "firebase-admin/firestore";
import { getTask } from "./tasks";
import { getSprint } from "./sprints";
import { getRequirementContext, getRequirementsContext } from "./requirements";
import { getProjectContext } from "./ai";

/**
 * @function getUserStoriesRef
 * @description Gets a reference to the user stories collection for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {FirebaseFirestore.CollectionReference} A reference to the user stories collection
 */
export const getUserStoriesRef = (firestore: Firestore, projectId: string) => {
  return getProjectRef(firestore, projectId).collection("userStories");
};

/**
 * @function getUserStoryRef
 * @description Gets a reference to a specific user story document
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param userStoryId The ID of the user story
 * @returns {FirebaseFirestore.DocumentReference} A reference to the user story document
 */
export const getUserStoryRef = (
  firestore: Firestore,
  projectId: string,
  userStoryId: string,
) => {
  return getUserStoriesRef(firestore, projectId).doc(userStoryId);
};

// FIXME: This may overlap, this isnt quite right
/**
 * @function getUserStoryNewId
 * @description Gets the next available user story ID for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {Promise<number>} The next available user story ID
 */
export const getUserStoryNewId = async (
  firestore: Firestore,
  projectId: string,
) => {
  const userStoriesRef = getUserStoriesRef(firestore, projectId).count().get();
  const userStoriesCount = (await userStoriesRef).data().count;
  return userStoriesCount + 1;
};

/**
 * @function getUserStories
 * @description Retrieves all non-deleted user stories associated with a specific project
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project to retrieve user stories from
 * @returns {Promise<WithId<UserStory>[]>} An array of user story objects with their IDs
 */
export const getUserStories = async (
  firestore: Firestore,
  projectId: string,
) => {
  const userStoriesRef = getUserStoriesRef(firestore, projectId)
    .where("deleted", "==", false)
    .orderBy("scrumId", "desc");
  const userStoriesSnapshot = await userStoriesRef.get();
  const userStories: WithId<UserStory>[] = userStoriesSnapshot.docs.map(
    (doc) => {
      return {
        id: doc.id,
        ...UserStorySchema.parse(doc.data()),
      } as WithId<UserStory>;
    },
  );
  return userStories;
};

/**
 * @function getUserStory
 * @description Retrieves a specific user story from the Firestore database
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param userStoryId The ID of the user story
 * @returns {Promise<WithId<UserStory>>} The user story object validated by UserStorySchema or undefined if not found
 */
export const getUserStory = async (
  firestore: Firestore,
  projectId: string,
  userStoryId: string,
) => {
  const userStoryRef = getUserStoryRef(firestore, projectId, userStoryId);
  const userStorySnapshot = await userStoryRef.get();
  if (!userStorySnapshot.exists) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User story not found",
    });
  }
  return {
    id: userStorySnapshot.id,
    ...UserStorySchema.parse(userStorySnapshot.data()),
  } as WithId<UserStory>;
};

/**
 * @function getUserStoryDetail
 * @description Retrieves detailed information about a specific user story
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @param {string} userStoryId - The ID of the user story to retrieve details for
 * @returns {Promise<UserStoryDetail>} The user story detail object
 */
export const getUserStoryDetail = async (
  firestore: Firestore,
  projectId: string,
  userStoryId: string,
) => {
  console.log("LOADING USER STORY DETAIL", userStoryId);
  const userStory = await getUserStory(firestore, projectId, userStoryId);

  const priority: Tag | undefined =
    (await getPriority(firestore, projectId, userStory.priorityId)) ??
    undefined;

  const epic: WithId<Epic> | undefined = userStory.epicId
    ? await getEpic(firestore, projectId, userStory.epicId)
    : undefined;

  const status: StatusTag | undefined = userStory.statusId
    ? await getStatusType(firestore, projectId, userStory.statusId)
    : undefined;

  const tags: Tag[] = await Promise.all(
    userStory.tagIds.map(async (tagId) => {
      return await getBacklogTag(firestore, projectId, tagId);
    }),
  );

  const dependencies: WithId<UserStory>[] = await Promise.all(
    userStory.dependencyIds.map(async (dependencyId) => {
      return await getUserStory(firestore, projectId, dependencyId);
    }),
  );

  const requiredBy: WithId<UserStory>[] = await Promise.all(
    userStory.requiredByIds.map(async (requiredById) => {
      return await getUserStory(firestore, projectId, requiredById);
    }),
  );

  const sprint: WithId<Sprint> | undefined = userStory.sprintId
    ? await getSprint(firestore, projectId, userStory.sprintId)
    : undefined;

  //   const tasks: WithId<Task>[] = await Promise.all(
  //     userStory.taskIds.map(async (taskId) => {
  //       return await getTask(firestore, projectId, taskId);
  //     }),
  //   );

  const userStoryDetail: WithId<UserStoryDetail> = {
    ...userStory,
    sprint,
    priority,
    status,
    epic,
    tags,
    dependencies,
    requiredBy,
  };

  return userStoryDetail;
};

/**
 * @function getUserStoryTable
 * @description Retrieves all non-deleted user story previews associated with a specific project
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project to retrieve user story previews from
 * @returns {Promise<WithId<UserStoryCol>[]>} An array of user story objects with their IDs
 */
export const getUserStoryTable = async (
  firestore: Firestore,
  projectId: string,
) => {
  const userStories = await getUserStories(firestore, projectId);
  const userStoryCols: UserStoryCol[] = await Promise.all(
    userStories.map(async (userStory): Promise<UserStoryCol> => {
      const priority: Tag =
        (await getPriority(firestore, projectId, userStory.priorityId)) ??
        noTag;

      const epicScrumId: number | undefined =
        userStory.epicId !== undefined
          ? ((await getEpic(firestore, projectId, userStory.epicId)).scrumId ??
            undefined)
          : undefined;

      // FIXME: Sprint, task progress
      const userStoryCol: UserStoryCol = {
        ...userStory,
        epicScrumId,
        priority,
        taskProgress: [0, 1],
      };
      return userStoryCol;
    }),
  );
  return userStoryCols;
};

export const getUserStoriesContext = async (
  firestore: Firestore,
  projectId: string,
) => {
  const userStories = await getUserStories(firestore, projectId);
  let userStoryContext = "# EXISTING USER STORIES\n\n";
  userStories.forEach((userStory) => {
    const userStoryData = UserStorySchema.parse(userStory);
    userStoryContext += `- id: ${userStory.id}\n- name: ${userStoryData.name}\n- description: ${userStoryData.description}\n- priorityId: ${userStoryData.priorityId}\n- tagIds: [${userStoryData.tagIds.join(" , ")}]\n- dependencies: [${userStoryData.dependencyIds.join(" , ")}]\n- requiredBy: [${userStoryData.requiredByIds.join(" , ")}]\n\n`;
  });
  return userStoryContext;
};

export const getUserStoryContext = async (
  firestore: Firestore,
  projectId: string,
  amount: number,
  prompt: string,
) => {
  // load all contexts simultaneously
  const [
    projectContext,
    epicsContext,
    requirementContext,
    userStoryContext,
    prioritiesContext,
    backlogContext,
  ] = await Promise.all([
    getUserStoriesContext(firestore, projectId),
    getEpicsContext(firestore, projectId),
    getRequirementsContext(firestore, projectId),
    getUserStoriesContext(firestore, projectId),
    getPriorityContext(firestore, projectId),
    getBacklogContext(firestore, projectId),
  ]);

  const passedInPrompt =
    prompt != ""
      ? `Consider that the user wants the user stories for the following: ${prompt}`
      : "";

  // Context for the AI ---------------------------
  const completePrompt = `
  ${projectContext}
  
  Given the following context, follow the instructions below to the best of your ability.
  
  ${epicsContext}
  ${requirementContext}
  ${userStoryContext}
  ${prioritiesContext}
  ${backlogContext}

  ${passedInPrompt}
  
  Generate ${amount} user stories for the mentioned software project. Do NOT include any identifier in the name like "User Story 1", just use a normal title.\n\n
`;
  // ---------------------------------------------

  return completePrompt;
};
