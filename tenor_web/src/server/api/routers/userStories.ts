import { z } from "zod";
import type { WithId, Tag, Size } from "~/lib/types/firebaseSchemas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { UserStory } from "~/lib/types/firebaseSchemas";
import { TRPCError } from "@trpc/server";
import {
  EpicSchema,
  TagSchema,
  TaskSchema,
  UserStorySchema,
} from "~/lib/types/zodFirebaseSchema";
import { type UserStoryDetail } from "~/lib/types/detailSchemas";
import { getProjectSettingsRef } from "./settings";

export interface UserStoryCol {
  id: string;
  scrumId: number;
  title: string;
  epicId: number;
  priority: Tag;
  size: Size;
  sprintId: number;
  taskProgress: [number | undefined, number | undefined];
}

function getRandomInt(min: number, max: number): number {
  if (min > max) {
    throw new Error("Min must be less than or equal to max");
  }

  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const getUserStoriesFromProject = async (
  dbAdmin: FirebaseFirestore.Firestore,
  projectId: string,
) => {
  const userStoryCollectionRef = dbAdmin
    .collection(`projects/${projectId}/userStories`)
    .where("deleted", "==", false)
    .orderBy("scrumId");
  const snap = await userStoryCollectionRef.get();

  const docs = snap.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
    };
  });

  const userStories: WithId<UserStory>[] = docs.filter(
    (userStory): userStory is WithId<UserStory> => userStory !== null,
  );

  return userStories;
};

// TODO: Fetch from db
const getSprintScrumId = () => {
  return getRandomInt(1, 10);
};

// TODO: Fetch from db
const getEpicScrumId = () => {
  return getRandomInt(1, 30);
};

// TODO: Fetch from db
const getPriorityTag = () => {
  const rand = getRandomInt(1, 2);
  return {
    name: rand == 1 ? "High" : "Low",
    color: rand == 1 ? "#FF4C4C" : "#009719",
    deleted: false,
  } as Tag;
};

// TODO: Fetch from db
const getTaskProgress = () => {
  return [0, 0] as [number | undefined, number | undefined];
};

const createUSTableData = (data: WithId<UserStory>[]) => {
  if (data.length === 0) return [];

  const fixedData = data.map((userStory) => ({
    id: userStory.id,
    scrumId: userStory.scrumId,
    title: userStory.name,
    epicId: getEpicScrumId(),
    priority: getPriorityTag(),
    size: userStory.size,
    sprintId: getSprintScrumId(),
    taskProgress: getTaskProgress(),
  })) as UserStoryCol[];
  // console.log("fixedData", fixedData);
  return fixedData;
};

export const userStoriesRouter = createTRPCRouter({
  createUserStory: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userStoryData: UserStorySchema.omit({ scrumId: true }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userStoryCount = await ctx.firestore
          .collection("projects")
          .doc(input.projectId)
          .collection("userStories")
          .count()
          .get();
        const userStory = await ctx.firestore
          .collection("projects")
          .doc(input.projectId)
          .collection("userStories")
          .add({
            ...input.userStoryData,
            scrumId: userStoryCount.data().count + 1,
          });
        return { success: true, userStoryId: userStory.id };
      } catch (err) {
        console.log("Error creating user story:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  getUserStoriesTableFriendly: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const rawUs = await getUserStoriesFromProject(ctx.firestore, input);
      const tableData = createUSTableData(rawUs);
      return tableData;
    }),

  getUserStoryDetail: protectedProcedure
    .input(z.object({ userStoryId: z.string(), projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get the necessary information to construct the UserStoryDetail

      const { projectId, userStoryId } = input;
      const userStoryRef = ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("userStories")
        .doc(userStoryId);
      const userStory = await userStoryRef.get();
      if (!userStory.exists) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const userStoryData = UserStorySchema.parse(userStory.data());
      // Fetch all the task information for the user story in parallel
      const tasks = await Promise.all(
        userStoryData.taskIds.map(async (taskId) => {
          const taskRef = ctx.firestore
            .collection("projects")
            .doc(projectId)
            .collection("tasks")
            .doc(taskId);
          const task = await taskRef.get();
          if (!task.exists) {
            throw new TRPCError({ code: "NOT_FOUND" });
          }
          const taskData = TaskSchema.parse(task.data());

          // FIXME: Get tag information from database
          const statusTag = TagSchema.parse({
            name: "Done",
            color: "#00FF00",
            deleted: false,
          });

          return { ...taskData, id: taskId, status: statusTag };
        }),
      );

      let epicData = undefined;
      if (userStoryData.epicId !== "") {
        const epic = await ctx.firestore
          .collection("projects")
          .doc(projectId)
          .collection("epics")
          .doc(userStoryData.epicId)
          .get();
        epicData = { ...EpicSchema.parse(epic.data()), id: epic.id };
      }

      const settingsRef = getProjectSettingsRef(input.projectId, ctx.firestore);

      let priorityTag = undefined;
      if (userStoryData.priorityId !== undefined) {
        const tag = await settingsRef
          .collection("priorityTypes")
          .doc(userStoryData.priorityId)
          .get();
        priorityTag = { id: tag.id, ...TagSchema.parse(tag.data()) };
      }

      const tags = await Promise.all(
        userStoryData.tagIds.map(async (tagId) => {
          const tag = await settingsRef
            .collection("backlogTags")
            .doc(tagId)
            .get();
          return { id: tag.id, ...TagSchema.parse(tag.data()) };
        }),
      );

      const dependencies = await Promise.all(
        userStoryData.dependencyIds.map(async (dependencyId) => {
          const dependency = await ctx.firestore
            .collection("projects")
            .doc(projectId)
            .collection("userStories")
            .doc(dependencyId)
            .get();
          const dependencyData = UserStorySchema.parse(dependency.data());
          return {
            id: dependency.id,
            name: dependencyData.name,
            scrumId: dependencyData.scrumId,
          };
        }),
      );

      const requiredBy = await Promise.all(
        userStoryData.requiredByIds.map(async (requiredById) => {
          const requiredBy = await ctx.firestore
            .collection("projects")
            .doc(projectId)
            .collection("userStories")
            .doc(requiredById)
            .get();
          const requiredByData = UserStorySchema.parse(requiredBy.data());
          return {
            id: requiredBy.id,
            name: requiredByData.name,
            scrumId: requiredByData.scrumId,
          };
        }),
      );

      // FIXME: Get sprint number from database
      const sprintNumber = undefined;

      const filteredTasks = tasks.filter((task) => task.deleted === false);
      return {
        id: userStoryId,
        scrumId: userStoryData.scrumId,
        name: userStoryData.name,
        description: userStoryData.description,
        acceptanceCriteria: userStoryData.acceptanceCriteria,
        epic: epicData,
        size: userStoryData.size,
        tags: tags,
        priority: priorityTag,
        dependencies: dependencies,
        requiredBy: requiredBy,
        tasks: filteredTasks,
        sprintNumber,
      } as UserStoryDetail;
    }),

  getAllUserStoryPreviews: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userStories = await ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("userStories")
        .where("deleted", "==", false)
        .get();
      const userStoriesData = z
        .array(UserStorySchema.extend({ id: z.string() }))
        .parse(userStories.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const userStoriesPreviews = userStoriesData.map((userStory) => ({
        id: userStory.id,
        scrumId: userStory.scrumId,
        name: userStory.name,
      }));
      return userStoriesPreviews;
    }),

  modifyUserStory: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userStoryId: z.string(),
        userStoryData: UserStorySchema.omit({ scrumId: true, deleted: true }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, userStoryId, userStoryData } = input;
      const userStoryRef = ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("userStories")
        .doc(userStoryId);
      await userStoryRef.update(userStoryData);
      return { success: true };
    }),

  deleteUserStory: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userStoryId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, userStoryId } = input;
      const userStoryRef = ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("userStories")
        .doc(userStoryId);
      await userStoryRef.update({ deleted: true });
      return { success: true };
    }),
});
