import type { Firestore } from "firebase-admin/firestore";
import { getProjectRef } from "./general";
import type {
  Task,
  LogProjectActivityParams,
} from "~/lib/types/firebaseSchemas";
import { getTasksRef } from "./tasks";
import { getStatusTypesRef } from "./tags";
import { getSprint } from "./sprints";
import { TRPCError } from "@trpc/server";

export const getActivityRef = (firestore: Firestore, projectId: string) => {
  return getProjectRef(firestore, projectId).collection("activity");
};

export const getActivityPartition = async (
  firestore: Firestore,
  projectId: string,
  userId: string,
  time?: string,
  sprintId?: string,
) => {
  let activityRef = null;
  if (time === "Week") {
    activityRef = getActivityRef(firestore, projectId).where(
      "date",
      ">=",
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    );
  } else if (time === "Month") {
    activityRef = getActivityRef(firestore, projectId).where(
      "date",
      ">=",
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    );
  } else {
    if (!sprintId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No activity data available, no sprint specified.",
      });
    }
    // Get start and end date from sprint
    const sprint = await getSprint(firestore, projectId, sprintId);
    if (!sprint) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No activity data available, sprint not found.",
      });
    }
    activityRef = getActivityRef(firestore, projectId)
      .where("date", ">=", sprint?.startDate)
      .where("date", "<=", sprint.endDate);
  }
  const activitySnapshot = await activityRef
    .where("userId", "==", userId)
    .get();
  const data: LogProjectActivityParams[] = [];

  activitySnapshot.docs.forEach((activity) => {
    data.push({
      ...(activity.data() as LogProjectActivityParams),
    });
  });

  // Group activities by day
  const groupedByDay: Record<string, { date: string; count: number }> = {};

  data.forEach((item) => {
    // Get timestamp from the activity data
    const timestamp = item.date
      ? item.date instanceof Date
        ? item.date
        : item.date.toDate()
      : new Date();

    // Format date as YYYY-MM-DD
    const day = timestamp.toISOString().split("T")[0];

    if (!day) return;

    if (!groupedByDay[day]) {
      groupedByDay[day] = {
        date: day,
        count: 0,
      };
    }

    groupedByDay[day].count += 1;
  });

  // Convert grouped data to array and convert date strings to Date objects
  const result = Object.values(groupedByDay)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((item) => ({
      date: new Date(item.date),
      count: item.count,
    }));

  return result;
};

export const getActivityTotalCount = async (
  firestore: Firestore,
  projectId: string,
  userId: string,
  time?: string,
  sprintId?: string,
) => {
  let activityRef = null;
  if (time === "Week") {
    activityRef = getActivityRef(firestore, projectId).where(
      "date",
      ">=",
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    );
  } else if (time === "Month") {
    activityRef = getActivityRef(firestore, projectId).where(
      "date",
      ">=",
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    );
  } else {
    if (!sprintId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No activity data available, no sprint specified.",
      });
    }
    // Get start and end date from sprint
    const sprint = await getSprint(firestore, projectId, sprintId);
    if (!sprint) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No activity data available, sprint not found.",
      });
    }
    activityRef = getActivityRef(firestore, projectId)
      .where("date", ">=", sprint?.startDate)
      .where("date", "<=", sprint.endDate);
  }
  const activityCount = await activityRef
    .where("userId", "==", userId)
    .count()
    .get();

  return activityCount.data().count;
};

export const getContributionOverview = async (
  firestore: Firestore,
  projectId: string,
  userId: string,
  time?: string,
  sprintId?: string,
) => {
  let activityRef = null;
  if (time === "Week") {
    activityRef = getActivityRef(firestore, projectId).where(
      "date",
      ">=",
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    );
  } else if (time === "Month") {
    activityRef = getActivityRef(firestore, projectId).where(
      "date",
      ">=",
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    );
  } else {
    if (!sprintId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No contribution data available, no sprint specified.",
      });
    }
    // Get start and end date from sprint
    const sprint = await getSprint(firestore, projectId, sprintId);
    if (!sprint) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No contribution data available, sprint not found.",
      });
    }
    activityRef = getActivityRef(firestore, projectId)
      .where("date", ">=", sprint?.startDate)
      .where("date", "<=", sprint.endDate);
  }
  const activitySnapshot = await activityRef
    .where("userId", "==", userId)
    .get();
  const data: LogProjectActivityParams[] = [];

  activitySnapshot.docs.forEach((activity) => {
    data.push({
      ...(activity.data() as LogProjectActivityParams),
    });
  });

  const contributionCount = {
    Tasks: 0,
    Issues: 0,
    "User Stories": 0,
  };

  data.forEach((item) => {
    if (item.type === "TS") {
      contributionCount.Tasks += 1;
    } else if (item.type === "IS") {
      contributionCount.Issues += 1;
    } else if (item.type === "US") {
      contributionCount["User Stories"] += 1;
    }
  });

  return contributionCount;
};

/**
 * @function getAverageTime
 * @description Gets the average time spent on tasks grouped by week, for the amount of weeks specified.
 * Only includes tasks that are marked as done.
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param userId The ID of the user
 * @param weeks The number of weeks to look back, default is 5
 * @returns {Promise<Record<string, number>>} Object with weeks as keys and average time as values (in milliseconds)
 */
export const getAverageTime = async (
  firestore: Firestore,
  projectId: string,
  userId: string,
  weeks = 5,
): Promise<Record<string, number>> => {
  const startDate = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000);

  const tasksSnapshot = await getTasksRef(firestore, projectId)
    .where("assigneeId", "==", userId)
    .where("statusChangeDate", "!=", null)
    .where("deleted", "==", false)
    .get();

  if (tasksSnapshot.empty) {
    // Return an empty object if no tasks found
    return {};
  }

  // Get all status types
  const statusTypesRef = getStatusTypesRef(firestore, projectId).where(
    "deleted",
    "==",
    false,
  );
  const statusTypesSnapshot = await statusTypesRef.get();

  // Create set of status IDs that mark tasks as done
  const doneStatusIds = new Set<string>();
  statusTypesSnapshot.forEach((doc) => {
    const statusData = doc.data();
    if (statusData.marksTaskAsDone === true) {
      doneStatusIds.add(doc.id);
    }
  });

  if (doneStatusIds.size === 0) {
    return {};
  }

  // Process tasks - filter for tasks with "done" status
  interface TaskWithTime {
    id: string;
    statusChangeDate: Date;
    assignedDate: Date;
    timeTaken: number;
  }

  const validTasks: TaskWithTime[] = [];

  tasksSnapshot.forEach((doc) => {
    const data = doc.data() as Task;
    const statusChangeDate = data.statusChangeDate?.toDate();
    const assignedDate = data.assignedDate?.toDate();

    // Skip tasks with:
    // - no statusChangeDate or assignedDate
    // - statusChangeDate < startDate
    // - Not done
    if (
      !statusChangeDate ||
      !assignedDate ||
      statusChangeDate < startDate ||
      !doneStatusIds.has(data.statusId)
    ) {
      return;
    }

    // Calculate time taken to complete the task (in milliseconds)
    const timeTaken = statusChangeDate.getTime() - assignedDate.getTime();

    // Only include tasks with positive completion time
    if (timeTaken > 0) {
      validTasks.push({
        id: doc.id,
        statusChangeDate,
        assignedDate,
        timeTaken,
      });
    }
  });

  // Group tasks by week
  interface WeekData {
    tasks: TaskWithTime[];
    totalTime: number;
  }

  const tasksByWeek: Record<string, WeekData> = {};

  validTasks.forEach((task) => {
    // Get the week start date (Sunday) for the task's status change date
    const taskDate = task.statusChangeDate;
    const dayOfWeek = taskDate.getDay();
    const weekStart = new Date(taskDate);
    weekStart.setDate(taskDate.getDate() - dayOfWeek); // Set beginning of the week (Sunday)
    weekStart.setHours(0, 0, 0, 0); // Set to midnight
    const weekKey = weekStart.toISOString().split("T")[0]; // YYYY-MM-DD

    if (!weekKey) return;

    // Initialize the week if it doesn't exist
    if (!tasksByWeek[weekKey]) {
      tasksByWeek[weekKey] = {
        tasks: [],
        totalTime: 0,
      };
    }

    tasksByWeek[weekKey].tasks.push(task);
    tasksByWeek[weekKey].totalTime += task.timeTaken;
  });

  const averageTimeByWeek: Record<string, number> = {};

  // Create array of weeks to include in the result
  const weeksToInclude: string[] = [];
  for (let i = 0; i < weeks; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (date.getDay() + 7 * i)); // Go back i weeks to Sunday
    date.setHours(0, 0, 0, 0);
    const weekKey = date.toISOString().split("T")[0];
    if (!weekKey) continue;
    weeksToInclude.push(weekKey);
  }

  // Fill in weeks with no tasks with 0, calculate average for weeks with tasks
  for (const weekKey of weeksToInclude) {
    const weekData = tasksByWeek[weekKey];
    if (!weekData) {
      averageTimeByWeek[weekKey] = 0;
    } else {
      const taskCount = weekData.tasks.length;
      averageTimeByWeek[weekKey] =
        taskCount > 0 ? weekData.totalTime / taskCount : 0; // Handle division by zero
    }
    // ms -> s
    averageTimeByWeek[weekKey] =
      Math.round((averageTimeByWeek[weekKey] / 1000) * 100) / 100; // 2 decimal places
  }

  // {YYYY-MM-DD : averageTimeInSeconds}
  return averageTimeByWeek;
};
