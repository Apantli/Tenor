import { z } from "zod";
import type { WithId, Tag } from "~/lib/types/firebaseSchemas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { Task } from "~/lib/types/firebaseSchemas";
import { TRPCError } from "@trpc/server";
import {
  TagSchema,
  TaskSchema,
} from "~/lib/types/zodFirebaseSchema";
import type { TaskDetail } from "~/lib/types/detailSchemas";
import { getProjectSettingsRef } from "./settings";


export interface TaskCol {
  id: string;
  scrumId: number;
  title: string;
  status: Tag;
  assignee?: {
    uid: string;
    displayName: string;
    photoURL: string;
  };
}

// const getTasksFromProject = async (
//   dbAdmin: FirebaseFirestore.Firestore,
//   projectId: string,
// ) => {
//   const taskCollectionRef = dbAdmin
//     .collection(`projects/${projectId}/tasks`)
//     .where("deleted", "==", false)
//     .orderBy("scrumId");
//   const snap = await taskCollectionRef.get();

//   const docs = snap.docs.map((doc) => {
//     return {
//       id: doc.id,
//       ...doc.data(),
//     };
//   });

//   const tasks: WithId<Task>[] = docs.filter(
//     (task): task is WithId<Task> => task !== null,
//   );

//   return tasks;
// };

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

const getStatusTag = async (
  settingsRef: FirebaseFirestore.DocumentReference,
  taskId: string,
) => {
  if (taskId === undefined) {
    return undefined;
  }
  const tag = await settingsRef.collection("statusTypes").doc(taskId).get();
  if (!tag.exists) {
    return undefined;
  }
  return { id: tag.id, ...TagSchema.parse(tag.data()) } as Tag;
};

export const tasksRouter = createTRPCRouter({
  createTask: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        taskData: TaskSchema.omit({ scrumId: true , finishedDate: true}),
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
            const assigneeData = await ctx.firebaseAdmin.auth().getUser(task.assigneeId);
            assignee = {
              uid: assigneeData.uid,
              displayName: assigneeData.displayName,
              photoURL: assigneeData.photoURL,
            }
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

  getTaskDetail: protectedProcedure
    .input(z.object({projectId: z.string(), taskId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get the necessary information to construct the UserStoryDetail

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
      // Fetch all the task information for the user story in parallel

      const settingsRef = getProjectSettingsRef(input.projectId, ctx.firestore);

      let statusTag = undefined;
      if (taskData.statusId !== undefined) {
        statusTag = await getStatusTag(
          settingsRef,
          taskData.statusId,
        );
      }

      let assignee = undefined;
      if(taskData.assigneeId !== undefined) {
        const userRef = await ctx.firebaseAdmin.auth().getUser(taskData.assigneeId);
        assignee = {
          uid: userRef.uid,
          displayName: userRef.displayName,
          photoURL: userRef.photoURL,}
      }
 
      return {
        id: taskId,
        scrumId: taskData.scrumId,
        name: taskData.name,
        description: taskData.description,
        status: statusTag,
        size: taskData.size,
        assignee: assignee,
        dueDate: taskData.dueDate?.toDate(),
      } as TaskDetail;
    }),

  modifyTask: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        taskId: z.string(),
        taskData: TaskSchema.omit({ scrumId: true, deleted: true }),
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
      await taskRef.update({statusId});
      return { success: true };
    }),

    // deleted task 
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
});