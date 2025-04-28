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
  TaskSchema,
  UserStorySchema,
} from "~/lib/types/zodFirebaseSchema";
import type {
  ExistingUserStory,
  IssueDetail,
} from "~/lib/types/detailSchemas";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  getProjectSettingsRef,
  getBacklogTag,
  getPriorityTag,
  getProjectRef,
} from "./settings";
import { TagSchema } from "~/lib/types/zodFirebaseSchema";
import { console } from "inspector";
import * as admin from "firebase-admin";
import { dbAdmin } from "~/utils/firebaseAdmin";

// Asegúrate de inicializar el admin SDK si no lo has hecho aún
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
    console.error("Error fetching issues:", err);
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
    (doc) => doc.id === userStoryId
  );

  if (!userStoryDoc) {
    return undefined;
  }

  return { id: userStoryDoc.id, ...ExistingUserStorySchema.parse(userStoryDoc.data()) } as ExistingUserStory;
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
      const userRecord = await admin
        .auth()
        .getUser(userId)
      return {
        id: userRecord.uid,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
      };
    })
  );

  const filteredUsers = users.filter((user): user is User => Boolean(user?.id));

  const uniqueUsers: User[] = Array.from(
    new Map(filteredUsers.map((u) => [u.id, u])).values()
  );

  return uniqueUsers;
};


export const issuesRouter = createTRPCRouter({
  getIssuesTableFriendly: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {

        const rawIssues = await getIssuesFromProject(
          ctx.firestore,
          input.projectId,
        );

        const settingsRef = getProjectSettingsRef(
          input.projectId,
          ctx.firestore,
        );

        const projectRef = getProjectRef(input.projectId, ctx.firestore);

        const fixedData = await Promise.all(
          rawIssues.map(async (issue) => {
          try {

            const rawUsers = await getTasksAssignUsers(
              ctx.firestore,
              input.projectId,
              issue.id
            );
      
            const assignUsers = rawUsers
              .filter(Boolean)
              .map((user) => ({
                uid: user.id,
                displayName: user.displayName,
                photoURL: user.photoURL,
            }));

              const priority = await getPriorityTag(settingsRef, issue.priorityId);

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
                size: issue.size
              };
            }
            catch (err){
              console.error("Error processing issue:", issue.id, err);
              throw err;  // Propagar el error hacia el bloque catch principal), 
            }
          })
        );

        return fixedData as IssueCol[];
      } catch (err) {
        console.log("Error getting issues:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  getIssue: protectedProcedure
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

  getIssueDetail: protectedProcedure
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
          const statusTag = TagSchema.parse({
            name: "Done",
            color: "#00FF00",
            deleted: false,
          });

          return { ...taskData, id: taskId, status: statusTag };
        }),
      );

      const settingsRef = getProjectSettingsRef(input.projectId, ctx.firestore);

      let priorityTag = undefined;
      if (issueData.priorityId !== undefined) {
        priorityTag = await getPriorityTag(settingsRef, issueData.priorityId);
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
        tasks: filteredTasks,
        sprint: sprint,
        relatedUserStory: relatedUserStory,
      } as IssueDetail;
    }),

  modifyIssue: protectedProcedure
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
    }),

  deleteIssue: protectedProcedure
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
      return { success: true };
    }),

  modifyIssuesTags: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        issueId: z.string(),
        size: z.string().optional(),
        priorityId: z.string().optional(),
      }),
    )
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
      return {
        success: true,
        issueId: issueId,
        updatedIssueData: updatedIssueData,
      };
    }),

  modifyIssuesRelatedUserStory: protectedProcedure
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
    }),
});
