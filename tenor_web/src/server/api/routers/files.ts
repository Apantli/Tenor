import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getGlobalUserRef, getUserRef } from "~/utils/helpers/shortcuts/users";

interface UserWithFiles {
  files?: {
    url: string;
    name: string;
  }[];
}

export const filesRouter = createTRPCRouter({
  getUserFiles: protectedProcedure.query(async ({ ctx }) => {
    const userRef = getGlobalUserRef(ctx.firestore, ctx.session.user.uid);
    const userDoc = await userRef.get();

    const user = userDoc.data() as UserWithFiles;
    return user.files ?? [];
  }),
});
