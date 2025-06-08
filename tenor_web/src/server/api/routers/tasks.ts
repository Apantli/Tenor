/**
 * Tasks - Tenor API Endpoints for Task Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing Tasks in the Tenor application.
 * It provides endpoints to create, modify, and retrieve tasks.
 *
 * @category API
 */
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import type { StatusTag, Task, WithId } from "~/lib/types/firebaseSchemas";
import {
  createTRPCRouter,
  protectedProcedure,
  roleRequiredProcedure,
} from "~/server/api/trpc";
import {
  BacklogItemSchema,
  BacklogItemZodType,
  TaskSchema,
  TimestampType,
} from "~/lib/types/zodFirebaseSchema";
import { askAiToGenerate } from "~/lib/aiTools/aiGeneration";
import {
  deleteTaskAndGetModified,
  getTask,
  getTaskContextFromItem,
  getTaskDetail,
  getTaskRef,
  getTasks,
  getTasksRef,
  getTaskTable,
  hasDependencyCycle,
  updateDependency,
} from "../shortcuts/tasks";
import {
  generateTaskContext,
  getGenericBacklogItemContext,
} from "../shortcuts/general";
import { getBacklogTagsContext, getTodoStatusTag } from "../shortcuts/tags";
import { getUserStoryContextSolo } from "../shortcuts/userStories";
import { getIssueContextSolo } from "../shortcuts/issues";
import { LogProjectActivity } from "~/server/api/lib/projectEventLogger";
import {
  backlogPermissions,
  taskPermissions,
} from "~/lib/defaultValues/permission";
import { FieldValue } from "firebase-admin/firestore";
import type { Edge, Node } from "@xyflow/react";
import { dateToString } from "~/lib/helpers/parsers";
import { getBacklogItemContextSolo } from "../shortcuts/backlogItems";
import { cyclicReference } from "~/server/errors";

/**
 * Retrieves tasks for a specific project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns Array of tasks for the specified project
 *
 * @http GET /api/trpc/tasks.getTasks
 */
export const getTasksProcedure = roleRequiredProcedure(
  backlogPermissions,
  "read",
)
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    return await getTasks(ctx.firestore, projectId);
  });

/**
 * Retrieves tasks for a specific project grouped by their due dates.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns Object with date strings as keys and arrays of tasks as values
 *
 * @http GET /api/trpc/tasks.getTasksByDate
 */
export const getTasksByDateProcedure = roleRequiredProcedure(
  backlogPermissions,
  "read",
)
  .input(
    z.object({
      projectId: z.string(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const tasks = await getTasks(ctx.firestore, input.projectId);

    const tasksByDate: Record<string, WithId<Task>[]> = {};
    tasks.forEach((task) => {
      const dateKey = task.dueDate
        ? (dateToString(task.dueDate) ?? undefined)
        : undefined;
      if (!dateKey) {
        return;
      }

      if (!tasksByDate[dateKey]) {
        tasksByDate[dateKey] = [];
      }
      tasksByDate[dateKey].push(task);
    });
    return tasksByDate;
  });

/**
 * Creates a new task in the specified project and assigns it a scrumId.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - taskData - The task data without scrumId
 *
 * @returns Object with the created task ID and data
 *
 * @throws {TRPCError} If there's an error creating the task or if it would create a dependency cycle
 *
 * @http POST /api/trpc/tasks.createTask
 */
export const createTaskProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      taskData: TaskSchema.omit({ scrumId: true }),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, taskData: taskDataRaw } = input;

    const hasCycle = await hasDependencyCycle(
      ctx.firestore,
      projectId,
      [
        {
          id: "this is a new task", // id to avoid collision
          dependencyIds: taskDataRaw.dependencyIds,
        },
      ],
      [
        ...taskDataRaw.requiredByIds.map((dependencyId) => ({
          parentId: dependencyId,
          dependencyId: "this is a new task",
        })),
      ],
    );

    if (hasCycle) {
      throw cyclicReference();
    }

    const { taskData, id: newTaskId } = await ctx.firestore.runTransaction(
      async (transaction) => {
        const tasksRef = getTasksRef(ctx.firestore, projectId);

        const taskCount = await transaction.get(tasksRef.count());

        const taskData = TaskSchema.parse({
          ...taskDataRaw,
          scrumId: taskCount.data().count + 1,
        });
        const docRef = tasksRef.doc();

        transaction.create(docRef, taskData);

        return {
          taskData,
          id: docRef.id,
        };
      },
    );

    // Add dependency references
    await Promise.all(
      input.taskData.dependencyIds.map(async (dependencyId) => {
        await getTaskRef(ctx.firestore, projectId, dependencyId).update({
          requiredByIds: FieldValue.arrayUnion(newTaskId),
        });
      }),
    );
    // Add requiredBy references
    await Promise.all(
      input.taskData.requiredByIds.map(async (requiredById) => {
        await getTaskRef(ctx.firestore, projectId, requiredById).update({
          dependencyIds: FieldValue.arrayUnion(newTaskId),
        });
      }),
    );

    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: newTaskId,
      type: "TS",
      action: "create",
    });

    return {
      id: newTaskId,
      ...taskData,
    } as WithId<Task>;
  });

/**
 * Gets tasks for a specific item in a table-friendly format.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - itemId - String ID of the item to get tasks for
 *
 * @returns Array of tasks in a table-friendly format
 *
 * @http GET /api/trpc/tasks.getTaskTable
 */
export const getTaskTableProcedure = protectedProcedure
  .input(z.object({ projectId: z.string(), itemId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId, itemId } = input;
    return await getTaskTable(
      ctx.firebaseAdmin.app(),
      ctx.firestore,
      projectId,
      itemId,
    );
  });

/**
 * Gets detailed information about a specific task.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - taskId - String ID of the task
 *
 * @returns Detailed task information
 *
 * @throws {TRPCError} If the task is not found
 *
 * @http GET /api/trpc/tasks.getTaskDetail
 */
export const getTaskDetailProcedure = protectedProcedure
  .input(z.object({ projectId: z.string(), taskId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId, taskId } = input;
    return await getTaskDetail(
      ctx.firebaseAdmin.app(),
      ctx.firestore,
      projectId,
      taskId,
    );
  });

/**
 * Updates the due date of a task.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - taskId - String ID of the task
 * - dueDate - Timestamp for the new due date
 *
 * @returns void
 *
 * @http POST /api/trpc/tasks.modifyDueDate
 */
export const modifyDueDateProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      taskId: z.string(),
      dueDate: TimestampType,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, taskId, dueDate } = input;
    const taskRef = getTaskRef(ctx.firestore, projectId, taskId);

    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: taskRef.id,
      type: "TS",
      action: "update",
    });
    await taskRef.update({ dueDate });
  });

/**
 * Updates a task with new data.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - taskId - String ID of the task to modify
 * - taskData - The new task data
 *
 * @returns Object with IDs of updated tasks
 *
 * @throws {TRPCError} If modification would create a dependency cycle
 *
 * @http POST /api/trpc/tasks.modifyTask
 */
export const modifyTaskProcedure = protectedProcedure
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
    const removedDependencies = oldTaskData.dependencyIds.filter(
      (dep) => !taskData.dependencyIds.includes(dep),
    );
    const addedRequiredBy = taskData.requiredByIds.filter(
      (req) => !oldTaskData.requiredByIds.includes(req),
    );
    const removedRequiredBy = oldTaskData.requiredByIds.filter(
      (req) => !taskData.requiredByIds.includes(req),
    );

    // Since one change is made at a time one these (thanks for that UI),
    // we only check if there's a cycle by adding the new dependencies (which are also the same as inverted requiredBy)
    const newDependencies = [
      ...addedDependencies.flatMap((dep) => [
        { parentId: taskId, dependencyId: dep },
      ]),
      ...addedRequiredBy.flatMap((req) => [
        { parentId: req, dependencyId: taskId },
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

    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: taskId,
      type: "TS",
      action: "update",
    });
    let assignedDate = oldTaskData.assignedDate;

    if (taskData.assigneeId !== oldTaskData.assigneeId) {
      assignedDate = Timestamp.fromDate(new Date());
    }

    let statusChangeDate = oldTaskData.statusChangeDate;
    if (taskData.statusId !== oldTaskData.statusId) {
      statusChangeDate = Timestamp.fromDate(new Date());
    }

    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: taskId,
      type: "TS",
      action: "update",
    });

    const updateData = {
      ...taskData,
      assignedDate,
      statusChangeDate,
      dueDate: taskData.dueDate ?? FieldValue.delete(),
    };

    await getTaskRef(ctx.firestore, projectId, taskId).update(updateData);
    return {
      updatedTaskds: [
        ...addedDependencies,
        ...removedDependencies,
        ...addedRequiredBy,
        ...removedRequiredBy,
      ],
    };
  });

/**
 * Updates the status of a task.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - taskId - String ID of the task to modify
 * - statusId - String ID of the new status
 *
 * @returns void
 *
 * @http POST /api/trpc/tasks.changeTaskStatus
 */
export const changeTaskStatusProcedure = protectedProcedure
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
    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: taskRef.id,
      type: "TS",
      action: "update",
    });

    await taskRef.update({
      statusId,
      statusChangeDate: Timestamp.fromDate(new Date()),
    });
  });

/**
 * Marks a task as deleted (soft delete).
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - taskId - String ID of the task to delete
 *
 * @returns Object with success status and array of modified task IDs
 *
 * @http POST /api/trpc/tasks.deleteTask
 */
export const deleteTaskProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      taskId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, taskId } = input;
    const modifiedTasks = await deleteTaskAndGetModified(
      ctx.firestore,
      projectId,
      taskId,
    );

    const taskRef = getTaskRef(ctx.firestore, projectId, taskId);
    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: taskRef.id,
      type: "TS",
      action: "delete",
    });

    return {
      success: true,
      modifiedTaskIds: modifiedTasks,
    };
  });

/**
 * Marks multiple tasks as deleted (soft delete).
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - taskIds - Array of string IDs of tasks to delete
 *
 * @returns Object with success status and array of modified task IDs
 *
 * @http POST /api/trpc/tasks.deleteTasks
 */
export const deleteTasksProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      taskIds: z.array(z.string()),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, taskIds } = input;

    const allModifiedTaskIds = new Set<string>();

    await Promise.all(
      taskIds.map(async (taskId) => {
        const modifiedTasks = await deleteTaskAndGetModified(
          ctx.firestore,
          projectId,
          taskId,
        );
        modifiedTasks.forEach((id) => allModifiedTaskIds.add(id));

        // Only add the taskRef of deleted task, not the modified ones
        const taskRef = getTaskRef(ctx.firestore, projectId, taskId);
        await LogProjectActivity({
          firestore: ctx.firestore,
          projectId: input.projectId,
          userId: ctx.session.user.uid,
          itemId: taskRef.id,
          type: "TS",
          action: "delete",
        });
      }),
    );

    return {
      success: true,
      modifiedTaskIds: Array.from(allModifiedTaskIds),
    };
  });

/**
 * Retrieves the Todo status tag for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns Todo status tag or null
 *
 * @http GET /api/trpc/tasks.getTodoStatusTag
 */
export const getTodoStatusTagProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    return await getTodoStatusTag(ctx.firestore, input.projectId);
  });

/**
 * Generates tasks for an item using AI.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - itemId - String ID of the item to generate tasks for (if included)
 * - itemType - The type of the item (US, IS, IT)
 * - amount - The number of tasks to generate
 * - prompt - Additional user prompt for task generation
 * - itemDetail - Optional details about the backlog item for which to generate tasks
 *
 * @returns Array of generated tasks with Todo status
 *
 * @http POST /api/trpc/tasks.generateTasks
 */
export const generateTasksProcedure = protectedProcedure
  .input(
    z
      .object({
        projectId: z.string(),
        itemId: z.string(),
        itemType: BacklogItemZodType,
        amount: z.number(),
        prompt: z.string(),
      })
      .or(
        z.object({
          projectId: z.string(),
          amount: z.number(),
          prompt: z.string(),
          itemType: BacklogItemZodType,
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
      switch (input.itemType) {
        case "US":
          itemTypeName = "user story";
          itemContext = await getUserStoryContextSolo(
            ctx.firestore,
            projectId,
            itemId,
          );
          break;
        case "IS":
          itemTypeName = "issue";
          itemContext = await getIssueContextSolo(
            ctx.firestore,
            projectId,
            itemId,
          );
          break;
        case "IT":
          itemTypeName = "backlog item";
          itemContext = await getBacklogItemContextSolo(
            ctx.firestore,
            projectId,
            itemId,
          );
          break;
      }

      tasksContext = await getTaskContextFromItem(
        ctx.firestore,
        projectId,
        itemId,
      );
    } else {
      // extra data, if exists
      let extra = "";
      const itemData = input.itemDetail;
      switch (input.itemType) {
        case "US":
          itemTypeName = "user story";
          extra = `- acceptance criteria: ${itemData.extra}`;
          break;
        case "IS":
          itemTypeName = "issue";
          extra = `- steps to recreate: ${itemData.extra}`;
          break;
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
  });

/**
 * Retrieves the number of tasks inside a given project, regardless of their deleted status.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns Number indicating the count of tasks in the project
 *
 * @http GET /api/trpc/tasks.getTaskCount
 */
export const getTaskCountProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    const tasksRef = getTasksRef(ctx.firestore, projectId);
    const countSnapshot = await tasksRef.count().get();
    return countSnapshot.data().count;
  });

/**
 * Creates a dependency relationship between two tasks, where one task becomes a prerequisite for another.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project to which the tasks belong
 * - dependencyTaskId - String ID of the task that will be a prerequisite (dependency)
 * - parentTaskId - String ID of the task that will depend on the prerequisite task
 *
 * @returns Object with success status
 *
 * @throws {TRPCError} If adding the dependency would create a cycle
 *
 * @http POST /api/trpc/tasks.addTaskDependencies
 */
export const addTaskDependenciesProcedure = roleRequiredProcedure(
  taskPermissions,
  "write",
)
  .input(
    z.object({
      projectId: z.string(),
      dependencyTaskId: z.string(),
      parentTaskId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, dependencyTaskId, parentTaskId } = input;

    const hasCycle = await hasDependencyCycle(
      ctx.firestore,
      projectId,
      undefined,
      [{ parentId: parentTaskId, dependencyId: dependencyTaskId }],
    );

    if (hasCycle) {
      throw cyclicReference();
    }

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
    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: parentTaskId,
      type: "TS",
      action: "update",
    });
    return { success: true };
  });

/**
 * Removes a dependency relationship between two tasks.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project to which the tasks belong
 * - parentTaskId - String ID of the dependent task that will no longer require the prerequisite
 * - dependencyTaskId - String ID of the prerequisite task that will no longer be required
 *
 * @returns Object with success status
 *
 * @http POST /api/trpc/tasks.deleteTaskDependencies
 */
export const deleteTaskDependenciesProcedure = roleRequiredProcedure(
  taskPermissions,
  "write",
)
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
    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: parentTaskId,
      type: "TS",
      action: "update",
    });
    return { success: true };
  });

/**
 * Retrieves all tasks and their dependency relationships in a format suitable for visualization.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project to get task dependencies from
 *
 * @returns Object containing:
 * - nodes: Array of task nodes with position and display data
 * - edges: Array of dependency relationships between tasks
 *
 * @http GET /api/trpc/tasks.getTaskDependencies
 */
export const getTaskDependenciesProcedure = roleRequiredProcedure(
  taskPermissions,
  "read",
)
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
          parentId: task.itemId,
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
  });

/**
 * Tasks Router - Centralizes all task-related procedures.
 * Provides a structured interface for task management across the application.
 */
export const tasksRouter = createTRPCRouter({
  getTasks: getTasksProcedure,
  getTasksByDate: getTasksByDateProcedure,
  createTask: createTaskProcedure,
  getTaskTable: getTaskTableProcedure,
  getTaskDetail: getTaskDetailProcedure,
  modifyDueDate: modifyDueDateProcedure,
  modifyTask: modifyTaskProcedure,
  changeTaskStatus: changeTaskStatusProcedure,
  deleteTask: deleteTaskProcedure,
  deleteTasks: deleteTasksProcedure,
  getTodoStatusTag: getTodoStatusTagProcedure,
  generateTasks: generateTasksProcedure,
  getTaskCount: getTaskCountProcedure,
  addTaskDependencies: addTaskDependenciesProcedure,
  deleteTaskDependencies: deleteTaskDependenciesProcedure,
  getTaskDependencies: getTaskDependenciesProcedure,
});
