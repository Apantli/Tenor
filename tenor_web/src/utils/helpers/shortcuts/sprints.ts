import type { Firestore } from "firebase-admin/firestore";
import { SprintSchema } from "~/lib/types/zodFirebaseSchema";
import { getProjectRef } from "./general";
import { TRPCError } from "@trpc/server";
import type { Sprint, WithId } from "~/lib/types/firebaseSchemas";

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

// FIXME: This may overlap, this isnt quite right
/**
 * @function getSprintNewId
 * @description Gets the next available sprint ID for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {Promise<number>} The next available sprint ID
 */
export const getSprintNewId = async (
  firestore: Firestore,
  projectId: string,
) => {
  const sprintsRef = getSprintsRef(firestore, projectId).count().get();
  const sprintsCount = (await sprintsRef).data().count;
  return sprintsCount + 1;
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
    .orderBy("startDate", "desc");
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
  const sprints = await getSprints(firestore, projectId);
  const now = new Date();
  return sprints.find((sprint) => {
    return (
      sprint.startDate.getTime() <= now.getTime() &&
      sprint.endDate.getTime() >= now.getTime()
    );
  });
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
  const twoDaysInMs = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
  
  return sprints.find((sprint) => {
    const sprintEndTime = sprint.endDate.getTime();
    return sprintEndTime < now.getTime() && 
           now.getTime() - sprintEndTime < twoDaysInMs;
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
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Sprint not found",
    });
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
