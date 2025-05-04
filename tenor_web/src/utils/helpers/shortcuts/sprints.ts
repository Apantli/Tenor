import { Firestore } from "firebase-admin/firestore";
import { SprintSchema } from "~/lib/types/zodFirebaseSchema";

/**
 * @function getSprint
 * @description Retrieves a sprint from the Firestore database
 * @param firestore
 * @param projectId
 * @param sprintId
 * @returns Sprint object or undefined if not found
 */
export const getSprint = async (
  firestore: Firestore,
  projectId: string,
  sprintId: string,
) => {
  if (sprintId === undefined || sprintId === "") {
    return undefined;
  }
  const sprintRef = firestore
    .collection("projects")
    .doc(projectId)
    .collection("sprints")
    .doc(sprintId);
  const sprint = await sprintRef.get();

  if (!sprint.exists) {
    return undefined;
  }
  return { id: sprint.id, ...SprintSchema.parse(sprint.data()) };
};
