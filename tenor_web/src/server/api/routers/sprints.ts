/**
 * Sprints - Tenor API Endpoints for Sprint Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing Sprints in the Tenor application.
 * It provides endpoints to create, modify, and retrieve sprints.
 *
 * @category API
 */

import { FieldValue } from "firebase-admin/firestore";
import {
  createTRPCRouter,
  protectedProcedure,
  roleRequiredProcedure,
} from "~/server/api/trpc";
import {
  BacklogItemSchema,
  BacklogItemZodType,
  SprintSchema,
} from "~/lib/types/zodFirebaseSchema";
import { z } from "zod";
import {
  getCurrentSprint,
  getSprint,
  getSprintRef,
  getSprints,
  getSprintsRef,
  updateSprintNumberOrder,
} from "../shortcuts/sprints";
import { sprintPermissions } from "~/lib/defaultValues/permission";
import { getUserStories, getUserStoriesRef } from "../shortcuts/userStories";
import { getIssues, getIssuesRef } from "../shortcuts/issues";
import { getBacklogTags } from "../shortcuts/tags";
import { getProjectRef } from "../shortcuts/general";
import { LogProjectActivity } from "~/server/api/lib/projectEventLogger";
import { getTasksAssignesIdsFromItem } from "../shortcuts/tasks";
import type {
  BacklogItemDetail,
  BacklogItemPreview,
} from "~/lib/types/detailSchemas";
import type { AnyBacklogItemType } from "~/lib/types/firebaseSchemas";
import { getBacklogItems } from "../shortcuts/backlogItems";
import { sortByItemTypeAndScrumId } from "~/lib/helpers/sort";
import { notFound } from "~/server/errors";

export const sprintsRouter = createTRPCRouter({
  getProjectSprintsOverview: roleRequiredProcedure(sprintPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      return await getSprints(ctx.firestore, projectId);
    }),
  getSprint: roleRequiredProcedure(sprintPermissions, "read")
    .input(z.object({ projectId: z.string(), sprintId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId, sprintId } = input;
      return await getSprint(ctx.firestore, projectId, sprintId);
    }),
  createSprint: roleRequiredProcedure(sprintPermissions, "write")
    .input(
      z.object({
        sprintData: SprintSchema,
        projectId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, sprintData: sprintDataRaw } = input;

      const { id: newSprintId } = await ctx.firestore.runTransaction(
        async (transaction) => {
          const sprintsRef = getSprintsRef(ctx.firestore, projectId);

          const sprintCount = await transaction.get(sprintsRef.count());

          const sprintData = SprintSchema.parse({
            ...sprintDataRaw,
            scrumId: sprintCount.data().count + 1,
          });
          const docRef = sprintsRef.doc();

          transaction.create(docRef, sprintData);

          return {
            id: docRef.id,
          };
        },
      );

      let didReorderSprints = await updateSprintNumberOrder(
        ctx.firestore,
        projectId,
      );

      // get the last sprint, if same as new added, reorder sprints didnt happen
      const lastSprint = await getSprintsRef(ctx.firestore, projectId)
        .where("deleted", "==", false)
        .orderBy("number", "desc")
        .limit(1)
        .get();
      if (lastSprint.docs[0]?.id === newSprintId) {
        didReorderSprints = false;
      }

      await LogProjectActivity({
        firestore: ctx.firestore,
        projectId: input.projectId,
        userId: ctx.session.user.uid,
        itemId: newSprintId,
        type: "SP",
        action: "create",
      });

      return { success: true, reorderedSprints: didReorderSprints };
    }),

  modifySprint: roleRequiredProcedure(sprintPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        sprintId: z.string(),
        sprintData: SprintSchema.omit({
          deleted: true,
          number: true,
          genericItemIds: true,
          issueIds: true,
          userStoryIds: true,
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, sprintId, sprintData } = input;
      const sprintRef = getSprintRef(ctx.firestore, projectId, sprintId);

      const sprintDoc = await sprintRef.get();
      if (!sprintDoc.exists) {
        throw notFound("Sprint");
      }

      await sprintRef.update(sprintData);

      const didReorderSprints = await updateSprintNumberOrder(
        ctx.firestore,
        projectId,
      );

      await LogProjectActivity({
        firestore: ctx.firestore,
        projectId: input.projectId,
        userId: ctx.session.user.uid,
        itemId: sprintRef.id,
        type: "SP",
        action: "update",
      });

      return { success: true, reorderedSprints: didReorderSprints };
    }),

  deleteSprint: roleRequiredProcedure(sprintPermissions, "write")
    .input(z.object({ projectId: z.string(), sprintId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { projectId, sprintId } = input;

      const [sprintStories, sprintIssues] = await Promise.all([
        // Get all user stories
        await getUserStoriesRef(ctx.firestore, projectId)
          .where("sprintId", "==", sprintId)
          .get(),
        // Get all issues
        await getIssuesRef(ctx.firestore, projectId)
          .where("sprintId", "==", sprintId)
          .get(),
        // Mark the sprint as deleted
        await getSprintRef(ctx.firestore, projectId, sprintId).update({
          deleted: true,
        }),
      ]);

      // Batch update the user stories and issues to remove the sprintId
      const batch = ctx.firestore.batch();
      sprintStories.forEach((doc) => {
        batch.update(doc.ref, { sprintId: "" });
      });
      sprintIssues.forEach((doc) => {
        batch.update(doc.ref, { sprintId: "" });
      });
      await batch.commit();

      const didReorderSprints = await updateSprintNumberOrder(
        ctx.firestore,
        projectId,
      );

      await LogProjectActivity({
        firestore: ctx.firestore,
        projectId: input.projectId,
        userId: ctx.session.user.uid,
        itemId: sprintId,
        type: "SP",
        action: "delete",
      });

      return { success: true, reorderedSprints: didReorderSprints };
    }),

  getBacklogItemPreviewsBySprint: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      const [userStories, issues, backlogItems, sprints, backlogTags] =
        await Promise.all([
          getUserStories(ctx.firestore, projectId),
          getIssues(ctx.firestore, projectId),
          getBacklogItems(ctx.firestore, projectId),
          getSprints(ctx.firestore, projectId),
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
      ] as BacklogItemPreview[];

      const backlogItemDetails = (await Promise.all(
        backlogItemPreviews.map(async (item) => ({
          id: item.id,
          scrumId: item.scrumId,
          name: item.name,
          sprintId: item.sprintId,
          size: item.size,
          tags: item.tagIds
            .map((tagId) => {
              const tag = backlogTags.find((tag) => tag.id === tagId);
              return tag;
            })
            .filter((tag) => tag !== undefined),
          itemType: item.itemType,
          assigneeIds: await getTasksAssignesIdsFromItem(
            ctx.firestore,
            projectId,
            item.id,
          ),
          priorityId: item.priorityId,
        })),
      )) as BacklogItemDetail[];

      // Sort the items by scrumId
      backlogItemDetails.sort((a, b) => {
        if (a.scrumId < b.scrumId) {
          return -1;
        }
        if (a.scrumId > b.scrumId) {
          return 1;
        }
        return 0;
      });

      const backlogItemsObject = Object.fromEntries(
        backlogItemDetails.map((item) => [item.id, item]),
      );

      // Organize the user stories by sprint
      const sprintsWithItems = sprints.map((sprint) => ({
        sprint: {
          id: sprint.id,
          description: sprint.description,
          number: sprint.number,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
        },
        backlogItemIds: backlogItemDetails
          .filter((item) => item.sprintId === sprint.id)
          .map((item) => item.id)
          .sort(sortByItemTypeAndScrumId(backlogItemsObject)),
      }));

      const unassignedItemIds = backlogItemDetails
        .filter((item) => item.sprintId === "")
        .map((item) => item.id)
        .sort(sortByItemTypeAndScrumId(backlogItemsObject));

      return {
        sprints: sprintsWithItems,
        unassignedItemIds,
        backlogItems: backlogItemsObject,
      };
    }),

  assignItemsToSprint: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        sprintId: z.string().optional(),
        items: z.array(
          z.object({ id: z.string(), itemType: BacklogItemZodType }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, sprintId, items } = input;

      // Update the user stories in parallel
      await Promise.all(
        items.map(async (item) => {
          let collectionName = "";
          let fieldName = "";
          if (item.itemType === "US") {
            collectionName = "userStories";
            fieldName = "userStoryIds";
          } else if (item.itemType === "IS") {
            collectionName = "issues";
            fieldName = "issueIds";
          } else if (item.itemType === "IT") {
            collectionName = "backlogItems";
            fieldName = "backlogItemIds";
          }

          // Obtain user story data
          const itemRef = getProjectRef(ctx.firestore, projectId)
            .collection(collectionName)
            .doc(item.id);
          const itemDoc = await itemRef.get();
          const itemData = BacklogItemSchema.extend({
            id: z.string(),
          }).parse({
            id: itemDoc.id,
            ...itemDoc.data(),
          });

          // Remove from previously assigned sprint
          if (itemData.sprintId !== "") {
            const prevSprintRef = getSprintRef(
              ctx.firestore,
              projectId,
              itemData.sprintId,
            );
            await prevSprintRef.update({
              [fieldName]: FieldValue.arrayRemove(item.id),
            });
          }

          // Update the user story with the new sprint ID
          await itemRef.update({
            sprintId: sprintId ?? "",
          });
        }),
      );

      const addedUserStoryIds = items
        .filter((item) => item.itemType === "US")
        .map((item) => item.id);
      const addedIssueIds = items
        .filter((item) => item.itemType === "IS")
        .map((item) => item.id);
      const addedBacklogItemIds = items
        .filter((item) => item.itemType === "IT")
        .map((item) => item.id);

      // Assign to the requested sprint
      if (sprintId && sprintId !== "") {
        const sprintRef = getSprintRef(ctx.firestore, projectId, sprintId);
        if (addedUserStoryIds.length > 0) {
          await sprintRef.update({
            userStoryIds: FieldValue.arrayUnion(...addedUserStoryIds),
          });
        }
        if (addedIssueIds.length > 0) {
          await sprintRef.update({
            issueIds: FieldValue.arrayUnion(...addedIssueIds),
          });
        }
        if (addedBacklogItemIds.length > 0) {
          await sprintRef.update({
            backlogItemIds: FieldValue.arrayUnion(...addedBacklogItemIds),
          });
        }
      }
    }),

  getActiveSprint: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      const currentSprint = await getCurrentSprint(ctx.firestore, projectId);
      if (!currentSprint) {
        return null;
      }
      return currentSprint;
    }),
});
