import { Firestore } from "firebase-admin/firestore";
import { getProjectRef } from "./general";
import { Issue, Tag, WithId } from "~/lib/types/firebaseSchemas";
import { IssueSchema } from "~/lib/types/zodFirebaseSchema";
import { TRPCError } from "@trpc/server";
import { IssueCol } from "~/lib/types/columnTypes";
import { IssueDetail } from "~/lib/types/detailSchemas";
import { noTag } from "~/lib/defaultProjectValues";
import { getPriority } from "./tags";

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

export const getIssueTable = async (
  firestore: Firestore,
  projectId: string,
) => {
  const issues = await getIssues(firestore, projectId);
  const issueCols: IssueCol[] = await Promise.all(
    issues.map(async (issue): Promise<IssueCol> => {
      const priority: Tag =
        (await getPriority(firestore, projectId, issue.priorityId)) ?? noTag;
      const issueCol: IssueCol = {
        ...issue,
        priority,
        tags: [],
        assignUsers: [],
      };

      return issueCol;
    }),
  );
  return issueCols;
};

export const getIssueDetail = async (
  firestore: Firestore,
  projectId: string,
  issueId: string,
) => {
  const issue = await getIssue(firestore, projectId, issueId);

  const priority: Tag =
    (await getPriority(firestore, projectId, issue.priorityId)) ?? noTag;

  // FIXME: Load Sprint, requiredBy, dependencies, tags, status, tasks
  const userStoryDetail: IssueDetail = {
    ...issue,
    priority,
    tags: [],
    completed: false,
    tasks: [],
  };

  return userStoryDetail;
};
//#endregion
