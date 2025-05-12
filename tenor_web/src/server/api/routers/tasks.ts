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
import type { StatusTag } from "~/lib/types/firebaseSchemas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { BacklogItemSchema, TaskSchema } from "~/lib/types/zodFirebaseSchema";
import { askAiToGenerate } from "~/utils/aiTools/aiGeneration";
import {
  getTaskContextFromItem,
  getTaskDetail,
  getTaskNewId,
  getTaskRef,
  getTasksRef,
  getTaskTable,
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

export const tasksRouter = createTRPCRouter({
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
      try {
        const task = await getTasksRef(ctx.firestore, input.projectId).add({
          ...input.taskData,
          scrumId: await getTaskNewId(ctx.firestore, input.projectId),
        });
        return { success: true, taskId: task.id };
      } catch (err) {
        console.log("Error creating task story:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
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
      const taskRef = getTaskRef(ctx.firestore, projectId, taskId);
      await taskRef.update(taskData);
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
      await taskRef.update({ deleted: true });
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
});
