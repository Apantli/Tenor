/**
 * User Stories Router - Tenor API Endpoints for User Story Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing User Stories in the Tenor application.
 * It provides endpoints to create, modify, and retrieve user stories.
 *
 * The router includes procedures for:
 * - Creating and managing user stories
 * - Retrieving user story details and dependencies
 * - Adding and removing story dependencies
 * - Generating AI-assisted acceptance criteria
 *
 * @category API
 */
import { z } from "zod";
import {
  createTRPCRouter,
  roleRequiredProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { UserStorySchema } from "~/lib/types/zodFirebaseSchema";
import type {
  UserStoryDetail,
  UserStoryPreview,
} from "~/lib/types/detailSchemas";
import { askAiToGenerate } from "~/lib/aiTools/aiGeneration";
import { FieldValue } from "firebase-admin/firestore";
import {
  backlogPermissions,
  tagPermissions,
  userStoryPreviewsPermissions,
} from "~/lib/defaultValues/permission";
import type { Tag, UserStory, WithId } from "~/lib/types/firebaseSchemas";
import {
  deleteUserStoryAndGetModified,
  getUserStories,
  getUserStoriesRef,
  getUserStory,
  getUserStoryContext,
  getUserStoryDetail,
  getUserStoryRef,
  getUserStoryTable,
  hasDependencyCycle,
  updateDependency,
} from "../shortcuts/userStories";
import { getEpic } from "../shortcuts/epics";
import { getBacklogTag, getPriorityByNameOrId } from "../shortcuts/tags";
import type { Edge, Node } from "@xyflow/react";
import { LogProjectActivity } from "~/server/api/lib/projectEventLogger";
import { getSprintRef } from "../shortcuts/sprints";
import { badRequest, cyclicReference, notFound } from "~/server/errors";

/**
 * Retrieves all user stories for a given project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project to retrieve user stories for
 *
 * @returns Array of user story objects
 *
 * @http GET /api/trpc/userStories.getUserStories
 */
export const getUserStoriesProcedure = roleRequiredProcedure(
  userStoryPreviewsPermissions,
  "read",
)
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    return await getUserStories(ctx.firestore, projectId);
  });

/**
 * Retrieves a table of user stories for a given project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project to retrieve user stories for
 *
 * @returns Array of user story objects formatted as a table
 *
 * @http GET /api/trpc/userStories.getUserStoryTable
 */
export const getUserStoryTableProcedure = roleRequiredProcedure(
  backlogPermissions,
  "read",
)
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    return await getUserStoryTable(ctx.firestore, projectId);
  });

/**
 * Retrieves detailed information about a specific user story.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project to which the user story belongs
 * - userStoryId - String ID of the user story to retrieve
 *
 * @returns Detailed user story information
 *
 * @http GET /api/trpc/userStories.getUserStoryDetail
 */
export const getUserStoryDetailProcedure = roleRequiredProcedure(
  backlogPermissions,
  "read",
)
  .input(z.object({ userStoryId: z.string(), projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { userStoryId, projectId } = input;
    return await getUserStoryDetail(
      ctx.firebaseAdmin.app(),
      ctx.firestore,
      projectId,
      userStoryId,
    );
  });

/**
 * Creates a new user story or modifies an existing one.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project to which the user story belongs
 * - userStoryData - UserStorySchema object containing the data for the user story
 *
 * @returns The created or modified user story
 *
 * @http POST /api/trpc/userStories.createUserStory
 */
export const createUserStoryProcedure = roleRequiredProcedure(
  backlogPermissions,
  "write",
)
  .input(
    z.object({
      projectId: z.string(),
      userStoryData: UserStorySchema.omit({ scrumId: true }),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, userStoryData: userStoryDataRaw } = input;

    const hasCycle = await hasDependencyCycle(
      ctx.firestore,
      projectId,
      // new user story
      [
        {
          id: "this is a new user story", // id to avoid collision
          dependencyIds: userStoryDataRaw.dependencyIds,
        },
      ],
      // required by dependencies
      [
        ...userStoryDataRaw.requiredByIds.map((dependencyId) => ({
          parentUsId: dependencyId,
          dependencyUsId: "this is a new user story",
        })),
      ],
    );

    if (hasCycle) {
      throw cyclicReference();
    }

    const { userStoryData, id: newUserStoryId } =
      await ctx.firestore.runTransaction(async (transaction) => {
        const userStoriesRef = getUserStoriesRef(ctx.firestore, projectId);

        const userStoryCount = await transaction.get(userStoriesRef.count());

        const userStoryData = UserStorySchema.parse({
          ...userStoryDataRaw,
          scrumId: userStoryCount.data().count + 1,
        });
        const docRef = userStoriesRef.doc();

        transaction.create(docRef, userStoryData);

        return {
          userStoryData,
          id: docRef.id,
        };
      });

    // Add dependency references
    await Promise.all(
      input.userStoryData.dependencyIds.map(async (dependencyId) => {
        await getUserStoryRef(ctx.firestore, projectId, dependencyId).update({
          requiredByIds: FieldValue.arrayUnion(newUserStoryId),
        });
      }),
    );
    // Add requiredBy references
    await Promise.all(
      input.userStoryData.requiredByIds.map(async (requiredById) => {
        await getUserStoryRef(ctx.firestore, projectId, requiredById).update({
          dependencyIds: FieldValue.arrayUnion(newUserStoryId),
        });
      }),
    );

    // Add to sprint if it is assigned to one
    if (userStoryData.sprintId && userStoryData.sprintId !== "") {
      const sprintRef = getSprintRef(
        ctx.firestore,
        projectId,
        userStoryData.sprintId,
      );
      await sprintRef.update({
        userStoryIds: FieldValue.arrayUnion(newUserStoryId),
      });
    }

    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: newUserStoryId,
      type: "US",
      action: "create",
    });

    return {
      id: newUserStoryId,
      ...userStoryData,
    } as WithId<UserStory>;
  });

/**
 * Modifies an existing user story.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project to which the user story belongs
 * - userStoryId - String ID of the user story to modify
 * - userStoryData - UserStorySchema object containing the data for the user story
 *
 * @returns Object indicating success and the IDs of updated user stories
 *
 * @http PATCH /api/trpc/userStories.modifyUserStory
 */
export const modifyUserStoryProcedure = roleRequiredProcedure(
  backlogPermissions,
  "write",
)
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

    if (userStoryData.statusId === "awaits_review") {
      throw badRequest("User stories can't have that status");
    }

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
        { parentUsId: userStoryId, dependencyUsId: dep },
      ]),
      ...addedRequiredBy.flatMap((req) => [
        { parentUsId: req, dependencyUsId: userStoryId },
      ]),
    ];
    let hasCycle = false;
    if (newDependencies.length > 0) {
      hasCycle = await hasDependencyCycle(
        ctx.firestore,
        projectId,
        undefined,
        newDependencies,
      );
    }
    if (hasCycle) {
      throw cyclicReference();
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

    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: userStoryId,
      type: "US",
      action: "update",
    });

    return {
      updatedUserStoryIds: [
        ...addedDependencies,
        ...removedDependencies,
        ...addedRequiredBy,
        ...removedRequiredBy,
      ],
    };
  });

/**
 * Deletes a user story by marking it as deleted.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project to which the user story belongs
 * - userStoryId - String ID of the user story to delete
 *
 * @returns Object indicating success and the IDs of updated user stories
 *
 * @http DELETE /api/trpc/userStories.deleteUserStory
 */
export const deleteUserStoryProcedure = roleRequiredProcedure(
  backlogPermissions,
  "write",
)
  .input(
    z.object({
      projectId: z.string(),
      userStoryId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, userStoryId } = input;
    const { modifiedUserStories, modifiedTasks } =
      await deleteUserStoryAndGetModified(
        ctx.firestore,
        projectId,
        userStoryId,
      );

    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: userStoryId,
      type: "US",
      action: "delete",
    });

    return {
      success: true,
      updatedUserStoryIds: modifiedUserStories,
      modifiedTaskIds: modifiedTasks,
    };
  });

/**
 * Deletes multiple user stories by marking them as deleted.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - userStoryIds - Array of String IDs of the user stories to delete
 *
 * @returns Object indicating success and the IDs of updated user stories
 *
 * @http DELETE /api/trpc/userStories.deleteUserStories
 */
export const deleteUserStoriesProcedure = roleRequiredProcedure(
  backlogPermissions,
  "write",
)
  .input(
    z.object({
      projectId: z.string(),
      userStoryIds: z.array(z.string()),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, userStoryIds } = input;

    const allModifiedUserStoryIds = new Set<string>();
    const allModifiedTaskIds = new Set<string>();

    await Promise.all(
      userStoryIds.map(async (userStoryId) => {
        const { modifiedUserStories, modifiedTasks } =
          await deleteUserStoryAndGetModified(
            ctx.firestore,
            projectId,
            userStoryId,
          );
        modifiedUserStories.forEach((id) => allModifiedUserStoryIds.add(id));
        modifiedTasks.forEach((id) => allModifiedTaskIds.add(id));
      }),
    );

    return {
      success: true,
      updatedUserStoryIds: Array.from(allModifiedUserStoryIds),
      modifiedTaskIds: Array.from(allModifiedTaskIds),
    };
  });

/**
 * Modifies the tags of an existing user story.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project to which the user story belongs
 * - userStoryId - String ID of the user story to modify
 * - priorityId - String ID of the priority tag to set (optional)
 * - size - String size of the user story (optional)
 * - statusId - String ID of the status tag to set (optional)
 *
 * @http PATCH /api/trpc/userStories.modifyUserStoryTags
 */
export const modifyUserStoryTagsProcedure = roleRequiredProcedure(
  tagPermissions,
  "write",
)
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

    if (statusId === "awaits_review") {
      throw badRequest("User stories can't have that status");
    }

    const userStoryRef = getUserStoryRef(ctx.firestore, projectId, userStoryId);
    const userStorySnapshot = await userStoryRef.get();
    if (!userStorySnapshot.exists) {
      throw notFound("User Story");
    }

    await userStoryRef.update({
      priorityId: priorityId,
      size: size,
      statusId: statusId,
    });

    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: userStoryId,
      type: "US",
      action: "update",
    });
  });

/**
 * Generates user stories using AI based on a given prompt.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project to which the user stories belong
 * - amount - Number of user stories to generate
 * - prompt - String prompt to use for generating user stories
 *
 * @returns Array of generated user stories
 *
 * @http POST /api/trpc/userStories.generateUserStories
 */
export const generateUserStoriesProcedure = roleRequiredProcedure(
  backlogPermissions,
  "write",
)
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
          ? await getPriorityByNameOrId(
              ctx.firestore,
              projectId,
              userStory.priorityId, // Assuming priorityId is either a name or an ID
            )
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
                console.error("Error fetching dependencyId user story:", error);
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
          scrumId: -1,
          tags,
        };

        return newUserStory;
      }),
    );

    // Check if there is a cycle with the generated user stories
    const hasCycle = await hasDependencyCycle(
      ctx.firestore,
      projectId,
      parsedData.map((userStory) => ({
        id: "temp" + userStory.id, // add temp to avoid collision, just in case
        dependencyIds: userStory.dependencies.map((dep) => dep.id),
        requiredByIds: userStory.requiredBy.map((req) => req.id),
      })),
    );

    if (hasCycle) {
      const parsedDataWithoutDependencies = parsedData.map((userStory) => ({
        ...userStory,
        dependencies: [],
        requiredBy: [],
      }));
      return parsedDataWithoutDependencies;
    }

    return parsedData;
  });

/**
 * Retrieves the number of user stories inside a given project, regardless of their deleted status.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns Number of user stories in the project
 *
 * @http GET /api/trpc/userStories.getUserStoryCount
 */
export const getUserStoryCountProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    const userStoriesRef = getUserStoriesRef(ctx.firestore, projectId);
    const countSnapshot = await userStoriesRef.count().get();
    return countSnapshot.data().count;
  });

/**
 * Updates the dependency relationship between two user stories.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project to which the user stories belong
 * - dependencyUsId - String ID of the user story that will be a dependency
 * - parentUsId - String ID of the user story that will depend on the target
 *
 * @returns Object indicating success
 *
 * @http POST /api/trpc/userStories.addUserStoryDependencies
 */
export const addUserStoryDependenciesProcedure = roleRequiredProcedure(
  backlogPermissions,
  "write",
)
  .input(
    z.object({
      projectId: z.string(),
      dependencyUsId: z.string(),
      parentUsId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, dependencyUsId, parentUsId } = input;

    const hasCycle = await hasDependencyCycle(
      ctx.firestore,
      projectId,
      undefined,
      [{ parentUsId, dependencyUsId }],
    );

    if (hasCycle) {
      throw cyclicReference();
    }

    await updateDependency(
      ctx.firestore,
      projectId,
      parentUsId,
      dependencyUsId,
      "add",
      "dependencyIds",
    );
    await updateDependency(
      ctx.firestore,
      projectId,
      dependencyUsId,
      parentUsId,
      "add",
      "requiredByIds",
    );

    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: dependencyUsId,
      type: "US",
      action: "update",
    });
    return { success: true };
  });

/**
 * Updates the dependency relationship by removing a dependency between two user stories.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project to which the user stories belong
 * - parentUsId - String ID of the user story that will no longer depend on the target
 * - dependencyUsId - String ID of the user story that will no longer be a dependency
 *
 * @returns Object indicating success
 *
 * @http DELETE /api/trpc/userStories.deleteUserStoryDependencies
 */
export const deleteUserStoryDependenciesProcedure = roleRequiredProcedure(
  backlogPermissions,
  "write",
)
  .input(
    z.object({
      projectId: z.string(),
      parentUsId: z.string(),
      dependencyUsId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, parentUsId, dependencyUsId } = input;
    await updateDependency(
      ctx.firestore,
      projectId,
      parentUsId,
      dependencyUsId,
      "remove",
      "dependencyIds",
    );
    await updateDependency(
      ctx.firestore,
      projectId,
      dependencyUsId,
      parentUsId,
      "remove",
      "requiredByIds",
    );

    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: dependencyUsId,
      type: "US",
      action: "delete",
    });

    return { success: true };
  });

export const getUserStoryDependencies = roleRequiredProcedure(
  backlogPermissions,
  "read",
)
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
        id: `${dependencyId}-${userStory.id}`,
        source: dependencyId,
        target: userStory.id,
        type: "dependency", // see edgeTypes
      })),
    );

    return { nodes, edges };
  });

export const userStoriesRouter = createTRPCRouter({
  getUserStories: getUserStoriesProcedure,
  getUserStoryTable: getUserStoryTableProcedure,
  getUserStoryDetail: getUserStoryDetailProcedure,
  createUserStory: createUserStoryProcedure,
  modifyUserStory: modifyUserStoryProcedure,
  deleteUserStory: deleteUserStoryProcedure,
  deleteUserStories: deleteUserStoriesProcedure,
  modifyUserStoryTags: modifyUserStoryTagsProcedure,
  generateUserStories: generateUserStoriesProcedure,
  getUserStoryCount: getUserStoryCountProcedure,
  addUserStoryDependencies: addUserStoryDependenciesProcedure,
  deleteUserStoryDependencies: deleteUserStoryDependenciesProcedure,
  getUserStoryDependencies,
});
