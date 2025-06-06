import type { Firestore } from "firebase-admin/firestore";
import { SprintSchema } from "~/lib/types/zodFirebaseSchema";
import { getProjectRef } from "./general";
import type { Sprint, WithId } from "~/lib/types/firebaseSchemas";
import { getTasksFromItem } from "./tasks";
import { getUserStoriesRef } from "./userStories";
import { getIssuesRef } from "./issues";
import { getBacklogItemsRef } from "./backlogItems";
import type { BacklogItemDetail } from "~/lib/types/detailSchemas";
import { notFound } from "~/server/errors";

/**
 * @function getSprintsRef
 * @description Gets a reference to the sprints collection for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {FirebaseFirestore.CollectionReference} A reference to the sprints collection
 */
export const getSprintsRef = (firestore: Firestore, projectId: string) => {
  return getProjectRef(firestore, projectId).collection("sprints");
};

/**
 * @function getSprintRef
 * @description Gets a reference to a specific sprint document
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param sprintId The ID of the sprint
 * @returns {FirebaseFirestore.DocumentReference} A reference to the sprint document
 */
export const getSprintRef = (
  firestore: Firestore,
  projectId: string,
  sprintId: string,
) => {
  return getSprintsRef(firestore, projectId).doc(sprintId);
};

/**
 * @function getSprints
 * @description Retrieves all non-deleted sprints associated with a specific project
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project to retrieve sprints from
 * @returns {Promise<WithId<Sprint>[]>} An array of sprint objects with their IDs
 */
export const getSprints = async (firestore: Firestore, projectId: string) => {
  const sprintsRef = getSprintsRef(firestore, projectId)
    .where("deleted", "==", false)
    .orderBy("number", "asc"); // This order is maintained dynamically by date after sprint modifications
  const sprintsSnapshot = await sprintsRef.get();
  const sprints: WithId<Sprint>[] = sprintsSnapshot.docs.map((sprintData) => {
    const sprintSchema = SprintSchema.parse(sprintData.data());
    const sprint: WithId<Sprint> = {
      id: sprintData.id,
      ...sprintSchema,
      startDate:
        sprintSchema.startDate && "seconds" in sprintSchema.startDate
          ? new Date(sprintSchema.startDate.seconds * 1000)
          : sprintSchema.startDate,
      endDate:
        sprintSchema.endDate && "seconds" in sprintSchema.endDate
          ? new Date(sprintSchema.endDate.seconds * 1000)
          : sprintSchema.endDate,
    };
    return sprint;
  });
  return sprints;
};

/**
 * @function getCurrentSprint
 * @description Retrieves the current active sprint for a specific project
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project to retrieve the sprint from
 * @returns {Promise<WithId<Sprint>>} An object representing the current sprint with its ID
 */
export const getCurrentSprint = async (
  firestore: Firestore,
  projectId: string,
) => {
  // If project is deleted, throw an error
  const projectRef = getProjectRef(firestore, projectId);
  const projectDoc = await projectRef.get();
  if (!projectDoc.exists) {
    throw notFound("Project");
  }
  if (projectDoc.data()?.deleted) {
    return null;
  }
  const sprints = await getSprints(firestore, projectId);
  const now = new Date();
  return (
    sprints.find((sprint) => {
      return (
        sprint.startDate.getTime() <= now.getTime() &&
        sprint.endDate.getTime() >= now.getTime()
      );
    }) ?? null
  );
};

/**
 * @function getPreviousSprint
 * @description Retrieves the most recently ended sprint (within the last 2 days)
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @returns {Promise<WithId<Sprint> | undefined>} The previous sprint or undefined if no recent sprint
 */
export const getPreviousSprint = async (
  firestore: Firestore,
  projectId: string,
) => {
  const sprints = await getSprints(firestore, projectId);
  const now = new Date();
  const threeDaysInMs = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

  return sprints.find((sprint) => {
    const sprintEndTime = sprint.endDate.getTime();
    return (
      sprintEndTime < now.getTime() &&
      now.getTime() - sprintEndTime < threeDaysInMs
    );
  });
};

/**
 * @function getSprint
 * @description Retrieves a sprint from the Firestore database
 * @param firestore
 * @param projectId
 * @param sprintId
 * @returns {Promise<WithId<Sprint>>} The sprint object with its ID
 */
export const getSprint = async (
  firestore: Firestore,
  projectId: string,
  sprintId: string,
) => {
  const sprintRef = getSprintRef(firestore, projectId, sprintId);
  const sprintDoc = await sprintRef.get();
  if (!sprintDoc.exists) {
    throw notFound("Sprint");
  }

  const sprintSchema = SprintSchema.parse(sprintDoc.data());
  const sprint: WithId<Sprint> = {
    id: sprintDoc.id,
    ...sprintSchema,
    startDate:
      sprintSchema.startDate && "seconds" in sprintSchema.startDate
        ? new Date(sprintSchema.startDate.seconds * 1000)
        : sprintSchema.startDate,
    endDate:
      sprintSchema.endDate && "seconds" in sprintSchema.endDate
        ? new Date(sprintSchema.endDate.seconds * 1000)
        : sprintSchema.endDate,
  };

  return sprint;
};

export const updateSprintNumberOrder = async (
  firestore: Firestore,
  projectId: string,
) => {
  let reorderedSprints = false;

  // Reorder the remaining sprints by date
  const sprints = await getSprints(firestore, projectId);
  const sortedSprints = sprints.sort((a, b) => {
    return a.startDate.getTime() - b.startDate.getTime();
  });
  // Make sure the sprint numbers match the new order
  const batch = firestore.batch();
  sortedSprints.forEach((sprint, index) => {
    if (sprint.number === index + 1) return;
    reorderedSprints = true;
    const sprintRef = getSprintRef(firestore, projectId, sprint.id);
    batch.update(sprintRef, { number: index + 1 });
  });
  await batch.commit();

  return reorderedSprints;
};

// This includes US, IS, and IT
export const getBacklogItemsFromSprint = async (
  firestore: Firestore,
  projectId: string,
  sprintId: string,
) => {
  const currentSprint = await getSprint(firestore, projectId, sprintId);
  const userStoriesRef = await getUserStoriesRef(firestore, projectId)
    .where("sprintId", "==", currentSprint.id)
    .where("deleted", "==", false)
    .get();
  const issuesRef = await getIssuesRef(firestore, projectId)
    .where("sprintId", "==", currentSprint.id)
    .where("deleted", "==", false)
    .get();
  const itemsRef = await getBacklogItemsRef(firestore, projectId)
    .where("sprintId", "==", currentSprint.id)
    .where("deleted", "==", false)
    .get();

  const items = [
    ...userStoriesRef.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      itemType: "US",
    })),
    ...issuesRef.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      itemType: "IS",
    })),
    ...itemsRef.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      itemType: "IT",
    })),
  ] as BacklogItemDetail[];
  return items;
};

export const getTasksFromSprint = async (
  firestore: Firestore,
  projectId: string,
  sprintId: string,
) => {
  const items = await getBacklogItemsFromSprint(firestore, projectId, sprintId);
  const tasks = await Promise.all(
    items.map(
      async (item) => await getTasksFromItem(firestore, projectId, item.id),
    ),
  );
  return tasks.flat();
};
