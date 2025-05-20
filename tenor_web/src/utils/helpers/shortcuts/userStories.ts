import type { UserStoryCol } from "~/lib/types/columnTypes";
import { getEpic, getEpicContext, getEpicsContext } from "./epics";
import {
  getBacklogTag,
  getBacklogContext,
  getPriority,
  getPriorityContext,
  getStatusType,
  getBacklogTagsContext,
} from "./tags";
import type {
  Epic,
  Sprint,
  StatusTag,
  Tag,
  UserStory,
  WithId,
} from "~/lib/types/firebaseSchemas";
import { getGenericBacklogItemContext, getProjectRef } from "./general";
import { UserStorySchema } from "~/lib/types/zodFirebaseSchema";
import { TRPCError } from "@trpc/server";
import type { TaskPreview, UserStoryDetail } from "~/lib/types/detailSchemas";
import type { Firestore } from "firebase-admin/firestore";
import { getTaskProgress, getTaskTable } from "./tasks";
import { getSprint } from "./sprints";
import { getRequirementsContext } from "./requirements";
import type * as admin from "firebase-admin";
import { getProjectContext } from "./ai";
import { FieldValue } from "firebase-admin/firestore";
import type { DependenciesWithId } from "~/lib/types/userStoriesUtilTypes";

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
  admin: admin.app.App,
  firestore: Firestore,
  projectId: string,
  userStoryId: string,
) => {
  const userStory = await getUserStory(firestore, projectId, userStoryId);

  const priority: Tag | undefined = userStory.priorityId
    ? await getPriority(firestore, projectId, userStory.priorityId)
    : undefined;

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

  const tasks = await getTaskTable(admin, firestore, projectId, userStory.id);

  const userStoryDetail: WithId<UserStoryDetail> & { tasks: TaskPreview[] } = {
    ...userStory,
    sprint,
    priority,
    status,
    epic,
    tags,
    dependencies,
    requiredBy,
    tasks,
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
      const priority: Tag | undefined = userStory.priorityId
        ? await getPriority(firestore, projectId, userStory.priorityId)
        : undefined;

      const epicScrumId: number | undefined = userStory.epicId
        ? (await getEpic(firestore, projectId, userStory.epicId)).scrumId
        : undefined;

      const sprint: WithId<Sprint> | undefined = userStory.sprintId
        ? await getSprint(firestore, projectId, userStory.sprintId)
        : undefined;

      const taskProgress = await getTaskProgress(
        firestore,
        projectId,
        userStory.id,
      );

      const userStoryCol: UserStoryCol = {
        ...userStory,
        sprintNumber: sprint?.number,
        epicScrumId,
        priority,
        taskProgress,
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
    getProjectContext(firestore, projectId),
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

export const getUserStoryContextSolo = async (
  firestore: Firestore,
  projectId: string,
  userStoryId: string,
) => {
  const userStory = await getUserStory(firestore, projectId, userStoryId);

  // User story context
  const itemContext = await getGenericBacklogItemContext(
    firestore,
    projectId,
    userStory.name,
    userStory.description,
    userStory.priorityId ?? "",
    userStory.size,
  );

  // User story context
  const epicContext = await getEpicContext(
    firestore,
    projectId,
    userStory.epicId,
  );

  // Related tags context
  const tagContext = await getBacklogTagsContext(
    firestore,
    projectId,
    userStory.tagIds,
  );

  return `# USER STORY DETAILS\n
${itemContext}
- acceptanceCriteria: ${userStory.acceptanceCriteria}
${epicContext}
${tagContext}\n
`;
};

export const updateDependency = (
  firestore: Firestore,
  projectId: string,
  userStoryId: string,
  relatedUserStoryId: string,
  operation: "add" | "remove",
  field: "requiredByIds" | "dependencyIds",
) => {
  const updateRef = getUserStoryRef(firestore, projectId, userStoryId);
  if (operation === "add") {
    return updateRef.update({
      [field]: FieldValue.arrayUnion(relatedUserStoryId),
    });
  } else {
    return updateRef.update({
      [field]: FieldValue.arrayRemove(relatedUserStoryId),
    });
  }
};

/**
 * Helper function to perform DFS and detect cycle in user story dependencies
 * @param adjacencyList Adjacency list representation of the dependency graph
 * @param userStoryId Current user story ID being checked
 * @param visitedUserStories Map to track visited nodes
 * @param recursionPathVisited Map to track nodes in current recursion stack
 * @returns {boolean} True if a cycle is detected, false otherwise
 */
const isCyclicUtil = (
  adjacencyList: Map<string, string[]>,
  userStoryId: string,
  visitedUserStories: Map<string, boolean>,
  recursionPathVisited: Map<string, boolean>,
): boolean => {
  // If node is already in the recursion stack, cycle detected
  if (recursionPathVisited.get(userStoryId)) return true;

  // If node is already visited and not in recStack, no need to check again
  if (visitedUserStories.get(userStoryId)) return false;

  // Mark the node as visited and add it to the recursion stack
  visitedUserStories.set(userStoryId, true);
  recursionPathVisited.set(userStoryId, true);

  // Recur for all neighbors (dependencies) of the current node
  const neighbors = adjacencyList.get(userStoryId) ?? [];
  for (const v of neighbors) {
    if (
      isCyclicUtil(adjacencyList, v, visitedUserStories, recursionPathVisited)
    ) {
      return true; // If any path leads to a cycle, return true
    }
  }

  // Backtrack: remove the node from recursion stack
  recursionPathVisited.set(userStoryId, false);
  return false;
};

/**
 * Function to construct adjacency list from user stories
 * @param userStories Array of user stories
 * @param newUserStories Optional array of new user stories to include in the graph
 * @param newDependencies Optional array of new dependencies to include in the graph
 * @returns Map representing the adjacency list
 */
const constructAdjacencyList = (
  userStories: DependenciesWithId[],
  newUserStories?: DependenciesWithId[],
  newDependencies?: Array<{ sourceId: string; targetId: string }>,
): Map<string, string[]> => {
  const adj = new Map<string, string[]>();

  // Add dependencies from existing user stories
  userStories.forEach((us) => {
    adj.set(us.id, [...(us.dependencyIds ?? [])]);
    us.requiredByIds?.forEach((reqId) => {
      const reqs = adj.get(reqId) ?? [];
      reqs.push(us.id);
      adj.set(reqId, reqs);
    });
  });

  // Add new user stories if provided
  if (newUserStories) {
    newUserStories.forEach((us) => {
      adj.set(us.id, [...(us.dependencyIds ?? [])]);
      us.requiredByIds?.forEach((reqId) => {
        const reqs = adj.get(reqId) ?? [];
        reqs.push(us.id);
        adj.set(reqId, reqs);
      });
    });
  }

  // Add new dependencies if provided
  if (newDependencies) {
    newDependencies.forEach(({ sourceId, targetId }) => {
      const deps = adj.get(sourceId) ?? [];
      if (!deps.includes(targetId)) {
        deps.push(targetId);
        adj.set(sourceId, deps);
      }
    });
  }

  return adj;
};

/**
 * Checks if there is a cycle in the dependencies between user stories
 * @param firestore Firestore instance
 * @param projectId Project ID
 * @param newUserStories Optional array of new user stories to include in cycle detection
 * @param newDependencies Optional array of new dependencies to include in cycle detection
 * @returns {Promise<boolean>} True if a cycle is detected, false otherwise
 */
export const hasDependencyCycle = async (
  firestore: Firestore,
  projectId: string,
  newUserStories?: DependenciesWithId[],
  newDependencies?: Array<{ sourceId: string; targetId: string }>,
): Promise<boolean> => {
  // Get all user stories
  const userStories = await getUserStories(firestore, projectId);

  // Construct adjacency list
  const adj = constructAdjacencyList(
    userStories,
    newUserStories,
    newDependencies,
  );

  // Initialize visited and recursion stack maps
  const visited = new Map<string, boolean>();
  const recStack = new Map<string, boolean>();

  // Initialize all nodes as not visited
  adj.forEach((_, id) => {
    visited.set(id, false);
    recStack.set(id, false);
  });

  // Check each user story (for disconnected components)
  for (const [id] of adj) {
    if (!visited.get(id) && isCyclicUtil(adj, id, visited, recStack)) {
      return true; // Cycle found
    }
  }

  return false; // No cycle detected
};
