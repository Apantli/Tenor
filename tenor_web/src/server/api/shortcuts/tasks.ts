import type { Firestore, Settings } from "firebase-admin/firestore";
import { getProjectRef, getSettings } from "./general";
import type {
  Size,
  StatusTag,
  Task,
  WithId,
} from "~/lib/types/firebaseSchemas";
import { TaskSchema } from "~/lib/types/zodFirebaseSchema";
import { getStatusType, getStatusTypes, getTodoStatusTag } from "./tags";
import type {
  TaskDetail,
  TaskPreview,
  UserPreview,
} from "~/lib/types/detailSchemas";
import type * as admin from "firebase-admin";
import type { TaskCol } from "~/lib/types/columnTypes";
import { getGlobalUserPreview } from "./users";
import { FieldValue } from "firebase-admin/firestore";
import type { DependenciesWithId } from "~/lib/types/userStoriesUtilTypes";
import { getSprint } from "./sprints";
import { getUserStory } from "./userStories";
import { type BurndownChartData } from "~/lib/defaultValues/burndownChart";

/**
 * @function getTasksRef
 * @description Gets a reference to the tasks collection for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {FirebaseFirestore.CollectionReference} A reference to the tasks collection
 */
export const getTasksRef = (firestore: Firestore, projectId: string) => {
  return getProjectRef(firestore, projectId).collection("tasks");
};

/**
 * @function getTaskRef
 * @description Gets a reference to a specific task document
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param taskId The ID of the task
 * @returns {FirebaseFirestore.DocumentReference} A reference to the task document
 */
export const getTaskRef = (
  firestore: Firestore,
  projectId: string,
  taskId: string,
) => {
  return getTasksRef(firestore, projectId).doc(taskId);
};

const isCyclicUtil = (
  adjacencyList: Map<string, string[]>,
  taskId: string,
  visitedTasks: Map<string, boolean>,
  recursionPathVisited: Map<string, boolean>,
): boolean => {
  // If node is already in the recursion stack, cycle detected
  if (recursionPathVisited.get(taskId)) return true;

  // If node is already visited and not in recStack, no need to check again
  if (visitedTasks.get(taskId)) return false;

  // Mark the node as visited and add it to the recursion stack
  visitedTasks.set(taskId, true);
  recursionPathVisited.set(taskId, true);

  // Recur for all neighbors (dependencies) of the current node
  const neighbors = adjacencyList.get(taskId) ?? [];
  for (const v of neighbors) {
    if (isCyclicUtil(adjacencyList, v, visitedTasks, recursionPathVisited)) {
      return true; // If any path leads to a cycle, return true
    }
  }

  // Backtrack: remove the node from recursion stack
  recursionPathVisited.set(taskId, false);
  return false;
};

export const updateDependency = (
  firestore: Firestore,
  projectId: string,
  taskId: string,
  relaredTaskId: string,
  operation: "add" | "remove",
  field: "requiredByIds" | "dependencyIds",
) => {
  const updateRef = getTaskRef(firestore, projectId, taskId);
  if (operation === "add") {
    return updateRef.update({
      [field]: FieldValue.arrayUnion(relaredTaskId),
    });
  } else {
    return updateRef.update({
      [field]: FieldValue.arrayRemove(relaredTaskId),
    });
  }
};

const constructAdjacencyList = (
  tasks: DependenciesWithId[],
  newTasks?: DependenciesWithId[],
  newDependencies?: Array<{ parentId: string; dependencyId: string }>,
): Map<string, string[]> => {
  const adj = new Map<string, string[]>();

  // Add dependencies from existing tasks
  tasks.forEach((ts) => {
    adj.set(ts.id, [...(ts.dependencyIds ?? [])]);
    ts.requiredByIds?.forEach((reqId) => {
      const reqs = adj.get(reqId) ?? [];
      reqs.push(ts.id);
      adj.set(reqId, reqs);
    });
  });

  // Add new tasks if provided
  if (newTasks) {
    newTasks.forEach((ts) => {
      adj.set(ts.id, [...(ts.dependencyIds ?? [])]);
      ts.requiredByIds?.forEach((reqId) => {
        const reqs = adj.get(reqId) ?? [];
        reqs.push(ts.id);
        adj.set(reqId, reqs);
      });
    });
  }

  // Add new dependencies if provided
  if (newDependencies) {
    newDependencies.forEach(({ parentId, dependencyId }) => {
      const deps = adj.get(parentId) ?? [];
      if (!deps.includes(dependencyId)) {
        deps.push(dependencyId);
        adj.set(parentId, deps);
      }
    });
  }

  return adj;
};

export const hasDependencyCycle = async (
  firestore: Firestore,
  projectId: string,
  newTasks?: DependenciesWithId[],
  newDependencies?: Array<{ parentId: string; dependencyId: string }>,
): Promise<boolean> => {
  // Get all tasks
  const tasks = await getTasks(firestore, projectId);

  // Construct adjacency list
  const adj = constructAdjacencyList(tasks, newTasks, newDependencies);

  // Initialize visited and recursion stack maps
  const visited = new Map<string, boolean>();
  const recStack = new Map<string, boolean>();

  // Initialize all nodes as not visited
  adj.forEach((_, id) => {
    visited.set(id, false);
    recStack.set(id, false);
  });

  // Check each task (for disconnected components)
  for (const [id] of adj) {
    if (!visited.get(id) && isCyclicUtil(adj, id, visited, recStack)) {
      return true; // Cycle found
    }
  }

  return false; // No cycle detected
};

/**
 * @function getTasks
 * @description Retrieves all non-deleted tasks from a project, ordered by scrumId
 * @param {Firestore} firestore - The Firestore database instance
 * @param {string} projectId - The ID of the project to retrieve tasks from
 * @returns {Promise<WithId<Task>[]>} An array of task objects with their IDs
 */
export const getTasks = async (firestore: Firestore, projectId: string) => {
  const tasksRef = getTasksRef(firestore, projectId)
    .where("deleted", "==", false)
    .orderBy("scrumId");

  const tasksSnapshot = await tasksRef.get();
  const tasks: WithId<Task>[] = tasksSnapshot.docs.map((doc) => {
    const dueDateData: { seconds: number; nanoseconds: number } | undefined =
      doc.data()?.dueDate as
        | {
            seconds: number;
            nanoseconds: number;
          }
        | undefined;
    const dueDate = dueDateData
      ? new Date(dueDateData.seconds * 1000)
      : undefined;
    return {
      id: doc.id,
      ...TaskSchema.parse(doc.data()),
      dueDate,
    } as WithId<Task>;
  });

  return tasks;
};

/**
 * @function getTask
 * @description Retrieves a specific task by its ID
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @param {string} taskId - The ID of the task to retrieve
 * @returns {Promise<WithId<Task>>} The task object with its ID
 */
export const getTask = async (
  firestore: Firestore,
  projectId: string,
  taskId: string,
) => {
  const taskRef = getTaskRef(firestore, projectId, taskId);
  const taskSnapshot = await taskRef.get();
  if (!taskSnapshot.exists) {
    throw new Error(`Task with ID ${taskId} does not exist`);
  }

  // FIXME: move this function to a new place
  // Parse the task due date
  const dueDateData: { seconds: number; nanoseconds: number } | undefined =
    taskSnapshot.data()?.dueDate as
      | {
          seconds: number;
          nanoseconds: number;
        }
      | undefined;
  const dueDate = dueDateData
    ? new Date(dueDateData.seconds * 1000)
    : undefined;

  return {
    id: taskSnapshot.id,
    ...TaskSchema.parse(taskSnapshot.data()),
    dueDate,
  } as WithId<Task>;
};

/**
 * @function getTasksFromItem
 * @description Retrieves all non-deleted tasks associated with a specific item
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @param {string} itemId - The ID of the item to retrieve tasks from
 * @returns {Promise<WithId<Task>[]>} An array of task objects with their IDs
 */
export const getTasksFromItem = async (
  firestore: Firestore,
  projectId: string,
  itemId: string,
) => {
  const tasksRef = getTasksRef(firestore, projectId)
    .where("deleted", "==", false)
    .where("itemId", "==", itemId)
    .orderBy("scrumId");

  const tasksSnapshot = await tasksRef.get();
  const tasks: WithId<Task>[] = tasksSnapshot.docs.map((doc) => {
    return {
      id: doc.id,
      ...TaskSchema.parse(doc.data()),
    } as WithId<Task>;
  });
  return tasks;
};

/**
 * @function getTaskProgress
 * @description Calculates the progress of tasks in a project
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @param {string} itemId - The ID of the item
 * @returns {Promise<[number, number]>} A tuple containing the number of completed tasks and the total number of tasks
 */
export const getTaskProgress = async (
  firestore: Firestore,
  projectId: string,
  itemId: string,
) => {
  const tasksRef = getTasksRef(firestore, projectId)
    .where("deleted", "==", false)
    .where("itemId", "==", itemId);
  const tasksSnapshot = await tasksRef.get();
  const totalTasks = tasksSnapshot.size;

  const completedTasks = await Promise.all(
    tasksSnapshot.docs.map(async (taskDoc) => {
      const taskData = TaskSchema.parse(taskDoc.data());

      if (!taskData.statusId) return false;

      const statusTag = await getStatusType(
        firestore,
        projectId,
        taskData.statusId,
      );
      return statusTag?.marksTaskAsDone;
    }),
  ).then((results) => results.filter(Boolean).length);

  return [completedTasks, totalTasks] as [number, number];
};

/**
 * @function getTasksAssignesIdsFromItem
 * @description Retrieves unique assignee IDs from all tasks associated with a specific item
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @param {string} itemId - The ID of the item to get task assignees from
 * @returns {Promise<string[]>} An array of unique assignee IDs from the item's tasks
 */
export const getTasksAssignesIdsFromItem = async (
  firestore: Firestore,
  projectId: string,
  itemId: string,
): Promise<string[]> => {
  if (!itemId) {
    return [];
  }
  const tasks = await getTasksFromItem(firestore, projectId, itemId);

  const userIds = tasks
    .map((task) => task.assigneeId)
    .filter((id): id is string => Boolean(id));

  const uniqueUserIds: string[] = [...new Set(userIds)];
  return uniqueUserIds;
};

/**
 * @function getTaskAssignUsers
 * @description Retrieves unique users assigned to tasks in a specific item
 * @param {admin.app.App} admin - The Firebase Admin instance
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @param {string} itemId - The ID of the item
 * @returns {Promise<UserPreview[]>} An array of unique user objects with their IDs
 */
export const getTasksAssignUsers = async (
  admin: admin.app.App,
  firestore: Firestore,
  projectId: string,
  itemId: string,
): Promise<UserPreview[]> => {
  if (!itemId) {
    return [];
  }

  // Unique user IDs
  const userIds = await getTasksAssignesIdsFromItem(
    firestore,
    projectId,
    itemId,
  );

  const users: WithId<UserPreview>[] = await Promise.all(
    userIds.map(async (userId) => {
      const userRecord = await admin.auth().getUser(userId);
      const user: WithId<UserPreview> = {
        id: userRecord.uid,
        displayName: userRecord.displayName ?? "",
        email: userRecord.email ?? "",
        photoURL: userRecord.photoURL ?? "",
      };
      return user;
    }),
  );

  const filteredUsers = users.filter((user): user is WithId<UserPreview> =>
    Boolean(user?.id),
  );

  return filteredUsers;
};

/**
 * @function getTaskDetail
 * @description Retrieves detailed information about a specific task
 * @param {admin.app.App} admin - The Firebase Admin instance
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @param {string} taskId - The ID of the task to retrieve
 * @returns {Promise<TaskDetail>} The detailed task object
 */
export const getTaskDetail = async (
  admin: admin.app.App,
  firestore: Firestore,
  projectId: string,
  taskId: string,
) => {
  const task = await getTask(firestore, projectId, taskId);

  const assignee: WithId<UserPreview> | undefined = task.assigneeId
    ? await getGlobalUserPreview(admin, task.assigneeId)
    : undefined;

  const status: StatusTag | undefined = task.statusId
    ? await getStatusType(firestore, projectId, task.statusId)
    : undefined;

  const dependencies: WithId<TaskPreview>[] = await Promise.all(
    task.dependencyIds.map(async (dependencyId) => {
      const task = await getTask(firestore, projectId, dependencyId);
      const statusTag = await getStatusType(
        firestore,
        projectId,
        task.statusId,
      );
      return {
        ...task,
        status: statusTag,
      } as WithId<TaskPreview>;
    }),
  );

  const requiredBy: WithId<TaskPreview>[] = await Promise.all(
    task.requiredByIds.map(async (dependencyId) => {
      const task = await getTask(firestore, projectId, dependencyId);
      const statusTag = await getStatusType(
        firestore,
        projectId,
        task.statusId,
      );
      return {
        ...task,
        status: statusTag,
      } as WithId<TaskPreview>;
    }),
  );

  const taskDetail: TaskDetail = {
    ...task,
    dueDate: task.dueDate ?? undefined,
    assignee,
    status: status ?? (await getTodoStatusTag(firestore, projectId)),
    dependencies,
    requiredBy,
  };
  return taskDetail;
};

export const getTaskContextFromItem = async (
  firestore: Firestore,
  projectId: string,
  itemId: string,
) => {
  const tasks = await getTasksFromItem(firestore, projectId, itemId);
  let taskContext = "# EXISTING TASKS\n\n";
  tasks.map((task) => {
    taskContext += `- name: ${task.name}\n- description: ${task.description}\n`;
  });
  return taskContext;
};

/**
 * @function getTaskTable
 * @description Retrieves a table of tasks with their details for a specific item
 * @param {admin.app.App} admin - The Firebase Admin instance
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @param {string} itemId - The ID of the item to retrieve tasks from
 * @returns {Promise<TaskCol[]>} An array of task objects with their details
 * */
export const getTaskTable = async (
  admin: admin.app.App,
  firestore: Firestore,
  projectId: string,
  itemId: string,
) => {
  const tasks = await getTasksFromItem(firestore, projectId, itemId);
  const todoStatus = await getTodoStatusTag(firestore, projectId);

  const taskCols: TaskCol[] = await Promise.all(
    tasks.map(async (task): Promise<TaskCol> => {
      const assignee: WithId<UserPreview> | undefined = task.assigneeId
        ? await getGlobalUserPreview(admin, task.assigneeId)
        : undefined;

      // FIXME: Is this expected behaviour?
      const status: StatusTag | undefined = await getStatusType(
        firestore,
        projectId,
        task.statusId,
      );

      const taskCol: TaskCol = {
        ...task,
        assignee,
        status: status ?? todoStatus,
      };
      return taskCol;
    }),
  );
  return taskCols;
};

/**
 * @function deleteTaskAndGetModified
 * @description Deletes a single task and returns the IDs of modified tasks
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @param {string} taskId - The ID of the task to delete
 * @returns {Promise<string[]>} Array of modified task IDs including the deleted task
 */
export const deleteTaskAndGetModified = async (
  firestore: Firestore,
  projectId: string,
  taskId: string,
): Promise<string[]> => {
  const taskRef = getTaskRef(firestore, projectId, taskId);
  const task = await getTask(firestore, projectId, taskId);

  const modifiedTasks = task.dependencyIds.concat(task.requiredByIds, taskId);

  // Remove this task from all dependencies' requiredBy arrays
  await Promise.all(
    task.dependencyIds.map(async (dependencyId) => {
      await updateDependency(
        firestore,
        projectId,
        dependencyId,
        taskId,
        "remove",
        "requiredByIds",
      );
    }),
  );

  // Remove this task from all requiredBy's dependency arrays
  await Promise.all(
    task.requiredByIds.map(async (requiredById) => {
      await updateDependency(
        firestore,
        projectId,
        requiredById,
        taskId,
        "remove",
        "dependencyIds",
      );
    }),
  );

  // Mark the task as deleted
  await taskRef.update({ deleted: true });

  return modifiedTasks;
};

/**
 * @function getSizeValues
 * @description Gets story point values based on project settings
 * @param {any} settingsData - The project settings data
 * @returns {Record<string, number>} Map of size keys to their point values
 */
const getSizeValues = (
  settingsData: Partial<Settings>,
): Record<Size, number> => {
  const settingsSizes = Array.isArray(settingsData?.Size)
    ? settingsData.Size.map((value) => Number(value))
    : [];

  return {
    XS: settingsSizes[0] ?? 0,
    S: settingsSizes[1] ?? 0,
    M: settingsSizes[2] ?? 0,
    L: settingsSizes[3] ?? 0,
    XL: settingsSizes[4] ?? 0,
    XXL: settingsSizes[5] ?? 0,
  };
};

/**
 * @function sameDay
 * @description Checks if two dates are on the same day
 * @param {Date} d1 - First date
 * @param {Date} d2 - Second date
 * @returns {boolean} True if dates are on the same day
 */
const sameDay = (d1: Date, d2: Date): boolean =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

/**
 * @function getTotalStoryPoints
 * @description Calculate total story points for a sprint based on user stories
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @param {string} sprintId - The ID of the sprint
 * @returns {Promise<number>} Total story points in the sprint
 */
const getTotalStoryPoints = async (
  firestore: Firestore,
  projectId: string,
  sprintId: string,
): Promise<number> => {
  // Get sprint data
  const sprint = await getSprint(firestore, projectId, sprintId);
  const userStoriesIds = sprint.userStoryIds;

  // Get all user stories in the sprint
  const userStories = await Promise.all(
    userStoriesIds.map((id) => getUserStory(firestore, projectId, id)),
  );

  // Get settings once for all user stories
  const settingsData = await getSettings(firestore, projectId);
  const sizeValues = getSizeValues(settingsData);

  // Calculate total points
  const totalPoints = userStories.reduce((total, story) => {
    const pointValue = story?.size ? (sizeValues[story.size] ?? 0) : 0;
    return total + pointValue;
  }, 0);

  return totalPoints;
};

/**
 * @function getCompletedTasksStoryPoints
 * @description Calculate completed story points for a user story on a specific date
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @param {string} userStoryId - The ID of the user story
 * @param {Date} date - The date to check for completed tasks
 * @param {Record<string, number>} sizeValues - Map of size keys to point values
 * @returns {Promise<number>} Completed story points for the user story on the date
 */
const getCompletedTasksStoryPoints = async (
  firestore: Firestore,
  projectId: string,
  userStoryId: string,
  date: Date,
  sizeValues: Record<string, number>,
): Promise<number> => {
  // Get user story and its tasks
  const [userStory, userStoryTasks] = await Promise.all([
    getUserStory(firestore, projectId, userStoryId),
    getTasksFromItem(firestore, projectId, userStoryId),
  ]);

  if (!userStory || !userStory.size || userStoryTasks.length === 0) {
    return 0;
  }

  // Get all status tags at once for better performance
  const statusTypes = await getStatusTypes(firestore, projectId);
  const statusTagsMap = new Map(statusTypes.map((tag) => [tag.id, tag]));

  // Count completed tasks on the given date
  let completedTasksCount = 0;

  for (const task of userStoryTasks) {
    if (!task.statusId || !task.statusChangeDate) continue;

    const statusTag = statusTagsMap.get(task.statusId);
    if (statusTag?.marksTaskAsDone) {
      const taskDate = new Date(task.statusChangeDate.seconds * 1000);
      if (sameDay(taskDate, date)) {
        completedTasksCount++;
      }
    }
  }

  // Calculate partial story points
  const storySizeValue =
    sizeValues[userStory.size as keyof typeof sizeValues] ?? 0;
  const totalTasks = userStoryTasks.length;
  const storyCompletedPoints =
    (completedTasksCount / totalTasks) * storySizeValue;

  return storyCompletedPoints;
};

/**
 * @function getBurndownData
 * @description Generate data for burndown chart (ideal and actual lines)
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @param {string} sprintId - The ID of the sprint
 * @returns {Promise<BurndownChartData>} Data for the burndown chart
 */
export const getBurndownData = async (
  firestore: Firestore,
  projectId: string,
  sprintId: string,
): Promise<BurndownChartData> => {
  // Get sprint data
  const sprintData = await getSprint(firestore, projectId, sprintId);

  // Get settings once for all calculations
  const settingsData = await getSettings(firestore, projectId);
  const sizeValues = getSizeValues(settingsData);

  const totalStoryPoints = await getTotalStoryPoints(
    firestore,
    projectId,
    sprintId,
  );

  const startDate = sprintData.startDate;
  const endDate = sprintData.endDate;
  const today = new Date();

  // Calculate sprint duration
  const sprintDuration = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Calculate current sprint day
  const todaySprintDay = Math.min(
    Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    sprintDuration,
  );

  // Generate ideal burndown line
  const idealBurndownLine: BurndownChartData = [];
  for (let day = 0; day <= sprintDuration; day++) {
    const idealRemaining =
      totalStoryPoints - (totalStoryPoints / sprintDuration) * day;
    idealBurndownLine.push({
      sprintDay: day,
      storyPoints: Math.max(0, idealRemaining),
      seriesType: 0,
    });
  }

  // Generate actual burndown line
  const actualBurndown: BurndownChartData = [];
  let remainingPoints = totalStoryPoints;

  // Loop through each day of the sprint up to today
  for (let day = 0; day <= todaySprintDay; day++) {
    const date = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);

    // Reset completed points for each day
    let completedTodayPoints = 0;

    // Calculate points completed on this day across all user stories
    if (sprintData.userStoryIds?.length) {
      const dailyPointsPromises = sprintData.userStoryIds.map((usId) =>
        getCompletedTasksStoryPoints(
          firestore,
          projectId,
          usId,
          date,
          sizeValues,
        ),
      );

      const dailyPoints = await Promise.all(dailyPointsPromises);
      completedTodayPoints = dailyPoints.reduce(
        (sum, points) => sum + points,
        0,
      );
    }

    // Subtract today's completed points from remaining
    remainingPoints -= completedTodayPoints;

    actualBurndown.push({
      sprintDay: day,
      storyPoints: Math.max(remainingPoints, 0),
      seriesType: 1,
    });
  }

  if (actualBurndown[0]) {
    actualBurndown[0].storyPoints = totalStoryPoints; // Ensure the first point matches the total story points
  }

  // Combine and sort both lines for chart display
  return [...idealBurndownLine, ...actualBurndown].sort(
    (a, b) => a.sprintDay - b.sprintDay || a.seriesType - b.seriesType,
  );
};
