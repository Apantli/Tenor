import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getUserList: protectedProcedure.query(async ({ ctx }) => {
    const users = await ctx.firebaseAdmin.auth().listUsers(1000);
    return users;
  }),
});
