import type {
  BacklogItem,
  Sprint,
  StatusTag,
  Tag,
  WithId,
} from "~/lib/types/firebaseSchemas";
import { getGenericBacklogItemContext, getProjectRef } from "./general";
import { BacklogItemSchema } from "~/lib/types/zodFirebaseSchema";
import { TRPCError } from "@trpc/server";
import type { Firestore } from "firebase-admin/firestore";
import admin from "firebase-admin";
import { deleteTaskAndGetModified, getTasksRef, getTaskTable } from "./tasks";
import {
  getBacklogTag,
  getBacklogTagsContext,
  getPriority,
  getStatusType,
} from "./tags";
import { getSprint } from "./sprints";
import type {
  BacklogItemFullDetail,
  TaskPreview,
} from "~/lib/types/detailSchemas";

/**
 * @function getBacklogItemsRef
 * @description Gets a reference to the backlog items collection for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {FirebaseFirestore.CollectionReference} A reference to the backlog items collection
 */
export const getBacklogItemsRef = (firestore: Firestore, projectId: string) => {
  return getProjectRef(firestore, projectId).collection("backlogItems");
};

/**
 * @function getBacklogItemRef
 * @description Gets a reference to a specific backlog item document
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param backlogItemId The ID of the backlog item
 * @returns {FirebaseFirestore.DocumentReference} A reference to the backlog item document
 */
export const getBacklogItemRef = (
  firestore: Firestore,
  projectId: string,
  backlogItemId: string,
) => {
  return getBacklogItemsRef(firestore, projectId).doc(backlogItemId);
};

// FIXME: This may overlap, this isnt quite right
/**
 * @function getBacklogItemNewId
 * @description Gets the next available backlog item ID for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {Promise<number>} The next available backlog item ID
 */
export const getBacklogItemNewId = async (
  firestore: Firestore,
  projectId: string,
) => {
  const backlogItemsRef = getBacklogItemsRef(firestore, projectId)
    .count()
    .get();
  const backlogItemsCount = (await backlogItemsRef).data().count;
  return backlogItemsCount + 1;
};

/**
 * @function getBacklogItems
 * @description Retrieves all non-deleted backlog items associated with a specific project
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project to retrieve backlog items from
 * @returns {Promise<WithId<BacklogItem>[]>} An array of backlog item objects with their IDs
 */
export const getBacklogItems = async (
  firestore: Firestore,
  projectId: string,
) => {
  const backlogItemsRef = getBacklogItemsRef(firestore, projectId)
    .where("deleted", "==", false)
    .orderBy("scrumId", "desc");
  const backlogItemsSnapshot = await backlogItemsRef.get();
  const backlogItems: WithId<BacklogItem>[] = backlogItemsSnapshot.docs.map(
    (doc) => {
      return {
        id: doc.id,
        ...BacklogItemSchema.parse(doc.data()),
      } as WithId<BacklogItem>;
    },
  );
  return backlogItems;
};

/**
 * @function getBacklogItemsAfter
 * @description Retrieves all non-deleted backlog items after a specified date
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project to retrieve backlog items from
 * @param {Date} date - The date to filter backlog items
 * @returns {Promise<WithId<BacklogItem>[]>} An array of backlog item objects with their IDs
 */
export const getBacklogItemsAfter = async (
  firestore: Firestore,
  projectId: string,
  date: Date,
) => {
  const backlogItemsRef = getBacklogItemsRef(firestore, projectId)
    .where("deleted", "==", false)
    .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(date));
  const backlogItemsSnapshot = await backlogItemsRef.get();
  const backlogItems: WithId<BacklogItem>[] = backlogItemsSnapshot.docs.map(
    (doc) => {
      return {
        id: doc.id,
        ...BacklogItemSchema.parse(doc.data()),
      } as WithId<BacklogItem>;
    },
  );
  return backlogItems;
};

/**
 * @function getBacklogItem
 * @description Retrieves a specific backlog item from the Firestore database
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param backlogItemId The ID of the backlog item
 * @returns {Promise<WithId<BacklogItem>>} The backlog item object validated by BacklogItemSchema or undefined if not found
 */
export const getBacklogItem = async (
  firestore: Firestore,
  projectId: string,
  backlogItemId: string,
) => {
  const backlogItemRef = getBacklogItemRef(firestore, projectId, backlogItemId);
  const backlogItemSnapshot = await backlogItemRef.get();
  if (!backlogItemSnapshot.exists) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Backlog item not found",
    });
  }
  return {
    id: backlogItemSnapshot.id,
    ...BacklogItemSchema.parse(backlogItemSnapshot.data()),
  } as WithId<BacklogItem>;
};

/**
 * @function getBacklogItemDetail
 * @description Retrieves detailed information about a specific backlog item
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @param {string} backlogItemId - The ID of the backlog item to retrieve details for
 * @returns {Promise<BacklogItemDetail>} The backlog item detail object
 */
export const getBacklogItemDetail = async (
  admin: admin.app.App,
  firestore: Firestore,
  projectId: string,
  backlogItemId: string,
) => {
  const backlogItem = await getBacklogItem(firestore, projectId, backlogItemId);

  const priority: Tag | undefined = backlogItem.priorityId
    ? await getPriority(firestore, projectId, backlogItem.priorityId)
    : undefined;

  const status: StatusTag | undefined = backlogItem.statusId
    ? await getStatusType(firestore, projectId, backlogItem.statusId)
    : undefined;

  const tags: Tag[] = await Promise.all(
    backlogItem.tagIds.map(async (tagId) => {
      return await getBacklogTag(firestore, projectId, tagId);
    }),
  );

  const sprint: WithId<Sprint> | undefined = backlogItem.sprintId
    ? await getSprint(firestore, projectId, backlogItem.sprintId)
    : undefined;

  const tasks = await getTaskTable(admin, firestore, projectId, backlogItem.id);

  const backlogItemDetail: BacklogItemFullDetail & { tasks: TaskPreview[] } = {
    ...backlogItem,
    sprint,
    priority,
    status,
    tags,
    tasks,
  };

  return backlogItemDetail;
};

/**
 * @function getSprintBacklogItems
 * @description Retrieves all non-deleted backlog items associated with a specific project and sprint
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project to retrieve backlog items from
 * @param {string} sprintId - The ID of the sprint to retrieve backlog items from
 * @returns {Promise<WithId<BacklogItem>[]>} An array of backlog item objects with their IDs
 */
export const getSprintBacklogItems = async (
  firestore: Firestore,
  projectId: string,
  sprintId: string,
) => {
  const backlogItemsRef = getBacklogItemsRef(firestore, projectId)
    .where("deleted", "==", false)
    .where("sprintId", "==", sprintId);

  const backlogItemsSnapshot = await backlogItemsRef.get();
  const backlogItems: WithId<BacklogItem>[] = backlogItemsSnapshot.docs.map(
    (doc) => {
      return {
        id: doc.id,
        ...BacklogItemSchema.parse(doc.data()),
      } as WithId<BacklogItem>;
    },
  );
  return backlogItems;
};

/**
 * @function deleteBacklogItemAndGetModified
 * @description Deletes a single backlog item and returns the IDs of modified stories and tasks
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @param {string} backlogItemId - The ID of the backlog item to delete
 * @returns {Promise<{modifiedBacklogItems: string[], modifiedTasks: string[]}>} Object containing arrays of modified backlog item and task IDs
 */
export const deleteBacklogItemAndGetModified = async (
  firestore: Firestore,
  projectId: string,
  backlogItemId: string,
): Promise<{ modifiedBacklogItems: string[]; modifiedTasks: string[] }> => {
  const backlogItemRef = getBacklogItemRef(firestore, projectId, backlogItemId);

  // Mark the backlog item as deleted
  await backlogItemRef.update({ deleted: true });

  // Delete associated tasks
  const tasksSnapshot = await getTasksRef(firestore, projectId)
    .where("deleted", "==", false)
    .where("itemType", "==", "IS")
    .where("itemId", "==", backlogItemId)
    .get();

  const allModifiedTasks = new Set<string>();
  const batch = firestore.batch();

  // Process each task and its dependencies
  await Promise.all(
    tasksSnapshot.docs.map(async (taskDoc) => {
      const taskId = taskDoc.id;
      allModifiedTasks.add(taskId);

      const tempModifiedTasks = await deleteTaskAndGetModified(
        firestore,
        projectId,
        taskId,
      );
      tempModifiedTasks.forEach((task) => {
        allModifiedTasks.add(task);
      });
    }),
  );

  await batch.commit();

  return {
    modifiedBacklogItems: [backlogItemId],
    modifiedTasks: Array.from(allModifiedTasks),
  };
};

/**
 * @function getBacklogItemContextSolo
 * @description Retrieves context information for a single backlog item, including generic details and related tags
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @param {string} backlogItemId - The ID of the backlog item to get context for
 * @returns {Promise<string>} A formatted string containing the backlog item's context details and related tags
 */
export const getBacklogItemContextSolo = async (
  firestore: Firestore,
  projectId: string,
  backlogItemId: string,
) => {
  const backlogItem = await getBacklogItem(firestore, projectId, backlogItemId);

  // Backlog item context
  const itemContext = await getGenericBacklogItemContext(
    firestore,
    projectId,
    backlogItem.name,
    backlogItem.description,
    backlogItem.priorityId ?? "",
    backlogItem.size,
  );

  // Related tags context
  const tagContext = await getBacklogTagsContext(
    firestore,
    projectId,
    backlogItem.tagIds,
  );

  return `# GENERIC BACKLOG ITEM DETAILS\n
${itemContext}
${tagContext}\n
`;
};
