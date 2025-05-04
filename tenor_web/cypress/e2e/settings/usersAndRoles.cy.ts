import type { ProjectInfo } from "cypress/support/commands";

describe("Settings: Users and roles", () => {
  before(() => {
    cy.signIn("/");
    cy.createEmptyProject();
  });

  // Return to dashboard and select the project
  beforeEach(() => {
    cy.get('img[alt="Tenor Logo"]').click();
    cy.fixture("testProjectInfo").then((data: ProjectInfo) => {
      cy.get('[data-cy="project-list"]').find("li").contains(data.name).click();
    });
    cy.get('[data-cy="settings"]').click();
    cy.contains("Users & Permissions").click();
  });

  it("TC062: Add role", () => {
    cy.get('[data-cy="segmented-control"]').contains("Roles").click();
    cy.get('[data-cy="primary-button"]').click();
    cy.get('[placeholder="New Role Name"]').type("Scrum Master");
    cy.get('[data-cy="dropdown"]').contains("Add Role").click();
    cy.contains("Scrum Master").should("be.visible");
  });

  it("TC063: Attempt to delete scrum master", () => {
    cy.get("li").contains("scrum").within(() => {
      cy.get("button").click();
    });
  });
});
