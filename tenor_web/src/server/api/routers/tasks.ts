import { z } from "zod";
import type { WithId, Tag, Size } from "~/lib/types/firebaseSchemas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { Task } from "~/lib/types/firebaseSchemas";
import { TRPCError } from "@trpc/server";
import {
  BacklogItemSchema,
  EpicSchema,
  IssueSchema,
  TagSchema,
  TaskSchema,
  UserStorySchema,
} from "~/lib/types/zodFirebaseSchema";
import type { TaskDetail } from "~/lib/types/detailSchemas";
import { getProjectSettingsRef } from "./settings";
import { timestampToDate } from "./sprints";
import { askAiToGenerate } from "~/utils/aiGeneration";
import { getProjectContextHeader } from "~/utils/aiContext";
import { todoTagName } from "~/lib/defaultProjectValues";

/**
 * @interface TaskCol
 * @description Represents a task in a table-friendly format for the UI
 * @property {string} id - The unique identifier of the task
 * @property {number} [scrumId] - The optional scrum ID of the task
 * @property {string} title - The title/name of the task
 * @property {Tag} status - The status tag of the task
 * @property {object} [assignee] - The optional user assigned to the task
 * @property {string} assignee.uid - The user ID of the assignee
 * @property {string} assignee.displayName - The display name of the assignee
 * @property {string} assignee.photoURL - The photo URL of the assignee
 */
export interface TaskCol {
  id: string;
  scrumId?: number;
  title: string;
  status: Tag;
  assignee?: {
    uid: string;
    displayName: string;
    photoURL: string;
  };
}

/**
 * @function getTasksFromProject
 * @description Retrieves all non-deleted tasks from a project, ordered by scrumId
 * @param {FirebaseFirestore.Firestore} dbAdmin - The Firestore database instance
 * @param {string} projectId - The ID of the project to retrieve tasks from
 * @returns {Promise<WithId<Task>[]>} An array of task objects with their IDs
 */
export const getTasksFromProject = async (
  dbAdmin: FirebaseFirestore.Firestore,
  projectId: string,
) => {
  const taskCollectionRef = dbAdmin
    .collection(`projects/${projectId}/tasks`)
    .where("deleted", "==", false)
    .orderBy("scrumId");
  const snap = await taskCollectionRef.get();

  const docs = snap.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
    };
  });

  const tasks: WithId<Task>[] = docs.filter(
    (task): task is WithId<Task> => task !== null,
  );

  return tasks;
};

/**
 * @function getTasksFromItem
 * @description Retrieves all non-deleted tasks associated with a specific item (user story, issue, etc.)
 * @param {FirebaseFirestore.Firestore} dbAdmin - The Firestore database instance
 * @param {string} projectId - The ID of the project to retrieve tasks from
 * @param {string} itemId - The ID of the item (user story, issue) to retrieve tasks for
 * @returns {Promise<WithId<Task>[]>} An array of task objects with their IDs
 */
export const getTasksFromItem = async (
  dbAdmin: FirebaseFirestore.Firestore,
  projectId: string,
  itemId: string,
) => {
  const taskCollectionRef = dbAdmin
    .collection(`projects/${projectId}/tasks`)
    .where("deleted", "==", false)
    .where("itemId", "==", itemId)
    .orderBy("scrumId");
  const snap = await taskCollectionRef.get();

  const docs = snap.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
    };
  });

  const tasks: WithId<Task>[] = docs.filter(
    (task): task is WithId<Task> => task !== null,
  );

  return tasks;
};

/**
 * @function getStatusTag
 * @description Retrieves a status tag from the settings collection based on its ID
 * @param {FirebaseFirestore.DocumentReference} settingsRef - Reference to the settings document
 * @param {string} statusId - The ID of the status tag to retrieve
 * @returns {Promise<Tag | undefined>} The status tag object or undefined if not found
 */
export const getStatusTag = async (
  settingsRef: FirebaseFirestore.DocumentReference,
  statusId: string,
) => {
  if (statusId === undefined || statusId === "") {
    return undefined;
  }
  const tag = await settingsRef.collection("statusTypes").doc(statusId).get();
  if (!tag.exists) {
    return undefined;
  }
  return { id: tag.id, ...TagSchema.parse(tag.data()) } as Tag;
};

/**
 * @function getTodoStatusTag
 * @description Retrieves the "Todo" status tag from the settings collection
 * @param {FirebaseFirestore.DocumentReference} settingsRef - Reference to the settings document
 * @returns {Promise<Tag>} The Todo status tag object
 * @throws {TRPCError} If the Todo status tag is not found
 */
export const getTodoStatusTag = async (
  settingsRef: FirebaseFirestore.DocumentReference,
) => {
  const todoTag = await settingsRef
    .collection("statusTypes")
    .where("name", "==", todoTagName)
    .limit(1)
    .get();
  console.log("Todo tag:", todoTag.docs);
  if (todoTag.empty || todoTag.docs.length !== 1) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "To Do status tag not found",
    });
  }
  return {
    id: todoTag.docs[0]!.id,
    ...TagSchema.parse(todoTag.docs[0]!.data()),
  };
};

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
        const taskCount = await ctx.firestore
          .collection("projects")
          .doc(input.projectId)
          .collection("tasks")
          .count()
          .get();
        const task = await ctx.firestore
          .collection("projects")
          .doc(input.projectId)
          .collection("tasks")
          .add({
            ...input.taskData,
            scrumId: taskCount.data().count + 1,
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
  getTasksTableFriendly: protectedProcedure
    .input(z.object({ projectId: z.string(), itemId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId, itemId } = input;
      const rawUs = await getTasksFromItem(ctx.firestore, projectId, itemId);
      // Transforming into table format
      const settingsRef = getProjectSettingsRef(projectId, ctx.firestore);

      const fixedData = await Promise.all(
        rawUs.map(async (task) => {
          let assignee = undefined;
          if (task.assigneeId !== undefined && task.assigneeId !== "") {
            const assigneeData = await ctx.firebaseAdmin
              .auth()
              .getUser(task.assigneeId);
            assignee = {
              uid: assigneeData.uid,
              displayName: assigneeData.displayName,
              photoURL: assigneeData.photoURL,
            };
          }
          return {
            id: task.id,
            scrumId: task.scrumId,
            title: task.name,
            status: await getStatusTag(settingsRef, task.statusId),
            assignee: assignee,
          };
        }),
      );

      return fixedData as TaskCol[];
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
      // Get the necessary information to construct the Task Detail

      const { projectId, taskId } = input;
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
      // Fetch all the task information for the task in parallel

      const settingsRef = getProjectSettingsRef(input.projectId, ctx.firestore);

      let statusTag = undefined;
      if (taskData.statusId !== undefined) {
        statusTag = await getStatusTag(settingsRef, taskData.statusId);
      }

      let assignee = undefined;
      if (taskData.assigneeId !== undefined && taskData.assigneeId !== "") {
        const userRef = await ctx.firebaseAdmin
          .auth()
          .getUser(taskData.assigneeId);
        assignee = {
          uid: userRef.uid,
          displayName: userRef.displayName,
          photoURL: userRef.photoURL,
        };
      }

      return {
        id: taskId,
        scrumId: taskData.scrumId,
        name: taskData.name,
        description: taskData.description,
        status: statusTag,
        size: taskData.size,
        assignee: assignee,
        dueDate: taskData.dueDate
          ? timestampToDate(taskData.dueDate)
          : undefined,
      } as TaskDetail;
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
      const taskRef = ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("tasks")
        .doc(taskId);
      await taskRef.update(taskData);
      return { success: true };
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
      const taskRef = ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("tasks")
        .doc(taskId);
      await taskRef.update({ statusId });
      return { success: true };
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
      const taskRef = ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("tasks")
        .doc(taskId);
      await taskRef.update({ deleted: true });
      return { success: true };
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

      const getGenericBacklogItemContext = async (
        name: string,
        description: string,
        priorityId: string,
        size?: Size,
      ) => {
        let priorityContext = "";
        if (priorityId && priorityId !== "") {
          const priorityTag = await ctx.firestore
            .collection("projects")
            .doc(projectId)
            .collection("backlogTags")
            .doc(priorityId)
            .get();
          if (priorityTag.exists) {
            const priorityData = TagSchema.parse(priorityTag.data());
            priorityContext = `- priority: ${priorityData.name}\n`;
          }
        }

        const sizeContext = size ? `- size: ${size}\n` : "";

        return `- name: ${name}\n- description: ${description}\n${priorityContext}${sizeContext}\n\n`;
      };

      const getBacklogTagsContext = async (tagIds: string[]) => {
        const tags = await Promise.all(
          tagIds.map(async (tagId) => {
            const tag = await ctx.firestore
              .collection("projects")
              .doc(projectId)
              .collection("backlogTags")
              .doc(tagId)
              .get();
            if (tag.exists) {
              const tagData = TagSchema.parse(tag.data());
              return `- ${tagData.name}`;
            }
            return "";
          }),
        );
        return (
          "RELATED TAGS\n\n" +
          tags.filter((tag) => tag !== "").join("\n") +
          "\n\n"
        );
      };

      const getEpicContext = async (epicId: string) => {
        let epicContext = "";
        if (epicId && epicId !== "") {
          const epic = await ctx.firestore
            .collection("projects")
            .doc(projectId)
            .collection("epics")
            .doc(epicId)
            .get();
          if (epic.exists) {
            const epicData = {
              id: epic.id,
              ...EpicSchema.parse(epic.data()),
            };
            epicContext = `# RELATED EPIC\n\n- name: ${epicData.name}\n- description: ${epicData.description}\n\n`;
          }
        }
        return epicContext;
      };

      // Get the item data
      let itemContext = "";
      let itemTypeName = "";
      let tasksContext = "";

      if ("itemId" in input) {
        const { itemId } = input;

        if (input.itemType === "US") {
          itemTypeName = "user story";
          const userStory = await ctx.firestore
            .collection("projects")
            .doc(projectId)
            .collection("userStories")
            .doc(itemId)
            .get();
          const userStoryData = {
            id: userStory.id,
            ...UserStorySchema.parse(userStory.data()),
          };

          const epicContext = await getEpicContext(userStoryData.epicId ?? "");

          itemContext = `# USER STORY DETAILS\n
${await getGenericBacklogItemContext(userStoryData.name, userStoryData.description, userStoryData.priorityId ?? "", userStoryData.size)}
- acceptance criteria: ${userStoryData.acceptanceCriteria}

${epicContext}

${await getBacklogTagsContext(userStoryData.tagIds)}\n\n`;
        } else if (input.itemType === "IS") {
          itemTypeName = "issue";
          const issue = await ctx.firestore
            .collection("projects")
            .doc(projectId)
            .collection("issues")
            .doc(itemId)
            .get();
          const issueData = {
            id: issue.id,
            ...IssueSchema.parse(issue.data()),
          };

          let userStoryContext = "";
          if (issueData.relatedUserStoryId) {
            const userStory = await ctx.firestore
              .collection("projects")
              .doc(projectId)
              .collection("userStories")
              .doc(issueData.relatedUserStoryId)
              .get();
            if (userStory.exists) {
              const userStoryData = {
                id: userStory.id,
                ...UserStorySchema.parse(userStory.data()),
              };
              userStoryContext = `# RELATED USER STORY\n\n- name: ${userStoryData.name}\n- description: ${userStoryData.description}\n- acceptance criteria: ${userStoryData.acceptanceCriteria}\n\n`;
            }
          }

          itemContext = `# ISSUE DETAILS\n
${await getGenericBacklogItemContext(issueData.name, issueData.description, issueData.priorityId ?? "", issueData.size)}
- steps to reproduce: ${issueData.stepsToRecreate}

${userStoryContext}

${await getBacklogTagsContext(issueData.tagIds)}\n\n`;
        }
        // FIXME: Also deal with generic items (IT)

        const tasks = await getTasksFromItem(ctx.firestore, projectId, itemId);
        tasksContext =
          tasks.length > 0
            ? "# EXISTING TASKS\n\n" +
              tasks
                .map((task) => {
                  return `- name: ${task.name}\n- description: ${task.description}\n`;
                })
                .join("\n")
            : "";
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

        itemContext = `# ${itemTypeName.toUpperCase()} DETAILS\n
${await getGenericBacklogItemContext(itemData.name, itemData.description, itemData.priorityId ?? "", itemData.size)}
${extra}

${await getBacklogTagsContext(itemData.tagIds)}\n\n`;

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

      const passedInPrompt =
        prompt != ""
          ? `Consider that the user wants the tasks for the following: ${prompt}`
          : "";

      const completePrompt = `
${await getProjectContextHeader(projectId, ctx.firestore)}

Given the following context, follow the instructions below to the best of your ability.

${itemContext}
${tasksContext}

Generate ${amount} tasks about the detailed ${itemTypeName}. You can also see the tasks that already exist, DO NOT repeat tasks. Do NOT include any identifier in the name like "Task 1", just use a normal title. Always include a size.\n\n

${passedInPrompt}
          `;

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
        ), // This makes the AI only generate description, name, and size
      );

      const todoTag = await getTodoStatusTag(
        getProjectSettingsRef(projectId, ctx.firestore),
      );

      return generatedTasks.map((task) => ({
        ...task,
        status: todoTag as Tag,
      }));
    }),

  getTaskCount: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const taskCount = await ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("tasks")
        .where("deleted", "==", false)
        .count()
        .get();
      return taskCount.data().count;
    }),
});
