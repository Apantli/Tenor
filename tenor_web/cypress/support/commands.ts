/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

import type { TestProjectInfo } from "cypress/fixtures/types";
import { initializeApp } from "firebase/app";
import {
  type Auth,
  connectAuthEmulator,
  initializeAuth,
  indexedDBLocalPersistence,
} from "firebase/auth";

let auth: Auth;
function getAuth() {
  const app = initializeApp({
    apiKey: Cypress.env("apiKey") as string,
  });
  auth =
    auth ||
    initializeAuth(app, {
      persistence: indexedDBLocalPersistence,
    });
  connectAuthEmulator(auth, "http://localhost:9099");
  return auth;
}
getAuth();

export function signInProgrammatically({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  return cy.window().then(async () => {
    // Import Firebase modules in browser context
    const {
      getAuth,
      signInWithEmailAndPassword,
      browserLocalPersistence,
      setPersistence,
    } = await import("firebase/auth");

    const auth = getAuth();

    // Set persistence so Firebase keeps the session
    await setPersistence(auth, browserLocalPersistence);

    // Sign in user
    const user = await signInWithEmailAndPassword(auth, email, password);
    const token = await user.user.getIdToken();

    cy.request({
      method: "POST",
      url: "http://localhost:3000/api/trpc/auth.login?batch=1",
      body: {
        "0": {
          json: { token },
        },
      },
    });
  });
}

Cypress.Commands.add(
  "signIn",
  (
    redirectPath = "/",
    credentials = {
      email: Cypress.env(`EMAIL`) as string,
      password: Cypress.env(`PASSWORD`) as string,
    },
  ) => {
    const filePath = "cypress/fixtures/sharedUser.json";

    void cy.readFile(filePath, { log: false }).then((data) => {
      if (data.exists) {
        signInProgrammatically(credentials);
        cy.visit(redirectPath);
      } else {
        cy.task("createTestUser", {
          email: credentials.email,
          password: credentials.password,
        }).then(() => {
          signInProgrammatically(credentials);
          cy.visit(redirectPath);
        });

        return cy.url().then((url) => {
          cy.writeFile(filePath, {
            exists: true,
            createdAt: new Date().toISOString(),
            description: "Shared user for cross-spec testing",
          });
        });
      }
    });

    cy.visit(redirectPath);
  },
);

Cypress.Commands.add("createEmptyProject", () => {
  cy.visit("/");
  cy.get('[data-cy="new-project-button"]').click();
  cy.fixture("testProjectInfo").then((data: TestProjectInfo) => {
    cy.get('[placeholder="What is your project called..."]').type(data.name);
    cy.get(".header > .flex").click();
    cy.contains(data.name).should("be.visible");
  });
});

/* eslint-disable */
Cypress.Commands.add("openSharedProject", () => {
  const filePath = "cypress/fixtures/sharedProjectURL.json";

  void cy.readFile(filePath, { log: false }).then((data) => {
    if (data.url && data.url.trim() !== "") {
      cy.signIn("/");
      cy.visit(data.url);
      return cy.wrap(data.url);
    } else {
      cy.signIn("/");
      cy.createEmptyProject();

      return cy.url().then((url) => {
        cy.writeFile(filePath, {
          url: url,
          createdAt: new Date().toISOString(),
          description: "Shared project URL for cross-spec testing",
        });

        cy.visit(url);
        return cy.wrap(url);
      });
    }
  });
});
/* eslint-enable */
