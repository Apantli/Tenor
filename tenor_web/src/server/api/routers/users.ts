import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { type TeamMember } from "~/app/_components/inputs/MemberTable";
import { z } from "zod";

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
});
