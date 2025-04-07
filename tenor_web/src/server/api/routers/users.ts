import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { type TeamMember } from "~/app/_components/inputs/MemberTable";

export const userRouter = createTRPCRouter({
  getUserList: protectedProcedure.query(async ({ ctx }) => {
    const users = await ctx.firebaseAdmin.auth().listUsers(1000);
    // map users to TeamMember
    const usersList = users.users.map((user) => ({
      id: user.uid,
      photoURL: user.photoURL,
      displayName: user.displayName,
      email: user.email,
      role: "viewer_role_id", // default role
    })) as TeamMember[];
    return usersList;
  }),
});
