/**
 * Auth Router - Tenor API Endpoints for Authentication Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for authentication in the Tenor application.
 * It provides endpoints to handle user login, logout, session management, and verification.
 *
 * The router includes procedures for:
 * - User login with Firebase authentication and optional GitHub integration
 * - User logout and token revocation
 * - Email verification status checking
 * - Session refresh and management
 *
 * Authentication is primarily implemented using Firebase Auth with additional integration
 * for GitHub OAuth verification.
 *
 * @category API
 */

import { z } from "zod";
import { cookies } from "next/headers";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { env } from "~/env";
import { TRPCError } from "@trpc/server";
import admin from "firebase-admin";
import { getEmails } from "~/lib/github";

/**
 * Logs in a user using a token and optional GitHub access token.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - token — Firebase authentication token
 * - githubAccessToken — Optional GitHub access token for email verification
 *
 * @returns Object indicating success status.
 *
 * @http POST /api/trpc/auth.login
 */
export const loginProcedure = publicProcedure
  .input(
    z.object({ token: z.string(), githubAccessToken: z.string().optional() }),
  )
  .mutation(async ({ input, ctx }) => {
    const { token, githubAccessToken } = input;

    try {
      // GET USER INFORMATION
      const decodedToken = await ctx.firebaseAdmin.auth().verifyIdToken(token);
      const user = await ctx.firebaseAdmin.auth().getUser(decodedToken.uid);

      // CHECK THE GITHUB EMAIL IS VERIFIED
      if (githubAccessToken && !user.emailVerified) {
        const emails = await getEmails(githubAccessToken);
        let emailVerified = false;
        for (const email of emails) {
          if (email.primary && email.verified) {
            emailVerified = true;
            break;
          }
        }

        if (emailVerified) {
          await ctx.firebaseAdmin.auth().updateUser(decodedToken.uid, {
            emailVerified: true,
          });
        }
      }

      // Set the auth token cookie
      const cookie = await cookies();
      cookie.set("token", token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      // Create the user document if it doesn't exist
      const userDocRef = ctx.firestore
        .collection("users")
        .doc(decodedToken.uid);
      const userDoc = await userDocRef.get();
      if (!userDoc.exists) {
        await ctx.firestore.collection("users").doc(decodedToken.uid).set({
          uid: decodedToken.uid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return { success: true };
    } catch {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
  });

/**
 * Logs out the current user by revoking refresh tokens and clearing the auth cookie.
 *
 * @param input None
 *
 * @returns Object indicating success status.
 *
 * @http POST /api/trpc/auth.logout
 */
export const logoutProcedure = publicProcedure.mutation(async ({ ctx }) => {
  if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" });

  await ctx.firebaseAdmin.auth().revokeRefreshTokens(ctx.session.uid);

  const cookie = await cookies();
  cookie.set("token", "", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return { success: true };
});

/**
 * Checks if the current user's email is verified.
 *
 * @param input None
 *
 * @returns Object indicating whether the user's email is verified.
 *
 * @http GET /api/trpc/auth.checkVerification
 */
export const checkVerificationProcedure = publicProcedure.query(
  async ({ ctx }) => {
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return { verified: ctx.session.emailVerified };
  },
);

/**
 * Refreshes the user's session by verifying and updating the auth token.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - token — Firebase authentication token
 *
 * @returns Object indicating success status.
 *
 * @http POST /api/trpc/auth.refreshSession
 */

export const refreshSessionProcedure = publicProcedure
  .input(z.object({ token: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { token } = input;

    const cookie = await cookies();
    try {
      await ctx.firebaseAdmin.auth().verifyIdToken(token);

      cookie.set("token", token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      return { success: true };
    } catch {
      cookie.set("token", "", {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      });
      return { success: false };
    }
  });

export const authRouter = createTRPCRouter({
  login: loginProcedure,
  logout: logoutProcedure,
  checkVerification: checkVerificationProcedure,
  refreshSession: refreshSessionProcedure,
});
