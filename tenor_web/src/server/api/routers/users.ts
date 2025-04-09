import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { type TeamMember } from "~/app/_components/inputs/MemberTable";

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
    
    const usersRef = ctx.firestore
      .collection("users")
      .where("projectIds", "array-contains", projectId);
    
    const usersSnapshot = await usersRef.get();
    
    interface FirestoreUserData {
      uid: string;
      projectIds: string[];
    }
    
    const usersList = [];

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data() as FirestoreUserData;
      
      try {
        const firebaseUser = await ctx.firebaseAdmin.auth().getUser(userData.uid);
        
        usersList.push({
          id: firebaseUser.uid,
          // No available name happens if the user doesn't have a github name registered
          name: firebaseUser.displayName ?? "No available name",
          // Repeating stuff but needed only for the EditableBox 
          user: {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          },
        });
      } catch (error) {
        console.error(`Error al obtener los datos del usuario ${userData.uid}:`, error);
      }
    }
    return usersList;
  }),
});
