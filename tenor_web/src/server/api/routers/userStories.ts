import { z } from "zod";
import type { WithId, Tag, Size } from "~/lib/types/firebaseSchemas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { UserStory } from "~/lib/types/firebaseSchemas";
import { TRPCError } from "@trpc/server";
import {
  EpicSchema,
  SprintSchema,
  TagSchema,
  TaskSchema,
  UserStorySchema,
} from "~/lib/types/zodFirebaseSchema";
import type { UserStoryDetail } from "~/lib/types/detailSchemas";
import { getProjectSettingsRef } from "./settings";
import { getEpic } from "./epics";
import { getSprint } from "./sprints";
export interface UserStoryCol {
  id: string;
  scrumId: number;
  title: string;
  epicScrumId?: number;
  priority?: Tag;
  size: Size;
  sprintNumber?: number;
  taskProgress: [number | undefined, number | undefined];
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

const getPriorityTag = async (
  settingsRef: FirebaseFirestore.DocumentReference,
  priorityId: string,
) => {
  if (priorityId === undefined) {
    return undefined;
  }
  const tag = await settingsRef
    .collection("priorityTypes")
    .doc(priorityId)
    .get();
  if (!tag.exists) {
    return undefined;
  }
  return { id: tag.id, ...TagSchema.parse(tag.data()) } as Tag;
};

const getBacklogTag = async (
  settingsRef: FirebaseFirestore.DocumentReference,
  taskId: string,
) => {
  if (taskId === undefined) {
    return undefined;
  }
  const tag = await settingsRef.collection("backlogTags").doc(taskId).get();
  if (!tag.exists) {
    return undefined;
  }
  return { id: tag.id, ...TagSchema.parse(tag.data()) } as Tag;
};

// TODO: Fetch from db
const getTaskProgress = () => {
  return [0, 0] as [number | undefined, number | undefined];
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
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      const rawUs = await getUserStoriesFromProject(ctx.firestore, projectId);

      // Transforming into table format
      const settingsRef = getProjectSettingsRef(projectId, ctx.firestore);

      const fixedData = await Promise.all(
        rawUs.map(async (userStory) => {
          const sprint = await getSprint(
            ctx.firestore,
            projectId,
            userStory.sprintId,
          );
          const epic = await getEpic(
            ctx.firestore,
            projectId,
            userStory.epicId,
          );
          return {
            id: userStory.id,
            scrumId: userStory.scrumId,
            title: userStory.name,
            epicScrumId: epic?.scrumId,
            priority: await getPriorityTag(settingsRef, userStory.priorityId),
            size: userStory.size,
            sprintNumber: sprint?.number,
            taskProgress: getTaskProgress(),
          };
        }),
      );

      return fixedData as UserStoryCol[];
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
        priorityTag = await getPriorityTag(
          settingsRef,
          userStoryData.priorityId,
        );
      }

      const tags = await Promise.all(
        userStoryData.tagIds.map(async (tagId) => {
          return await getBacklogTag(settingsRef, tagId);
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

      let sprint = undefined;
      if (userStoryData.sprintId !== "") {
        const sprintDoc = await ctx.firestore
          .collection("projects")
          .doc(projectId)
          .collection("sprints")
          .doc(userStoryData.sprintId)
          .get();
        if (sprintDoc.exists) {
          const sprintData = SprintSchema.parse(sprintDoc.data());
          sprint = {
            id: sprintDoc.id,
            number: sprintData.number,
          };
        }
      }

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
        sprint,
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

  modifyUserStoryTags: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userStoryId: z.string(),
        priorityId: z.string().optional(),
        size: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, userStoryId, priorityId, size } = input;
      if (priorityId === undefined && size === undefined) {
        return;
      }

      const userStoryRef = ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("userStories")
        .doc(userStoryId);
      const userStory = await userStoryRef.get();
      if (!userStory.exists) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const newUserStoryData = {
        priorityId: priorityId,
        size: size,
      };
      await userStoryRef.update(newUserStoryData);
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
