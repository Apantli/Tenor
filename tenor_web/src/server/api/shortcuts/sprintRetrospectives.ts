import { getSettingsRef } from "./general";
import type { Firestore, QuerySnapshot } from "firebase-admin/firestore";
import { FieldPath } from "firebase-admin/firestore";
import { getAutomaticStatusId } from "./tags";
import { getStatusTypes } from "./tags";

export const getSprintRetrospectiveTextAnswersContext = (
  textAnswers: string[],
) => {
  return `
Given the following answers to questions, improve each answer only by correcting grammar and spelling mistakes. Do not change the content of the answers. Some words might be wrong, feel free to correct them based on the context and the rest of their responses. Based on their answers, provide a happiness rating from 1 to 10, where 1 is the lowest and 10 is the highest. The rating should be based on the overall sentiment of the answers. Finally, also provide a happiness analysis where you explain the rating and the overall sentiment of the answers. Make the analysis match the tone of their answers (opt for more informal), and talk to them directly, don't include the rating in the analysis and say that you're a sentiment analyzer, and make it only 2 sentences long, maximum. Also thank the user for participating. If an answer is empty, leave it empty in the response as well. Do NOT come up with your own answers for any reason.

Question 1: Think about your role in the project. How did it feel to carry your responsibilities, and what satisfied you?

### Answer 1:

${textAnswers[0]}

### End of Answer 1



Question 2: Think about your team. How would you describe the energy and collaboration within your team and the company?

### Answer 2:

${textAnswers[1]}

### End of Answer 2



Question 3: Imagine the next sprint. What small changes could make it better, and what would help you thrive even more?

### Answer 3:

${textAnswers[2]}

### End of Answer 3
`;
};

export const getCompletedStatusIds = async (
  firestore: Firestore,
  projectId: string,
): Promise<string[]> => {
  const settingsRef = getSettingsRef(firestore, projectId);
  const statusTypesCollectionRef = settingsRef.collection("statusTypes");
  const snapshot = await statusTypesCollectionRef
    .where("marksTaskAsDone", "==", true)
    .where("deleted", "==", false)
    .get();

  if (snapshot.empty) {
    return [];
  }

  const completedIds: string[] = [];
  snapshot.forEach((doc) => {
    completedIds.push(doc.id);
  });
  return completedIds;
};

export const getStoryPointsBySizeSettings = async (
  firestore: Firestore,
  projectId: string,
): Promise<Record<string, number>> => {
  const settingsRef = getSettingsRef(firestore, projectId);
  const sizeDoc = await settingsRef
    .collection("requirementTypes")
    .doc("Size")
    .get();

  if (!sizeDoc.exists) {
    return {
      XS: 1,
      S: 2,
      M: 3,
      L: 5,
      XL: 8,
      XXL: 13,
    };
  }

  const sizeData = sizeDoc.data();
  return {
    XS: sizeData?.["0"] as number,
    S: sizeData?.["1"] as number,
    M: sizeData?.["2"] as number,
    L: sizeData?.["3"] as number,
    XL: sizeData?.["4"] as number,
    XXL: sizeData?.["5"] as number,
  };
};

export const computeSprintTeamProgress = async (
  firestore: Firestore,
  projectId: string,
  sprintId: string,
): Promise<{
  totalIssues: number;
  completedIssues: number;
  totalUserStories: number;
  completedUserStories: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
}> => {
  const completedStatusIds = await getCompletedStatusIds(firestore, projectId);
  const storyPointsMap = await getStoryPointsBySizeSettings(
    firestore,
    projectId,
  );

  const projectRef = firestore.collection("projects").doc(projectId);
  const issuesCollectionRef = projectRef.collection("issues");
  const userStoriesCollectionRef = projectRef.collection("userStories");

  // Parallel query
  const [issuesSnapshot, userStoriesSnapshot, statusSnapshot] =
    await Promise.all([
      issuesCollectionRef
        .where("sprintId", "==", sprintId)
        .where("deleted", "==", false)
        .get(),
      userStoriesCollectionRef
        .where("sprintId", "==", sprintId)
        .where("deleted", "==", false)
        .get(),
      getStatusTypes(firestore, projectId),
    ]);

  const totalIssues = issuesSnapshot.size;
  let completedIssues = 0;
  let totalStoryPoints = 0;
  let completedStoryPoints = 0;

  const issuesDoc = await Promise.all(
    issuesSnapshot.docs.map(async (doc) => {
      const issueData = doc.data() as {
        statusId?: string;
        size?: string;
      };
      let statusId: string;
      if (issueData?.statusId) {
        statusId = issueData.statusId;
      } else {
        statusId =
          (await getAutomaticStatusId(
            firestore,
            projectId,
            doc.id,
            statusSnapshot,
          )) ?? "";
      }

      const points = issueData?.size
        ? (storyPointsMap[issueData.size] ?? 0)
        : 0;

      return {
        ...issueData,
        id: doc.id,
        statusId,
        calculatedStoryPoints: points,
      };
    }),
  );

  issuesDoc.forEach((issueData) => {
    totalStoryPoints += issueData.calculatedStoryPoints || 0;

    if (
      issueData?.statusId &&
      completedStatusIds.includes(issueData.statusId)
    ) {
      completedIssues++;
      completedStoryPoints += issueData.calculatedStoryPoints || 0;
    }
  });

  const totalUserStories = userStoriesSnapshot.size;
  let completedUserStories = 0;

  const userStoriesDoc = await Promise.all(
    userStoriesSnapshot.docs.map(async (doc) => {
      const userStoryData = doc.data() as {
        statusId?: string;
        size?: string;
      };
      let statusId: string;
      if (userStoryData?.statusId) {
        statusId = userStoryData.statusId;
      } else {
        statusId =
          (await getAutomaticStatusId(
            firestore,
            projectId,
            doc.id,
            statusSnapshot,
          )) ?? "";
      }

      const points = userStoryData?.size
        ? (storyPointsMap[userStoryData.size] ?? 0)
        : 0;

      return {
        ...userStoryData,
        id: doc.id,
        statusId,
        calculatedStoryPoints: points,
      };
    }),
  );

  userStoriesDoc.forEach((userStoryData) => {
    totalStoryPoints += userStoryData.calculatedStoryPoints || 0;

    if (
      userStoryData?.statusId &&
      completedStatusIds.includes(userStoryData.statusId)
    ) {
      completedUserStories++;
      completedStoryPoints += userStoryData.calculatedStoryPoints || 0;
    }
  });

  return {
    totalIssues,
    completedIssues,
    totalUserStories,
    completedUserStories,
    totalStoryPoints,
    completedStoryPoints,
  };
};

export const computeSprintPersonalProgress = async (
  firestore: Firestore,
  projectId: string,
  sprintId: string,
  userId: string,
): Promise<{
  totalAssignedTasks: number;
  completedAssignedTasks: number;
  totalAssignedStoryPoints: number;
  completedAssignedStoryPoints: number;
}> => {
  const completedStatusIds = await getCompletedStatusIds(firestore, projectId);
  const storyPointsMap = await getStoryPointsBySizeSettings(
    firestore,
    projectId,
  );

  const projectRef = firestore.collection("projects").doc(projectId);
  const tasksCollectionRef = projectRef.collection("tasks");

  const userTasksQuery = tasksCollectionRef
    .where("assigneeId", "==", userId)
    .where("deleted", "==", false);

  const userTasksSnapshot = await userTasksQuery.get();

  let totalAssignedTasks = 0;
  let completedAssignedTasks = 0;
  let totalAssignedStoryPoints = 0;
  let completedAssignedStoryPoints = 0;

  const taskDataMap = new Map<
    string,
    {
      isCompleted: boolean;
      itemId: string;
      weight?: number;
    }
  >();

  userTasksSnapshot.forEach((taskDoc) => {
    const taskData = taskDoc.data() as {
      itemId?: string;
      statusId?: string;
      weight?: number;
    };
    const itemId = taskData?.itemId;

    if (itemId) {
      const isCompleted =
        taskData?.statusId && completedStatusIds.includes(taskData.statusId);

      taskDataMap.set(taskDoc.id, {
        isCompleted: !!isCompleted,
        itemId: itemId,
        weight: taskData?.weight ?? 1,
      });
    }
  });

  if (taskDataMap.size === 0) {
    return {
      totalAssignedTasks: 0,
      completedAssignedTasks: 0,
      totalAssignedStoryPoints: 0,
      completedAssignedStoryPoints: 0,
    };
  }

  const issuesCollectionRef = projectRef.collection("issues");
  const userStoriesCollectionRef = projectRef.collection("userStories");

  const uniqueItemIds = [
    ...new Set([...taskDataMap.values()].map((t) => t.itemId)),
  ];
  const chunkSize = 30;

  const allPromises: Promise<QuerySnapshot>[] = [];

  for (let i = 0; i < uniqueItemIds.length; i += chunkSize) {
    const chunk = uniqueItemIds.slice(i, i + chunkSize);

    const issuesQuery = issuesCollectionRef
      .where(FieldPath.documentId(), "in", chunk)
      .where("sprintId", "==", sprintId)
      .where("deleted", "==", false);

    allPromises.push(issuesQuery.get());

    const userStoriesQuery = userStoriesCollectionRef
      .where(FieldPath.documentId(), "in", chunk)
      .where("sprintId", "==", sprintId)
      .where("deleted", "==", false);

    allPromises.push(userStoriesQuery.get());
  }

  const snapshots = await Promise.all(allPromises);

  const itemStoryPointsMap = new Map<string, number>();

  snapshots.forEach((snapshot) => {
    snapshot.forEach((doc) => {
      const data = doc.data() as {
        size?: string;
      };

      const points = data?.size ? (storyPointsMap[data.size] ?? 0) : 0;

      itemStoryPointsMap.set(doc.id, points);
    });
  });

  const itemTaskCountMap = new Map<
    string,
    { totalWeight: number; taskCount: number }
  >();

  const allTasksPromises: Promise<QuerySnapshot>[] = [];

  for (let i = 0; i < uniqueItemIds.length; i += chunkSize) {
    const chunk = uniqueItemIds.slice(i, i + chunkSize);

    const allTasksQuery = tasksCollectionRef
      .where("itemId", "in", chunk)
      .where("deleted", "==", false);

    allTasksPromises.push(allTasksQuery.get());
  }

  const allTasksSnapshots = await Promise.all(allTasksPromises);

  allTasksSnapshots.forEach((snapshot) => {
    snapshot.forEach((doc) => {
      const taskData = doc.data() as {
        itemId?: string;
        weight?: number;
      };

      if (taskData?.itemId) {
        const existing = itemTaskCountMap.get(taskData.itemId) ?? {
          totalWeight: 0,
          taskCount: 0,
        };
        itemTaskCountMap.set(taskData.itemId, {
          totalWeight: existing.totalWeight + (taskData.weight ?? 1),
          taskCount: existing.taskCount + 1,
        });
      }
    });
  });

  taskDataMap.forEach((taskInfo) => {
    if (itemStoryPointsMap.has(taskInfo.itemId)) {
      totalAssignedTasks++;

      const itemPoints = itemStoryPointsMap.get(taskInfo.itemId) ?? 0;
      const itemTaskInfo = itemTaskCountMap.get(taskInfo.itemId);

      const pointsPerWeightUnit = itemTaskInfo
        ? itemPoints / itemTaskInfo.totalWeight
        : itemPoints;
      const taskPoints = pointsPerWeightUnit * (taskInfo.weight ?? 1);

      totalAssignedStoryPoints += taskPoints;

      if (taskInfo.isCompleted) {
        completedAssignedTasks++;
        completedAssignedStoryPoints += taskPoints;
      }
    }
  });

  return {
    totalAssignedTasks,
    completedAssignedTasks,
    totalAssignedStoryPoints: Math.round(totalAssignedStoryPoints * 100) / 100,
    completedAssignedStoryPoints:
      Math.round(completedAssignedStoryPoints * 100) / 100,
  };
};

export const postSprintTeamProgress = async (
  firestore: Firestore,
  projectId: string,
  sprintId: string,
) => {
  const projectRef = firestore.collection("projects").doc(projectId);
  const teamRetrospectivesRef = projectRef
    .collection("teamRetrospectives")
    .doc(sprintId);

  const data = await computeSprintTeamProgress(firestore, projectId, sprintId);

  await teamRetrospectivesRef.set({
    ...data,
    updatedAt: new Date(),
  });
};

export const postSprintPersonalProgress = async (
  firestore: Firestore,
  projectId: string,
  sprintId: string,
  userId: string,
) => {
  const projectRef = firestore.collection("projects").doc(projectId);
  const personalRetrospectivesRef = projectRef
    .collection("personalRetrospectives")
    .doc(userId);

  const data = await computeSprintPersonalProgress(
    firestore,
    projectId,
    sprintId,
    userId,
  );

  await personalRetrospectivesRef.set({
    ...data,
    sprintId,
    updatedAt: new Date(),
  });
};

export const getSprintTeamProgress = async (
  firestore: Firestore,
  projectId: string,
  sprintId: string,
): Promise<{
  totalIssues: number;
  completedIssues: number;
  totalUserStories: number;
  completedUserStories: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
}> => {
  const projectRef = firestore.collection("projects").doc(projectId);
  const teamRetrospectivesRef = projectRef
    .collection("teamRetrospectives")
    .doc(sprintId);

  try {
    const doc = await teamRetrospectivesRef.get();

    if (doc.exists) {
      const data = doc.data();
      return {
        totalIssues: data?.totalIssues as number,
        completedIssues: data?.completedIssues as number,
        totalUserStories: data?.totalUserStories as number,
        completedUserStories: data?.completedUserStories as number,
        totalStoryPoints: data?.totalStoryPoints as number,
        completedStoryPoints: data?.completedStoryPoints as number,
      };
    }
  } catch (error) {
    console.error("Error getting team retrospective:", error);
  }

  await postSprintTeamProgress(firestore, projectId, sprintId);

  const doc = await teamRetrospectivesRef.get();
  const data = doc.data();

  return {
    totalIssues: data?.totalIssues as number,
    completedIssues: data?.completedIssues as number,
    totalUserStories: data?.totalUserStories as number,
    completedUserStories: data?.completedUserStories as number,
    totalStoryPoints: data?.totalStoryPoints as number,
    completedStoryPoints: data?.completedStoryPoints as number,
  };
};

export const getSprintPersonalProgress = async (
  firestore: Firestore,
  projectId: string,
  sprintId: string,
  userId: string,
): Promise<{
  totalAssignedTasks: number;
  completedAssignedTasks: number;
  totalAssignedStoryPoints: number;
  completedAssignedStoryPoints: number;
}> => {
  const projectRef = firestore.collection("projects").doc(projectId);
  const personalRetrospectivesRef = projectRef
    .collection("personalRetrospectives")
    .doc(userId);

  try {
    const doc = await personalRetrospectivesRef.get();

    if (doc.exists) {
      const data = doc.data();
      if (data?.sprintId === sprintId) {
        return {
          totalAssignedTasks: data?.totalAssignedTasks as number,
          completedAssignedTasks: data?.completedAssignedTasks as number,
          totalAssignedStoryPoints: data?.totalAssignedStoryPoints as number,
          completedAssignedStoryPoints:
            data?.completedAssignedStoryPoints as number,
        };
      }
    }
  } catch (error) {
    console.error("Error getting personal retrospective:", error);
  }

  await postSprintPersonalProgress(firestore, projectId, sprintId, userId);

  const doc = await personalRetrospectivesRef.get();
  const data = doc.data();

  return {
    totalAssignedTasks: data?.totalAssignedTasks as number,
    completedAssignedTasks: data?.completedAssignedTasks as number,
    totalAssignedStoryPoints: data?.totalAssignedStoryPoints as number,
    completedAssignedStoryPoints: data?.completedAssignedStoryPoints as number,
  };
};

export const ensureSprintTeamProgress = async (
  firestore: Firestore,
  projectId: string,
  sprintId: string,
): Promise<void> => {
  const projectRef = firestore.collection("projects").doc(projectId);
  const teamRetrospectivesRef = projectRef
    .collection("teamRetrospectives")
    .doc(sprintId);

  try {
    const doc = await teamRetrospectivesRef.get();
    if (doc.exists) {
      return;
    }
  } catch (error) {
    console.error("Error checking team retrospective:", error);
  }

  await postSprintTeamProgress(firestore, projectId, sprintId);
};

export const ensureSprintPersonalProgress = async (
  firestore: Firestore,
  projectId: string,
  sprintId: string,
  userId: string,
): Promise<void> => {
  const projectRef = firestore.collection("projects").doc(projectId);
  const personalRetrospectivesRef = projectRef
    .collection("personalRetrospectives")
    .doc(userId);

  try {
    const doc = await personalRetrospectivesRef.get();
    if (doc.exists) {
      const data = doc.data();
      if (data?.sprintId === sprintId) {
        return;
      }
    }
  } catch (error) {
    console.error("Error checking personal retrospective:", error);
  }

  await postSprintPersonalProgress(firestore, projectId, sprintId, userId);
};
