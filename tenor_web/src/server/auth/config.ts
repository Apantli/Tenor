import { type DefaultSession, type NextAuthConfig } from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { firestore } from "~/utils/auth-adapter";
import GitHub from "next-auth/providers/github";

import { getEmails } from "~/lib/github";
/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  callbacks: {
    async signIn({ profile, account, user }) {
      const allowedDomain = "tec.mx";

      // Check if primary email has the allowed domain
      if (profile?.email?.endsWith(`@${allowedDomain}`)) {
        return true;
      }

      // Check if any verified email has the allowed domain
      if (account?.access_token?.toString()) {
        const associatedEmails = await getEmails(account?.access_token);

        for (const email of associatedEmails) {
          if (email.verified && email.email.endsWith(`@${allowedDomain}`)) {
            user.email = email.email; // Save tec email
            return true;
          }
        }
      }

      return false;
    },
  },
  providers: [
    GitHub({
      authorization: {
        url: "https://github.com/login/oauth/authorize",
        params: {
          // TODO: add more scopes if needed
          scope: "read:user user:email",
          prompt: "select_account",
        },
      },
      // Handle email override in callback. Safe to add as github verifies emails.
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  adapter: FirestoreAdapter(firestore),
} satisfies NextAuthConfig;
