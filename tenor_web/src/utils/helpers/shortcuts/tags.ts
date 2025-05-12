import type { Firestore } from "firebase-admin/firestore";
import {
  doingTagName,
  doneTagName,
  todoTagName,
} from "~/lib/defaultProjectValues";
import { getSettingsRef } from "./general";
import type { StatusTag, Tag, WithId } from "~/lib/types/firebaseSchemas";
import { StatusTagSchema, TagSchema } from "~/lib/types/zodFirebaseSchema";
import { TRPCError } from "@trpc/server";
import { getTasksFromItem } from "./tasks";

/**
 * @function getPrioritiesRef
 * @description Gets a reference to the priority types collection for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {FirebaseFirestore.CollectionReference} A reference to the priority types collection
 */
export const getPrioritiesRef = (firestore: Firestore, projectId: string) => {
  return getSettingsRef(firestore, projectId).collection("priorityTypes");
};

/**
 * @function getPriorityRef
 * @description Gets a reference to a specific priority document
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param priorityId The ID of the priority
 * @returns {FirebaseFirestore.DocumentReference} A reference to the priority document
 */
export const getPriotityRef = (
  firestore: Firestore,
  projectId: string,
  priorityId: string,
) => {
  return getPrioritiesRef(firestore, projectId).doc(priorityId);
};

/**
 * @function getPriorities
 * @description Retrieves all non-deleted priority tags associated with a specific project
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project to retrieve priority tags from
 * @returns {Promise<WithId<Tag>[]>} An array of priority tag objects with their IDs
 */
export const getPriorities = async (
  firestore: Firestore,
  projectId: string,
) => {
  const prioritiesRef = getPrioritiesRef(firestore, projectId)
    .where("deleted", "==", false)
    .orderBy("name", "desc");
  const prioritiesSnapshot = await prioritiesRef.get();
  const priorities: WithId<Tag>[] = prioritiesSnapshot.docs.map((doc) => {
    return {
      id: doc.id,
      ...TagSchema.parse(doc.data()),
    } as WithId<Tag>;
  });
  return priorities;
};

/**
 * @function getPriority
 * @description Retrieves a priority tag from the priorityTypes collection based on its ID
 * @param {FirebaseFirestore.DocumentReference} settingsRef - Reference to the settings document
 * @param {string} priorityId - The ID of the priority tag to retrieve
 * @returns {Promise<Tag | undefined>} The priority tag object or undefined if not found
 */
export const getPriority = async (
  firestore: Firestore,
  projectId: string,
  priorityId: string,
) => {
  const tag = await getPriotityRef(firestore, projectId, priorityId).get();
  return { id: tag.id, ...TagSchema.parse(tag.data()) } as WithId<Tag>;
};

/**
 * @function getStatusTypesRef
 * @description Gets a reference to the status types collection for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {FirebaseFirestore.CollectionReference} A reference to the status types collection
 */
export const getStatusTypesRef = (firestore: Firestore, projectId: string) => {
  return getSettingsRef(firestore, projectId).collection("statusTypes");
};

/**
 * @function getStatusTypeRef
 * @description Gets a reference to a specific status type document
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param statusId The ID of the status type
 * @returns {FirebaseFirestore.DocumentReference} A reference to the status type document
 */
export const getStatusTypeRef = (
  firestore: Firestore,
  projectId: string,
  statusId: string,
) => {
  return getStatusTypesRef(firestore, projectId).doc(statusId);
};

/**
 * @function getStatusTypes
 * @description Retrieves all non-deleted status types associated with a specific project
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project to retrieve status types from
 * @returns {Promise<WithId<StatusTag>[]>} An array of status type objects with their IDs
 */
export const getStatusTypes = async (
  firestore: Firestore,
  projectId: string,
) => {
  const statusesRef = getStatusTypesRef(firestore, projectId).where(
    "deleted",
    "==",
    false,
  );
  const statusesSnapshot = await statusesRef.get();
  const statuses: WithId<StatusTag>[] = statusesSnapshot.docs.map((doc) => {
    return {
      id: doc.id,
      ...StatusTagSchema.parse(doc.data()),
    } as WithId<StatusTag>;
  });
  return statuses;
};

/**
 * @function getStatusType
 * @description Retrieves a status tag from the settings collection based on its ID
 * @param {FirebaseFirestore.DocumentReference} settingsRef - Reference to the settings document
 * @param {string} statusId - The ID of the status tag to retrieve
 * @returns {Promise<WithId<StatusTag> | undefined>} The status tag object or undefined if not found
 */
export const getStatusType = async (
  firestore: Firestore,
  projectId: string,
  statusId: string,
) => {
  const tag = await getStatusTypeRef(firestore, projectId, statusId).get();
  if (!tag.exists) {
    return undefined;
  }
  return {
    id: tag.id,
    ...StatusTagSchema.parse(tag.data()),
  } as WithId<StatusTag>;
};

// FIXME: This function is kind of weird, why is there always a TODO tag?
/**
 * @function getTodoStatusTag
 * @description Retrieves the "Todo" status tag from the settings collection
 * @param {FirebaseFirestore.DocumentReference} settingsRef - Reference to the settings document
 * @returns {Promise<Tag>} The Todo status tag object
 * @throws {TRPCError} If the Todo status tag is not found
 */
export const getTodoStatusTag = async (
  firestore: Firestore,
  projectId: string,
) => {
  const todoTag = await getStatusTypesRef(firestore, projectId)
    .where("name", "==", todoTagName)
    .limit(1)
    .get();

  if (todoTag.empty || todoTag.docs.length !== 1) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "To Do status tag not found",
    });
  }
  return {
    id: todoTag.docs[0]!.id,
    ...StatusTagSchema.parse(todoTag.docs[0]!.data()),
  };
};

/**
 * @function getBacklogTagsRef
 * @description Gets a reference to the backlog tags collection for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {FirebaseFirestore.CollectionReference} A reference to the backlog tags collection
 */
export const getBacklogTagsRef = (firestore: Firestore, projectId: string) => {
  return getSettingsRef(firestore, projectId).collection("backlogTags");
};

/**
 * @function getBacklogTagRef
 * @description Gets a reference to a specific backlog tag document
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param taskId The ID of the backlog tag
 * @returns {FirebaseFirestore.DocumentReference} A reference to the backlog tag document
 */
export const getBacklogTagRef = (
  firestore: Firestore,
  projectId: string,
  taskId: string,
) => {
  return getBacklogTagsRef(firestore, projectId).doc(taskId);
};

/**
 * @function getBacklogTags
 * @description Retrieves all non-deleted backlog tags associated with a specific project
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project to retrieve backlog tags from
 * @returns {Promise<WithId<Tag>[]>} An array of backlog tag objects with their IDs
 */
export const getBacklogTags = async (
  firestore: Firestore,
  projectId: string,
) => {
  const backlogTagsRef = getBacklogTagsRef(firestore, projectId)
    .where("deleted", "==", false)
    .orderBy("name", "desc");
  const backlogTagsSnapshot = await backlogTagsRef.get();
  const backlogTags: WithId<Tag>[] = backlogTagsSnapshot.docs.map((doc) => {
    return {
      id: doc.id,
      ...TagSchema.parse(doc.data()),
    } as WithId<Tag>;
  });
  return backlogTags;
};

/**
 * @function getBacklogTag
 * @description Retrieves a backlog tag from the backlogTags collection based on its ID
 * @param {FirebaseFirestore.DocumentReference} settingsRef - Reference to the settings document
 * @param {string} taskId - The ID of the backlog tag to retrieve
 * @returns {Promise<WithId<Tag>>} The backlog tag object or undefined if not found
 */
export const getBacklogTag = async (
  firestore: Firestore,
  projectId: string,
  taskId: string,
) => {
  const tag = await getBacklogTagRef(firestore, projectId, taskId).get();
  if (!tag.exists) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Backlog tag not found",
    });
  }
  return {
    id: tag.id,
    ...TagSchema.parse(tag.data()),
  } as WithId<Tag>;
};

export const getAutomaticStatusId = async (
  firestore: Firestore,
  projectId: string,
  itemId: string,
  statusTags: WithId<StatusTag>[],
) => {
  // Get all tasks for this item
  const tasks = await getTasksFromItem(firestore, projectId, itemId);

  // Rule 1: No tasks? Item is set to TODO
  if (tasks.length === 0) {
    // Find the "Todo" status tag
    const todoStatus = statusTags.find(
      (status) => status.name.toLowerCase() === todoTagName.toLowerCase(),
    );
    if (todoStatus) return todoStatus.id;

    // If no "Todo" status exists, use the first status in order
    const orderedStatuses = [...statusTags].sort(
      (a, b) => a.orderIndex - b.orderIndex,
    );
    if (orderedStatuses.length > 0) {
      const firstStatus = orderedStatuses[0] ?? { id: "" }; // Weird, but TypeScript needs this
      return firstStatus.id;
    } else {
      return "";
    }
  }

  // Rule 2: All tasks have the same status? The item takes that status
  const taskStatusIds = tasks
    .map((task) => task.statusId)
    .filter((id) => id !== "");
  if (
    taskStatusIds.length > 0 &&
    taskStatusIds.every((id) => id === taskStatusIds[0])
  ) {
    return taskStatusIds[0];
  }

  // Rule 3: All tasks are resolved? The item is set to Done
  const doneStatusIds = statusTags
    .filter((status) => status.marksTaskAsDone)
    .map((status) => status.id);

  if (
    tasks.length > 0 &&
    tasks.every(
      (task) => task.statusId && doneStatusIds.includes(task.statusId),
    )
  ) {
    // Find the "Done" status tag
    const doneStatus = statusTags.find(
      (status) => status.name.toLowerCase() === doneTagName.toLowerCase(),
    );
    if (doneStatus) return doneStatus.id;

    // If no specific "Done" status exists, use the first status that marks tasks as done
    return doneStatusIds.length > 0 ? doneStatusIds[0] : "";
  }

  // Rule 4: Otherwise, the item is set to Doing
  const doingStatus = statusTags.find(
    (status) => status.name.toLowerCase() === doingTagName.toLowerCase(),
  );
  if (doingStatus) return doingStatus.id;

  // If no "Doing" status exists, use a middle status based on order index
  const orderedStatuses = [...statusTags].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );
  if (orderedStatuses.length > 0) {
    const middleIndex = Math.floor((orderedStatuses.length - 1) / 2);
    return (orderedStatuses[middleIndex] ?? { id: "" }).id;
  }

  return "";
};

export const getPriorityContext = async (
  firestore: Firestore,
  projectId: string,
) => {
  const priorities = await getPriorities(firestore, projectId);

  let prioritiesContext = "# PRIORITY TAGS\n\n";
  priorities.forEach((tag) => {
    prioritiesContext += `- id: ${tag.id}\n- name: ${tag.name}\n\n`;
  });
  return prioritiesContext;
};

export const getBacklogContext = async (
  firestore: Firestore,
  projectId: string,
) => {
  const backlogTags = await getBacklogTags(firestore, projectId);
  let backlogTagsContext = "# BACKLOG TAGS\n\n";
  backlogTags.forEach((tag) => {
    backlogTagsContext += `- id: ${tag.id}\n- name: ${tag.name}\n\n`;
  });
  return backlogTagsContext;
};

export const getBacklogTagsContext = async (
  firestore: Firestore,
  projectId: string,
  tagIds: string[],
) => {
  const tags = await Promise.all(
    tagIds.map(async (tagId) => {
      const tag = await getBacklogTagRef(firestore, projectId, tagId).get();
      if (tag.exists) {
        const tagData = TagSchema.parse(tag.data());
        return `- ${tagData.name}`;
      }
      return "";
    }),
  );
  return (
    "RELATED TAGS\n\n" + tags.filter((tag) => tag !== "").join("\n") + "\n\n"
  );
};
