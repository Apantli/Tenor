/**
 * Sprints - Tenor API Endpoints for Sprint Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing Sprints in the Tenor application.
 * It provides endpoints to create, modify, and retrieve sprints.
 *
 * @category API
 */

import { FieldPath, FieldValue, Timestamp } from "firebase-admin/firestore";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  BacklogItemSchema,
  IssueSchema,
  SprintInfoSchema,
  SprintSchema,
  TagSchema,
  UserStorySchema,
} from "~/lib/types/zodFirebaseSchema";
import { z } from "zod";
import { timestampToDate } from "~/utils/helpers/parsers";

export const sprintsRouter = createTRPCRouter({
  getProjectSprintsOverview: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const sprintsSnapshot = await ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("sprints")
        .select("number", "description", "startDate", "endDate")
        .orderBy("number")
        .get();

      const sprints = sprintsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...SprintInfoSchema.parse(doc.data()),
      }));

      return sprints;
    }),
  getSprint: protectedProcedure
    .input(z.object({ projectId: z.string(), sprintNumber: z.number() }))
    .query(async ({ ctx, input }) => {
      const snapshot = await ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("sprints")
        .where("number", "==", input.sprintNumber)
        .limit(1)
        .get();

      if (snapshot.empty) {
        throw new Error("Sprint not found");
      }

      const sprintDoc = snapshot.docs[0];

      return SprintSchema.parse({ ...sprintDoc?.data() });
    }),
  createOrModifySprint: protectedProcedure
    .input(SprintSchema.extend({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const projectCount = (
        await ctx.firestore
          .collection("projects")
          .where(FieldPath.documentId(), "==", input.projectId)
          .count()
          .get()
      ).data().count;

      if (projectCount === 0) {
        throw new Error("Project not found");
      }

      const sprintsRef = ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("sprints");

      if (input.number !== -1) {
        const sprintDocs = await sprintsRef
          .where("number", "==", input.number)
          .get();

        if (sprintDocs.empty) {
          throw new Error("Epic not found");
        }

        const sprintDoc = sprintDocs.docs[0];
        await sprintDoc?.ref.update(input);
        return "Sprint updated successfully";
      } else {
        const existingSprintsCount = (await sprintsRef.count().get()).data()
          .count;
        input.number = existingSprintsCount + 1;
        await sprintsRef.add(input);
        return "Sprint created successfully";
      }
    }),

  getBacklogItemPreviewsBySprint: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      const userStories = await ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("userStories")
        .where("deleted", "==", false)
        .get();
      const userStoriesData = z
        .array(UserStorySchema.extend({ id: z.string() }))
        .parse(userStories.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const issues = await ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("issues")
        .where("deleted", "==", false)
        .get();
      const issuesData = z
        .array(IssueSchema.extend({ id: z.string() }))
        .parse(issues.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      // FIXME: Exclude passed sprints
      const sprints = await ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("sprints")
        .where("deleted", "==", false)
        .orderBy("number", "asc")
        .get();
      const sprintsData = z
        .array(SprintSchema.extend({ id: z.string() }))
        .parse(sprints.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        .map((sprint) => ({
          ...sprint,
          startDate: timestampToDate(sprint.startDate),
          endDate: timestampToDate(sprint.endDate),
        }));

      const backlogTags = await ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("settings")
        .doc("settings")
        .collection("backlogTags")
        .where("deleted", "==", false)
        .get();
      const backlogTagsData = z
        .array(TagSchema.extend({ id: z.string() }))
        .parse(backlogTags.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const userStoriesPreviews = userStoriesData.map((userStory) => {
        return {
          id: userStory.id,
          scrumId: userStory.scrumId,
          name: userStory.name,
          sprintId: userStory.sprintId,
          size: userStory.size,
          tags: userStory.tagIds
            .map((tagId) => {
              const tag = backlogTagsData.find((tag) => tag.id === tagId);
              return tag;
            })
            .filter((tag) => tag !== undefined),
          itemType: "US",
        };
      });
      const issuesPreviews = issuesData.map((issue) => {
        return {
          id: issue.id,
          scrumId: issue.scrumId,
          name: issue.name,
          sprintId: issue.sprintId,
          size: issue.size,
          tags: issue.tagIds
            .map((tagId) => {
              const tag = backlogTagsData.find((tag) => tag.id === tagId);
              return tag;
            })
            .filter((tag) => tag !== undefined),
          itemType: "IS",
        };
      });

      const allItems = [...userStoriesPreviews, ...issuesPreviews];
      // Sort the items by scrumId
      allItems.sort((a, b) => {
        if (a.scrumId < b.scrumId) {
          return -1;
        }
        if (a.scrumId > b.scrumId) {
          return 1;
        }
        return 0;
      });

      // Organize the user stories by sprint
      const sprintsWithItems = sprintsData.map((sprint) => ({
        sprint: {
          id: sprint.id,
          description: sprint.description,
          number: sprint.number,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
        },
        backlogItemIds: allItems
          .filter((item) => item.sprintId === sprint.id)
          .map((item) => item.id),
      }));

      const unassignedItemIds = allItems
        .filter((item) => item.sprintId === "")
        .map((item) => item.id);

      return {
        sprints: sprintsWithItems,
        unassignedItemIds,
        backlogItems: Object.fromEntries(
          allItems.map((item) => [item.id, item]),
        ),
      };
    }),

  assignItemsToSprint: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        sprintId: z.string().optional(),
        items: z.array(
          z.object({ id: z.string(), itemType: z.enum(["US", "IS"]) }),
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
          }

          // Obtain user story data
          const itemRef = ctx.firestore
            .collection("projects")
            .doc(projectId)
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
            const prevSprintRef = ctx.firestore
              .collection("projects")
              .doc(projectId)
              .collection("sprints")
              .doc(itemData.sprintId);
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

      // Assign to the requested sprint
      if (sprintId && sprintId !== "") {
        const sprintRef = ctx.firestore
          .collection("projects")
          .doc(projectId)
          .collection("sprints")
          .doc(sprintId);
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
      }
    }),
});
