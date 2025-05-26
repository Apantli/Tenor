import type { Firestore } from "firebase-admin/firestore";
import { getProjectRef } from "./general";
import { type LogProjectActivityParams } from "~/lib/types/firebaseSchemas";

export const getActivityRef = (firestore: Firestore, projectId: string) => {
  return getProjectRef(firestore, projectId).collection("activity");
};

export const getActivityPartition = async (
  firestore: Firestore,
  projectId: string,
  userId: string,
  time: string,
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
    activityRef = getActivityRef(firestore, projectId).where(
      "date",
      ">=",
      new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    );
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
export const getContributionOverview = async (
  firestore: Firestore,
  projectId: string,
  userId: string,
  time: string,
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
    activityRef = getActivityRef(firestore, projectId).where(
      "date",
      ">=",
      new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    );
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
