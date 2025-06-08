/**
 * Files Router - Tenor API Endpoints for File Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing user files in the Tenor application.
 * It provides endpoints to retrieve file information associated with users.
 *
 * The router includes procedures for:
 * - Retrieving files associated with the current user
 *
 * Files are stored as metadata in user documents and may include URLs and file names
 * for resources uploaded by or associated with users.
 *
 * @category API
 */

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getGlobalUserRef } from "../shortcuts/users";

interface UserWithFiles {
  files?: {
    url: string;
    name: string;
  }[];
}

/**
 * Retrieves files associated with the current user.
 *
 * @param input None
 *
 * @returns Array of file objects containing URL and name information.
 *
 * @http GET /api/trpc/files.getUserFiles
 */
export const getUserFilesProcedure = protectedProcedure.query(
  async ({ ctx }) => {
    const userRef = getGlobalUserRef(ctx.firestore, ctx.session.user.uid);
    const userDoc = await userRef.get();

    const user = userDoc.data() as UserWithFiles;
    return user.files ?? [];
  },
);

export const filesRouter = createTRPCRouter({
  getUserFiles: getUserFilesProcedure,
});
