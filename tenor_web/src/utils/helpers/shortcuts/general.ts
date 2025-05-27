import type { Firestore } from "firebase-admin/firestore";
import type { 
  Epic, 
  Issue, 
  ProjectActivity,
  Role,
  Size, 
  Sprint,
  StatusTag, 
  Task, 
  UserStory,
  WithId,
} from "~/lib/types/firebaseSchemas";
import { ActivitySchema,
  ProjectSchema,
  SettingsSchema,
  type UserSchema,
} from "~/lib/types/zodFirebaseSchema";
import { getPriority, getStatusTypes } from "./tags";
import { getProjectContext } from "./ai";
import { getTasks } from "./tasks";
import { getIssues } from "./issues";
import { getUserStories } from "./userStories";
import { getCurrentSprint } from "./sprints";
import { getGlobalUserRef, getUsers } from "./users";
import type * as admin from "firebase-admin";
import type { z } from "zod";
import { TRPCError } from "@trpc/server";


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
  size?: Size,
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
  const [
    tasks,
    statuses,
    issues,
    userStories,
    currentSprint,
    projectCollaborators,
  ] = await Promise.all([
    getTasks(firestore, projectId),
    getStatusTypes(firestore, projectId),
    getIssues(firestore, projectId),
    getUserStories(firestore, projectId),
    getCurrentSprint(firestore, projectId),
    getUsers(admin, firestore, projectId),
  ]);

  // Filter out deleted entries
  const activeTasks = tasks.filter((task) => !task.deleted);
  const activeIssues = issues.filter((issue) => !issue.deleted);
  const activeUserStories = userStories.filter((us) => !us.deleted);

  // Collect IDs linked to the current sprint
  const spruntIssuesIds = new Set(
    activeIssues
      .filter((issue) => issue.sprintId === currentSprint?.id)
      .map((issue) => issue.id),
  );
  const sprintUserStoriesIds = new Set(
    activeUserStories
      .filter((us) => us.sprintId === currentSprint?.id)
      .map((us) => us.id),
  );

  // Filter tasks relevant to the sprint
  const filteredTasks = activeTasks.filter(
    (task) =>
      spruntIssuesIds.has(task.itemId) || sprintUserStoriesIds.has(task.itemId),
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

export const getActivityRef = (
  firestore: Firestore,
  projectId: string,
  activityId: string,
) => {
  return getActivitiesRef(firestore, projectId).doc(activityId);
}

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
    id : activitySnapshot.id,
    ...ActivitySchema.parse(activitySnapshot.data()),
  } as WithId<ProjectActivity>;
}

export const getActivitiesRef = (
  firestore: Firestore,
  projectId: string,
) => { return getProjectRef(firestore, projectId).collection("activity");}

export const getProjectActivities = async (
  firestore: Firestore,
  projectId: string,
) => {
  const activitiesRef = getActivitiesRef(firestore, projectId);
  const activitiesSnapshot = await activitiesRef
  .orderBy("date", "desc")
  .limit(50)
  .get();
  const activities: WithId<ProjectActivity>[] = activitiesSnapshot.docs.map((activityData) => {
    return { 
      id: activityData.id,
      ...ActivitySchema.parse(activityData.data()),
    } as WithId<ProjectActivity>;
  }
  );
  return activities;
}

export const getItemActivityDetails = async (
  firestore: Firestore,
  projectId: string,
) => {
  // Get activities
  const activities = await getProjectActivities(firestore, projectId);
  
  // Create a map of activities by itemId
  const activityMap: Record<string, WithId<ProjectActivity>> = activities.reduce((acc, activity) => {
    if (activity.itemId) {
      acc[activity.itemId] = activity;
    }
    return acc;
  }, {} as Record<string, WithId<ProjectActivity>>);
  
  // Create references to collections
  const tasksRef = getProjectRef(firestore, projectId).collection("tasks");
  const issuesRef = getProjectRef(firestore, projectId).collection("issues");
  const userStoriesRef = getProjectRef(firestore, projectId).collection("userStories");
  const epicsRef = getProjectRef(firestore, projectId).collection("epics");
  const sprintsRef = getProjectRef(firestore, projectId).collection("sprints");
  
  // Fetch all items including deleted ones
  const [tasks, issues, userStories, epics, sprints] = await Promise.all([
    // Include deleted items by not filtering in the query
    tasksRef.get().then(snapshot => 
      snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Task }))
    ),
    issuesRef.get().then(snapshot => 
      snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Issue}))
    ),
    userStoriesRef.get().then(snapshot => 
      snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as UserStory}))
    ),
    epicsRef.get().then(snapshot => 
      snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Epic}))
    ),
    sprintsRef.get().then(snapshot => 
      snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Sprint}))
    ),
  ]);

  // Filter items that have activities associated with them
  const tasksActivities = tasks.filter((task) => activityMap[task.id]);
  const issuesActivities = issues.filter((issue) => activityMap[issue.id]);
  const userStoriesActivities = userStories.filter((us) => activityMap[us.id]);
  const epicsActivities = epics.filter((epic) => activityMap[epic.id]);
  const sprintsActivities = sprints.filter((sprint) => activityMap[sprint.id]);
  
  return {
    tasksActivities: tasksActivities.map((task) => ({
      ...task,
      activity: activityMap[task.id]!,
    })),
    issuesActivities: issuesActivities.map((issue) => ({
      ...issue,
      activity: activityMap[issue.id]!,
    })),
    userStoriesActivities: userStoriesActivities.map((us) => ({
      ...us,
      activity: activityMap[us.id]!,
    })),
    epicsActivities: epicsActivities.map((epic) => ({
      ...epic,
      activity: activityMap[epic.id]!,
    })),
    sprintsActivities: sprintsActivities.map((sprint) => ({
      ...sprint,
      activity: activityMap[sprint.id]!,
    })),
  };
};