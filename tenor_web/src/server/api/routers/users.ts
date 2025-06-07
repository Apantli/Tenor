/**
 * Users Router - Tenor API Endpoints for User Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing Users in the Tenor application.
 * It provides endpoints to create, modify, and retrieve global users and within projects.
 *
 * The router includes procedures for:
 * - Retrieving global users and filtering by search criteria
 * - Getting and managing user access to projects
 * - Updating user roles and profiles
 * - Adding and removing users from projects
 *
 * @category API
 */

import {
  createTRPCRouter,
  protectedProcedure,
  roleRequiredProcedure,
} from "~/server/api/trpc";
import { z } from "zod";
import {
  settingsPermissions,
  usersPermissions,
} from "~/lib/defaultValues/permission";
import {
  getGlobalUserPreview,
  getGlobalUserPreviews,
  getGlobalUserRef,
  getUserRef,
  getUsers,
  getUserTable,
  getWritableUsers,
} from "../shortcuts/users";
import { emptyRole } from "~/lib/defaultValues/roles";
import { uploadBase64File } from "~/lib/db/firebaseBucket";
import { forbidden, notFound } from "~/server/errors";

/**
 * Retrieves a list of users from Firebase Auth and filters them based on the input filter.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - filter - Optional string to search for in user emails and display names
 *
 * @returns Array of filtered user objects
 *
 * @http GET /api/trpc/users.getGlobalUsers
 */
export const getGlobalUsersProcedure = protectedProcedure
  .input(z.object({ filter: z.string().optional() }))
  .query(async ({ ctx, input }) => {
    const { filter } = input;
    const users = await getGlobalUserPreviews(ctx.firebaseAdmin.app());

    // Get the users based on the filter
    return users.filter((user) =>
      (user.displayName ?? "")
        .toLowerCase()
        .includes(filter?.toLowerCase() ?? ""),
    );
  });

/**
 * Retrieves a specific global user by their user ID.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - userId - String ID of the user to retrieve
 *
 * @returns User object for the specified user
 *
 * @http GET /api/trpc/users.getGlobalUser
 */
export const getGlobalUserProcedure = protectedProcedure
  .input(z.object({ userId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { userId } = input;
    return await getGlobalUserPreview(ctx.firebaseAdmin.app(), userId);
  });

/**
 * Retrieves a list of users from Firestore based on the project ID.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project to get users for
 *
 * @returns Array of user objects associated with the project
 *
 * @http GET /api/trpc/users.getUsers
 */
export const getUsersProcedure = roleRequiredProcedure(usersPermissions, "read")
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    return await getUsers(ctx.firebaseAdmin.app(), ctx.firestore, projectId);
  });

/**
 * Retrieves a table of users from Firestore based on the project ID.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project to get users for
 * - filter - Optional string to filter users
 *
 * @returns Array of user objects formatted as a table
 *
 * @http GET /api/trpc/users.getUserTable
 */
export const getUserTableProcedure = roleRequiredProcedure(
  usersPermissions,
  "read",
)
  .input(z.object({ projectId: z.string(), filter: z.string().optional() }))
  .query(async ({ ctx, input }) => {
    return await getUserTable(
      ctx.firebaseAdmin.app(),
      ctx.firestore,
      input.projectId,
    );
  });

/**
 * Adds a user to a project or reactivates them if they were previously deactivated.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project to add the user to
 * - userId - String ID of the user to add
 *
 * @returns None
 *
 * @http POST /api/trpc/users.addUser
 */
export const addUserProcedure = roleRequiredProcedure(
  settingsPermissions,
  "write",
)
  .input(z.object({ projectId: z.string(), userId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { projectId, userId } = input;

    // search if it exists
    const userRef = getUserRef(ctx.firestore, projectId, userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      // add user to project
      await userRef.set({
        roleId: emptyRole.id,
        active: true,
      });
    } else {
      // update user to project to active
      await userRef.update({
        active: true,
        roleId: emptyRole.id,
      });
    }

    // add project to user
    const userDoc = getGlobalUserRef(ctx.firestore, userId);
    await userDoc.update({
      projectIds: ctx.firebaseAdmin.firestore.FieldValue.arrayUnion(projectId),
    });
  });

/**
 * Removes a user from a project by marking them as inactive.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project to remove the user from
 * - userId - String ID of the user to remove
 *
 * @returns None
 * @throws {TRPCError} - If the user is not found or is the project owner
 *
 * @http POST /api/trpc/users.removeUser
 */
export const removeUserProcedure = roleRequiredProcedure(
  settingsPermissions,
  "write",
)
  .input(z.object({ projectId: z.string(), userId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { projectId, userId } = input;

    const teamMemberRef = getUserRef(ctx.firestore, projectId, userId);
    const teamMemberSnap = await teamMemberRef.get();

    if (!teamMemberSnap.exists) {
      throw notFound("Team member");
    }

    if (teamMemberSnap.data()?.roleId === "owner") {
      throw forbidden("You cannot remove the owner of the project.");
    }

    // Mark the team member as inactive
    await teamMemberRef.update({ active: false, roleId: emptyRole.id });

    if (userId) {
      const userRef = getGlobalUserRef(ctx.firestore, userId);

      // Remove the project from their list of projects
      await userRef.update({
        projectIds:
          ctx.firebaseAdmin.firestore.FieldValue.arrayRemove(projectId),
      });
    } else {
      throw new Error("No userId found in team member document");
    }
  });

/**
 * Updates the role of a user in a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - userId - String ID of the user to update
 * - roleId - String ID of the new role to assign
 *
 * @returns None
 *
 * @http POST /api/trpc/users.updateUserRole
 */
export const updateUserRoleProcedure = roleRequiredProcedure(
  settingsPermissions,
  "write",
)
  .input(
    z.object({
      projectId: z.string(),
      userId: z.string(),
      roleId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, userId, roleId } = input;

    const userRef = getUserRef(ctx.firestore, projectId, userId);
    await userRef.update({ roleId });
  });

/**
 * Updates a user's profile information including display name and profile photo.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - displayName - Optional string for the user's display name
 * - photoBase64 - Optional base64-encoded string of the user's profile photo
 *
 * @returns None
 *
 * @http POST /api/trpc/users.updateUser
 */
export const updateUserProcedure = protectedProcedure
  .input(
    z.object({
      displayName: z.string().optional(),
      photoBase64: z.string().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { displayName, photoBase64 } = input;
    const user = ctx.session.user;
    const updateData: { displayName?: string; photoURL?: string } = {};

    if (displayName !== undefined) {
      updateData.displayName = displayName;
    } else {
      updateData.displayName = user.displayName;
    }

    if (photoBase64 !== undefined) {
      const newUrl = await uploadBase64File(crypto.randomUUID(), photoBase64);
      updateData.photoURL = newUrl;
    } else {
      updateData.photoURL = user.photoURL;
    }

    await ctx.firebaseAdmin.auth().updateUser(user.uid, updateData);
  });

/**
 * Retrieves team members (users with write access) for a specific project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns Array of user objects with write access to the project
 *
 * @http GET /api/trpc/users.getTeamMembers
 */
export const getTeamMembersProcedure = roleRequiredProcedure(
  usersPermissions,
  "read",
)
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    return await getWritableUsers(
      ctx.firestore,
      ctx.firebaseAdmin.app(),
      input.projectId,
    );
  });

export const userRouter = createTRPCRouter({
  getGlobalUsers: getGlobalUsersProcedure,
  getGlobalUser: getGlobalUserProcedure,
  getUsers: getUsersProcedure,
  getUserTable: getUserTableProcedure,
  addUser: addUserProcedure,
  removeUser: removeUserProcedure,
  updateUserRole: updateUserRoleProcedure,
  updateUser: updateUserProcedure,
  getTeamMembers: getTeamMembersProcedure,
});
