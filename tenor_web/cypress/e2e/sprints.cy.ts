import type { TestSprint } from "cypress/fixtures/types";

describe("Sprints", () => {
  beforeEach(() => {
    cy.openSharedProject();
    cy.get('[data-cy="sprints"]').click();
    cy.window().then((window) => {
      window.localStorage.removeItem("persistent_value:showBacklog");
    });
    cy.get('[data-cy="dismiss-sidebar"]').click();
  });

  it("TC044: Creation of sprint available", () => {
    cy.get('[data-cy="primary-button"]').contains("+ Add Sprint").click();
    cy.get('[data-cy="primary-button"]')
      .contains("Create Sprint")
      .should("be.visible");
  });

  it("TC045: Create empty sprint.", () => {
    cy.fixture("TestUserStory").then((data: TestSprint) => {
      cy.get('[data-cy="primary-button"]').contains("+ Add Sprint").click();
      cy.get('[data-cy="popup"]').within(() => {
        cy.get(
          '[placeholder="Explain what will be done in this sprint..."]',
        ).type(data.description);
      });
      cy.get('[data-cy="primary-button"]').contains("Create Sprint").click();

      cy.contains("Sprint").should("be.visible");
    });
  });
});
