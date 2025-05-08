import type { TestProjectInfo, TestSprint } from "cypress/fixtures/types";

describe("Sprints", () => {
  before(() => {
    cy.signIn("/");
    cy.createEmptyProject();
  });

  // Return to dashboard and select the project
  beforeEach(() => {
    cy.signIn("/");
    cy.fixture("testProjectInfo").then((data: TestProjectInfo) => {
      cy.get('[data-cy="project-list"]').find("li").contains(data.name).click();
    });
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
