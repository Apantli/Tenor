import { Firestore } from "firebase-admin/firestore";
import { getProjectRef } from "./general";
import { Epic, WithId } from "~/lib/types/firebaseSchemas";
import { EpicOverviewSchema, EpicSchema } from "~/lib/types/zodFirebaseSchema";
import { TRPCError } from "@trpc/server";

/**
 * @function getEpicsRef
 * @description Gets a reference to the epics collection for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {FirebaseFirestore.CollectionReference} A reference to the epics collection
 */
export const getEpicsRef = (firestore: Firestore, projectId: string) => {
  return getProjectRef(firestore, projectId).collection("epics");
};

/**
 * @function getEpicRef
 * @description Gets a reference to a specific epic document
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param epicId The ID of the epic
 * @returns {FirebaseFirestore.DocumentReference} A reference to the epic document
 */
export const getEpicRef = (
  firestore: Firestore,
  projectId: string,
  epicId: string,
) => {
  return getEpicsRef(firestore, projectId).doc(epicId);
};

// FIXME: This may overlap, this isnt quite right
/**
 * @function getEpicNewId
 * @description Gets the next available epic ID for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {Promise<number>} The next available epic ID
 */
export const getEpicNewId = async (firestore: Firestore, projectId: string) => {
  const epicsRef = getEpicsRef(firestore, projectId).count().get();
  const epicsCount = (await epicsRef).data().count;
  return epicsCount + 1;
};

/**
 * @function getEpics
 * @description Retrieves all non-deleted epics associated with a specific project
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project to retrieve epics from
 * @returns {Promise<WithId<Epic>[]>} An array of epic objects with their IDs
 */
export const getEpics = async (firestore: Firestore, projectId: string) => {
  const epicsRef = getEpicsRef(firestore, projectId)
    .where("deleted", "==", false)
    .orderBy("scrumId", "desc");
  const epicsSnapshot = await epicsRef.get();
  const epics: WithId<Epic>[] = epicsSnapshot.docs.map((epicData) => {
    return {
      id: epicData.id,
      ...EpicSchema.parse(epicData.data()),
    } as WithId<Epic>;
  });
  return epics;
};

/**
 * @function getEpic
 * @description Retrieves a specific epic from the Firestore database
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param epicId The ID of the epic
 * @returns {Promise<WithId<Epic>>} The epic object validated by EpicSchema
 */
export const getEpic = async (
  firestore: Firestore,
  projectId: string,
  epicId: string,
) => {
  const epicData = await getEpicRef(firestore, projectId, epicId).get();
  if (!epicData.exists) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Epic not found",
    });
  }
  return {
    id: epicData.id,
    ...EpicSchema.parse(epicData.data()),
  } as WithId<Epic>;
};

/**
 * @function getEpicsOverview
 * @description Retrieves all non-deleted epics associated with a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {Promise<WithId<EpicOverview>[]>} An array of epic overview objects with their IDs
 */
export const getEpicsOverview = async (
  firestore: Firestore,
  projectId: string,
) => {
  const epicsRef = getEpicsRef(firestore, projectId)
    .where("deleted", "==", false)
    .orderBy("scrumId", "desc");
  const epicsSnapshot = await epicsRef.get();
  const epics = epicsSnapshot.docs.map((epicData) => {
    return {
      id: epicData.id,
      ...EpicOverviewSchema.parse(epicData.data()),
    };
  });
  return epics;
};

/**
 * @function getEpicOverview
 * @description Retrieves a specific epic overview from the Firestore database
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param epicId The ID of the epic
 * @returns {Promise<WithId<EpicOverview>>} The epic overview object validated by EpicOverviewSchema
 */
export const getEpicOverview = async (
  firestore: Firestore,
  projectId: string,
  epicId: string,
) => {
  const epicData = await getEpicRef(firestore, projectId, epicId).get();
  if (!epicData.exists) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Epic not found",
    });
  }
  const epic = EpicOverviewSchema.parse(epicData.data());
  return {
    id: epicData.id,
    ...epic,
  };
};
