import { FieldPath, FieldValue, Timestamp } from "firebase-admin/firestore";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  SprintInfoSchema,
  SprintSchema,
  TagSchema,
  UserStorySchema,
} from "~/lib/types/zodFirebaseSchema";
import { z } from "zod";

export const sprintsRouter = createTRPCRouter({

  getTasks: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      
    }),

});
