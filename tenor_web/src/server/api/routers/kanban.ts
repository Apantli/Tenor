/**
 * Kanban Router - Tenor API Endpoints for Kanban Board Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing Kanban board functionality in the Tenor application.
 * It provides endpoints to retrieve and organize tasks, user stories, and other backlog items for kanban board views.
 *
 * The router includes procedures for:
 * - Retrieving tasks formatted for kanban display
 * - Getting backlog items organized by status for kanban columns
 * - Fetching user stories and issues with appropriate kanban metadata
 *
 * Kanban functionality enables visual project management through card-based organization
 * of work items across different status columns.
 *
 * @category API
 */

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

import { z } from "zod";
import type {
  AnyBacklogItemType,
  StatusTag,
  Tag,
  WithId,
} from "~/lib/types/firebaseSchemas";
import type { KanbanItemCard, KanbanTaskCard } from "~/lib/types/kanbanTypes";
import { getTasks, getTasksAssignesIdsFromItem } from "../shortcuts/tasks";
import {
  getAutomaticStatusId,
  getBacklogTag,
  getBacklogTags,
  getStatusTypes,
} from "../shortcuts/tags";
import { getUserStories, getUserStory } from "../shortcuts/userStories";
import { getIssue, getIssues, isIssue } from "../shortcuts/issues";
import { getBacklogItems } from "../shortcuts/backlogItems";
import { sortByCardTypeAndScrumId } from "~/lib/helpers/sort";

/**
 * Retrieves tasks formatted for kanban board display.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — The ID of the project to retrieve tasks for
 *
 * @returns Object containing columns and task cards organized for kanban view.
 *
 * @http GET /api/trpc/kanban.getTasksForKanban
 */
export const getTasksForKanbanProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    const tasks = await getTasks(ctx.firestore, projectId);

    const cardTasks = await Promise.all(
      tasks.map(async (task) => {
        // Load parent item variables
        let priorityId: string | undefined = undefined;
        let sprintId: string | undefined = undefined;
        let tagIds: string[] = [];

        if (task.itemType === "US") {
          const userStory = await getUserStory(
            ctx.firestore,
            projectId,
            task.itemId,
          );
          if (userStory) {
            priorityId = userStory.priorityId;
            sprintId = userStory.sprintId;
            tagIds = userStory.tagIds;
          }
        }
        if (task.itemType === "IS") {
          const issue = await getIssue(ctx.firestore, projectId, task.itemId);
          if (issue) {
            priorityId = issue.priorityId;
            sprintId = issue.sprintId;
            tagIds = issue.tagIds;
          }
        }

        const tags: WithId<Tag>[] = (
          await Promise.all(
            tagIds.map(async (tagId: string) => {
              const tag = await getBacklogTag(ctx.firestore, projectId, tagId);
              return tag ?? null;
            }),
          )
        ).filter((tag): tag is WithId<Tag> => tag !== null);

        const {
          id,
          scrumId,
          name,
          description,
          size,
          statusId,
          itemType,
          itemId,
          assigneeId,
        } = task;
        const cardTypes = {
          US: "US-TS",
          IS: "IS-TS",
          IT: "IT-TS",
        };
        return {
          id,
          cardType: cardTypes[itemType],
          scrumId,
          name,
          description,
          size,
          tags,
          columnId: statusId,
          itemType,
          itemId,
          assigneeIds: [assigneeId],
          sprintId,
          priorityId,
        } as KanbanTaskCard;
      }),
    );

    const activeColumns = await getStatusTypes(ctx.firestore, input.projectId);

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
  });

/**
 * Retrieves backlog items (user stories, issues, items) formatted for kanban board display.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — The ID of the project to retrieve backlog items for
 *
 * @returns Object containing columns and item cards organized for kanban view.
 *
 * @http GET /api/trpc/kanban.getBacklogItemsForKanban
 */
export const getBacklogItemsForKanbanProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const { projectId } = input;

    const [userStories, issues, backlogItems, backlogTags] = await Promise.all([
      getUserStories(ctx.firestore, projectId),
      getIssues(ctx.firestore, projectId),
      getBacklogItems(ctx.firestore, projectId),
      getBacklogTags(ctx.firestore, projectId),
    ]);

    const backlogItemPreviews = [
      ...userStories.map((userStory) => ({
        ...userStory,
        itemType: "US" as AnyBacklogItemType,
      })),
      ...issues.map((issue) => ({
        ...issue,
        itemType: "IS" as AnyBacklogItemType,
      })),
      ...backlogItems.map((item) => ({
        ...item,
        itemType: "IT" as AnyBacklogItemType,
      })),
    ];

    const backlogItemDetails = (await Promise.all(
      backlogItemPreviews.map(async (item) => ({
        id: item.id,
        cardType: item.itemType,
        scrumId: item.scrumId,
        name: item.name,
        size: item.size,
        tags: item.tagIds
          .map((tagId) => {
            const tag = backlogTags.find((tag) => tag.id === tagId);
            return tag;
          })
          .filter((tag) => tag !== undefined),
        columnId: item.statusId,
        assigneeIds: await getTasksAssignesIdsFromItem(
          ctx.firestore,
          projectId,
          item.id,
        ),
        sprintId: item.sprintId,
        priorityId: item.priorityId,
        reviewerId: "reviewerId" in item ? item.reviewerId : undefined,
      })),
    )) as KanbanItemCard[];

    // Get all statuses
    const activeColumns = await getStatusTypes(ctx.firestore, projectId, true);

    // Assign automatic status to items with undefined status
    const itemsWithStatus = await Promise.all(
      backlogItemDetails.map(async (item) => {
        if (item.columnId === "" || item.columnId === undefined) {
          const newCol = await getAutomaticStatusId(
            ctx.firestore,
            projectId,
            item.id,
            activeColumns,
          );
          item.columnId = newCol ?? "";
        }
        return item;
      }),
    );

    const cardItems = Object.fromEntries(
      itemsWithStatus.map((item) => [item.id, item]),
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
          .map((item) => item.id)
          .sort(sortByCardTypeAndScrumId(cardItems)),
      }))
      .sort((a, b) => (a.orderIndex < b.orderIndex ? -1 : 1));

    return {
      columns: columnsWithItems,
      cardItems: cardItems,
    };
  });

/**
 * Determines the automatic status for a specific item based on its tasks and current state.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — The ID of the project containing the item
 * - itemId — The ID of the item to determine status for
 *
 * @returns The automatically determined status ID for the item.
 *
 * @http GET /api/trpc/kanban.getItemAutomaticStatus
 */
export const getItemAutomaticStatusProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      itemId: z.string(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const { projectId, itemId } = input;
    const includeAwaitsReview = await isIssue(ctx.firestore, projectId, itemId);

    const activeStatuses = await getStatusTypes(
      ctx.firestore,
      input.projectId,
      includeAwaitsReview,
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
  });

export const kanbanRouter = createTRPCRouter({
  getTasksForKanban: getTasksForKanbanProcedure,
  getBacklogItemsForKanban: getBacklogItemsForKanbanProcedure,
  getItemAutomaticStatus: getItemAutomaticStatusProcedure,
});
