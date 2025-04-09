import { FieldPath, FieldValue, Timestamp } from "firebase-admin/firestore";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  SprintInfoSchema,
  SprintSchema,
  TagSchema,
  UserStorySchema,
} from "~/lib/types/zodFirebaseSchema";
import { z } from "zod";

const timestampToDate = (timestamp: {
  seconds: number;
  nanoseconds: number;
}) => {
  return new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
};

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

  getUserStoryPreviewsBySprint: protectedProcedure
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
        .orderBy("scrumId", "asc")
        .get();
      const userStoriesData = z
        .array(UserStorySchema.extend({ id: z.string() }))
        .parse(userStories.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      // FIXME: Exclude passed sprints
      const sprints = await ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("sprints")
        .where("deleted", "==", false)
        .orderBy("number", "asc") // missing index
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
        };
      });

      // Organize the user stories by sprint
      const sprintsWithUserStories = sprintsData.map((sprint) => ({
        sprint: {
          id: sprint.id,
          description: sprint.description,
          number: sprint.number,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
        },
        userStoryIds: userStoriesPreviews
          .filter((userStory) => userStory.sprintId === sprint.id)
          .map((userStory) => userStory.id),
      }));

      const unassignedUserStoryIds = userStoriesPreviews
        .filter((userStory) => userStory.sprintId === "")
        .map((userStory) => userStory.id);

      return {
        sprints: sprintsWithUserStories,
        unassignedUserStoryIds,
        userStories: Object.fromEntries(
          userStoriesPreviews.map((userStory) => [userStory.id, userStory]),
        ),
      };
    }),

  assignUserStoriesToSprint: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        sprintId: z.string().optional(),
        userStoryIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, sprintId, userStoryIds } = input;

      // Update the user stories in parallel
      await Promise.all(
        userStoryIds.map(async (userStoryId) => {
          // Obtain user story data
          const userStoryRef = ctx.firestore
            .collection("projects")
            .doc(projectId)
            .collection("userStories")
            .doc(userStoryId);
          const userStory = await userStoryRef.get();
          const userStoryData = UserStorySchema.extend({
            id: z.string(),
          }).parse({
            id: userStoryId,
            ...userStory.data(),
          });

          // Remove from previously assigned sprint
          if (userStoryData.sprintId !== "") {
            const prevSprintRef = ctx.firestore
              .collection("projects")
              .doc(projectId)
              .collection("sprints")
              .doc(userStoryData.sprintId);
            await prevSprintRef.update({
              userStoryIds: FieldValue.arrayRemove(userStoryId),
            });
          }

          // Update the user story with the new sprint ID
          await userStoryRef.update({
            sprintId: sprintId ?? "",
          });
        }),
      );

      // Assign to the requested sprint
      if (sprintId && sprintId !== "") {
        const sprintRef = ctx.firestore
          .collection("projects")
          .doc(projectId)
          .collection("sprints")
          .doc(sprintId);
        await sprintRef.update({
          userStoryIds: FieldValue.arrayUnion(...userStoryIds),
        });
      }
    }),
});
