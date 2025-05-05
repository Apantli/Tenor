import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

import { z } from "zod";
import { getTasksFromProject, getTasksFromItem } from "./tasks";
import type {
  Issue,
  StatusTag,
  Tag,
  UserStory,
  WithId,
} from "~/lib/types/firebaseSchemas";
import { getBacklogTag, getProjectSettingsRef } from "./settings";
import { StatusTagSchema } from "~/lib/types/zodFirebaseSchema";
import {
  doingTagName,
  doneTagName,
  todoTagName,
} from "~/lib/defaultProjectValues";

// Only information needed by the kanban board columns / selectable cards
export interface KanbanCard {
  id: string;
  cardType: "US" | "IS" | "IT" | "TS"; // US = user story, IS = issue, IT = generic item, TS = task
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

export interface KanbanTaskCard extends KanbanCard {
  cardType: "TS"; // TS = task
  itemId: string;
  itemType: "US" | "IS" | "IT"; // US = user story, IS = issue, IT = generic item
}
export interface KanbanItemCard extends KanbanCard {
  cardType: "US" | "IS" | "IT"; // US = user story, IS = issue, IT = generic item
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
    .collection("statusTypes")
    .where("deleted", "==", false);

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

export const kanbanRouter = createTRPCRouter({
  /**
   * Retrieves tasks for the Kanban board of a project.
   *
   * @param input Object containing procedure parameters  
   * Input object structure:  
   * - projectId — ID of the project to fetch tasks for  
   *
   * @returns Object containing columns and tasks for the Kanban board:  
   * - columns — Array of columns with their details and associated task IDs  
   * - cardTasks — Object mapping task IDs to their details  
   *
   * @http GET /api/trpc/kanban.getTasksForKanban
   */
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
          cardType: "TS",
          scrumId,
          name,
          description,
          size,
          tags: [],
          columnId: statusId,
          itemType,
          itemId,
        } as KanbanTaskCard;
      });

      const activeColumns = await getAllStatuses(
        ctx.firestore,
        input.projectId,
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

  /**
   * Retrieves backlog items for the Kanban board of a project.
   *
   * @param input Object containing procedure parameters  
   * Input object structure:  
   * - projectId — ID of the project to fetch backlog items for  
   *
   * @returns Object containing columns and backlog items for the Kanban board:  
   * - columns — Array of columns with their details and associated item IDs  
   * - cardItems — Object mapping item IDs to their details  
   *
   * @http GET /api/trpc/kanban.getBacklogItemsForKanban
   */
  getBacklogItemsForKanban: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Fetch user stories
      // FIXME: This view should only include items assigned to the current sprint

      const userStoriesRef = ctx.firestore
        .collection(`projects/${input.projectId}/userStories`)
        .where("deleted", "==", false);
      const userStoriesSnapshot = await userStoriesRef.get();
      const settingsRef = getProjectSettingsRef(input.projectId, ctx.firestore);
      const memoTags = new Map<string, WithId<Tag>>();
      const userStories = await Promise.all(
        userStoriesSnapshot.docs.map(async (doc) => {
          const data = doc.data() as UserStory;
          const tags = await Promise.all(
            data.tagIds.map(async (tagId: string) => {
              if (memoTags.has(tagId)) {
                return memoTags.get(tagId);
              }
              const tag = await getBacklogTag(settingsRef, tagId);
              if (!tag) {
                return null;
              }
              memoTags.set(tagId, tag);
              return tag;
            }),
          );
          return {
            id: doc.id,
            cardType: "US",
            scrumId: data.scrumId,
            name: data.name,
            description: data.description,
            size: data.size,
            tags: tags,
            columnId: data.statusId ?? "",
          } as KanbanItemCard;
        }),
      );

      // Fetch issues
      const issuesRef = ctx.firestore
        .collection(`projects/${input.projectId}/issues`)
        .where("deleted", "==", false);
      const issuesSnapshot = await issuesRef.get();

      const issues = await Promise.all(
        issuesSnapshot.docs.map(async (doc) => {
          const data = doc.data() as Issue;
          const tags = await Promise.all(
            data.tagIds.map(async (tagId: string) => {
              if (memoTags.has(tagId)) {
                return memoTags.get(tagId);
              }
              const tag = await getBacklogTag(settingsRef, tagId);
              if (!tag) {
                return null;
              }
              memoTags.set(tagId, tag);
              return tag;
            }),
          );
          return {
            id: doc.id,
            cardType: "IS",
            scrumId: data.scrumId,
            name: data.name,
            description: data.description,
            size: data.size,
            tags,
            columnId: data.statusId ?? "",
          } as KanbanItemCard;
        }),
      );

      // Combine both types of backlog items
      const backlogItems = [...userStories, ...issues];

      // Get all statuses
      const activeColumns = await getAllStatuses(
        ctx.firestore,
        input.projectId,
      );

      // Assign automatic status to items with undefined status
      const itemsWithStatus = await Promise.all(
        backlogItems.map(async (item) => {
          if (item.columnId === "") {
            const newCol = await getAutomaticStatusId(
              ctx.firestore,
              input.projectId,
              item.id,
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
            .map((item) => item.id),
        }))
        .sort((a, b) => (a.orderIndex < b.orderIndex ? -1 : 1));

      return {
        columns: columnsWithItems,
        cardItems: Object.fromEntries(
          itemsWithStatus.map((item) => [item.id, item]),
        ),
      };
    }),

  /**
   * Creates a new status list for a project.
   *
   * @param input Object containing procedure parameters  
   * Input object structure:  
   * - projectId — ID of the project to create the status list in  
   * - name — Name of the status list  
   * - color — Color of the status list  
   * - marksTaskAsDone — Boolean indicating if the status marks tasks as done  
   *
   * @returns Object containing the details of the created status list.
   *
   * @http POST /api/trpc/kanban.createStatusList
   */
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

  /**
   * Retrieves the automatic status for a backlog item based on its tasks.
   *
   * @param input Object containing procedure parameters  
   * Input object structure:  
   * - projectId — ID of the project containing the backlog item  
   * - itemId — ID of the backlog item to determine the status for  
   *
   * @returns Object containing the automatic status details for the backlog item.
   *
   * @http GET /api/trpc/kanban.getItemAutomaticStatus
   */
  getItemAutomaticStatus: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        itemId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { projectId, itemId } = input;
      const activeStatuses = await getAllStatuses(
        ctx.firestore,
        input.projectId,
      );
      const statusId = await getAutomaticStatusId(
        ctx.firestore,
        projectId,
        itemId,
        activeStatuses,
      );
      const status = activeStatuses.find((status) => status.id === statusId);
      if (!status) {
        throw new Error("Status not found");
      }
      return {
        id: status.id,
        name: status.name,
        color: status.color,
        marksTaskAsDone: status.marksTaskAsDone,
        orderIndex: status.orderIndex,
        deleted: status.deleted,
      } as StatusTag;
    }),
});
