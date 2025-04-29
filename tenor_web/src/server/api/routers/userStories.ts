import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { WithId, Tag, Size } from "~/lib/types/firebaseSchemas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { UserStory } from "~/lib/types/firebaseSchemas";
import { TRPCError } from "@trpc/server";
import {
  EpicSchema,
  ExistingEpicSchema,
  ExistingUserStorySchema,
  SprintSchema,
  TagSchema,
  TaskSchema,
  UserStorySchema,
} from "~/lib/types/zodFirebaseSchema";
import type {
  UserStoryDetail,
  UserStoryPreview,
} from "~/lib/types/detailSchemas";
import {
  getBacklogTag,
  getPriorityTag,
  getProjectSettingsRef,
} from "./settings";
import { getEpic } from "./epics";
import { getSprint } from "./sprints";
import { env } from "~/env";
import { askAiToGenerate } from "~/utils/aiGeneration";
import {
  collectBacklogTagsContext,
  collectPriorityTagContext,
} from "~/utils/aiContext";
import { FieldValue } from "firebase-admin/firestore";

export interface UserStoryCol {
  id: string;
  scrumId?: number;
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
    .orderBy("scrumId", "desc");
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
const getStatusName = async (
  dbAdmin: FirebaseFirestore.Firestore,
  projectId: string,
  statusId: string,
) => {
  if (!statusId) {
    return undefined;
  }
  const settingsRef = getProjectSettingsRef(projectId, dbAdmin);
  const tag = await settingsRef.collection("statusTypes").doc(statusId).get();
  if (!tag.exists) {
    return undefined;
  }
  return { id: tag.id, ...TagSchema.parse(tag.data()) } as Tag;
};

const getTaskProgress = async (
  dbAdmin: FirebaseFirestore.Firestore,
  projectId: string,
  itemId: string,
) => {
  const tasksRef = dbAdmin
    .collection("projects")
    .doc(projectId)
    .collection("tasks");

  const tasksSnapshot = await tasksRef
    .where("deleted", "==", false)
    .where("itemId", "==", itemId)
    .get();

  const totalTasks = tasksSnapshot.size;

  const completedTasks = await Promise.all(
    tasksSnapshot.docs.map(async (taskDoc) => {
      const taskData = TaskSchema.parse(taskDoc.data());

      if (!taskData.statusId) return false;

      const statusTag = await getStatusName(
        dbAdmin,
        projectId,
        taskData.statusId,
      );
      return statusTag?.name === "Done";
    }),
  ).then((results) => results.filter(Boolean).length);

  return [completedTasks, totalTasks];
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

        // Add dependency and requiredBy references
        await Promise.all(
          input.userStoryData.dependencyIds.map(async (dependencyId) => {
            await ctx.firestore
              .collection("projects")
              .doc(input.projectId)
              .collection("userStories")
              .doc(dependencyId)
              .update({ requiredByIds: FieldValue.arrayUnion(userStory.id) });
          }),
        );
        await Promise.all(
          input.userStoryData.requiredByIds.map(async (requiredById) => {
            await ctx.firestore
              .collection("projects")
              .doc(input.projectId)
              .collection("userStories")
              .doc(requiredById)
              .update({ dependencyIds: FieldValue.arrayUnion(userStory.id) });
          }),
        );

        return { success: true, userStoryId: userStory.id };
      } catch (err) {
        console.log("Error creating user story:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  getProjectUserStoriesOverview: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userStoriesSnapshot = await ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("userStories")
        .select("scrumId", "name")
        .where("deleted", "==", false)
        .orderBy("scrumId")
        .get();

      const userStories = userStoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...ExistingUserStorySchema.parse(doc.data()),
      }));

      return userStories;
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
          const taskProgress = await getTaskProgress(
            ctx.firestore,
            projectId,
            userStory.id,
          );
          return {
            id: userStory.id,
            scrumId: userStory.scrumId,
            title: userStory.name,
            epicScrumId: epic?.scrumId,
            priority: await getPriorityTag(settingsRef, userStory.priorityId),
            size: userStory.size,
            sprintNumber: sprint?.number,
            taskProgress: taskProgress,
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

      const oldUserStoryData = UserStorySchema.parse(
        (await userStoryRef.get()).data(),
      );

      // Check the difference in dependency and requiredBy arrays
      const addedDependencies = userStoryData.dependencyIds.filter(
        (dep) => !oldUserStoryData.dependencyIds.includes(dep),
      );
      const removedDependencies = oldUserStoryData.dependencyIds.filter(
        (dep) => !userStoryData.dependencyIds.includes(dep),
      );
      const addedRequiredBy = userStoryData.requiredByIds.filter(
        (req) => !oldUserStoryData.requiredByIds.includes(req),
      );
      const removedRequiredBy = oldUserStoryData.requiredByIds.filter(
        (req) => !userStoryData.requiredByIds.includes(req),
      );

      const updateDependency = (
        userStoryId: string,
        otherUserStoryId: string,
        operation: "add" | "remove",
        field: "requiredByIds" | "dependencyIds",
      ) => {
        const updateRef = ctx.firestore
          .collection("projects")
          .doc(projectId)
          .collection("userStories")
          .doc(userStoryId);
        if (operation === "add") {
          return updateRef.update({
            [field]: FieldValue.arrayUnion(otherUserStoryId),
          });
        } else {
          return updateRef.update({
            [field]: FieldValue.arrayRemove(otherUserStoryId),
          });
        }
      };

      // Update the related user stories
      await Promise.all(
        addedDependencies.map(async (dependencyId) => {
          await updateDependency(
            dependencyId,
            userStoryId,
            "add",
            "requiredByIds",
          );
        }),
      );
      await Promise.all(
        removedDependencies.map(async (dependencyId) => {
          await updateDependency(
            dependencyId,
            userStoryId,
            "remove",
            "requiredByIds",
          );
        }),
      );
      await Promise.all(
        addedRequiredBy.map(async (requiredById) => {
          await updateDependency(
            requiredById,
            userStoryId,
            "add",
            "dependencyIds",
          );
        }),
      );
      await Promise.all(
        removedRequiredBy.map(async (requiredById) => {
          await updateDependency(
            requiredById,
            userStoryId,
            "remove",
            "dependencyIds",
          );
        }),
      );

      await userStoryRef.update(userStoryData);
      return {
        success: true,
        updatedUserStoryIds: [
          ...addedDependencies,
          ...removedDependencies,
          ...addedRequiredBy,
          ...removedRequiredBy,
        ],
      };
    }),

  modifyUserStoryTags: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userStoryId: z.string(),
        priorityId: z.string().optional(),
        size: z.string().optional(),
        statusId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, userStoryId, priorityId, size, statusId } = input;
      if (
        priorityId === undefined &&
        size === undefined &&
        statusId === undefined
      ) {
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
        statusId: statusId,
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

  generateUserStories: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        amount: z.number(),
        prompt: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, amount, prompt } = input;

      // Get the epics from the database
      const epics = await ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("epics")
        .where("deleted", "==", false)
        .get();

      let epicContext = "# EXISTING EPICS\n\n";
      epics.forEach((epic) => {
        const epicData = EpicSchema.parse(epic.data());
        epicContext += `- id: ${epic.id}\n- name: ${epicData.name}\n- description: ${epicData.description}\n\n`;
      });

      // Get the current user stories from the database (to avoid duplicates and provide context)
      const userStories = await getUserStoriesFromProject(
        ctx.firestore,
        projectId,
      );

      let userStoryContext = "# EXISTING USER STORIES\n\n";
      userStories.forEach((userStory) => {
        const userStoryData = UserStorySchema.parse(userStory);
        userStoryContext += `- id: ${userStory.id}\n- name: ${userStoryData.name}\n- description: ${userStoryData.description}\n- priorityId: ${userStoryData.priorityId}\n- tagIds: [${userStoryData.tagIds.join(" , ")}]\n- dependencies: [${userStoryData.dependencyIds.join(" , ")}]\n- requiredBy: [${userStoryData.requiredByIds.join(" , ")}]\n\n`;
      });

      const priorityContext = await collectPriorityTagContext(
        projectId,
        ctx.firestore,
      );

      const tagContext = await collectBacklogTagsContext(
        projectId,
        ctx.firestore,
      );

      const settingsRef = getProjectSettingsRef(projectId, ctx.firestore);

      // FIXME: Missing project context (currently the fruit market is hardcoded)

      const passedInPrompt =
        prompt != ""
          ? `Consider that the user wants the user stories for the following: ${prompt}`
          : "";

      const completePrompt = `
Given the following context, follow the instructions below to the best of your ability.

${epicContext}
${userStoryContext}
${priorityContext}
${tagContext}

Generate ${amount} user stories about an application for food markets. Do NOT include any identifier in the name like "User Story 1", just use a normal title.\n\n

${passedInPrompt}

`;

      const data = await askAiToGenerate(
        completePrompt,
        z.array(UserStorySchema.omit({ scrumId: true, deleted: true })),
      );

      const parsedData = await Promise.all(
        data.map(async (userStory) => {
          let priority = undefined;
          if (
            userStory.priorityId !== undefined &&
            userStory.priorityId !== ""
          ) {
            const priorityTag = await getPriorityTag(
              settingsRef,
              userStory.priorityId,
            );
            priority = priorityTag;
          }

          let epic = undefined;
          if (userStory.epicId !== undefined && userStory.epicId !== "") {
            const epicTag = await ctx.firestore
              .collection("projects")
              .doc(projectId)
              .collection("epics")
              .doc(userStory.epicId)
              .get();
            if (epicTag.exists) {
              const epicData = EpicSchema.parse(epicTag.data());
              epic = { id: epicTag.id, ...epicData };
            }
          }

          // Check the related user stories exist and are valid
          const validDependencies: string[] = [];
          await Promise.all(
            userStory.dependencyIds.map(async (dependencyId) => {
              const dependency = await ctx.firestore
                .collection("projects")
                .doc(projectId)
                .collection("userStories")
                .doc(dependencyId)
                .get();
              if (dependency.exists) {
                validDependencies.push(dependencyId);
              }
            }),
          );

          const validRequiredBy: string[] = [];
          await Promise.all(
            userStory.requiredByIds.map(async (requiredById) => {
              const requiredBy = await ctx.firestore
                .collection("projects")
                .doc(projectId)
                .collection("userStories")
                .doc(requiredById)
                .get();
              if (requiredBy.exists) {
                validRequiredBy.push(requiredById);
              }
            }),
          );

          return {
            ...userStory,
            priority,
            epic,
            dependencyIds: validDependencies,
            requiredByIds: validRequiredBy,
          };
        }),
      );

      return parsedData;
    }),
});
