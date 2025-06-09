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
    defaultCommandTimeout: 10000,

    // Test ordering
    specPattern: [
      "cypress/e2e/runBefore.cy.ts",
      "cypress/e2e/app.cy.ts", // Basic app tests first
      "cypress/e2e/general/**/*.cy.ts", // General tests
      "cypress/e2e/epics.cy.ts", // Epics before UserStories
      "cypress/e2e/userStories.cy.ts", // UserStories before tasks (dependency)
      "cypress/e2e/issues.cy.ts", // Issues before tasks (dependency)
      "cypress/e2e/tasks.cy.ts", // Tasks after user stories
      "cypress/e2e/sprints.cy.ts", // Sprints after core functionality
      "cypress/e2e/requirements.cy.ts", // Requirements
      "cypress/e2e/settings/**/*.cy.ts", // Settings last
    ],

    setupNodeEvents(on) {
      if (!admin.apps.length) {
        admin.initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
      }

      on("task", {
        async createTestUser({
          email,
          password,
          displayName,
        }: {
          email: string;
          password: string;
          displayName?: string;
        }) {
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

  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});
