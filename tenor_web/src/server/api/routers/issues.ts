import type {
  Issue, 
  Tag,
  WithId
} from "~/lib/types/firebaseSchemas";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getProjectSettingsRef } from "./settings";
import { FieldPath } from "firebase-admin/firestore";
import { TagSchema } from "~/lib/types/zodFirebaseSchema";

// Get the issues from a designated project and sprint
// This is used to get the issues from a project and sprint
const getIssuesFromProject = async (
  dbAdmin: FirebaseFirestore.Firestore,
  projectId: string,
  sprintId: string,
) => {
  const issueRef = dbAdmin
    .collection(`projects/${projectId}/sprints/${sprintId}/issues`);
  const issueSnapshot = await issueRef.get();

  console.log("issueSnapshot", issueSnapshot.docs)

  const issues: WithId<Issue>[] = [];
  issueSnapshot.forEach((doc) => {
    const data = doc.data() as Issue;
    if (data.deleted !== true) {
      issues.push({
        id: doc.id,
        ...data,
      });
    }
  })

  return issues;
};

const createIssueTableData = async (
  data: WithId<Issue>[],
  projectId: string,
  sprintId: string,
  adAdmin: FirebaseFirestore.Firestore,
) => {
  if (data.length === 0) {
    return {
      allTags: [],
      fixedData: [],
      allStepsToRecreate: [],
      relatedUserStories: [],
    }
  }

  // Get all the tasksId, sprintId, tags and priorityIds from the issue
  const uniquePriorityIds: string[] = Array.from(
    new Set(data.map((issue) => issue.priorityId).filter(Boolean)
    ),
  );

  //Get the project settings reference
  const settingsRef = getProjectSettingsRef(projectId, adAdmin);

  //Get all the tags from the collection "priorityTypes"
  const allTagsSnapshot = await settingsRef.collection("priorityTypes").get();
  const allTags: Tag[] = allTagsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Tag),
  }));

  //Get only the tags assign to the issue
  const tagsData = await Promise.all(
    uniquePriorityIds.map(async (tagId) => {
      const tagSnap = await settingsRef
        .collection("priorityTypes")
        .doc(tagId)
        .get();
      if (!tagSnap.exists) return null;
      return { id: tagId, ...TagSchema.parse(tagSnap.data()) };
    })
  );

  const fixedData = data.map((issue) => ({
    
  }))
}

export const issuesRouter = createTRPCRouter({
  getIssuesTableFriendly: protectedProcedure.input(z.object({ projectId: z.string(), sprintId: z.string() })).query(async ({ ctx, input }) => {
    .query(async ({ ctx, input }) => {
      const rawIssues = await getIssuesFromProject(
        ctx.firestore,
        input.projectId,
        input.sprintId,
      );

      const {
        fixedData,
        allTags,
        allStepsToRecreate,
        relatedUserStories,
      } = await createIssueTableData(
        rawIssues,
        input.projectId,
        input.sprintId,
        ctx.firestoreAdmin,
      );
      return {
        fixedData,
        allTags,
        allStepsToRecreate,
        relatedUserStories,
      };
    }),

    getIssues: protectedProcedure.input(z.object({ projectId: z.string(), issueId: z.string() })).query(async ({ ctx, input }) => {
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
      }
    }),
})