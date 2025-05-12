import { defineConfig } from "cypress";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

export default defineConfig({
  env: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    EMAIL: "test@mail.com",
    PASSWORD: "123456",
  },
  e2e: {
    baseUrl: "http://localhost:3000",
    defaultCommandTimeout: 10000, // Increase default timeout

    setupNodeEvents(on) {
      if (!admin.apps.length) {
        admin.initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
      }

      on("task", {
        async createTestUser({ email, password, displayName } : { email: string; password: string; displayName?: string }) {
          try {
            const existingUser = await admin
              .auth()
              .getUserByEmail(email)
              .catch(() => null);

            if (existingUser) {
              await admin.auth().deleteUser(existingUser.uid);
            }

            const user = await admin.auth().createUser({
              email,
              password,
              emailVerified: true,
              displayName: displayName ?? "Test User",
            });

            return { uid: user.uid };
          } catch (err) {
            console.error("createTestUser error:", err);
            throw err;
          }
        },
      });
    },
    testIsolation: false,
  },
});
