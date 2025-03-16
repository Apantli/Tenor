import { z } from "zod";
import { cookies } from 'next/headers';

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { env } from '~/env';
import { TRPCError } from '@trpc/server';
import admin from 'firebase-admin';

interface GithubEmail {
  email: string,
  primary: boolean,
  verified: boolean,
  visibility: string | null,
}

async function getGitHubEmails(accessToken: string) {
  const response = await fetch('https://api.github.com/user/emails', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch GitHub emails');
  }

  return await response.json() as GithubEmail[];
}

export const authRouter = createTRPCRouter({

  login: publicProcedure.input(z.object({token: z.string(), githubAccessToken: z.string().optional()})).mutation(async ({input, ctx}) => {

    const {token, githubAccessToken} = input;
    const allowedDomain = "@tec.mx";

    try {
      // GET USER INFORMATION
      const decodedToken = await ctx.firebaseAdmin.auth().verifyIdToken(token);
      const user = await ctx.firebaseAdmin.auth().getUser(decodedToken.uid);

      // VALIDATE USER EMAIL HAS CORRECT DOMAIN
      if (githubAccessToken) {

        // Check all their verified emails to see if they have one valid email
        const emails = await getGitHubEmails(githubAccessToken);

        let validEmail = "";
        for (const email of emails) {
          if (email.email.endsWith(allowedDomain) && email.verified) {
            validEmail = email.email;
            break;
          }
        }

        if (!validEmail) {
          await ctx.firebaseAdmin.auth().deleteUser(decodedToken.uid);
          return {success: false, error: "UNAUTHORIZED_DOMAIN"};
        }

        // Update their profile to use the valid email
        await ctx.firebaseAdmin.auth().updateUser(decodedToken.uid, {
          email: validEmail
        });

      } else if (!user.email?.endsWith(allowedDomain)) {
        await ctx.firebaseAdmin.auth().deleteUser(decodedToken.uid);
        return {success: false, error: "UNAUTHORIZED_DOMAIN"};
      }

      // Set the auth token cookie
      const cookie = await cookies();
      cookie.set("token", token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/"
      });

      // Create the user document if it doesnt exist
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
