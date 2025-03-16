import { z } from "zod";
import { cookies } from 'next/headers';

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { env } from '~/env';
import { TRPCError } from '@trpc/server';
import admin from 'firebase-admin';

export const authRouter = createTRPCRouter({
  login: publicProcedure.input(z.object({token: z.string()})).mutation(async ({input, ctx}) => {

    const {token} = input;

    try {
      const decodedToken = await ctx.firebaseAdmin.auth().verifyIdToken(token);

      const cookie = await cookies();

      cookie.set("token", token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/"
      });

      const userDocRef = ctx.firestore.collection("users").doc(decodedToken.uid);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        await ctx.firestore.collection("users").doc(decodedToken.uid).set({
          uid: decodedToken.uid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return {success: true};
    } catch (error) {
      console.log(error);
      throw new TRPCError({code: "UNAUTHORIZED"});
    }

  }),

  logout: publicProcedure.mutation(async ({input, ctx}) => {
    const cookie = await cookies();
    cookie.set("token", "", {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return {success: true}
  })
});
