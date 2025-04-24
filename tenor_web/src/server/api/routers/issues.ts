import { z } from "zod";
import type {Issue, WithId, Tag, Size } from "~/lib/types/firebaseSchemas";
import type { UserStory } from "~/lib/types/firebaseSchemas";
import { TRPCError } from "@trpc/server";
import {
  EpicSchema,
  IssueSchema,
  SprintSchema,
  TaskSchema,
  UserStorySchema,
} from "~/lib/types/zodFirebaseSchema";
import type { UserStoryDetail } from "~/lib/types/detailSchemas";
import { getEpic } from "./epics";
import { getSprint } from "./sprints";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getProjectSettingsRef } from "./settings";
import { FieldPath } from "firebase-admin/firestore";
import { TagSchema } from "~/lib/types/zodFirebaseSchema";
import { all, is } from "node_modules/cypress/types/bluebird";

export interface IssueCol {
  id: string;
  scrumId: number;
  name?: string;
  description: string;
  priorityId: Tag;
  relatedUserStoryId: string;
  stepsToRecreate: string[];
}

// Get the issues from a designated project and sprint
// This is used to get the issues from a project and sprint
const getIssuesFromProject = async (
  dbAdmin: FirebaseFirestore.Firestore,
  projectId: string,
) => {
  const issueRef = dbAdmin
    .collection(`projects/${projectId}/issues`)
    .orderBy("scrumId", "asc");
  const issueSnapshot = await issueRef.get();

  console.log("issueSnapshot", issueSnapshot.docs);
  console.log("issue docs", issueSnapshot.docs.map(doc => doc.data()));

  const issues: WithId<Issue>[] = [];
  issueSnapshot.forEach((doc) => {
    const data = doc.data() as Issue;
    if (data.deleted !== true) {
      issues.push({ id: doc.id, ...data,});
    }
  })

  return issues;
};

const createIssueTableData = async (
  data: WithId<Issue>[],
  projectId: string,
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

  // Map the tags to their ids
  const tagMap = new Map(
    tagsData.filter((tag): tag is Tag & { id:string} => tag !== null).map((tag) => [tag.id, tag]),
  );

  const fixedData = data.map((issue) => ({
    id: issue.id,
    name: issue.name,
    scrumId: issue.scrumId,
    description: issue.description,
    priorityId: tagMap.get(issue.priorityId ?? "") ?? {
      id: "unknown",
      name: "Unknown",
      color: "#000000",
      deleted: false,
    },
    size: issue.size,
    relatedUserStoryId: issue.relatedUserStoryId,
    stepsToRecreate: Array.isArray(issue.stepsToRecreate) ? issue.stepsToRecreate : [],
  })) as IssueCol[];

  return {
    allTags,
    fixedData,
    allStepsToRecreate: [],
  relatedUserStories: [], 
  };
};

export const issuesRouter = createTRPCRouter({
  getIssuesTableFriendly: protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
      const rawIssues = await getIssuesFromProject(
        ctx.firestore,
        input.projectId,
      );

      const {
        fixedData,
        allTags,
        allStepsToRecreate,
        relatedUserStories,
      } = await createIssueTableData(
        rawIssues,
        input.projectId,
        ctx.firestore,
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
    createIssue: protectedProcedure
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
        console.log("Error creating issue:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
})