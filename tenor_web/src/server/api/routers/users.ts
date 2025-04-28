import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { type TeamMember } from "~/app/_components/inputs/MemberTable";
import { z } from "zod";
import { remove } from "node_modules/cypress/types/lodash";
import admin from "firebase-admin";
import { emptyRole } from "~/lib/defaultProjectValues";

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

  getUserListEdiBox: protectedProcedure
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

  getTeamMembers: protectedProcedure
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

      const users: TeamMember[] = [];

      for (const doc of userList.docs) {
        const userData = doc.data();

        try {
          const firebaseUser = await ctx.firebaseAdmin
            .auth()
            .getUser(userData.userId as string);

          users.push({
            id: doc.id,
            photoURL: firebaseUser.photoURL,
            displayName: firebaseUser.displayName ?? "No available name",
            email: firebaseUser.email ?? "No available email",
            role: userData.roleId as string,
          } as TeamMember);
        } catch (error) {
          console.error(
            `Error getting Firebase user ${userData.userId}:`,
            error,
          );
        }
      }

      return users;
    }),

  removeUser: protectedProcedure
    .input(z.object({ projectId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { projectId, userId } = input;

      const teamMemberRef = ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("users")
        .doc(userId);

      // Mark the team member as inactive
      await teamMemberRef.update({ active: false, roleId: emptyRole.id });

      // Get the actual userId from the teamMember document
      const teamMemberSnap = await teamMemberRef.get();
      const realUserId = teamMemberSnap.data()?.userId as string;

      if (realUserId) {
        const userRef = ctx.firestore.collection("users").doc(realUserId);

        // Remove the project from their list of projects
        await userRef.update({
          projects:
            ctx.firebaseAdmin.firestore.FieldValue.arrayRemove(projectId),
        });
      } else {
        throw new Error("No userId found in team member document");
      }
    }),

  addUser: protectedProcedure
    .input(z.object({ projectId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { projectId, userId } = input;

      // search if it exists
      const userList = await ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("users")
        .where("userId", "==", userId)
        .get();

      if (userList.empty) {
        // add user to project
        const userRef = ctx.firestore
          .collection("projects")
          .doc(projectId)
          .collection("users")
          .doc(userId);

        await userRef.set({
          userId,
          roleId: emptyRole.id, // default role
          active: true,
        });
      } else {
        // update user to project to active
        const userRef = ctx.firestore
          .collection("projects")
          .doc(projectId)
          .collection("users")
          .doc(userId);
        await userRef.update({
          active: true,
          roleId: emptyRole.id,
        });
      }

      // add project to user
      const userDoc = ctx.firestore.collection("users").doc(userId);
      await userDoc.update({
        projects: ctx.firebaseAdmin.firestore.FieldValue.arrayUnion(projectId),
      });
    }),
  updateUserRole: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
        roleId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, userId, roleId } = input;

      const userRef = ctx.firestore
        .collection("projects")
        .doc(projectId)
        .collection("users")
        .doc(userId);

      await userRef.update({ roleId });
    }),
});
