import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

interface UserWithFiles {
  files?: {
    url: string,
    name: string
  }[]
};

export const filesRouter = createTRPCRouter({
  getUserFiles: protectedProcedure.query(async ({ctx}) => {
    const docRef = ctx.firestore.collection("users").doc(ctx.session.user.uid);
    const userDoc = await docRef.get();

    const user = userDoc.data() as UserWithFiles;
    return user.files ?? [];
  })
});
