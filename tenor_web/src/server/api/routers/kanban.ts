import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

import { z } from "zod";
import { getTasksFromProject } from "./tasks";
import type { Tag, WithId } from "~/lib/types/firebaseSchemas";

export interface CardItem {
  id: string;
  scrumId: number;
  name: string;
  size: "XS" | "S" | "M" | "L" | "XL" | "XXL" | undefined;
  tags: {
    deleted: boolean;
    id: string;
    name: string;
    color: string;
  }[];
  columnId: string;
}

export interface CardTask extends CardItem {
  itemId: string;
  itemType: "US" | "IS" | "IT"; // US = user story, IS = issue, ITEM = generic item
}

const getAllStatuses = async (
  dbAdmin: FirebaseFirestore.Firestore,
  projectId: string,
) => {
  const statusesRef = dbAdmin
    .collection("projects")
    .doc(projectId)
    .collection("settings")
    .doc("settings")
    .collection("statusTypes");
  const snap = await statusesRef.get();

  const docs = snap.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
    };
  });
  console.log("Raw Statuses", docs);

  return docs as WithId<Tag>[];
};

export const kanbanRouter = createTRPCRouter({
  getTasksForKanban: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tasks = await getTasksFromProject(ctx.firestore, input.projectId);
      const items = tasks.map((task) => {
        const {
          id,
          scrumId,
          name,
          description,
          size,
          statusId,
          itemType,
          itemId,
        } = task;
        return {
          id,
          scrumId,
          name,
          description,
          size,
          tags: [],
          columnId: statusId,
          itemType,
          itemId,
        } as CardTask;
      });

      const columns = await getAllStatuses(ctx.firestore, input.projectId);
      const activeColumns = columns.filter(
        (column) => column.deleted === false,
      );

      const columnsWithItems = activeColumns.map((column) => ({
        id: column.id,
        name: column.name,
        color: column.color,

        itemIds: items
          .filter((item) => item.columnId === column.id)
          .map((item) => item.id),
      }));

      return {
        columns: columnsWithItems,
        items: Object.fromEntries(items.map((item) => [item.id, item])),
      };
    }),

  createStatusList: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string(),
        color: z.string(),
        marksTaskAsDone: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, name, color, marksTaskAsDone } = input;

      const statusRef = ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("settings")
        .doc("settings")
        .collection("statusTypes");

      const newStatus = {
        name,
        color: color.toUpperCase(),
        marksTaskAsDone,
        deleted: false,
      };

      const docRef = await statusRef.add(newStatus);
      return {
        id: docRef.id,
        ...newStatus,
      };
    }),
});
