import type { Firestore } from "firebase-admin/firestore";
import { getGenericBacklogItemContext, getProjectRef } from "./general";
import type {
  Issue,
  Sprint,
  StatusTag,
  Tag,
  WithId,
} from "~/lib/types/firebaseSchemas";
import { IssueSchema } from "~/lib/types/zodFirebaseSchema";
import { TRPCError } from "@trpc/server";
import type { IssueCol } from "~/lib/types/columnTypes";
import type { IssueDetail } from "~/lib/types/detailSchemas";
import {
  getBacklogTag,
  getBacklogTagsContext,
  getPriority,
  getStatusType,
} from "./tags";
import { getUserStory } from "./userStories";
import { getSprint } from "./sprints";
import admin from "firebase-admin";
import {
  deleteTaskAndGetModified,
  getTasksFromItem,
  getTasksRef,
  getTaskTable,
} from "./tasks";
import { getUser } from "./users";

/**
 * @function getIssuesRef
 * @description Gets a reference to the issues collection for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {FirebaseFirestore.CollectionReference} A reference to the issues collection
 */
export const getIssuesRef = (firestore: Firestore, projectId: string) => {
  return getProjectRef(firestore, projectId).collection("issues");
};

/**
 * @function getIssueRef
 * @description Gets a reference to a specific issue document
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param issueId The ID of the issue
 * @returns {FirebaseFirestore.DocumentReference} A reference to the issue document
 */
export const getIssueRef = (
  firestore: Firestore,
  projectId: string,
  issueId: string,
) => {
  return getIssuesRef(firestore, projectId).doc(issueId);
};

// TODO: This may overlap, this isnt quite right
/**
 * @function getIssueNewId
 * @description Gets the next available issue ID for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {Promise<number>} The next available issue ID
 */
export const getIssueNewId = async (
  firestore: Firestore,
  projectId: string,
) => {
  const issuesRef = getIssuesRef(firestore, projectId).count().get();
  const issuesCount = (await issuesRef).data().count;
  return issuesCount + 1;
};

/**
 * @function getIssues
 * @description Retrieves all non-deleted issues associated with a specific project
 * @param {Firestore} firestore - The Firestore database instance
 * @param {string} projectId - The ID of the project to retrieve issues from
 * @returns {Promise<WithId<Issue>[]>} An array of issue objects with their IDs
 */
export const getIssues = async (firestore: Firestore, projectId: string) => {
  const issuesRef = getIssuesRef(firestore, projectId)
    .where("deleted", "==", false)
    .orderBy("scrumId", "desc");
  const issuesSnapshot = await issuesRef.get();
  const issues: WithId<Issue>[] = issuesSnapshot.docs.map((doc) => {
    return {
      id: doc.id,
      ...IssueSchema.parse(doc.data()),
    } as WithId<Issue>;
  });
  return issues;
};

/**
 * @function getIssuesAfter
 * @description Retrieves all non-deleted issues associated with a specific project after a specified date
 * @param {Firestore} firestore - The Firestore database instance
 * @param {string} projectId - The ID of the project to retrieve issues from
 * @param {Date} date - The date to filter issues by. Issues created after this date will be returned
 * @returns {Promise<WithId<Issue>[]>} An array of issue objects with their IDs
 */
export const getIssuesAfter = async (
  firestore: Firestore,
  projectId: string,
  date: Date,
) => {
  const issuesRef = getIssuesRef(firestore, projectId)
    .where("deleted", "==", false)
    .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(date));
  const issuesSnapshot = await issuesRef.get();
  const issues: WithId<Issue>[] = issuesSnapshot.docs.map((doc) => {
    return {
      id: doc.id,
      ...IssueSchema.parse(doc.data()),
    } as WithId<Issue>;
  });
  return issues;
};

/**
 * @function getSprintIssues
 * @description Retrieves all non-deleted issues associated with a specific sprint withing a project
 * @param {Firestore} firestore - The Firestore database instance
 * @param {string} projectId - The ID of the project to retrieve issues from
 * @param {string} sprintId - The ID of the sprint
 * @returns {Promise<WithId<Issue>[]>} An array of issue objects with their IDs
 */
export const getSprintIssues = async (
  firestore: Firestore,
  projectId: string,
  sprintId: string,
) => {
  const issuesRef = getIssuesRef(firestore, projectId)
    .where("deleted", "==", false)
    .where("sprintId", "==", sprintId);

  const issuesSnapshot = await issuesRef.get();
  const issues: WithId<Issue>[] = issuesSnapshot.docs.map((doc) => {
    return {
      id: doc.id,
      ...IssueSchema.parse(doc.data()),
    } as WithId<Issue>;
  });
  return issues;
};

/**
 * @function getIssue
 * @description Retrieves a specific issue from the Firestore database
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param issueId The ID of the issue
 * @returns {Promise<WithId<Issue>>} The issue object validated by IssueSchema or undefined if not found
 */
export const getIssue = async (
  firestore: Firestore,
  projectId: string,
  issueId: string,
) => {
  const issueRef = getIssueRef(firestore, projectId, issueId);
  const issueSnapshot = await issueRef.get();
  if (!issueSnapshot.exists) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Issue not found",
    });
  }
  return {
    id: issueSnapshot.id,
    ...IssueSchema.parse(issueSnapshot.data()),
  } as WithId<Issue>;
};

/**
 * @function getIssueTable
 * @description Retrieves all issues for a specific project and formats them into a table structure
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {Promise<IssueCol[]>} An array of issue objects formatted for display in a table
 */
export const getIssueTable = async (
  admin: admin.app.App,
  firestore: Firestore,
  projectId: string,
) => {
  const issues = await getIssues(firestore, projectId);
  const issueCols: IssueCol[] = await Promise.all(
    issues.map(async (issue): Promise<IssueCol> => {
      const priority: Tag | undefined = issue.priorityId
        ? await getPriority(firestore, projectId, issue.priorityId)
        : undefined;

      let relatedUserStory = undefined;
      if (issue.relatedUserStoryId) {
        relatedUserStory = await getUserStory(
          firestore,
          projectId,
          issue.relatedUserStoryId,
        );
      }

      const tasks = await getTasksFromItem(firestore, projectId, issue.id);
      const userIds = tasks
        .map((task) => task.assigneeId)
        .filter((id) => id !== "");
      const uniqueUserIds = Array.from(new Set(userIds));
      const assignedUsers = await Promise.all(
        uniqueUserIds.map(async (userId) => {
          const user = await getUser(admin, firestore, projectId, userId);
          return {
            uid: user.id,
            displayName: user.displayName,
            photoURL: user.photoURL,
          };
        }),
      );

      const issueCol: IssueCol = {
        ...issue,
        priority: priority,
        tags: [],
        assignUsers: assignedUsers,
        relatedUserStory: relatedUserStory
          ? {
              id: relatedUserStory?.id,
              name: relatedUserStory?.name,
              scrumId: relatedUserStory?.scrumId,
              description: relatedUserStory?.description,
              deleted: relatedUserStory?.deleted,
            }
          : undefined,
      };

      return issueCol;
    }),
  );
  return issueCols;
};

/**
 * @function getIssueDetail
 * @description Retrieves detailed information about a specific issue
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param issueId The ID of the issue
 * @returns {Promise<IssueDetail>} The detailed issue object
 */
export const getIssueDetail = async (
  admin: admin.app.App,
  firestore: Firestore,
  projectId: string,
  issueId: string,
) => {
  const issue = await getIssue(firestore, projectId, issueId);

  const priority: Tag | undefined = issue.priorityId
    ? await getPriority(firestore, projectId, issue.priorityId)
    : undefined;

  const status: StatusTag | undefined = issue.statusId
    ? await getStatusType(firestore, projectId, issue.statusId)
    : undefined;

  const tags: Tag[] = await Promise.all(
    issue.tagIds.map(async (tagId) => {
      return await getBacklogTag(firestore, projectId, tagId);
    }),
  );

  const relatedUserStory = issue.relatedUserStoryId
    ? await getUserStory(firestore, projectId, issue.relatedUserStoryId)
    : undefined;

  const sprint: WithId<Sprint> | undefined = issue.sprintId
    ? await getSprint(firestore, projectId, issue.sprintId)
    : undefined;

  const tasks = await getTaskTable(admin, firestore, projectId, issueId);

  const userStoryDetail: IssueDetail = {
    ...issue,
    sprint,
    priority,
    status,
    tags,
    relatedUserStory,
    completed: false,
    tasks,
  };

  return userStoryDetail;
};

/**
 * @function getIssuesContext
 * @description Retrieves all issues for a specific project and formats them into a context string
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {Promise<string>} A formatted string containing all issues
 */
export const getIssuesContext = async (
  firestore: Firestore,
  projectId: string,
) => {
  const issues = await getIssues(firestore, projectId);
  let issuesContext = "# EXISTING ISSUES\n\n";
  issues.forEach((issue) => {
    issuesContext += `- id: ${issue.id}\n- name: ${issue.name}\n- description: ${issue.description}\n- stepsToRecreate: ${issue.stepsToRecreate}\n\n`;
  });
  return issuesContext;
};

export const getIssueContextSolo = async (
  firestore: Firestore,
  projectId: string,
  issueId: string,
) => {
  const issue = await getIssue(firestore, projectId, issueId);

  // Issue context
  const itemContext = await getGenericBacklogItemContext(
    firestore,
    projectId,
    issue.name,
    issue.description,
    issue.priorityId,
    issue.size,
  );

  // Related user story context
  const userStory = issue.relatedUserStoryId
    ? await getUserStory(firestore, projectId, issue.relatedUserStoryId ?? "")
    : "";
  const userStoryContext = userStory
    ? `- related user story: ${userStory.name}\n`
    : "";

  // Related tags context
  const tagContext = await getBacklogTagsContext(
    firestore,
    projectId,
    issue.tagIds,
  );

  return `# ISSUE DETAILS\n
${itemContext}
- steps to reproduce: ${issue.stepsToRecreate}
${userStoryContext}
${tagContext}\n
`;
};

/**
 * @function deleteIssueAndGetModified
 * @description Deletes a single issue and returns the IDs of modified tasks
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @param {string} issueId - The ID of the issue to delete
 * @returns {Promise<{modifiedTasks: string[]}>} Object containing arrays of modified task IDs
 */
export const deleteIssueAndGetModified = async (
  firestore: Firestore,
  projectId: string,
  issueId: string,
): Promise<{ modifiedTasks: string[] }> => {
  const issueRef = getIssueRef(firestore, projectId, issueId);

  // Mark the user story as deleted
  await issueRef.update({ deleted: true });

  // Delete associated tasks
  const tasksSnapshot = await getTasksRef(firestore, projectId)
    .where("deleted", "==", false)
    .where("itemType", "==", "IS")
    .where("itemId", "==", issueId)
    .get();

  const allModifiedTasks = new Set<string>();
  const batch = firestore.batch();

  // Process each task and its dependencies
  await Promise.all(
    tasksSnapshot.docs.map(async (taskDoc) => {
      const taskId = taskDoc.id;
      allModifiedTasks.add(taskId);

      const tempModifiedTasks = await deleteTaskAndGetModified(
        firestore,
        projectId,
        taskId,
      );
      tempModifiedTasks.forEach((task) => {
        allModifiedTasks.add(task);
      });
    }),
  );

  await batch.commit();

  return {
    modifiedTasks: Array.from(allModifiedTasks),
  };
};
