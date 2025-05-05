/**
 * Files Router - Tenor API Endpoints for File Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing files in the Tenor application.
 * It provides endpoints to retrieve user-associated files.
 * 
 * The router currently includes procedures for:
 * - Retrieving files associated with the current user
 *
 * File management is a supporting feature that allows users to access and manage their
 * uploaded files across the application.
 *
 * @category API
 */

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
