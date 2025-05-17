import type { TestSprint } from "cypress/fixtures/types";

let projectPath = "";

describe("Sprints", () => {
  before(() => {
    cy.ensureSharedProjectExists().then((url) => {
      projectPath = url;
    });
  });

  beforeEach(() => {
    cy.visit(projectPath);
    cy.get('[data-cy="sprints"]').click();
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
