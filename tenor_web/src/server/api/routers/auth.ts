import { z } from "zod";
import { cookies } from "next/headers";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { env } from "~/env";
import { TRPCError } from "@trpc/server";
import admin from "firebase-admin";
import { getEmails } from "~/lib/github";

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({ token: z.string(), githubAccessToken: z.string().optional() }),
    )
    .mutation(async ({ input, ctx }) => {
      const { token, githubAccessToken } = input;
      const allowedDomain = "@tec.mx";

      try {
        // GET USER INFORMATION
        const decodedToken = await ctx.firebaseAdmin
          .auth()
          .verifyIdToken(token);
        const user = await ctx.firebaseAdmin.auth().getUser(decodedToken.uid);

        let email = user.email;

        // VALIDATE USER EMAIL HAS CORRECT DOMAIN
        if (githubAccessToken) {
          // Check all their verified emails to see if they have one valid email
          const emails = await getEmails(githubAccessToken);

          let validEmail = "";
          for (const email of emails) {
            if (email.email.endsWith(allowedDomain) && email.verified) {
              validEmail = email.email;
              break;
            }
          }

          if (!validEmail) {
            await ctx.firebaseAdmin.auth().deleteUser(decodedToken.uid);
            return { success: false, error: "UNAUTHORIZED_DOMAIN" };
          }

          // Update their profile to use the valid email
          try {
            await ctx.firebaseAdmin.auth().updateUser(decodedToken.uid, {
              emailVerified: true,
            });
            email = validEmail;
          } catch (err) {
            if (typeof err === "object" && err !== null && "code" in err) {
              console.log(err.code);
              if (err.code === "auth/email-already-exists") {
                await ctx.firebaseAdmin.auth().deleteUser(decodedToken.uid); // Delete the created user if the email is already used
              }
              return { success: false, error: "FIREBASE", code: err.code };
            }
          }
        } else if (!user.email?.endsWith(allowedDomain)) {
          await ctx.firebaseAdmin.auth().deleteUser(decodedToken.uid);
          return { success: false, error: "UNAUTHORIZED_DOMAIN" };
        }

        // Set the auth token cookie
        const cookie = await cookies();
        cookie.set("token", token, {
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
        });

        // Create the user document if it doesnt exist
        const userDocRef = ctx.firestore
          .collection("users")
          .doc(decodedToken.uid);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
          await ctx.firestore.collection("users").doc(decodedToken.uid).set({
            uid: decodedToken.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            email,
          });
        }

        return { success: true };
      } catch (err) {
        console.log(err);
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
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
  }),

  checkVerification: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return { verified: ctx.session.emailVerified };
  }),

  refreshSession: publicProcedure
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
      } catch (error) {
        console.log("Token refresh error: ", error);
        cookie.set("token", "", {
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          maxAge: 0,
        });
        return { success: false };
      }
    }),
});
