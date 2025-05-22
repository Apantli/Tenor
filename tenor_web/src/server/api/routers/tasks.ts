/**
 * Tasks - Tenor API Endpoints for Task Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing Tasks in the Tenor application.
 * It provides endpoints to create, modify, and retrieve tasks.
 *
 * @category API
 */

import { z } from "zod";
import type { StatusTag, Task, WithId } from "~/lib/types/firebaseSchemas";
import {
  createTRPCRouter,
  protectedProcedure,
  roleRequiredProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { BacklogItemSchema, TaskSchema } from "~/lib/types/zodFirebaseSchema";
import { askAiToGenerate } from "~/utils/aiTools/aiGeneration";
import {
  getTask,
  getTaskContextFromItem,
  getTaskDetail,
  getTaskNewId,
  getTaskRef,
  getTasks,
  getTasksRef,
  getTaskTable,
  hasDependencyCycle,
  updateDependency,
} from "~/utils/helpers/shortcuts/tasks";
import {
  generateTaskContext,
  getGenericBacklogItemContext,
} from "~/utils/helpers/shortcuts/general";
import {
  getBacklogTagsContext,
  getTodoStatusTag,
} from "~/utils/helpers/shortcuts/tags";
import { getUserStoryContextSolo } from "~/utils/helpers/shortcuts/userStories";
import { getIssueContextSolo } from "~/utils/helpers/shortcuts/issues";
import { backlogPermissions, taskPermissions } from "~/lib/permission";
import { FieldValue } from "firebase-admin/firestore";
import type { Edge, Node } from "@xyflow/react";

export const tasksRouter = createTRPCRouter({
  getTasks: roleRequiredProcedure(backlogPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      return await getTasks(ctx.firestore, projectId);
    }),
  /**
   * @procedure createTask
   * @description Creates a new task in the specified project and assigns it a scrumId
   * @input {object} input - Input parameters
   * @input {string} input.projectId - The ID of the project
   * @input {object} input.taskData - The task data without scrumId
   * @returns {object} Object with success status and the created task ID
   * @throws {TRPCError} If there's an error creating the task
   */
  createTask: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        taskData: TaskSchema.omit({ scrumId: true }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, taskData: taskDataRaw } = input;
      const taskData = TaskSchema.parse({
        ...taskDataRaw,
        scrumId: await getTaskNewId(ctx.firestore, projectId),
      });

      // const hasCycle = await hasDependencyCycle(ctx.firestore, projectId, [
      //   {
      //     id: "this is a new user story", // id to avoid collision
      //     dependencyIds: taskData.dependencyIds,
      //   },
      // ]);

      // if (hasCycle) {
      //   throw new TRPCError({
      //     code: "BAD_REQUEST",
      //     message: "Circular dependency detected.",
      //   });
      // }

      const task = await getTasksRef(ctx.firestore, projectId).add(taskData);

      // Add dependency references
      await Promise.all(
        input.taskData.dependencyIds.map(async (dependencyId) => {
          await getTaskRef(ctx.firestore, projectId, dependencyId).update({
            requiredByIds: FieldValue.arrayUnion(task.id),
          });
        }),
      );
      // Add requiredBy references
      await Promise.all(
        input.taskData.requiredByIds.map(async (requiredById) => {
          await getTaskRef(ctx.firestore, projectId, requiredById).update({
            dependencyIds: FieldValue.arrayUnion(task.id),
          });
        }),
      );

      return {
        id: task.id,
        ...taskData,
      } as WithId<Task>;
    }),

  /**
   * @procedure getTasksTableFriendly
   * @description Gets tasks for a specific item in a table-friendly format
   * @input {object} input - Input parameters
   * @input {string} input.projectId - The ID of the project
   * @input {string} input.itemId - The ID of the item to get tasks for
   * @returns {TaskCol[]} Array of tasks in a table-friendly format
   */
  getTaskTable: protectedProcedure
    .input(z.object({ projectId: z.string(), itemId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId, itemId } = input;
      return await getTaskTable(
        ctx.firebaseAdmin.app(),
        ctx.firestore,
        projectId,
        itemId,
      );
    }),

  /**
   * @procedure getTaskDetail
   * @description Gets detailed information about a specific task
   * @input {object} input - Input parameters
   * @input {string} input.projectId - The ID of the project
   * @input {string} input.taskId - The ID of the task
   * @returns {TaskDetail} Detailed task information
   * @throws {TRPCError} If the task is not found
   */
  getTaskDetail: protectedProcedure
    .input(z.object({ projectId: z.string(), taskId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId, taskId } = input;
      return await getTaskDetail(
        ctx.firebaseAdmin.app(),
        ctx.firestore,
        projectId,
        taskId,
      );
    }),

  /**
   * @procedure modifyTask
   * @description Updates a task with new data
   * @input {object} input - Input parameters
   * @input {string} input.projectId - The ID of the project
   * @input {string} input.taskId - The ID of the task to modify
   * @input {object} input.taskData - The new task data
   * @returns {object} Object with success status
   */
  modifyTask: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        taskId: z.string(),
        taskData: TaskSchema.omit({
          scrumId: true,
          deleted: true,
          itemType: true,
          itemId: true,
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, taskId, taskData } = input;
      const oldTaskData = await getTask(ctx.firestore, projectId, taskId);

      // Check the difference in dependency and requiredBy arrays
      const addedDependencies = taskData.dependencyIds.filter(
        (dep) => !oldTaskData.dependencyIds.includes(dep),
      );
      const removedDependencies = taskData.dependencyIds.filter(
        (dep) => !oldTaskData.dependencyIds.includes(dep),
      );
      const addedRequiredBy = taskData.requiredByIds.filter(
        (req) => !oldTaskData.requiredByIds.includes(req),
      );
      const removedRequiredBy = taskData.requiredByIds.filter(
        (req) => !oldTaskData.requiredByIds.includes(req),
      );

      // Since one change is made at a time one these (thanks for that UI),
      // we only check if there's a cycle by adding the new dependencies (which are also the same as inverted requiredBy)
      const newDependencies = [
        ...addedDependencies.flatMap((dep) => [
          { sourceId: taskId, targetId: dep },
        ]),
        ...addedRequiredBy.flatMap((req) => [
          { sourceId: req, targetId: taskId },
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
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Circular dependency detected.",
        });
      }

      // Update the related user stories
      await Promise.all(
        addedDependencies.map(async (dependencyId) => {
          await updateDependency(
            ctx.firestore,
            projectId,
            dependencyId,
            taskId,
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
            taskId,
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
            taskId,
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
            taskId,
            "remove",
            "dependencyIds",
          );
        }),
      );

      await getTaskRef(ctx.firestore, projectId, taskId).update(taskData);
      return {
        updatedTaskds: [
          ...addedDependencies,
          ...removedDependencies,
          ...addedRequiredBy,
          ...removedRequiredBy,
        ],
      };
    }),

  /**
   * @procedure changeTaskStatus
   * @description Updates the status of a task
   * @input {object} input - Input parameters
   * @input {string} input.projectId - The ID of the project
   * @input {string} input.taskId - The ID of the task to modify
   * @input {string} input.statusId - The ID of the new status
   * @returns {object} Object with success status
   */
  changeTaskStatus: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        taskId: z.string(),
        statusId: z.string().default(""),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, taskId, statusId } = input;
      const taskRef = getTaskRef(ctx.firestore, projectId, taskId);
      await taskRef.update({ statusId });
    }),

  /**
   * @procedure deleteTask
   * @description Marks a task as deleted (soft delete)
   * @input {object} input - Input parameters
   * @input {string} input.projectId - The ID of the project
   * @input {string} input.taskId - The ID of the task to delete
   * @returns {object} Object with success status
   */
  deleteTask: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        taskId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, taskId } = input;
      const taskRef = getTaskRef(ctx.firestore, projectId, taskId);

      // Get the task to get its dependencies and required by relationships
      const task = await getTask(ctx.firestore, projectId, taskId);

      const modifiedTasks = task.dependencyIds.concat(
        task.requiredByIds,
        taskId,
      );

      // Remove this user story from all dependencies' requiredBy arrays
      await Promise.all(
        task.dependencyIds.map(async (dependencyId) => {
          await updateDependency(
            ctx.firestore,
            projectId,
            dependencyId,
            taskId,
            "remove",
            "requiredByIds",
          );
        }),
      );

      // Remove this user story from all requiredBy's dependency arrays
      await Promise.all(
        task.requiredByIds.map(async (requiredById) => {
          await updateDependency(
            ctx.firestore,
            projectId,
            requiredById,
            taskId,
            "remove",
            "dependencyIds",
          );
        }),
      );

      // Mark the task as deleted
      await taskRef.update({ deleted: true });

      return {
        success: true,
        updatedTaskIds: modifiedTasks,
      };
    }),

  getTodoStatusTag: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await getTodoStatusTag(ctx.firestore, input.projectId);
    }),

  /**
   * @procedure generateTasks
   * @description Generates tasks for an item using AI
   * @input {object} input - Input parameters
   * @input {string} input.projectId - The ID of the project
   * @input {string} input.itemId - The ID of the item to generate tasks for
   * @input {string} input.itemType - The type of the item (US, IS, IT)
   * @input {number} input.amount - The number of tasks to generate
   * @input {string} input.prompt - Additional user prompt for task generation
   * @returns {Array} Array of generated tasks with Todo status
   */
  generateTasks: protectedProcedure
    .input(
      z
        .object({
          projectId: z.string(),
          itemId: z.string(),
          itemType: z.enum(["US", "IS", "IT"]),
          amount: z.number(),
          prompt: z.string(),
        })
        .or(
          z.object({
            projectId: z.string(),
            amount: z.number(),
            prompt: z.string(),
            itemType: z.enum(["US", "IS", "IT"]),
            itemDetail: BacklogItemSchema.omit({
              scrumId: true,
              deleted: true,
              complete: true,
            }).extend({
              tasks: z.array(
                TaskSchema.omit({
                  scrumId: true,
                  deleted: true,
                  itemType: true,
                  itemId: true,
                  assigneeId: true,
                  dueDate: true,
                }),
              ),
              extra: z.string(),
            }),
          }),
        ),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, amount, prompt } = input;

      // Get the item data
      let itemContext = "";
      let itemTypeName = "";
      let tasksContext = "";

      // LOAD US or IS or IT corresponding to the itemId
      if ("itemId" in input) {
        const { itemId } = input;
        if (input.itemType === "US") {
          itemTypeName = "user story";
          itemContext = await getUserStoryContextSolo(
            ctx.firestore,
            projectId,
            itemId,
          );
        } else if (input.itemType === "IS") {
          itemTypeName = "issue";
          itemContext = await getIssueContextSolo(
            ctx.firestore,
            projectId,
            itemId,
          );
        } else {
          itemTypeName = "backlog item";
        }

        tasksContext = await getTaskContextFromItem(
          ctx.firestore,
          projectId,
          itemId,
        );
      } else {
        let extra = "";
        const itemData = input.itemDetail;
        if (input.itemType === "IT") {
          itemTypeName = "backlog item";
        } else if (input.itemType === "IS") {
          itemTypeName = "issue";
          extra = `- steps to recreate: ${itemData.extra}`;
        } else {
          itemTypeName = "user story";
          extra = `- acceptance criteria: ${itemData.extra}`;
        }
        // Item context
        itemContext = await getGenericBacklogItemContext(
          ctx.firestore,
          projectId,
          itemData.name,
          itemData.description,
          itemData.priorityId ?? "",
          itemData.size,
        );
        // Tag Context
        const tagContext = await getBacklogTagsContext(
          ctx.firestore,
          projectId,
          itemData.tagIds,
        );

        itemContext = `# ${itemTypeName.toUpperCase()} DETAILS\n
${itemContext}
${extra}
${tagContext}\n\n`;

        tasksContext =
          itemData.tasks.length > 0
            ? "# EXISTING TASKS\n\n" +
              itemData.tasks
                .map((task) => {
                  return `- name: ${task.name}\n- description: ${task.description}\n`;
                })
                .join("\n")
            : "";
      }

      const completePrompt = await generateTaskContext(
        ctx.firestore,
        projectId,
        itemContext,
        itemTypeName,
        tasksContext,
        amount,
        prompt,
      );

      const generatedTasks = await askAiToGenerate(
        completePrompt,
        z.array(
          TaskSchema.omit({
            scrumId: true,
            deleted: true,
            itemType: true,
            itemId: true,
            assigneeId: true,
            statusId: true,
            dueDate: true,
          }),
        ),
      );

      const todoTag = await getTodoStatusTag(ctx.firestore, projectId);

      return generatedTasks.map((task) => ({
        ...task,
        status: todoTag as StatusTag,
      }));
    }),

  /**
   * @function getTaskCount
   * @description Retrieves the number of tasks inside a given project, regardless of their deleted status.
   * @param {string} projectId - The ID of the project.
   * @returns {number} - The number of tasks in the project.
   */
  getTaskCount: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      const tasksRef = getTasksRef(ctx.firestore, projectId);
      const countSnapshot = await tasksRef.count().get();
      return countSnapshot.data().count;
    }),
  /**
   * @function addTaskDependency
   * @description Creates a dependency relationship between two tasks, where one task becomes a prerequisite for another.
   * @param {string} projectId - The ID of the project to which the tasks belong.
   * @param {string} dependencyTaskId - The ID of the task that will be a prerequisite (dependency).
   * @param {string} parentTaskId - The ID of the task that will depend on the prerequisite task.
   * @returns {Promise<{ success: boolean }>} - A promise that resolves when the dependency is created.
   */
  addTaskDependencies: roleRequiredProcedure(taskPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        dependencyTaskId: z.string(),
        parentTaskId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, dependencyTaskId, parentTaskId } = input;

      // TODO: Make Alonso adapt to the new one
      // const hasCycle = await hasDependencyCycle(
      //   ctx.firestore,
      //   projectId,
      //   undefined,
      //   [{ parentTaskId, dependencyTaskId }],
      // );

      // if (hasCycle) {
      //   throw new TRPCError({
      //     code: "BAD_REQUEST",
      //     message: "Circular dependency detected.",
      //   });
      // }

      await updateDependency(
        ctx.firestore,
        projectId,
        parentTaskId,
        dependencyTaskId,
        "add",
        "dependencyIds",
      );
      await updateDependency(
        ctx.firestore,
        projectId,
        dependencyTaskId,
        parentTaskId,
        "add",
        "requiredByIds",
      );
      return { success: true };
    }),

  /**
   * @function deleteTaskDependency
   * @description Removes a dependency relationship between two tasks.
   * @param {string} projectId - The ID of the project to which the tasks belong.
   * @param {string} parentTaskId - The ID of the dependent task that will no longer require the prerequisite.
   * @param {string} dependencyTaskId - The ID of the prerequisite task that will no longer be required.
   * @returns {Promise<{ success: boolean }>} - A promise that resolves when the dependency is removed.
   */
  deleteTaskDependencies: roleRequiredProcedure(taskPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        parentTaskId: z.string(),
        dependencyTaskId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, parentTaskId, dependencyTaskId } = input;
      await updateDependency(
        ctx.firestore,
        projectId,
        parentTaskId,
        dependencyTaskId,
        "remove",
        "dependencyIds",
      );
      await updateDependency(
        ctx.firestore,
        projectId,
        dependencyTaskId,
        parentTaskId,
        "remove",
        "requiredByIds",
      );
      return { success: true };
    }),
  /**
   * @function getTaskDependencies
   * @description Retrieves all tasks and their dependency relationships in a format suitable for visualization.
   * @param {string} projectId - The ID of the project to get task dependencies from.
   * @returns {Promise<{nodes: Node[], edges: Edge[]}>} - Returns an object containing:
   *   - nodes: Array of task nodes with position and display data
   *   - edges: Array of dependency relationships between tasks
   */
  getTaskDependencies: roleRequiredProcedure(taskPermissions, "read")
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      const tasks = await getTasks(ctx.firestore, projectId);

      // Create nodes for each user story with a grid layout
      const nodes: Node[] = tasks.map((task) => {
        return {
          id: task.id,
          position: {
            x: 0,
            y: -100,
          }, // Position is updated in the frontend because it needs nodes' real size
          data: {
            id: task.id,
            title: task.name,
            scrumId: task.scrumId,
            itemType: task.itemType + "-TS",
            showDeleteButton: true,
            showEditButton: true,
            collapsible: false,
          }, // See BasicNodeData for properties
          type: "basic", // see nodeTypes
          deletable: false,
        };
      });

      // Create edges for dependencies
      const edges: Edge[] = tasks.flatMap((task) =>
        task.dependencyIds.map((dependencyId) => ({
          id: `${dependencyId}-${task.id}`,
          source: dependencyId,
          target: task.id,
          type: "dependency", // see edgeTypes
        })),
      );

      return { nodes, edges };
    }),
});
