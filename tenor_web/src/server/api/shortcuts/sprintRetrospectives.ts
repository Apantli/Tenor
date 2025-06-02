import { getSettingsRef } from "./general";
import type { Firestore, QuerySnapshot } from "firebase-admin/firestore";
import { FieldPath } from "firebase-admin/firestore";

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

export const computeSprintTeamProgress = async (
  firestore: Firestore,
  projectId: string,
  sprintId: string,
): Promise<{
  totalIssues: number;
  completedIssues: number;
  totalUserStories: number;
  completedUserStories: number;
}> => {
  const completedStatusIds = await getCompletedStatusIds(firestore, projectId);

  const projectRef = firestore.collection("projects").doc(projectId);
  const issuesCollectionRef = projectRef.collection("issues");
  const userStoriesCollectionRef = projectRef.collection("userStories");

  // Parallel query
  const [issuesSnapshot, userStoriesSnapshot] = await Promise.all([
    issuesCollectionRef
      .where("sprintId", "==", sprintId)
      .where("deleted", "==", false)
      .get(),
    userStoriesCollectionRef
      .where("sprintId", "==", sprintId)
      .where("deleted", "==", false)
      .get(),
  ]);

  const totalIssues = issuesSnapshot.size;
  let completedIssues = 0;

  issuesSnapshot.forEach((doc) => {
    const issueData = doc.data() as { statusId?: string };
    if (
      issueData?.statusId &&
      completedStatusIds.includes(issueData.statusId)
    ) {
      completedIssues++;
    }
  });

  const totalUserStories = userStoriesSnapshot.size;
  let completedUserStories = 0;

  userStoriesSnapshot.forEach((doc) => {
    const userStoryData = doc.data() as { statusId?: string };
    if (
      userStoryData?.statusId &&
      completedStatusIds.includes(userStoryData.statusId)
    ) {
      completedUserStories++;
    }
  });

  return {
    totalIssues,
    completedIssues,
    totalUserStories,
    completedUserStories,
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
}> => {
  const completedStatusIds = await getCompletedStatusIds(firestore, projectId);

  const projectRef = firestore.collection("projects").doc(projectId);
  const tasksCollectionRef = projectRef.collection("tasks");

  const userTasksQuery = tasksCollectionRef
    .where("assigneeId", "==", userId)
    .where("deleted", "==", false);

  const userTasksSnapshot = await userTasksQuery.get();

  let totalAssignedTasks = 0;
  let completedAssignedTasks = 0;

  const taskDataMap = new Map<
    string,
    { isCompleted: boolean; itemId: string }
  >();

  userTasksSnapshot.forEach((taskDoc) => {
    const taskData = taskDoc.data() as { itemId?: string; statusId?: string };
    const itemId = taskData?.itemId;

    if (itemId) {
      const isCompleted =
        taskData?.statusId && completedStatusIds.includes(taskData.statusId);

      taskDataMap.set(itemId, {
        isCompleted: !!isCompleted,
        itemId: itemId,
      });
    }
  });

  if (taskDataMap.size === 0) {
    return { totalAssignedTasks: 0, completedAssignedTasks: 0 };
  }

  const issuesCollectionRef = projectRef.collection("issues");
  const userStoriesCollectionRef = projectRef.collection("userStories");

  const uniqueItemIds = [...taskDataMap.keys()];
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

  const sprintItemIds = new Set<string>();
  snapshots.forEach((snapshot) => {
    snapshot.forEach((doc) => {
      sprintItemIds.add(doc.id);
    });
  });

  taskDataMap.forEach((taskInfo, itemId) => {
    if (sprintItemIds.has(itemId)) {
      totalAssignedTasks++;
      if (taskInfo.isCompleted) {
        completedAssignedTasks++;
      }
    }
  });

  return { totalAssignedTasks, completedAssignedTasks };
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
