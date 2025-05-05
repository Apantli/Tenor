import { boolean, z } from "zod";
import type {
  Issue,
  WithId,
  Tag,
  Size,
  Sprint,
  Task,
} from "~/lib/types/firebaseSchemas";
import { TRPCError } from "@trpc/server";
import {
  ExistingUserStorySchema,
  IssueSchema,
  SprintSchema,
  StatusTagSchema,
  TaskSchema,
  UserStorySchema,
} from "~/lib/types/zodFirebaseSchema";
import type { ExistingUserStory, IssueDetail } from "~/lib/types/detailSchemas";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  getProjectSettingsRef,
  getBacklogTag,
  getPriorityTag,
  getProjectRef,
} from "./settings";
import { TagSchema } from "~/lib/types/zodFirebaseSchema";
import * as admin from "firebase-admin";
import { getStatusTag } from "./tasks";

if (!admin.apps.length) {
  admin.initializeApp();
}

export interface IssueCol {
  id: string;
  scrumId: number;
  name: string;
  description: string;
  priority: Tag;
  relatedUserStory?: ExistingUserStory;
  tags: Tag[];
  stepsToRecreate?: string;
  size: Size;
  sprint?: Sprint;
  assignUsers: {
    uid: string;
    displayName?: string;
    photoURL?: string;
  }[];
}

// Get the issues from a designated project and sprint
// This is used to get the issues from a project and sprint
const getIssuesFromProject = async (
  dbAdmin: FirebaseFirestore.Firestore,
  projectId: string,
) => {
  try {
    const issueCollectionRef = dbAdmin
      .collection(`projects/${projectId}/issues`)
      .orderBy("scrumId", "desc");

    const issueCollectionSnapshot = await issueCollectionRef.get();

    const issues: WithId<Issue>[] = [];
    issueCollectionSnapshot.forEach((doc) => {
      const data = doc.data() as Issue;
      if (data.deleted !== true) {
        issues.push({ id: doc.id, ...data });
      }
    });

    return issues;
  } catch (err) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Error fetching issues from the database",
    });
  }
};

const getUserStory = async (
  projectRef: FirebaseFirestore.DocumentReference,
  userStoryId: string,
) => {
  if (
    !userStoryId ||
    typeof userStoryId !== "string" ||
    userStoryId.trim() === ""
  ) {
    return undefined;
  }

  const userStoriesRef = projectRef
    .collection("userStories")
    .where("deleted", "==", false);

  const userStorySnapshot = await userStoriesRef.get();

  const userStoryDoc = userStorySnapshot.docs.find(
    (doc) => doc.id === userStoryId,
  );

  if (!userStoryDoc) {
    return undefined;
  }

  return {
    id: userStoryDoc.id,
    ...ExistingUserStorySchema.parse(userStoryDoc.data()),
  } as ExistingUserStory;
};

type TaskData = {
  assigneeId?: string;
};

type User = {
  id: string;
  displayName: string;
  photoURL: string;
};

const getTasksFromItem = async (
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

const getTasksAssignUsers = async (
  firestore: FirebaseFirestore.Firestore,
  projectId: string,
  itemId: string,
): Promise<User[]> => {
  if (!itemId) {
    return [];
  }

  const tasks = await getTasksFromItem(firestore, projectId, itemId);

  const userIds = tasks
    .map((task) => task.assigneeId)
    .filter((id): id is string => Boolean(id));

  const users = await Promise.all(
    userIds.map(async (userId) => {
      const userRecord = await admin.auth().getUser(userId);
      return {
        id: userRecord.uid,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
      };
    }),
  );

  const filteredUsers = users.filter((user): user is User => Boolean(user?.id));

  const uniqueUsers: User[] = Array.from(
    new Map(filteredUsers.map((u) => [u.id, u])).values(),
  );

  return uniqueUsers;
};

/**
 * Retrieves issues for a project in a table-friendly format.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to fetch issues for
 *
 * @returns Array of issues with their details, including priority, related user story, and assigned users.
 *
 * @http GET /api/trpc/issues.getIssuesTableFriendly
 */
export const getIssuesTableFriendlyProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    try {
      const rawIssues = await getIssuesFromProject(
        ctx.firestore,
        input.projectId,
      );

      const settingsRef = getProjectSettingsRef(input.projectId, ctx.firestore);

      const projectRef = getProjectRef(input.projectId, ctx.firestore);

      const fixedData = await Promise.all(
        rawIssues.map(async (issue) => {
          try {
            const rawUsers = await getTasksAssignUsers(
              ctx.firestore,
              input.projectId,
              issue.id,
            );

            const assignUsers = rawUsers.filter(Boolean).map((user) => ({
              uid: user.id,
              displayName: user.displayName,
              photoURL: user.photoURL,
            }));

            const priority = await getPriorityTag(
              settingsRef,
              issue.priorityId,
            );

            const relatedUserStory = issue.relatedUserStoryId
              ? await getUserStory(projectRef, issue.relatedUserStoryId)
              : undefined;

            return {
              id: issue.id,
              scrumId: issue.scrumId,
              name: issue.name,
              description: issue.description,
              priority,
              relatedUserStory,
              assignUsers,
              size: issue.size,
            };
          } catch (err) {
            throw err; // Propagate the error to the outer catch block
          }
        }),
      );

      return fixedData as IssueCol[];
    } catch (err) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  });

/**
 * Retrieves a specific issue by ID.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the issue
 * - issueId — ID of the issue to retrieve
 *
 * @returns Issue object with its details.
 *
 * @http GET /api/trpc/issues.getIssue
 */
export const getIssueProcedure = protectedProcedure
  .input(z.object({ projectId: z.string(), issueId: z.string() }))
  .query(async ({ ctx, input }) => {
    const issue = (
      await ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("issues")
        .doc(input.issueId)
        .get()
    ).data();

    if (!issue) {
      throw new Error("Issue not found");
    }

    return {
      id: input.issueId,
      ...issue,
    };
  });

/**
 * Creates a new issue in a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to create the issue in
 * - issueData — Data for the new issue, excluding the scrum ID
 *
 * @returns Object containing the ID of the created issue.
 *
 * @http POST /api/trpc/issues.createIssue
 */
export const createIssueProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      issueData: IssueSchema.omit({ scrumId: true }),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    try {
      const issueCount = await ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("issues")
        .count()
        .get();
      const issue = await ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("issues")
        .add({
          ...input.issueData,
          scrumId: issueCount.data().count + 1,
        });
      return { success: true, issueId: issue.id };
    } catch (err) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  });

/**
 * Retrieves detailed information about a specific issue.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the issue
 * - issueId — ID of the issue to retrieve details for
 *
 * @returns Detailed issue object, including tasks, tags, priority, status, and related user story.
 *
 * @http GET /api/trpc/issues.getIssueDetail
 */
export const getIssueDetailProcedure = protectedProcedure
  .input(z.object({ issueId: z.string(), projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    // Get the necessary information to construct the IssueDetail

    const { projectId, issueId } = input;
    const issueRef = ctx.firestore
      .collection("projects")
      .doc(projectId)
      .collection("issues")
      .doc(issueId);
    const issue = await issueRef.get();
    if (!issue.exists) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    const issueData = IssueSchema.parse(issue.data());

    // Fetch all the task information for the issue in parallel
    const tasks = await Promise.all(
      issueData.taskIds.map(async (taskId) => {
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
        const statusTag = await getStatusTag(
          getProjectSettingsRef(projectId, ctx.firestore),
          taskData.statusId,
        );

        return { ...taskData, id: taskId, status: statusTag };
      }),
    );

    const settingsRef = getProjectSettingsRef(input.projectId, ctx.firestore);

    let priorityTag = undefined;
    if (issueData.priorityId !== undefined) {
      priorityTag = await getPriorityTag(settingsRef, issueData.priorityId);
    }

    let statusTag = undefined;
    if (issueData.statusId !== undefined) {
      statusTag = await getStatusTag(settingsRef, issueData.statusId);
    }

    const tags = await Promise.all(
      issueData.tagIds.map(async (tagId) => {
        return await getBacklogTag(settingsRef, tagId);
      }),
    );

    let relatedUserStory = undefined;
    if (issueData.relatedUserStoryId !== "") {
      const relatedUserStoryDoc = await ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("userStories")
        .doc(issueData.relatedUserStoryId)
        .get();
      if (relatedUserStoryDoc.exists) {
        const relatedUserStoryData = UserStorySchema.parse(
          relatedUserStoryDoc.data(),
        );
        relatedUserStory = {
          id: issueData.relatedUserStoryId,
          name: relatedUserStoryData.name,
          scrumId: relatedUserStoryData.scrumId,
        };
      }
    }

    let sprint = undefined;
    if (issueData.sprintId !== "") {
      const sprintDoc = await ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("sprints")
        .doc(issueData.sprintId)
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
      id: issueId,
      scrumId: issueData.scrumId,
      name: issueData.name,
      description: issueData.description,
      stepsToRecreate: issueData.stepsToRecreate,
      completed: issueData.complete,
      size: issueData.size,
      tags: tags,
      priority: priorityTag,
      status: statusTag,
      tasks: filteredTasks,
      sprint: sprint,
      relatedUserStory: relatedUserStory,
    } as IssueDetail;
  });

/**
 * Modifies an existing issue in a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the issue
 * - issueId — ID of the issue to modify
 * - issueData — Updated data for the issue
 *
 * @returns Object indicating success status.
 *
 * @http PUT /api/trpc/issues.modifyIssue
 */
export const modifyIssueProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      issueId: z.string(),
      issueData: IssueSchema.omit({ scrumId: true, deleted: true }),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, issueId, issueData } = input;
    const issueRef = ctx.firestore
      .collection("projects")
      .doc(projectId)
      .collection("issues")
      .doc(issueId);
    await issueRef.update(issueData);
    return { success: true };
  });

/**
 * Deletes an issue from a project (soft delete).
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the issue
 * - issueId — ID of the issue to delete
 *
 * @returns Object indicating success status.
 *
 * @http DELETE /api/trpc/issues.deleteIssue
 */
export const deleteIssueProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      issueId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, issueId } = input;
    const issueRef = ctx.firestore
      .collection("projects")
      .doc(projectId)
      .collection("issues")
      .doc(issueId);
    await issueRef.update({ deleted: true });

    const tasks = await ctx.firestore
      .collection("projects")
      .doc(projectId)
      .collection("tasks")
      .where("itemType", "==", "IS")
      .where("itemId", "==", issueId)
      .get();
    const batch = ctx.firestore.batch();
    tasks.docs.forEach((task) => {
      batch.update(task.ref, { deleted: true });
    });
    await batch.commit();

    return { success: true };
  });

/**
 * Modifies tags for an issue in a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the issue
 * - issueId — ID of the issue to modify tags for
 * - size — New size for the issue (optional)
 * - priorityId — New priority ID for the issue (optional)
 * - statusId — New status ID for the issue (optional)
 *
 * @returns Object containing the updated issue data.
 *
 * @http PUT /api/trpc/issues.modifyIssuesTags
 */
export const modifyIssuesTagsProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      issueId: z.string(),
      size: z.string().optional(),
      priorityId: z.string().optional(),
      statusId: z.string().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, issueId, size, priorityId, statusId } = input;
    if (
      priorityId === undefined &&
      size === undefined &&
      statusId === undefined
    ) {
      return;
    }
    const issueRef = ctx.firestore
      .collection("projects")
      .doc(projectId)
      .collection("issues")
      .doc(issueId);
    const issueDoc = await issueRef.get();
    if (!issueDoc.exists) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Issue not found" });
    }
    const issueData = issueDoc.data() as Issue;
    const updatedIssueData = {
      ...issueData,
      priorityId: priorityId ?? issueData.priorityId,
      size: size ?? issueData.size,
      statusId: statusId ?? issueData.statusId,
    };

    await issueRef.update(updatedIssueData);
    return {
      success: true,
      issueId: issueId,
      updatedIssueData: updatedIssueData,
    };
  });

/**
 * Modifies the related user story for an issue in a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the issue
 * - issueId — ID of the issue to modify
 * - relatedUserStoryId — ID of the related user story (optional)
 *
 * @returns Object containing the updated issue data.
 *
 * @http PUT /api/trpc/issues.modifyIssuesRelatedUserStory
 */
export const modifyIssuesRelatedUserStoryProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      issueId: z.string(),
      relatedUserStoryId: z.string().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, issueId, relatedUserStoryId } = input;
    if (relatedUserStoryId === undefined) {
      return;
    }
    const issueRef = ctx.firestore
      .collection("projects")
      .doc(projectId)
      .collection("issues")
      .doc(issueId);
    const issueDoc = await issueRef.get();
    if (!issueDoc.exists) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Issue not found" });
    }
    const issueData = issueDoc.data() as Issue;
    const updatedIssueData = {
      ...issueData,
      relatedUserStoryId: relatedUserStoryId ?? issueData.relatedUserStoryId,
    };
    await issueRef.update(updatedIssueData);
    return {
      success: true,
      issueId: issueId,
      updatedIssueData: updatedIssueData,
    };
  });

/**
 * Retrieves the count of issues in a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to count issues for
 *
 * @returns Number of issues in the project.
 *
 * @http GET /api/trpc/issues.getIssueCount
 */
export const getIssueCountProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const issueCount = await ctx.firestore
      .collection("projects")
      .doc(input.projectId)
      .collection("issues")
      .where("deleted", "==", false)
      .count()
      .get();
    return issueCount.data().count;
  });

export const issuesRouter = createTRPCRouter({
  getIssuesTableFriendly: getIssuesTableFriendlyProcedure,
  getIssue: getIssueProcedure,
  createIssue: createIssueProcedure,
  getIssueDetail: getIssueDetailProcedure,
  modifyIssue: modifyIssueProcedure,
  deleteIssue: deleteIssueProcedure,
  modifyIssuesTags: modifyIssuesTagsProcedure,
  modifyIssuesRelatedUserStory: modifyIssuesRelatedUserStoryProcedure,
  getIssueCount: getIssueCountProcedure,
});
