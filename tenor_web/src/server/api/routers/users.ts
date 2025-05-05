/**
 * Users Router - Tenor API Endpoints for User Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing users in the Tenor application.
 * It provides endpoints to retrieve, add, update, and remove users from projects.
 *
 * The router includes procedures for:
 * - Retrieving user lists with filtering options
 * - Managing team members for specific projects
 * - Adding and removing users from projects
 * - Updating user roles and permissions
 *
 * User management is essential for collaboration within projects, allowing proper
 * assignment of roles and responsibilities to team members.
 *
 * @category API
 */

import {
  createTRPCRouter,
  protectedProcedure,
  roleRequiredProcedure,
} from "~/server/api/trpc";
import { type TeamMember } from "~/app/_components/inputs/MemberTable";
import { z } from "zod";
import { remove } from "node_modules/cypress/types/lodash";
import admin from "firebase-admin";
import { emptyRole } from "~/lib/defaultProjectValues";
import { TRPCError } from "@trpc/server";
import { getProjectUserRef } from "./settings";
import { access } from "fs";

/**
 * Retrieves a list of users filtered by a search term.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - filter — Search term to filter users by email or display name
 *
 * @returns Array of users matching the filter criteria.
 *
 * @http GET /api/trpc/users.getUserList
 */
export const getUserListProcedure = protectedProcedure
  .input(z.object({ filter: z.string() }))
  .query(async ({ ctx, input }) => {
    const { filter } = input;
    const users = await ctx.firebaseAdmin.auth().listUsers(1000);
    const filteredUsers = users.users.filter(
      (user) =>
        (user.email ?? "").toLowerCase().includes(filter.toLowerCase()) ||
        (user.displayName ?? "").toLowerCase().includes(filter.toLowerCase()),
    );

    const usersList: TeamMember[] = users.users.map((user) => ({
      id: user.uid,
      photoURL: user.photoURL,
      displayName: user.displayName ?? "No available name",
      email: user.email ?? "No available email",
      role: "none",
    }));
    return usersList;
  });

/**
 * Retrieves a list of users with their roles for a specific project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to fetch users from
 *
 * @returns Array of users with their roles and activity status.
 *
 * @http GET /api/trpc/users.getUserListEditBox
 */
export const getUserListEditBoxProcedure = roleRequiredProcedure(
  {
    flags: [
      "backlog",
      "settings",
      "issues",
      "scrumboard",
      "performance",
      "sprints",
    ],

    optimistic: true,
  },
  "read",
)
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;

    const userList = await ctx.firestore
      .collection("projects")
      .doc(projectId)
      .collection("users")
      .select("roleId", "userId")
      .where("active", "==", true)
      .get();

    const users = [];

    for (const doc of userList.docs) {
      const userData = doc.data();

      try {
        const firebaseUser = await ctx.firebaseAdmin
          .auth()
          .getUser(userData.userId as string);

        users.push({
          id: doc.id,
          roleId: userData.roleId as string,
          userId: userData.userId as string,
          active: userData.active as boolean,
          name:
            firebaseUser.displayName ??
            firebaseUser.email ??
            "No available name",
          user: {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          },
        });
      } catch (error) {
        console.error(`Error getting Firebase user ${userData.userId}:`, error);
      }
    }

    return users;
  });

/**
 * Retrieves team members for a specific project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to fetch team members from
 *
 * @returns Array of team members with their roles and activity status.
 *
 * @http GET /api/trpc/users.getTeamMembers
 */
export const getTeamMembersProcedure = roleRequiredProcedure(
  { flags: ["settings"] },
  "read",
)
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;

    const userList = await ctx.firestore
      .collection("projects")
      .doc(projectId)
      .collection("users")
      .select("roleId")
      .where("active", "==", true)
      .get();

    const users: TeamMember[] = [];

    for (const doc of userList.docs) {
      const userData = doc.data();

      try {
        const firebaseUser = await ctx.firebaseAdmin.auth().getUser(doc.id);

        users.push({
          id: doc.id,
          photoURL: firebaseUser.photoURL,
          displayName: firebaseUser.displayName ?? "No available name",
          email: firebaseUser.email ?? "No available email",
          role: userData.roleId as string,
        });
      } catch (error) {
        console.error(`Error getting Firebase user ${doc.id}:`, error);
      }
    }

    return users;
  });

/**
 * Removes a user from a specific project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to remove the user from
 * - userId — ID of the user to be removed
 *
 * @returns Void.
 *
 * @http DELETE /api/trpc/users.removeUser
 */
export const removeUserProcedure = roleRequiredProcedure(
  { flags: ["settings"] },
  "write",
)
  .input(z.object({ projectId: z.string(), userId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { projectId, userId } = input;

    const teamMemberRef = getProjectUserRef(projectId, userId, ctx.firestore);
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
      const userRef = ctx.firestore.collection("users").doc(userId);

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
 * Adds a user to a specific project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to add the user to
 * - userId — ID of the user to be added
 *
 * @returns Void.
 *
 * @http POST /api/trpc/users.addUser
 */
export const addUserProcedure = roleRequiredProcedure(
  { flags: ["settings"] },
  "write",
)
  .input(z.object({ projectId: z.string(), userId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { projectId, userId } = input;

    // search if it exists
    const userRef = getProjectUserRef(projectId, userId, ctx.firestore);
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
    const userDoc = ctx.firestore.collection("users").doc(userId);
    await userDoc.update({
      projectIds: ctx.firebaseAdmin.firestore.FieldValue.arrayUnion(projectId),
    });
  });

/**
 * Updates the role of a user in a specific project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project where the user role will be updated
 * - userId — ID of the user whose role will be updated
 * - roleId — New role ID to assign to the user
 *
 * @returns Void.
 *
 * @http PUT /api/trpc/users.updateUserRole
 */
export const updateUserRoleProcedure = roleRequiredProcedure(
  { flags: ["settings"] },
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

    const userRef = getProjectUserRef(projectId, userId, ctx.firestore);
    await userRef.update({ roleId });
  });

export const userRouter = createTRPCRouter({
  getUserList: getUserListProcedure,
  getUserListEditBox: getUserListEditBoxProcedure,
  getTeamMembers: getTeamMembersProcedure,
  removeUser: removeUserProcedure,
  addUser: addUserProcedure,
  updateUserRole: updateUserRoleProcedure,
});
