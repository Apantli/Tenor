import type { Firestore } from "firebase-admin/firestore";
import { getProjectRef } from "./general";
import type { Epic, WithId } from "~/lib/types/firebaseSchemas";
import { EpicOverviewSchema, EpicSchema } from "~/lib/types/zodFirebaseSchema";
import { notFound } from "~/server/errors";

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
    throw notFound("Epic");
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
    throw notFound("Epic");
  }
  const epic = EpicOverviewSchema.parse(epicData.data());
  return {
    id: epicData.id,
    ...epic,
  };
};

export const getEpicsContext = async (
  firestore: Firestore,
  projectId: string,
) => {
  const epics = await getEpics(firestore, projectId);
  let epicContext = "# EXISTING EPICS\n\n";
  epics.forEach((epic) => {
    const epicData = EpicSchema.parse(epic);
    epicContext += `- id: ${epic.id}\n- name: ${epicData.name}\n- description: ${epicData.description}\n\n`;
  });
  return epicContext;
};

export const getEpicContext = async (
  firestore: Firestore,
  projectId: string,
  epicId: string,
) => {
  let epicContext = "";
  if (epicId && epicId !== "") {
    const epic = await getEpicRef(firestore, projectId, epicId).get();
    if (epic.exists) {
      const epicData = {
        id: epic.id,
        ...EpicSchema.parse(epic.data()),
      };
      epicContext = `# RELATED EPIC\n\n- name: ${epicData.name}\n- description: ${epicData.description}\n\n`;
    }
  }
  return epicContext;
};
