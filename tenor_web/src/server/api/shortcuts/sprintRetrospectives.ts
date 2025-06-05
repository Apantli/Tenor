import { getProjectRef, getSettingsRef } from "./general";
import type { Firestore, QuerySnapshot } from "firebase-admin/firestore";
import { FieldPath } from "firebase-admin/firestore";
import { getAutomaticStatusId, getStatusTypesRef } from "./tags";
import { getStatusTypes } from "./tags";
import { getIssuesRef } from "./issues";
import { getUserStoriesRef } from "./userStories";
import { getBacklogItemsRef } from "./backlogItems";
import { getTasksRef } from "./tasks";

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

export const getTeamRetrospectivesRef = (
  firestore: Firestore,
  projectId: string,
  sprintId: string,
) => {
  return getProjectRef(firestore, projectId)
    .collection("teamRetrospectives")
    .doc(sprintId);
};

export const getPersonalRetrospectivesRef = (
  firestore: Firestore,
  projectId: string,
  userId: string,
) => {
  return getProjectRef(firestore, projectId)
    .collection("personalRetrospectives")
    .doc(userId);
};

export const getCompletedStatusIds = async (
  firestore: Firestore,
  projectId: string,
): Promise<string[]> => {
  const snapshot = await getStatusTypesRef(firestore, projectId)
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
  const settingsDoc = await getSettingsRef(firestore, projectId).get();

  if (!settingsDoc.exists) {
    return {
      XS: 1,
      S: 2,
      M: 3,
      L: 5,
      XL: 8,
      XXL: 13,
    };
  }

  const settingsData = settingsDoc.data();
  const sizeData = settingsData?.Size as number[] | undefined;

  if (!sizeData || !Array.isArray(sizeData) || sizeData.length < 6) {
    return {
      XS: 1,
      S: 2,
      M: 3,
      L: 5,
      XL: 8,
      XXL: 13,
    };
  }

  return {
    XS: sizeData[0] ?? 1,
    S: sizeData[1] ?? 2,
    M: sizeData[2] ?? 3,
    L: sizeData[3] ?? 5,
    XL: sizeData[4] ?? 8,
    XXL: sizeData[5] ?? 13,
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
  totalBacklogItems: number;
  completedBacklogItems: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
}> => {
  const completedStatusIds = await getCompletedStatusIds(firestore, projectId);
  const storyPointsMap = await getStoryPointsBySizeSettings(
    firestore,
    projectId,
  );

  const issuesCollectionRef = getIssuesRef(firestore, projectId);
  const userStoriesCollectionRef = getUserStoriesRef(firestore, projectId);
  const backlogItemsCollectionRef = getBacklogItemsRef(firestore, projectId);

  // Parallel query
  const [
    issuesSnapshot,
    userStoriesSnapshot,
    backlogItemsSnapshot,
    statusSnapshot,
  ] = await Promise.all([
    issuesCollectionRef
      .where("sprintId", "==", sprintId)
      .where("deleted", "==", false)
      .get(),
    userStoriesCollectionRef
      .where("sprintId", "==", sprintId)
      .where("deleted", "==", false)
      .get(),
    backlogItemsCollectionRef
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

  const totalBacklogItems = backlogItemsSnapshot.size;
  let completedBacklogItems = 0;

  const backlogItemsDoc = await Promise.all(
    backlogItemsSnapshot.docs.map(async (doc) => {
      const backlogItemData = doc.data() as {
        statusId?: string;
        size?: string;
      };
      let statusId: string;
      if (backlogItemData?.statusId) {
        statusId = backlogItemData.statusId;
      } else {
        statusId =
          (await getAutomaticStatusId(
            firestore,
            projectId,
            doc.id,
            statusSnapshot,
          )) ?? "";
      }

      const points = backlogItemData?.size
        ? (storyPointsMap[backlogItemData.size] ?? 0)
        : 0;

      return {
        ...backlogItemData,
        id: doc.id,
        statusId,
        calculatedStoryPoints: points,
      };
    }),
  );

  backlogItemsDoc.forEach((backlogItemData) => {
    totalStoryPoints += backlogItemData.calculatedStoryPoints ?? 0;
    if (
      backlogItemData?.statusId &&
      completedStatusIds.includes(backlogItemData.statusId)
    ) {
      completedBacklogItems++;
      completedStoryPoints += backlogItemData.calculatedStoryPoints ?? 0;
    }
  });

  return {
    totalIssues,
    completedIssues,
    totalUserStories,
    completedUserStories,
    totalBacklogItems,
    completedBacklogItems,
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

  const userTasksQuery = getTasksRef(firestore, projectId)
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

  const issuesCollectionRef = getIssuesRef(firestore, projectId);
  const userStoriesCollectionRef = getUserStoriesRef(firestore, projectId);
  const backlogItemsCollectionRef = getBacklogItemsRef(firestore, projectId);

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

    const backlogItemsQuery = backlogItemsCollectionRef
      .where(FieldPath.documentId(), "in", chunk)
      .where("sprintId", "==", sprintId)
      .where("deleted", "==", false);

    allPromises.push(backlogItemsQuery.get());
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

    const allTasksQuery = getTasksRef(firestore, projectId)
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
  const teamRetrospectivesRef = getTeamRetrospectivesRef(
    firestore,
    projectId,
    sprintId,
  );

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
  const personalRetrospectivesRef = getPersonalRetrospectivesRef(
    firestore,
    projectId,
    userId,
  );

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
  totalBacklogItems: number;
  completedBacklogItems: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
}> => {
  const teamRetrospectivesRef = getTeamRetrospectivesRef(
    firestore,
    projectId,
    sprintId,
  );

  try {
    const doc = await teamRetrospectivesRef.get();

    if (doc.exists) {
      const data = doc.data();
      return {
        totalIssues: data?.totalIssues as number,
        completedIssues: data?.completedIssues as number,
        totalUserStories: data?.totalUserStories as number,
        completedUserStories: data?.completedUserStories as number,
        totalBacklogItems: data?.totalBacklogItems as number,
        completedBacklogItems: data?.completedBacklogItems as number,
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
    totalBacklogItems: data?.totalBacklogItems as number,
    completedBacklogItems: data?.completedBacklogItems as number,
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
  const personalRetrospectivesRef = getPersonalRetrospectivesRef(
    firestore,
    projectId,
    userId,
  );

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
  const teamRetrospectivesRef = getTeamRetrospectivesRef(
    firestore,
    projectId,
    sprintId,
  );

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
  const personalRetrospectivesRef = getPersonalRetrospectivesRef(
    firestore,
    projectId,
    userId,
  );

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
