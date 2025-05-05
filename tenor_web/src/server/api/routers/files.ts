import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

interface UserWithFiles {
  files?: {
    url: string;
    name: string;
  }[];
}

/**
 * Retrieves the list of files associated with the current user.
 *
 * @param input None
 *
 * @returns Array of files with their URLs and names.
 *
 * @http GET /api/trpc/files.getUserFiles
 */
export const getUserFilesProcedure = protectedProcedure.query(
  async ({ ctx }) => {
    const docRef = ctx.firestore.collection("users").doc(ctx.session.user.uid);
    const userDoc = await docRef.get();

    const user = userDoc.data() as UserWithFiles;
    return user.files ?? [];
  },
);

export const filesRouter = createTRPCRouter({
  getUserFiles: getUserFilesProcedure,
});
