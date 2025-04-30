import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

import { z } from "zod";
import { getTasksFromProject, getTasksFromItem } from "./tasks";
import type {
  Issue,
  StatusTag,
  UserStory,
  WithId,
} from "~/lib/types/firebaseSchemas";
import { getProjectSettingsRef } from "./settings";
import { StatusTagSchema } from "~/lib/types/zodFirebaseSchema";
import { doingTagName, doneTagName, todoTagName } from "~/lib/defaultTags";

// TODO: Fix double ids. Create 2 formats: one for tasks and one for items... (one does not hvae itemId i think, and just "itemType")
// Only information needed by the kanban board columns / selectable cards
export interface CardItem {
  id: string;
  scrumId: number;
  name: string;
  size: "XS" | "S" | "M" | "L" | "XL" | "XXL" | undefined;
  tags: {
    deleted: boolean;
    id: string;
    name: string;
    color: string;
  }[];
  columnId: string;
}

// The ID and type of the parent if its a task, or itself if its an item
export interface CardItemWithType extends CardItem {
  itemId: string;
  itemType: "US" | "IS" | "IT"; // US = user story, IS = issue, ITEM = generic item
}

const getAllStatuses = async (
  dbAdmin: FirebaseFirestore.Firestore,
  projectId: string,
) => {
  const statusesRef = dbAdmin
    .collection("projects")
    .doc(projectId)
    .collection("settings")
    .doc("settings")
    .collection("statusTypes");
  const snap = await statusesRef.get();

  const docs = snap.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
    };
  });

  return docs as WithId<StatusTag>[];
};

// Get the status ID based on tasks for a backlog item with undefined status
const getAutomaticStatusId = async (
  dbAdmin: FirebaseFirestore.Firestore,
  projectId: string,
  itemId: string,
  statusTags: WithId<StatusTag>[],
) => {
  // Get all tasks for this item
  const tasks = await getTasksFromItem(dbAdmin, projectId, itemId);

  // Rule 1: No tasks? Item is set to TODO
  if (tasks.length === 0) {
    // Find the "Todo" status tag
    const todoStatus = statusTags.find(
      (status) => status.name.toLowerCase() === todoTagName,
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
      (status) => status.name.toLowerCase() === doneTagName,
    );
    if (doneStatus) return doneStatus.id;

    // If no specific "Done" status exists, use the first status that marks tasks as done
    return doneStatusIds.length > 0 ? doneStatusIds[0] : "";
  }

  // Rule 4: Otherwise, the item is set to Doing
  const doingStatus = statusTags.find(
    (status) => status.name.toLowerCase() === doingTagName,
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

export const kanbanRouter = createTRPCRouter({
  getTasksForKanban: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tasks = await getTasksFromProject(ctx.firestore, input.projectId);
      const cardTasks = tasks.map((task) => {
        const {
          id,
          scrumId,
          name,
          description,
          size,
          statusId,
          itemType,
          itemId,
        } = task;
        return {
          id,
          scrumId,
          name,
          description,
          size,
          tags: [],
          columnId: statusId,
          itemType,
          itemId,
        } as CardItemWithType;
      });

      const columns = await getAllStatuses(ctx.firestore, input.projectId);
      const activeColumns = columns.filter(
        (column) => column.deleted === false,
      );

      const columnsWithTasks = activeColumns
        .map((column) => ({
          id: column.id,
          name: column.name,
          color: column.color,
          orderIndex: column.orderIndex,

          taskIds: cardTasks
            .filter((item) => item.columnId === column.id)
            .map((item) => item.id),
        }))
        .sort((a, b) => (a.orderIndex < b.orderIndex ? -1 : 1));

      return {
        columns: columnsWithTasks,
        cardTasks: Object.fromEntries(cardTasks.map((item) => [item.id, item])),
      };
    }),

  // TODO: get items tags
  getBacklogItemsForKanban: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Fetch user stories
      const userStoriesRef = ctx.firestore
        .collection(`projects/${input.projectId}/userStories`)
        .where("deleted", "==", false);
      const userStoriesSnapshot = await userStoriesRef.get();

      const userStories = userStoriesSnapshot.docs.map((doc) => {
        const data = doc.data() as UserStory;
        return {
          id: doc.id,
          scrumId: data.scrumId,
          name: data.name,
          description: data.description,
          size: data.size,
          tags: [],
          columnId: data.statusId ?? "", // Handle potentially undefined statusId
          itemType: "US" as const,
          itemId: doc.id,
        } as CardItemWithType;
      });

      // Fetch issues
      const issuesRef = ctx.firestore
        .collection(`projects/${input.projectId}/issues`)
        .where("deleted", "==", false);
      const issuesSnapshot = await issuesRef.get();

      const issues = issuesSnapshot.docs.map((doc) => {
        const data = doc.data() as Issue;
        return {
          id: doc.id,
          scrumId: data.scrumId,
          name: data.name,
          description: data.description,
          size: data.size,
          tags: [],
          columnId: data.statusId ?? "", // Handle potentially undefined statusId
          itemType: "IS" as const,
          itemId: doc.id,
        } as CardItemWithType;
      });

      // Combine both types of backlog items
      const backlogItems = [...userStories, ...issues];

      // Get all statuses
      const columns = await getAllStatuses(ctx.firestore, input.projectId);
      const activeColumns = columns.filter(
        (column) => column.deleted === false,
      );

      // Assign automatic status to items with undefined status
      const itemsWithStatus = await Promise.all(
        backlogItems.map(async (item) => {
          if (item.columnId === "") {
            const newCol = await getAutomaticStatusId(
              ctx.firestore,
              input.projectId,
              item.itemId,
              activeColumns,
            );
            item.columnId = newCol ?? "";
          }
          return item;
        }),
      );

      // Group items by status
      const columnsWithItems = activeColumns
        .map((column) => ({
          id: column.id,
          name: column.name,
          color: column.color,
          orderIndex: column.orderIndex,

          itemIds: itemsWithStatus
            .filter((item) => item.columnId === column.id)
            .sort((a, b) => (a?.scrumId ?? 0) - (b?.scrumId ?? 0))
            .map((item) => item.id)
        }))
        .sort((a, b) => (a.orderIndex > b.orderIndex ? -1 : 1));

      return {
        columns: columnsWithItems,
        cardItems: Object.fromEntries(
          itemsWithStatus.map((item) => [item.id, item]),
        ),
      };
    }),

  createStatusList: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string(),
        color: z.string(),
        marksTaskAsDone: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, name, color, marksTaskAsDone } = input;

      const projectSettingsRef = getProjectSettingsRef(
        projectId,
        ctx.firestore,
      );

      const statusCollectionRef = projectSettingsRef.collection("statusTypes");

      const statusTypes = await statusCollectionRef.get();

      const statusTypesData = statusTypes.docs.map((doc) => ({
        id: doc.id,
        ...StatusTagSchema.parse(doc.data()),
      }));
      const biggestOrderIndex = Math.max(
        ...statusTypesData.map((status) => status.orderIndex),
        0,
      );

      const newStatus = {
        name,
        color: color.toUpperCase(),
        marksTaskAsDone,
        deleted: false,
        orderIndex: biggestOrderIndex + 1,
      };

      const docRef = await statusCollectionRef.add(newStatus);
      return {
        id: docRef.id,
        ...newStatus,
      };
    }),
});
