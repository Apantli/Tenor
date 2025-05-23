import type { Firestore } from "firebase-admin/firestore";
import type { ProjectActivity, Role, Size, StatusTag, WithId } from "~/lib/types/firebaseSchemas";
import { ActivitySchema, ProjectSchema, SettingsSchema } from "~/lib/types/zodFirebaseSchema";
import { getPriority, getStatusTypes } from "./tags";
import { getProjectContext } from "./ai";
import { getTasks } from "./tasks";
import { getIssues } from "./issues";
import { getUserStories } from "./userStories";
import { getCurrentSprint } from "./sprints";
import { getUsers } from "./users";
import type * as admin from "firebase-admin";
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
  admin: admin.app.App,
) => {
  const activitiesRef = getActivitiesRef(firestore, projectId);
  const activitiesSnapshot = await activitiesRef.get();
  const activities: WithId<ProjectActivity>[] = activitiesSnapshot.docs.map((activityData) => {
    return {
      id: activityData.id,
      ...ActivitySchema.parse(activityData.data()),
    } as WithId<ProjectActivity>;
  }
  );
  const users = await getUsers(admin, firestore, projectId);
  const usersMap = new Map(users.map(user => [user.id, user]));
  const activitiesWithUser = activities.map(activity => {
    const user = usersMap.get(activity.userId);
    return {
      ...activity,
      user: user ? {
        uid: user.id,
        displayName: user.displayName,
        photoURL: user.photoURL,
      } : null,
    };
  });
  return activitiesWithUser;
}

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
  const [tasks, statuses, issues, userStories, currentSprint, projectCollaborators] = await Promise.all([
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
    (activeIssues).filter((issue) => issue.sprintId === currentSprint?.id).map((issue) => issue.id)
  );
  const sprintUserStoriesIds = new Set(
    (activeUserStories).filter((us) => us.sprintId === currentSprint?.id).map((us) => us.id)
  );

  // Filter tasks relevant to the sprint
  const filteredTasks = (activeTasks).filter((task) =>
    spruntIssuesIds.has(task.itemId) || sprintUserStoriesIds.has(task.itemId)
  );

  // Create a map of status types
  const statusMap = statuses.reduce((acc, status) => {
    acc[status.id] = status;
    return acc;
  }, {} as Record<string, StatusTag>);

  // Get the completed tasks
  const completedTasks = filteredTasks.filter((task) =>
    statusMap[task.statusId]?.marksTaskAsDone === true
  );

  // Map collaborators
  const mappedUsers = projectCollaborators?.map((u) => ({
    uid: u.id ?? u.id, // Use 'id' or fallback to 'uid' if available
    displayName: u.displayName,
    photoURL: u.photoURL,
  }));

  // Return structured project status
  return {
    taskCount: filteredTasks.length ?? 0,
    completedCount: completedTasks.length ?? 0,
    currentSprintId: currentSprint?.id,
    currentSprintNumber: currentSprint?.number,
    currentSprintStartDate: currentSprint?.startDate,
    currentSprintEndDate: currentSprint?.endDate,
    currentSprintDescription: currentSprint?.description,
    assignedUssers: mappedUsers,
  };
}

export const getProjectBurndown = async(
  firestore: Firestore,
  projectId: string,
  admin: admin.app.App,
) => {
  try {
    const [tasks, userStories, currentSprint, activitySnapshot, projectSettings] = await Promise.all([
      getTasks(firestore, projectId),
      getUserStories(firestore, projectId),
      getCurrentSprint(firestore, projectId),
      getProjectActivity(firestore, projectId, admin),
      getSettingsRef(firestore, projectId),
    ]);

    const activeTasks = tasks.filter((task) => !task.deleted);
    const activeUserStories = userStories.filter((us) => !us.deleted);

    const sprintUserStories = userStories.filter((us) => us.sprintId === currentSprint?.id);
    const sprintUserStoriesIds = new Set(sprintUserStories.map((us) => us.id));

    const settingsSnap = await projectSettings.get();
    const settingsData = SettingsSchema.parse(settingsSnap.data());
    const sizeValues = Array.isArray(settingsData.Size) ? settingsData.Size : [];

    // Map numeric values to Size types in order
    const sizeOrder: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];
    const sizePointsMap: Record<Size, number> = {
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0,
    };

    // Create a mapping between size labels and their point values
    sizeValues.forEach((value, index) => {
      const sizeKey = sizeOrder[index];
      if (sizeKey !== undefined) {
        sizePointsMap[sizeKey] = value;
      }
    });

    // Calculate total points for each user story
    // and map them to the corresponding tasks
    const tasksPointMap: Record<string, number> = {};
    for (const us of sprintUserStories) {
      const tasksForUs = activeTasks.filter((task) => task.itemId === us.id);

      // Calculate total points for the user story
      // based on the size of its tasks
      let totalPoints = 0;
      for (const task of tasksForUs) {
        // Assuming task.size is a Size type like "S", "M", etc.
        if (task.size && sizePointsMap[task.size]) {
          totalPoints += sizePointsMap[task.size];
        }
      }

      // Add the user story's size points
      if (us.size && sizePointsMap[us.size]) {
        totalPoints += sizePointsMap[us.size];
      }

      // Map the user story ID to its total points
      tasksPointMap[us.id] = totalPoints;
    }

    // Calculate total points for the sprint
    const totalPoints = Object.values(tasksPointMap).reduce((sum, points) => sum + points, 0);
    
    // Create a map of status types to determine completed tasks
    const statuses = await getStatusTypes(firestore, projectId);
    const statusMap = statuses.reduce((acc, status) => {
      acc[status.id] = status;
      return acc;
    }, {} as Record<string, StatusTag>);
    
    // Process activity data to track completion over time
    const activityData = activitySnapshot;
    
    // Filter activities related to tasks (type TS)
    const taskActivities = activityData.filter(activity => 
      activity.type === "TS" && 
      activity.itemId // Check if itemId exists
    );
    
    // Create data structure for burndown
    const burndownData: {
      date: Date;
      ideal: number;
      actual: number;
    }[] = [];
    
    // If we have a sprint with valid dates
    if (currentSprint?.startDate && currentSprint?.endDate) {
      const startDate = new Date(currentSprint.startDate);
      const endDate = new Date(currentSprint.endDate);
      
      // Create a map to track completed story points by date
      const completedPointsByDate: Record<string, number> = {};
      
      // Process task activities
      taskActivities.forEach(activity => {
        const timestamp = activity.date ? new Date(activity.date) : new Date();
        const dateKeyRaw = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD format
        const dateKey: string = typeof dateKeyRaw === "string" ? dateKeyRaw : "";

        // Get the task related to this activity
        const taskId = activity.itemId;
        const task = activeTasks.find(t => t.id === taskId);

        // Check if this task exists and is marked as done
        if (task && statusMap[task.statusId]?.marksTaskAsDone) {
          const userStoryId = task.itemId;

          // Only count if the task belongs to a user story in this sprint
          if (sprintUserStoriesIds.has(userStoryId) && dateKey) {
            // Add the task's points to completed points for this date
            const taskPoints = task.size ? sizePointsMap[task.size] : 0;
            completedPointsByDate[dateKey] = (completedPointsByDate[dateKey] || 0) + taskPoints;
          }
        }
      });
      
      // Generate daily burndown data
      const daysInSprint = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
      let cumulativeCompletedPoints = 0;
      
      for (let i = 0; i < daysInSprint; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateKey = currentDate.toISOString().split('T')[0] as string;
        
        // Add completed points for this date to cumulative total
        cumulativeCompletedPoints += completedPointsByDate[dateKey] || 0;
        
        // Calculate ideal burndown (straight line)
        const idealRemaining = totalPoints - (totalPoints * (i / (daysInSprint - 1)));
        
        // Calculate actual remaining points
        const actualRemaining = totalPoints - cumulativeCompletedPoints;
        
        burndownData.push({
          date: currentDate,
          ideal: Math.max(0, Math.round(idealRemaining * 10) / 10),  // Round to 1 decimal place
          actual: Math.max(0, actualRemaining),
        });
      }
    }
    
    // Make sure to have a safe default in case burndownData is empty
    const burndownDataSafe = burndownData.length > 0 ? burndownData : [];
    const lastActual = burndownDataSafe.length > 0 ? burndownDataSafe[burndownDataSafe.length - 1]?.actual : 0;
    
    return {
      burndownData: burndownDataSafe.map(point => ({
        date: point.date instanceof Date ? point.date.toISOString() : null,
        ideal: point.ideal,
        actual: point.actual
      })),
      totalPoints: totalPoints || 0,
      completedPoints: totalPoints - (lastActual || 0),
      startDate: currentSprint?.startDate ? new Date(currentSprint.startDate).toISOString() : null,
      endDate: currentSprint?.endDate ? new Date(currentSprint.endDate).toISOString() : null,
      sprintNumber: currentSprint?.number,
      // Add these required fields:
      dependencyIds: [],
      requiredByIds: []
    };
  } catch (error) {
    console.error("Error in getProjectBurndown:", error);
    // Return a safe fallback response with all required fields
    return {
      burndownData: [],
      totalPoints: 0,
      completedPoints: 0,
      startDate: null,
      endDate: null,
      sprintNumber: null,
      dependencyIds: [],
      requiredByIds: []
    };
  }
}

