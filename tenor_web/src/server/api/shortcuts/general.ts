import type { Firestore } from "firebase-admin/firestore";
import type {
  ActivityItem,
  AllBasicItemType,
  ProjectActivity,
  Role,
  Size,
  StatusTag,
  WithId,
} from "~/lib/types/firebaseSchemas";
import {
  ActivitySchema,
  ProjectSchema,
  SettingsSchema,
  type UserSchema,
} from "~/lib/types/zodFirebaseSchema";
import { getPriority, getStatusTypes } from "./tags";
import { getProjectContext } from "./ai";
import { getItemActivityTask } from "./tasks";
import { getCurrentSprint, getSprint, getTasksFromSprint } from "./sprints";
import { getGlobalUserRef, getUsers } from "./users";
import type * as admin from "firebase-admin";
import type { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Timestamp } from "firebase-admin/firestore";
import { addDays, differenceInDays } from "date-fns";
import type { BurndownChartData, BurndownDataPoint } from "~/lib/defaultValues/burndownChart";
import { getTask } from "./tasks";
import { getIssue } from "./issues";
import { getUserStory } from "./userStories";
import { getBacklogItem } from "./backlogItems";
import { getEpic } from "./epics";

/**
 * @function getProjectsRef
 * @description Gets a reference to the projects collection
 * @param {Firestore} firestore - The Firestore instance
 * @returns {FirebaseFirestore.CollectionReference} A reference to the projects collection
 */
export const getProjectsRef = (firestore: Firestore) => {
  return firestore.collection("projects");
};

/**
 * @function getProjectRef
 * @description Gets a reference to the project document
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @returns {FirebaseFirestore.DocumentReference} A reference to the project document
 */
export const getProjectRef = (firestore: Firestore, projectId: string) => {
  return getProjectsRef(firestore).doc(projectId);
};

/**
 * @function getProject
 * @description Retrieves the project document
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @returns {Promise<WithId<Project>>} A promise that resolves to the project document
 */
export const getProject = async (firestore: Firestore, projectId: string) => {
  const project = await getProjectRef(firestore, projectId).get();
  if (!project.exists) {
    throw new Error("Project not found");
  }
  return { id: project.id, ...ProjectSchema.parse(project.data()) };
};

/**
 * @function getSettingsRef
 * @description Gets a reference to the project settings document
 * @param {string} projectId - The ID of the project
 * @param {Firestore} firestore - The Firestore instance
 * @returns {FirebaseFirestore.DocumentReference} A reference to the project settings document
 */
export const getSettingsRef = (firestore: Firestore, projectId: string) => {
  return getProjectRef(firestore, projectId)
    .collection("settings")
    .doc("settings");
};

/**
 * @function getSettings
 * @description Retrieves the settings for a specific project
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 */
export const getSettings = async (firestore: Firestore, projectId: string) => {
  const settings = await getSettingsRef(firestore, projectId).get();
  return SettingsSchema.parse(settings.data());
};

/**
 * @function getRolesRef
 * @description Gets a reference to the project roles collection
 * @param {string} projectId - The ID of the project
 * @param {Firestore} firestore - The Firestore instance
 * @returns {FirebaseFirestore.CollectionReference} A reference to the project roles collection
 */
export const getRolesRef = (firestore: Firestore, projectId: string) => {
  return getSettingsRef(firestore, projectId).collection("userTypes");
};

/**
 * @function getPerformanceRef
 * @description Gets a reference to the project's performance subcollection
 * @param {string} projectId - The ID of the project
 * @param {Firestore} firestore - The Firestore instance
 * @returns {FirebaseFirestore.CollectionReference} A reference to the performance subcollection
 */
export const getPerformanceRef = (firestore: Firestore, projectId: string) => {
  return getProjectRef(firestore, projectId).collection("performance");
};

/**
 * @function getProductivityRef
 * @description Gets a reference to the project's productivity doc
 * @param {string} projectId - The ID of the project
 * @param {Firestore} firestore - The Firestore instance
 * @returns {FirebaseFirestore.CollectionReference} A reference to the productivity document
 */
export const getProductivityRef = (firestore: Firestore, projectId: string) => {
  return getPerformanceRef(firestore, projectId).doc("productivity");
};

export const getTopProjectStatusCacheRef = (
  firestore: Firestore,
  userId: string,
) => {
  return getGlobalUserRef(firestore, userId)
    .collection("cache")
    .doc("TopProjectsStatus");
};

/**
 * @function getRoleRef
 * @description Gets a reference to a specific project role document
 * @param {string} projectId - The ID of the project
 * @param {string} roleId - The ID of the role
 * @param {Firestore} firestore - The Firestore instance
 * @returns {FirebaseFirestore.DocumentReference} A reference to the project role document
 */
export const getRoleRef = (
  firestore: Firestore,
  projectId: string,
  roleId: string,
) => {
  return getRolesRef(firestore, projectId).doc(roleId);
};

export const getRoles = async (firestore: Firestore, projectId: string) => {
  const rolesRef = getRolesRef(firestore, projectId);
  const rolesSnapshot = await rolesRef.get();
  const roles: WithId<Role>[] = rolesSnapshot.docs.map((roleData) => {
    return {
      id: roleData.id,
      ...roleData.data(),
    } as WithId<Role>;
  });
  return roles;
};

export const getGenericBacklogItemContext = async (
  firestore: Firestore,
  projectId: string,
  name: string,
  description: string,
  priorityId?: string,
  size?: Size | "",
) => {
  const priority = priorityId
    ? await getPriority(firestore, projectId, priorityId)
    : undefined;
  const priorityContext = priority ? `- priority: ${priority.name}\n` : "";
  const sizeContext = size ? `- size: ${size}\n` : "";

  return `- name: ${name}\n- description: ${description}\n${priorityContext}${sizeContext}\n\n`;
};

export const generateTaskContext = async (
  firestore: Firestore,
  projectId: string,
  itemContext: string,
  itemTypeName: string,
  tasksContext: string,
  amount: number,
  prompt: string,
) => {
  const passedInPrompt =
    prompt != ""
      ? `Consider that the user wants the tasks for the following: ${prompt}`
      : "";

  const completePrompt = `
  ${await getProjectContext(firestore, projectId)}
  
  Given the following context, follow the instructions below to the best of your ability.
  
  ${itemContext}
  ${tasksContext}
  
  Generate ${amount} tasks about the detailed ${itemTypeName}. You can also see the tasks that already exist, DO NOT repeat tasks. Do NOT include any identifier in the name like "Task 1", just use a normal title. Always include a size.\n\n
  
  ${passedInPrompt}
            `;
  return completePrompt;
};

export const getProjectStatus = async (
  firestore: Firestore,
  projectId: string,
  admin: admin.app.App,
) => {
  // Fetch all data in parallel
  const [statuses, currentSprint, projectCollaborators] = await Promise.all([
    getStatusTypes(firestore, projectId),
    getCurrentSprint(firestore, projectId),
    getUsers(admin, firestore, projectId),
  ]);

  // If no statuses are found, return an empty project status
  if (!currentSprint) {
    return {
      projectId: projectId,
      taskCount: 0,
      completedCount: 0,
      currentSprintId: "",
      currentSprintNumber: "",
      currentSprintStartDate: "",
      currentSprintEndDate: "",
      currentSprintDescription: "",
      assignedUssers: [],
    };
  }

  const filteredTasks = await getTasksFromSprint(
    firestore,
    projectId,
    currentSprint.id,
  );

  // Create a map of status types
  const statusMap = statuses.reduce(
    (acc, status) => {
      acc[status.id] = status;
      return acc;
    },
    {} as Record<string, StatusTag>,
  );

  // Get the completed tasks
  const completedTasks = filteredTasks.filter(
    (task) => statusMap[task.statusId]?.marksTaskAsDone === true,
  );

  // Map collaborators
  const mappedUsers = projectCollaborators?.map((u) => ({
    uid: u.id ?? u.id, // Use 'id' or fallback to 'uid' if available
    displayName: u.displayName,
    photoURL: u.photoURL,
  }));

  // Return structured project status
  return {
    projectId: projectId,
    taskCount: filteredTasks.length ?? 0,
    completedCount: completedTasks.length ?? 0,
    currentSprintId: currentSprint?.id,
    currentSprintNumber: currentSprint?.number,
    currentSprintStartDate: currentSprint?.startDate,
    currentSprintEndDate: currentSprint?.endDate,
    currentSprintDescription: currentSprint?.description,
    assignedUssers: mappedUsers,
  };
};

/**
 * @function getTopProjects
 * @description Gets an array of the projects that are closest to ending their sprint
 * @param {string} userId - The ID of the user
 * @param {Firestore} firestore - The Firestore instance
 * @returns {WithId<Sprint>[]} An array of the projects sorted by their sprint end date
 */
export const getTopProjects = async (firestore: Firestore, userId: string) => {
  // Fetch all user projects
  const user = (
    await getGlobalUserRef(firestore, userId).get()
  ).data() as z.infer<typeof UserSchema>;

  if (!user?.projectIds || user.projectIds.length === 0) {
    return [];
  }

  const projectSprintsPromises = user.projectIds.map(async (projectId) => {
    const sprint = await getCurrentSprint(firestore, projectId);
    return { sprint, projectId };
  });

  const projectSprintPairs = await Promise.all(projectSprintsPromises);

  const filteredProjectSprintPairs = projectSprintPairs.filter(
    (pair) => pair.sprint !== undefined,
  );

  const sortedProjectSprintPairs = filteredProjectSprintPairs.sort(
    (a, b) =>
      (b.sprint?.endDate?.getTime() ?? 0) - (a.sprint?.endDate?.getTime() ?? 0),
  );

  // Return just the projectIds in the same order as the sorted sprints
  return sortedProjectSprintPairs.map((pair) => pair.projectId);
};

export const computeTopProjectStatus = async (
  firestore: FirebaseFirestore.Firestore,
  adminFirestore: admin.app.App,
  userId: string,
  count: number,
) => {
  let projects = await getTopProjects(firestore, userId);
  if (projects.length === 0) {
    return undefined;
  }

  projects = projects.slice(0, count);

  let projectStatus = await Promise.all(
    projects.map(async (projectId) => {
      const status = await getProjectStatus(
        firestore,
        projectId,
        adminFirestore,
      );

      return {
        id: projectId,
        status,
      };
    }),
  );

  // Filter out projects with no tasks
  projectStatus = projectStatus.filter(
    (project) => project.status.taskCount !== 0,
  );

  const topProjects = {
    fetchDate: Timestamp.now(),
    topProjects: projectStatus.map((project) => ({
      projectId: project.id,
      taskCount: project.status.taskCount,
      completedCount: project.status.completedCount,
    })),
  };

  return topProjects;
};

export const getActivityRef = (
  firestore: Firestore,
  projectId: string,
  activityId: string,
) => {
  return getActivitiesRef(firestore, projectId).doc(activityId);
};

export const getActivity = async (
  firestore: Firestore,
  projectId: string,
  activityId: string,
) => {
  const activityRef = getActivityRef(firestore, projectId, activityId);
  const activitySnapshot = await activityRef.get();
  if (!activitySnapshot.exists) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Activity not found",
    });
  }

  return {
    id: activitySnapshot.id,
    ...ActivitySchema.parse(activitySnapshot.data()),
  } as WithId<ProjectActivity>;
};

export const getActivitiesRef = (firestore: Firestore, projectId: string) => {
  return getProjectRef(firestore, projectId).collection("activity");
};

export const getProjectActivities = async (
  firestore: Firestore,
  projectId: string,
) => {
  const activitiesRef = getActivitiesRef(firestore, projectId);
  const activitiesSnapshot = await activitiesRef
    .orderBy("date", "desc")
    .limit(5)
    .get();
  const activities: WithId<ProjectActivity>[] = activitiesSnapshot.docs.map(
    (activityData) => {
      return {
        id: activityData.id,
        ...ActivitySchema.parse(activityData.data()),
      } as WithId<ProjectActivity>;
    },
  );
  return activities;
};

export const getItemActivityDetails = async (
  firestore: Firestore,
  projectId: string,
) => {
  // Get activities
  const activities = await getProjectActivities(firestore, projectId);

  // Array to hold the results
  const results = {} as Record<string, ActivityItem>;

  // Iterate in the activityMap to get the item type and itemId
  for (const activity of activities) {
    if (!activity.itemId || !activity.type) continue;

    const itemType = activity.type;
    const itemId = activity.itemId;

    if (itemType === "PJ") {
      // If the item type is project, we don't need to fetch it
      continue;
    }

    const item = await getActivityItemByType(
      firestore,
      projectId,
      itemId,
      itemType,
    );

    if (!item) {
      console.warn(
        `Item with ID ${itemId} and type ${itemType} not found for activity ${activity.id}`,
      );
      continue;
    }

    // Get the item data
    const data = {
      ...item,
      activity: activity,
      type: itemType,
    } as ActivityItem;

    results[data.id] = data;
  }

  return results;
};

export const getActivityItemByType = async (
  firestore: Firestore,
  projectId: string,
  itemId: string,
  itemType: AllBasicItemType,
): Promise<Omit<ActivityItem, "activity" | "type"> | undefined> => {
  switch (itemType) {
    case "TS": // Task
      return await getTask(firestore, projectId, itemId);
    case "IS": // Issue
      return await getIssue(firestore, projectId, itemId);
    case "US": // User Story
      return await getUserStory(firestore, projectId, itemId);
    case "IT": // Backlog Item
      return await getBacklogItem(firestore, projectId, itemId);
    case "EP": // Epic
      return await getEpic(firestore, projectId, itemId);
    case "PJ": // Project
      return undefined; // No need to fetch project details here
    case "SP": // Sprint
      try {
        const sprint = await getSprint(firestore, projectId, itemId);
        return {
          ...sprint,
          scrumId: sprint.number,
          name: "", // Sprints don't have a name
        };
      } catch {
        return undefined; // Sprint not found
      }
    default:
      // Does not happen, but in case new types are added
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Item type ${itemType as string} not supported`,
      });
  }
};

export const getBurndownData = async (
  startDate: Date,
  endDate: Date,
  totalTasks: number,
  completedTasks: number,
  burndownHistory: BurndownDataPoint[],
): Promise<BurndownChartData> => {
  if (!startDate || !endDate || totalTasks === 0) {
    return [{ sprintDay: 0, storyPoints: 0, seriesType: 0 }];
  }

  const sprintDuration = differenceInDays(endDate, startDate) + 1;
  const today = new Date();
  const currentDay = Math.min(differenceInDays(today, startDate), sprintDuration - 1);

  const burndownLine: BurndownChartData = [];
  for (let day = 0; day <= sprintDuration; day++) {
    const idealRemaining = totalTasks * (1 - day / sprintDuration);
    burndownLine.push({
      sprintDay: day,
      storyPoints: idealRemaining,
      seriesType: 0,
    });
  }

  const actualBurndown: BurndownChartData = [];

  if (burndownHistory && burndownHistory.length > 0) {
    for (const point of burndownHistory) {
      const dayIndex = Math.min(point.day, sprintDuration);
      actualBurndown.push({
        sprintDay: dayIndex,
        storyPoints: totalTasks - point.completedCount,
        seriesType: 1,
      });
    }
  } else {
    const remainingTasks = totalTasks - completedTasks;
    actualBurndown.push({
      sprintDay: currentDay,
      storyPoints: remainingTasks,
      seriesType: 1,
    });
  }

  return [...burndownLine, ...actualBurndown].sort((a, b) => a.sprintDay - b.sprintDay);
};

export const generateBurndownHistory = async (
  firestore: Firestore,
  projectId: string,
  startDate: Date,
  endDate: Date,
): Promise<BurndownDataPoint[]> => {
  // Calculate number of days
  const result: BurndownDataPoint[] = [];

  // Cap at today
  const today = new Date();
  const effectiveEndDate = today < endDate ? today : endDate;
  const effectiveDays = differenceInDays(effectiveEndDate, startDate) + 1;

  // For each day, get task counst
  for (let i = 0; i < effectiveDays; i++) {
    const date = addDays(startDate, i);
    const timestamp = Timestamp.fromDate(date);
    
    try {
      const completedCount = await getItemActivityTask(
        firestore,
        projectId,
        timestamp,
      );

      result.push({
        day: i,
        date: date.toISOString(),
        completedCount
      });
    } catch (e) {
      console.error(`Error fetching tasks for date ${date.toISOString()}:`, e);
      result.push({
        day: i,
        date: date.toISOString(),
        completedCount: 0,
      });
    }
  }

  return result;
}
