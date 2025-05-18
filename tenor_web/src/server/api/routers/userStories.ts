/**
 * User Stories Router - Tenor API Endpoints for User Story Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing User Stories in the Tenor application.
 * It provides endpoints to create, modify, and retrieve user stories.
 *
 * @category API
 */
import { z } from "zod";
import { createTRPCRouter, roleRequiredProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { UserStorySchema } from "~/lib/types/zodFirebaseSchema";
import type {
  UserStoryDetail,
  UserStoryPreview,
} from "~/lib/types/detailSchemas";
import { askAiToGenerate } from "~/utils/aiTools/aiGeneration";
import { FieldValue } from "firebase-admin/firestore";
import { backlogPermissions, tagPermissions } from "~/lib/permission";
import type { Tag, UserStory, WithId } from "~/lib/types/firebaseSchemas";
import {
  getUserStories,
  getUserStoriesRef,
  getUserStory,
  getUserStoryContext,
  getUserStoryDetail,
  getUserStoryNewId,
  getUserStoryRef,
  getUserStoryTable,
  hasDependencyCycle,
  updateDependency,
} from "~/utils/helpers/shortcuts/userStories";
import { getEpic } from "~/utils/helpers/shortcuts/epics";
import { getBacklogTag, getPriority } from "~/utils/helpers/shortcuts/tags";
import { getTasksRef } from "~/utils/helpers/shortcuts/tasks";
import { type Edge, type Node } from "@xyflow/react";

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
      const { userStoryId, projectId } = input;
      return await getUserStoryDetail(ctx.firestore, projectId, userStoryId);
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

        const hasCycle = await hasDependencyCycle(ctx.firestore, projectId, [
          {
            id: "this is a new user story", // id to avoid collision
            dependencyIds: userStoryData.dependencyIds,
          },
        ]);
        if (hasCycle) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cyclic dependency detected.",
          });
        }

        const userStory = await getUserStoriesRef(ctx.firestore, projectId).add(
          userStoryData,
        );

        // TODO: Implement dependency check to prevent cyclic dependencies. Maybe only allow adding dependencies 1 by 1
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

      // Since one change is made at a time one these (thanks for that UI),
      // we only check if there's a cycle by adding the new dependencies (which are also the same as inverted requiredBy)
      const newDependencies = [
        ...addedDependencies.flatMap((dep) => [
          { sourceId: userStoryId, targetId: dep },
        ]),
        ...addedRequiredBy.flatMap((req) => [
          { sourceId: req, targetId: userStoryId },
        ]),
      ];
      const hasCycle = await hasDependencyCycle(
        ctx.firestore,
        projectId,
        undefined,
        newDependencies,
      );
      if (hasCycle) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cyclic dependency detected.",
        });
      }

      // Update the related user stories
      await Promise.all(
        addedDependencies.map(async (dependencyId) => {
          await updateDependency(
            ctx.firestore,
            projectId,
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
            ctx.firestore,
            projectId,
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
            ctx.firestore,
            projectId,
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
            ctx.firestore,
            projectId,
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

      // Get the user story to get its dependencies and required by relationships
      const userStory = await getUserStory(
        ctx.firestore,
        projectId,
        userStoryId,
      );

      const modifiedUserStories = userStory.dependencyIds.concat(
        userStory.requiredByIds,
        userStoryId,
      );

      // Remove this user story from all dependencies' requiredBy arrays
      await Promise.all(
        userStory.dependencyIds.map(async (dependencyId) => {
          await updateDependency(
            ctx.firestore,
            projectId,
            dependencyId,
            userStoryId,
            "remove",
            "requiredByIds",
          );
        }),
      );

      // Remove this user story from all requiredBy's dependency arrays
      await Promise.all(
        userStory.requiredByIds.map(async (requiredById) => {
          await updateDependency(
            ctx.firestore,
            projectId,
            requiredById,
            userStoryId,
            "remove",
            "dependencyIds",
          );
        }),
      );

      // Mark the user story as deleted
      await userStoryRef.update({ deleted: true });

      // Delete associated tasks
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

      return {
        success: true,
        updatedUserStoryIds: modifiedUserStories,
      };
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
  /**
   * @function generateUserStories
   * @description Generates user stories using AI based on a given prompt.
   * @param {string} projectId - The ID of the project to which the user stories belong.
   * @param {number} amount - The number of user stories to generate.
   * @param {string} prompt - The prompt to use for generating user stories.
   * @returns {Promise<WithId<UserStoryDetail>[]>} - A promise that resolves to an array of generated user stories.
   */
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

      const completePrompt = await getUserStoryContext(
        ctx.firestore,
        projectId,
        amount,
        prompt,
      );

      const data = await askAiToGenerate(
        completePrompt,
        z.array(UserStorySchema.omit({ scrumId: true, deleted: true })),
      );

      const parsedData: UserStoryDetail[] = await Promise.all(
        data.map(async (userStory) => {
          const priority = userStory.priorityId
            ? await getPriority(ctx.firestore, projectId, userStory.priorityId)
            : undefined;

          const epic = userStory.epicId
            ? await getEpic(ctx.firestore, projectId, userStory.epicId)
            : undefined;

          // Check the related user stories exist and are valid
          const dependencies: WithId<UserStoryPreview>[] = (
            await Promise.all(
              userStory.dependencyIds.map(async (dependencyId) => {
                try {
                  return await getUserStory(
                    ctx.firestore,
                    projectId,
                    dependencyId,
                  );
                } catch (error) {
                  console.error(
                    "Error fetching dependencyId user story:",
                    error,
                  );
                  return undefined;
                }
              }),
            )
          ).filter((dep) => dep !== undefined);

          const requiredBy: WithId<UserStoryPreview>[] = (
            await Promise.all(
              userStory.requiredByIds.map(async (requiredById) => {
                try {
                  return await getUserStory(
                    ctx.firestore,
                    projectId,
                    requiredById,
                  );
                } catch (error) {
                  console.error("Error fetching requiredBy user story:", error);
                  return undefined;
                }
              }),
            )
          ).filter((req) => req !== undefined);

          const tags: WithId<Tag>[] = (
            await Promise.all(
              userStory.tagIds.map(async (tagId) => {
                try {
                  return await getBacklogTag(ctx.firestore, projectId, tagId);
                } catch (error) {
                  console.error("Error fetching tag:", error);
                  return undefined;
                }
              }),
            )
          ).filter((tag) => tag !== undefined);

          const newUserStory: UserStoryDetail = {
            id: crypto.randomUUID(),
            ...userStory,
            requiredBy,
            dependencies,
            epic,
            priority,
            scrumId: 0,
            tags,
          };

          return newUserStory;
        }),
      );

      return parsedData;
    }),

  /**
   * @function updateUserStoryDependencies
   * @description Updates the dependency relationship between two user stories.
   * @param {string} projectId - The ID of the project to which the user stories belong.
   * @param {string} sourceId - The ID of the user story that will depend on the target.
   * @param {string} targetId - The ID of the user story that will be a dependency.
   * @returns {Promise<{ success: boolean }>} - A promise that resolves when the update is complete.
   */
  addUserStoryDependencies: roleRequiredProcedure(backlogPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        sourceId: z.string(),
        targetId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, sourceId, targetId } = input;

      const hasCycle = await hasDependencyCycle(
        ctx.firestore,
        projectId,
        undefined,
        [{ sourceId, targetId }],
      );
      if (hasCycle) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cyclic dependency detected.",
        });
      }

      await updateDependency(
        ctx.firestore,
        projectId,
        sourceId,
        targetId,
        "add",
        "dependencyIds",
      );
      await updateDependency(
        ctx.firestore,
        projectId,
        targetId,
        sourceId,
        "add",
        "requiredByIds",
      );
      return { success: true };
    }),

  /**
   * @function deleteUserStoryDependencies
   * @description Updates the dependency relationship by removing a dependency between two user stories.
   * @param {string} projectId - The ID of the project to which the user stories belong.
   * @param {string} sourceId - The ID of the user story that will no longer depend on the target.
   * @param {string} targetId - The ID of the user story that will no longer be a dependency.
   * @returns {Promise<{ success: boolean }>} - A promise that resolves when the update is complete.
   */
  deleteUserStoryDependencies: roleRequiredProcedure(
    backlogPermissions,
    "write",
  )
    .input(
      z.object({
        projectId: z.string(),
        sourceId: z.string(),
        targetId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, sourceId, targetId } = input;
      await updateDependency(
        ctx.firestore,
        projectId,
        sourceId,
        targetId,
        "remove",
        "dependencyIds",
      );
      await updateDependency(
        ctx.firestore,
        projectId,
        targetId,
        sourceId,
        "remove",
        "requiredByIds",
      );
      return { success: true };
    }),

  getUserStoryDependencies: roleRequiredProcedure(backlogPermissions, "read")
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      const userStories = await getUserStories(ctx.firestore, projectId);

      // Create nodes for each user story with a grid layout
      const nodes: Node[] = userStories.map((userStory) => {
        return {
          id: userStory.id,
          position: {
            x: 0,
            y: -100,
          }, // Position is updated in the frontend because it needs nodes' real size
          data: {
            id: userStory.id,
            title: userStory.name,
            scrumId: userStory.scrumId,
            itemType: "US",
            showDeleteButton: true,
            showEditButton: true,
            collapsible: false,
          }, // See BasicNodeData for properties
          type: "basic", // see nodeTypes
          deletable: false,
        };
      });

      // Create edges for dependencies
      const edges: Edge[] = userStories.flatMap((userStory) =>
        userStory.dependencyIds.map((dependencyId) => ({
          id: `${userStory.id}-${dependencyId}`,
          source: userStory.id,
          target: dependencyId,
          type: "dependency", // see edgeTypes
        })),
      );

      return { nodes, edges };
    }),
});
