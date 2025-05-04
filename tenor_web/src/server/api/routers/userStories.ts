import { z } from "zod";
import { createTRPCRouter, roleRequiredProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import {
  EpicSchema,
  RequirementSchema,
  SprintSchema,
  TagSchema,
  TaskSchema,
  UserStorySchema,
} from "~/lib/types/zodFirebaseSchema";
import type {
  UserStoryDetail,
  UserStoryPreview,
} from "~/lib/types/detailSchemas";
import { askAiToGenerate } from "~/utils/aiTools/aiGeneration";
import { FieldValue } from "firebase-admin/firestore";
import {
  collectBacklogTagsContext,
  collectPriorityTagContext,
  getBacklogTag,
  getEpic,
  getPriority,
  getProjectContextHeader,
  getSettingsRef,
  getStatusType,
  getTasksRef,
  getUserStories,
  getUserStoriesRef,
  getUserStory,
  getUserStoryDetail,
  getUserStoryNewId,
  getUserStoryRef,
  getUserStoryTable,
} from "~/utils/helpers/shortcuts";
import { backlogPermissions, tagPermissions } from "~/lib/permission";
import { UserStory, WithId } from "~/lib/types/firebaseSchemas";
import { UserStoryCol } from "~/lib/types/columnTypes";

export const userStoriesRouter = createTRPCRouter({
  /**
   * @function getUserStories
   * @description Retrieves all user stories for a given project.
   * @param {string} projectId - The ID of the project to retrieve user stories for.
   * @returns {Promise<WithId<UserStory>[]>} - A promise that resolves to an array of user stories.
   */
  getUserStories: roleRequiredProcedure(backlogPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      return await getUserStories(ctx.firestore, projectId);
    }),
  /**
   * @function getUserStoryTable
   * @description Retrieves a table of user stories for a given project.
   * @param {string} projectId - The ID of the project to retrieve user stories for.
   * @returns {Promise<UserStoryCol[]>} - A promise that resolves to an array of user stories.
   */
  getUserStoryTable: roleRequiredProcedure(backlogPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      return await getUserStoryTable(ctx.firestore, projectId);
    }),

  /**
   * @function getUserStoryDetail
   * @description Retrieves detailed information about a specific user story.
   * @param {string} projectId - The ID of the project to which the user story belongs.
   * @param {string} userStoryId - The ID of the user story to retrieve.
   * @returns {Promise<UserStoryDetail>} - A promise that resolves to the detailed user story information.
   */
  getUserStoryDetail: roleRequiredProcedure(backlogPermissions, "read")
    .input(z.object({ userStoryId: z.string(), projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await getUserStoryDetail(
        ctx.firestore,
        input.projectId,
        input.userStoryId,
      );
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
        epicData = await getEpic(
          ctx.firestore,
          projectId,
          userStoryData.epicId,
        );
      }

      let priorityTag = undefined;
      if (userStoryData.priorityId !== undefined) {
        priorityTag = await getPriority(
          ctx.firestore,
          projectId,
          userStoryData.priorityId!,
        );
      }

      let statusTag = undefined;
      if (userStoryData.statusId !== undefined) {
        statusTag = await getStatusType(
          ctx.firestore,
          projectId,
          userStoryData.statusId!,
        );
      }

      const tags = await Promise.all(
        userStoryData.tagIds.map(async (tagId) => {
          return await getBacklogTag(ctx.firestore, projectId, tagId);
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
        status: statusTag,
        priority: priorityTag,
        dependencies: dependencies,
        requiredBy: requiredBy,
        tasks: filteredTasks,
        sprint,
      } as UserStoryDetail;
    }),

  /**
   * @function createUserStory
   * @description Creates a new user story or modifies an existing one.
   * @param {UserStorySchema} userStoryData - The data for the user story to create or modify.
   * @param {string} projectId - The ID of the project to which the user story belongs.
   * @param {string} [userStoryId] - The ID of the user story to modify (optional).
   * @returns {Promise<WithId<UserStory>>} - A promise that resolves to the created or modified user story.
   */
  createUserStory: roleRequiredProcedure(backlogPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        userStoryData: UserStorySchema.omit({ scrumId: true }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { projectId, userStoryData: userStoryDataRaw } = input;
        const userStoryData = UserStorySchema.parse({
          ...userStoryDataRaw,
          scrumId: await getUserStoryNewId(ctx.firestore, projectId),
        });
        const userStory = await getUserStoriesRef(ctx.firestore, projectId).add(
          userStoryData,
        );

        // Add dependency references
        await Promise.all(
          input.userStoryData.dependencyIds.map(async (dependencyId) => {
            await getUserStoryRef(
              ctx.firestore,
              projectId,
              dependencyId,
            ).update({ requiredByIds: FieldValue.arrayUnion(userStory.id) });
          }),
        );
        // Add requiredBy references
        await Promise.all(
          input.userStoryData.requiredByIds.map(async (requiredById) => {
            await getUserStoryRef(
              ctx.firestore,
              projectId,
              requiredById,
            ).update({ dependencyIds: FieldValue.arrayUnion(userStory.id) });
          }),
        );

        return {
          id: userStory.id,
          ...userStoryData,
        } as WithId<UserStory>;
      } catch (err) {
        console.log("Error creating user story:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
  /**
   * @function modifyUserStory
   * @description Modifies an existing user story.
   * @param {string} projectId - The ID of the project to which the user story belongs.
   * @param {string} userStoryId - The ID of the user story to modify.
   * @param {UserStorySchema} userStoryData - The data for the user story to modify.
   * @returns {Promise<{ success: boolean, updatedUserStoryIds: string[] }>} - A promise that resolves to an object indicating success and the IDs of updated user stories.
   */
  modifyUserStory: roleRequiredProcedure(backlogPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        userStoryId: z.string(),
        userStoryData: UserStorySchema.omit({ scrumId: true, deleted: true }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, userStoryId, userStoryData } = input;
      const oldUserStoryData = await getUserStory(
        ctx.firestore,
        projectId,
        userStoryId,
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
        const updateRef = getUserStoryRef(
          ctx.firestore,
          projectId,
          userStoryId,
        );
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

      await getUserStoryRef(ctx.firestore, projectId, userStoryId).update(
        userStoryData,
      );
      return {
        updatedUserStoryIds: [
          ...addedDependencies,
          ...removedDependencies,
          ...addedRequiredBy,
          ...removedRequiredBy,
        ],
      };
    }),
  /**
   * @function deleteUserStory
   * @description Deletes a user story by marking it as deleted.
   * @param {string} projectId - The ID of the project to which the user story belongs.
   * @param {string} userStoryId - The ID of the user story to delete.
   */
  deleteUserStory: roleRequiredProcedure(backlogPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        userStoryId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, userStoryId } = input;
      const userStoryRef = getUserStoryRef(
        ctx.firestore,
        projectId,
        userStoryId,
      );
      await userStoryRef.update({ deleted: true });

      const tasksSnapshot = await getTasksRef(ctx.firestore, projectId)
        .where("deleted", "==", false)
        .where("itemType", "==", "US")
        .where("itemId", "==", userStoryId)
        .get();

      // NOTE: This is a batch operation, so it will not be atomic. If one of the updates fails, the others will still be applied.
      const batch = ctx.firestore.batch();
      tasksSnapshot.docs.forEach((task) => {
        batch.update(task.ref, { deleted: true });
      });
      await batch.commit();
    }),
  /**
   * @function modifyUserStoryTags
   * @description Modifies the tags of an existing user story.
   * @param {string} projectId - The ID of the project to which the user story belongs.
   * @param {string} userStoryId - The ID of the user story to modify.
   * @param {string} [priorityId] - The ID of the priority tag to set (optional).
   * @param {string} [size] - The size of the user story (optional).
   * @param {string} [statusId] - The ID of the status tag to set (optional).
   */
  modifyUserStoryTags: roleRequiredProcedure(tagPermissions, "write")
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

      const userStoryRef = getUserStoryRef(
        ctx.firestore,
        projectId,
        userStoryId,
      );
      const userStorySnapshot = await userStoryRef.get();
      if (!userStorySnapshot.exists) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await userStoryRef.update({
        priorityId: priorityId,
        size: size,
        statusId: statusId,
      });
    }),
  generateUserStories: roleRequiredProcedure(backlogPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        amount: z.number(),
        prompt: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, amount, prompt } = input;

      const requirements = await ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("requirements")
        .where("deleted", "==", false)
        .get();

      let requirementsContext = "# EXISTING REQUIREMENTS\n\n";
      requirements.forEach((requirement) => {
        const requirementData = RequirementSchema.parse(requirement.data());
        requirementsContext += `- id: ${requirement.id}\n- name: ${requirementData.name}\n- description: ${requirementData.description}\n- priorityId: ${requirementData.priorityId}\n\n`;
      });

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
      const userStories = await getUserStories(ctx.firestore, projectId);

      let userStoryContext = "# EXISTING USER STORIES\n\n";
      userStories.forEach((userStory) => {
        const userStoryData = UserStorySchema.parse(userStory);
        userStoryContext += `- id: ${userStory.id}\n- name: ${userStoryData.name}\n- description: ${userStoryData.description}\n- priorityId: ${userStoryData.priorityId}\n- tagIds: [${userStoryData.tagIds.join(" , ")}]\n- dependencies: [${userStoryData.dependencyIds.join(" , ")}]\n- requiredBy: [${userStoryData.requiredByIds.join(" , ")}]\n\n`;
      });

      const priorityContext = await collectPriorityTagContext(
        ctx.firestore,
        projectId,
      );

      const tagContext = await collectBacklogTagsContext(
        projectId,
        ctx.firestore,
      );

      const settingsRef = getSettingsRef(ctx.firestore, projectId);

      // FIXME: Missing project context (currently the fruit market is hardcoded)

      const passedInPrompt =
        prompt != ""
          ? `Consider that the user wants the user stories for the following: ${prompt}`
          : "";

      const completePrompt = `
${await getProjectContextHeader(ctx.firestore, projectId)}

Given the following context, follow the instructions below to the best of your ability.

${requirementsContext}
${epicContext}
${userStoryContext}
${priorityContext}
${tagContext}

Generate ${amount} user stories for the mentioned software project. Do NOT include any identifier in the name like "User Story 1", just use a normal title.\n\n

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
            const priorityTag = await getPriority(
              ctx.firestore,
              projectId,
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
          const dependencies = (
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
                  const dependencyData = UserStorySchema.parse(
                    dependency.data(),
                  );
                  return {
                    id: dependency.id,
                    name: dependencyData.name,
                    scrumId: dependencyData.scrumId,
                  };
                }
                return undefined;
              }),
            )
          ).filter((dep) => dep !== undefined);

          const validRequiredBy: string[] = [];
          const requiredBy = (
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
                  const requiredByData = UserStorySchema.parse(
                    requiredBy.data(),
                  );
                  return {
                    id: requiredBy.id,
                    name: requiredByData.name,
                    scrumId: requiredByData.scrumId,
                  };
                }
                return undefined;
              }),
            )
          ).filter((req) => req !== undefined);

          const tags = (
            await Promise.all(
              userStory.tagIds.map(async (tagId) => {
                const tag = await settingsRef
                  .collection("backlogTags")
                  .doc(tagId)
                  .get();
                if (tag.exists) {
                  const tagData = TagSchema.parse(tag.data());
                  return { id: tag.id, ...tagData };
                }
                return undefined;
              }),
            )
          ).filter((tag) => tag !== undefined);

          return {
            name: userStory.name,
            description: userStory.description,
            acceptanceCriteria: userStory.acceptanceCriteria,
            epic: epic,
            size: userStory.size,
            tags: tags,
            priority: priority,
            dependencies: dependencies as UserStoryPreview[],
            requiredBy: requiredBy as UserStoryPreview[],
          } as UserStoryDetail;
        }),
      );

      return parsedData;
    }),
});
