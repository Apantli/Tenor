import { type DefaultSession, type NextAuthConfig } from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { firestore } from "~/utils/auth-adapter";
import GitHub from "next-auth/providers/github";
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
    }),
  ],
  adapter: FirestoreAdapter(firestore),
} satisfies NextAuthConfig;
