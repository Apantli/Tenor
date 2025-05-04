import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

import { z } from "zod";
import type {
  Issue,
  StatusTag,
  Tag,
  UserStory,
  WithId,
} from "~/lib/types/firebaseSchemas";
import { StatusTagSchema } from "~/lib/types/zodFirebaseSchema";
import {
  getAutomaticStatusId,
  getBacklogTag,
  getSettingsRef,
  getStatusTypes,
  getTasks,
} from "~/utils/helpers/shortcuts";
import { KanbanItemCard, KanbanTaskCard } from "~/lib/types/kanbanTypes";

export const kanbanRouter = createTRPCRouter({
  getTasksForKanban: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tasks = await getTasks(ctx.firestore, input.projectId);
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

      const activeColumns = await getStatusTypes(
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
      const settingsRef = getSettingsRef(ctx.firestore, input.projectId);
      const memoTags = new Map<string, WithId<Tag>>();
      const userStories = await Promise.all(
        userStoriesSnapshot.docs.map(async (doc) => {
          const data = doc.data() as UserStory;
          const tags = await Promise.all(
            data.tagIds.map(async (tagId: string) => {
              if (memoTags.has(tagId)) {
                return memoTags.get(tagId);
              }
              const tag = await getBacklogTag(
                ctx.firestore,
                input.projectId,
                tagId,
              );
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
              const tag = await getBacklogTag(
                ctx.firestore,
                input.projectId,
                tagId,
              );
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
      const activeColumns = await getStatusTypes(
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

      const projectSettingsRef = getSettingsRef(ctx.firestore, projectId);

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

  getItemAutomaticStatus: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        itemId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { projectId, itemId } = input;
      const activeStatuses = await getStatusTypes(
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
