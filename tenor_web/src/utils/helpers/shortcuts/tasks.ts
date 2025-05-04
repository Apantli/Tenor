import { Firestore } from "firebase-admin/firestore";
import { getProjectRef } from "./general";
import { Task, WithId } from "~/lib/types/firebaseSchemas";
import { TaskSchema } from "~/lib/types/zodFirebaseSchema";
import { getPriority, getStatusType } from "./tags";
import { UserPreview } from "~/lib/types/detailSchemas";
import * as admin from "firebase-admin";

/**
 * @function getTasksRef
 * @description Gets a reference to the tasks collection for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {FirebaseFirestore.CollectionReference} A reference to the tasks collection
 */
export const getTasksRef = (firestore: Firestore, projectId: string) => {
  return getProjectRef(firestore, projectId).collection("tasks");
};

/**
 * @function getTaskRef
 * @description Gets a reference to a specific task document
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param taskId The ID of the task
 * @returns {FirebaseFirestore.DocumentReference} A reference to the task document
 */
export const getTaskRef = (
  firestore: Firestore,
  projectId: string,
  taskId: string,
) => {
  return getTasksRef(firestore, projectId).doc(taskId);
};

/**
 * @function getTasks
 * @description Retrieves all non-deleted tasks from a project, ordered by scrumId
 * @param {Firestore} firestore - The Firestore database instance
 * @param {string} projectId - The ID of the project to retrieve tasks from
 * @returns {Promise<WithId<Task>[]>} An array of task objects with their IDs
 */
export const getTasks = async (firestore: Firestore, projectId: string) => {
  const tasksRef = getTasksRef(firestore, projectId).orderBy("scrumId");

  const tasksSnapshot = await tasksRef.get();
  const tasks: WithId<Task>[] = tasksSnapshot.docs.map((doc) => {
    return {
      id: doc.id,
      ...TaskSchema.parse(doc.data()),
    } as WithId<Task>;
  });

  return tasks;
};

/**
 * @function getTasksFromItem
 * @description Retrieves all non-deleted tasks associated with a specific item
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @param {string} itemId - The ID of the item to retrieve tasks from
 * @returns {Promise<WithId<Task>[]>} An array of task objects with their IDs
 */
export const getTasksFromItem = async (
  firestore: Firestore,
  projectId: string,
  itemId: string,
) => {
  const tasksRef = getTasksRef(firestore, projectId)
    .where("itemId", "==", itemId)
    .orderBy("scrumId");

  const tasksSnapshot = await tasksRef.get();
  const tasks: WithId<Task>[] = tasksSnapshot.docs.map((doc) => {
    return {
      id: doc.id,
      ...TaskSchema.parse(doc.data()),
    } as WithId<Task>;
  });
  return tasks;
};

/**
 * @function getTaskProgress
 * @description Calculates the progress of tasks in a project
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @param {string} itemId - The ID of the item
 * @returns {Promise<[number, number]>} A tuple containing the number of completed tasks and the total number of tasks
 */
export const getTaskProgress = async (
  firestore: Firestore,
  projectId: string,
  itemId: string,
) => {
  const tasksRef = getTasksRef(firestore, projectId).where(
    "deleted",
    "==",
    false,
  );
  const tasksSnapshot = await tasksRef.get();
  const totalTasks = tasksSnapshot.size;

  const completedTasks = await Promise.all(
    tasksSnapshot.docs.map(async (taskDoc) => {
      const taskData = TaskSchema.parse(taskDoc.data());

      if (!taskData.statusId) return false;

      const statusTag = await getStatusType(
        firestore,
        projectId,
        taskData.statusId,
      );
      return statusTag?.marksTaskAsDone;
    }),
  ).then((results) => results.filter(Boolean).length);

  return [completedTasks, totalTasks];
};

/**
 * @function getTaskAssignUsers
 * @description Retrieves unique users assigned to tasks in a specific item
 * @param {admin.app.App} admin - The Firebase Admin instance
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @param {string} itemId - The ID of the item
 * @returns {Promise<UserPreview[]>} An array of unique user objects with their IDs
 */
export const getTasksAssignUsers = async (
  admin: admin.app.App,
  firestore: Firestore,
  projectId: string,
  itemId: string,
): Promise<UserPreview[]> => {
  if (!itemId) {
    return [];
  }
  const tasks = await getTasksFromItem(firestore, projectId, itemId);

  const userIds = tasks
    .map((task) => task.assigneeId)
    .filter((id): id is string => Boolean(id));

  const users: WithId<UserPreview>[] = await Promise.all(
    userIds.map(async (userId) => {
      const userRecord = await admin.auth().getUser(userId);
      const user: WithId<UserPreview> = {
        id: userRecord.uid,
        displayName: userRecord.displayName ?? "",
        email: userRecord.email ?? "",
        photoURL: userRecord.photoURL ?? "",
      };
      return user;
    }),
  );

  const filteredUsers = users.filter((user): user is WithId<UserPreview> =>
    Boolean(user?.id),
  );

  const uniqueUsers: UserPreview[] = Array.from(
    new Map(filteredUsers.map((user) => [user.id, user])).values(),
  );

  return uniqueUsers;
};
