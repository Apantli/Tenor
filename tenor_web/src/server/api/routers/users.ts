/**
 * Users Router - Tenor API Endpoints for User Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing Users in the Tenor application.
 * It provides endpoints to create, modify, and retrieve global users and within projects.
 *
 * @category API
 */

import {
  createTRPCRouter,
  protectedProcedure,
  roleRequiredProcedure,
} from "~/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
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
} from "../shortcuts/users";
import { emptyRole } from "~/lib/defaultValues/roles";
import { uploadBase64File } from "~/lib/db/firebaseBucket";
import { getWritableUsers } from "../shortcuts/general";

export const userRouter = createTRPCRouter({
  /**
   * @function getUserList
   * @description Get a list of users from Firebase Auth and filter them based on the input filter.
   * @param {string} filter - The filter string to search for in user emails and display names.
   * @return {Promise<TeamMember[]>} - A promise that resolves to an array of TeamMember objects.
   * @throws {TRPCError} - Throws an error if the user is not authenticated.
   */
  getGlobalUsers: protectedProcedure
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
    }),

  getGlobalUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { userId } = input;
      return await getGlobalUserPreview(ctx.firebaseAdmin.app(), userId);
    }),

  /**
   * @function getUsers
   * @description Get a list of users from Firestore based on the project ID.
   * @param {string} projectId - The ID of the project to get users for.
   * @return {Promise<WithId<UserPreview>[]>} - A promise that resolves to an array of TeamMember objects.
   * @throws {TRPCError} - Throws an error if the user is not authenticated.
   */
  getUsers: roleRequiredProcedure(usersPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      return await getUsers(ctx.firebaseAdmin.app(), ctx.firestore, projectId);
    }),

  /**
   * @function getUsersRef
   * @description Get a reference to the users collection in Firestore based on the project ID.
   * @param {string} projectId - The ID of the project to get users for.
   * @return {UserCol[]} - An array of UserCol objects.
   */
  getUserTable: roleRequiredProcedure(usersPermissions, "read")
    .input(z.object({ projectId: z.string(), filter: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return await getUserTable(
        ctx.firebaseAdmin.app(),
        ctx.firestore,
        input.projectId,
      );
    }),

  /**
   * @function getUsersRef
   * @description Get a reference to the users collection in Firestore based on the project ID.
   * @param {string} projectId - The ID of the project to get users for.
   */
  addUser: roleRequiredProcedure(settingsPermissions, "write")
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
        projectIds:
          ctx.firebaseAdmin.firestore.FieldValue.arrayUnion(projectId),
      });
    }),

  /**
   * @function removeUser
   * @description Remove a user from a project by marking them as inactive.
   * @param {string} projectId - The ID of the project to remove the user from.
   * @param {string} userId - The ID of the user to remove from the project.
   * @throws {TRPCError} - Throws an error if the user is not authenticated or if the user is the owner.
   */
  removeUser: roleRequiredProcedure(settingsPermissions, "write")
    .input(z.object({ projectId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { projectId, userId } = input;

      const teamMemberRef = getUserRef(ctx.firestore, projectId, userId);
      const teamMemberSnap = await teamMemberRef.get();

      if (!teamMemberSnap.exists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team member not found",
        });
      }

      if (teamMemberSnap.data()?.roleId === "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot remove owner",
        });
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
    }),

  /**
   * @function updateUserRole
   * @description Update the role of a user in a project.
   * @param {string} projectId - The ID of the project to update the user role for.
   * @param {string} userId - The ID of the user to update the role for.
   * @param {string} roleId - The ID of the new role to assign to the user.
   */
  updateUserRole: roleRequiredProcedure(settingsPermissions, "write")
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
    }),
  updateUser: protectedProcedure
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
    }),

  getTeamMembers: roleRequiredProcedure(usersPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await getWritableUsers(
        ctx.firestore,
        ctx.firebaseAdmin.app(),
        input.projectId,
      );
    }),
});
