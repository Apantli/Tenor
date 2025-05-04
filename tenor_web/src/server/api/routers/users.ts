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
import { access } from "fs";
import { getProjectUserRef } from "~/utils/helpers/shortcuts";

export const userRouter = createTRPCRouter({
  // No role is required to get the user list
  getUserList: protectedProcedure
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
    }),

  getUserListEditBox: roleRequiredProcedure(
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
          console.error(
            `Error getting Firebase user ${userData.userId}:`,
            error,
          );
        }
      }

      return users;
    }),
  getTeamMembers: roleRequiredProcedure({ flags: ["settings"] }, "read")
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
          const admin = ctx.firebaseAdmin;
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
    }),
  removeUser: roleRequiredProcedure({ flags: ["settings"] }, "write")
    .input(z.object({ projectId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { projectId, userId } = input;

      const teamMemberRef = getProjectUserRef(ctx.firestore, projectId, userId);
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
    }),

  addUser: roleRequiredProcedure({ flags: ["settings"] }, "write")
    .input(z.object({ projectId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { projectId, userId } = input;

      // search if it exists
      const userRef = getProjectUserRef(ctx.firestore, projectId, userId);
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
        projectIds:
          ctx.firebaseAdmin.firestore.FieldValue.arrayUnion(projectId),
      });
    }),
  updateUserRole: roleRequiredProcedure({ flags: ["settings"] }, "write")
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
        roleId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, userId, roleId } = input;

      const userRef = getProjectUserRef(ctx.firestore, projectId, userId);
      await userRef.update({ roleId });
    }),
});
