import { z } from "zod";
import type {Issue, WithId, Tag, Size } from "~/lib/types/firebaseSchemas";
import type { UserStory } from "~/lib/types/firebaseSchemas";
import { TRPCError } from "@trpc/server";
import {
  EpicSchema,
  ExistingUserStorySchema,
  IssueSchema,
  SprintSchema,
  TaskSchema,
  UserStorySchema,
} from "~/lib/types/zodFirebaseSchema";
import type { ExistingUserStory, UserStoryDetail } from "~/lib/types/detailSchemas";
import { getEpic } from "./epics";
import { getSprint } from "./sprints";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getProjectSettingsRef } from "./settings";
import { FieldPath } from "firebase-admin/firestore";
import { TagSchema } from "~/lib/types/zodFirebaseSchema";
import { all, is } from "node_modules/cypress/types/bluebird";
import { settings } from ".eslintrc.cjs";

export interface IssueCol {
  id: string;
  scrumId: number;
  name: string;
  description: string;
  priority: Tag;
  relatedUserStory: ExistingUserStory;
  size: Size;
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

const getPriorityTag = async (
  settingsRef: FirebaseFirestore.DocumentReference,
  priorityId: string,
) => {
  if (priorityId === undefined) {
    return undefined;
  }
  const tag = await settingsRef
    .collection("priorityTypes")
    .doc(priorityId)
    .get();
  if (!tag.exists) {
    return undefined;
  }
  return { id: tag.id, ...TagSchema.parse(tag.data()) } as Tag;
}

const getBacklogTag = async (
  settingsRef: FirebaseFirestore.DocumentReference,
  taskId: string,
) => {
  if (taskId === undefined) {
    return undefined;
  }

  const tag = await settingsRef.collection("backlogTags").doc(taskId).get();
  if (!tag.exists) {
    return undefined;
  }
  return { id: tag.id, ...TagSchema.parse(tag.data()) } as Tag;
}

const getUserStory = async (
  settingsRef: FirebaseFirestore.DocumentReference,
  userStoryId: string,
) => {
  if (userStoryId === undefined) {
    return undefined;
  }
  const userStory = await settingsRef
    .collection("userStories")
    .doc(userStoryId)
    .get();
  if (!userStory.exists) {
    return undefined;
  }
  return { id: userStory.id, ...ExistingUserStorySchema.parse(userStory.data()) } as ExistingUserStory;
}

// const createIssueTableData = async (
//   data: WithId<Issue>[],
//   projectId: string,
//   adAdmin: FirebaseFirestore.Firestore,
// ) => {
//   if (data.length === 0) {
//     return {
//       allTags: [],
//       fixedData: [],
//       allStepsToRecreate: [],
//       relatedUserStories: [],
//     }
//   }

//   // Get all the tasksId, sprintId, tags, userStories priorityIds from the issue
//   const uniquePriorityIds: string[] = Array.from(
//     new Set(data.map((issue) => issue.priorityId).filter(Boolean)
//     ),
//   );

//   //Get the project settings reference
//   const settingsRef = getProjectSettingsRef(projectId, adAdmin);

//   //Get all the tags from the collection "priorityTypes"
//   const allTagsSnapshot = await settingsRef.collection("priorityTypes").get();
//   const allTags: Tag[] = allTagsSnapshot.docs.map((doc) => ({
//     id: doc.id,
//     ...(doc.data() as Tag),
//   }));

//   //Get only the tags assign to the issue
//   const tagsData = await Promise.all(
//     uniquePriorityIds.map(async (tagId) => {
//       const tagSnap = await settingsRef
//         .collection("priorityTypes")
//         .doc(tagId)
//         .get();
//       if (!tagSnap.exists) return null;
//       return { id: tagId, ...TagSchema.parse(tagSnap.data()) };
//     })
//   );

//   // Map the tags to their ids
//   const tagMap = new Map(
//     tagsData.filter((tag): tag is Tag & { id:string} => tag !== null).map((tag) => [tag.id, tag]),
//   );

//   const fixedData = data.map((issue) => ({
//     id: issue.id,
//     name: issue.name,
//     scrumId: issue.scrumId,
//     description: issue.description,
//     priority: tagMap.get(issue.priorityId ?? "") ?? {
//       id: "unknown",
//       name: "Unknown",
//       color: "#000000",
//       deleted: false,
//     },
//     size: Array.isArray(issue.size) ? issue.size[0] : issue.size,
//     relatedUserStoryId: Array.isArray(issue.relatedUserStoryId) ? issue.relatedUserStoryId[0] : issue.relatedUserStoryId,
//     tags: issue.tagIds.map((tagId) => tagMap.get(tagId) ?? {
//       id: "unknown",
//       name: "Unknown",
//       color: "#000000",
//       deleted: false,
//     }),
//   })) as IssueCol[];

//   return {
//     allTags,
//     fixedData,
//     allStepsToRecreate: [],
//   relatedUserStories: [], 
//   };
// };

export const issuesRouter = createTRPCRouter({
  getIssuesTableFriendly: protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
      const rawIssues = await getIssuesFromProject(
        ctx.firestore,
        input.projectId,
      );

      const settingsRef = getProjectSettingsRef(input.projectId, ctx.firestore);

      const fixedData = await Promise.all(
        rawIssues.map(async (issue) => {
          return {
            id: issue.id,
            scrumId: issue.scrumId,
            name: issue.name,
            description: issue.description,
            priority: await getPriorityTag(
              settingsRef,
              issue.priorityId,
            ),
            relatedUserStory: await getUserStory(
              settingsRef,
              issue.relatedUserStoryId,
            ),
            size: issue.size,
          };
        }),
      );

      return fixedData as IssueCol[];
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
  modifyIssue: protectedProcedure
    .input(IssueSchema.extend({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const issueRef = ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("issues");
      
      const issueDocs = await issueRef
        .where("scrumId", "==", input.scrumId)
        .get();
      if (issueDocs.empty) {
        throw new Error("Issue not found");
      }
      const issueDoc = issueDocs.docs[0];
      await issueDoc?.ref.update(input);
      return "Issue updated successfully";
    }),

  getIssueDetail: protectedProcedure
    .input(z.object({ projectId: z.string(), issueId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get the necesary information to construct the issue detail

      const { projectId, issueId } = input;
      const issueRef = ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("issues")
        .doc(issueId);
      const issueDoc = await issueRef.get();
      if (!issueDoc.exists) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Issue not found" });
      }

      const issueData = IssueSchema.parse(issueDoc.data());
      // Fetch all the tasks information from the issues in parallel
      const tasks = await Promise.all(
        issueData.taskIds.map(async (taskId) => {
          const taskRef = ctx.firestore
            .collection("projects")
            .doc(projectId)
            .collection("tasks")
            .doc(taskId);
          const taskDoc = await taskRef.get();
          if (!taskDoc.exists) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
          }
          const taskData = TaskSchema.parse(taskDoc.data());

          const statusTag = TagSchema.parse(
            {name: "Done",
            color: "#00FF00",
            deleted: false,}
          );

          return { ...taskData, id: taskId, status: statusTag };
        }),
      );

      const settingsRef = getProjectSettingsRef(projectId, ctx.firestore);
      
      let priorityTag = undefined;
      if (issueData.priorityId !== undefined) {
        priorityTag = await getPriorityTag(
          settingsRef,
          issueData.priorityId,
        );
      }

      const tags = await Promise.all(
        issueData.tagIds.map(async (tagId) => {
          return await getBacklogTag(settingsRef, tagId);
        }),
      )

      let relatedUserStoryId = undefined;
      if (issueData.relatedUserStoryId !== undefined) {
        relatedUserStoryId = await getUserStory(
          settingsRef,
          issueData.relatedUserStoryId,
        );
      }

      const filteredTasks = tasks.filter((task) => task.deleted !== true);
      return {
        id: issueId,
        scrumId: issueData.scrumId,
        name: issueData.name,
        description: issueData.description,
        stepsToRecreate: issueData.stepsToRecreate,
        size: issueData.size,
        priority: priorityTag,
        relatedUserStory: relatedUserStoryId,
        tags: tags
      } as IssueCol
    }
  ),

  modifyIssuesTags: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      issueId: z.string(),
      size: z.string().optional(),
      priorityId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { projectId, issueId, size, priorityId } = input;
      if (priorityId === undefined && size === undefined) {
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
      };
      await issueRef.update(updatedIssueData);
      return { success: true, issueId: issueId, updatedIssueData: updatedIssueData };
    }),

  modifyIssuesRelatedUserStory: protectedProcedure
    .input(z.object({ projectId: z.string(), issueId: z.string(), relatedUserStoryId: z.string().optional() }))
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
      return { success: true, issueId: issueId, updatedIssueData: updatedIssueData };
    }),
  }
);