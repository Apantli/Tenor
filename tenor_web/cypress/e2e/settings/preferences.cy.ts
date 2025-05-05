import type { TestProjectInfo } from "cypress/fixtures/types";

describe("Test Scrum preferences", () => {
  // Create a project to view it
  before(() => {
    cy.signIn("/");
    cy.createEmptyProject();
  });

  beforeEach(() => {
    cy.signIn("/");
    cy.fixture("testProjectInfo").then((data: TestProjectInfo) => {
      cy.contains(data.name).click();
      cy.contains("Project Settings").click();
      cy.contains("Scrum Preferences").click();
    });
  });

  it("TC067: Modify sprint duration", () => {
    cy.get("[data-cy='sprint-duration'").then(($input) => {
      const currentValue = parseInt($input.val() as string) || 1;
      const newValue = currentValue + 1 > 365 ? 1 : currentValue + 1;

      cy.wrap($input).clear().type(newValue.toString());
      cy.get('[data-cy="primary-button"]').contains("Save").click();
      cy.contains("Scrum settings have been updated").should("be.visible");
    });
  });

  it("TC068: Modify maximum points", () => {
    cy.get("[data-cy='maximum-sprint-story-points'").then(($input) => {
      cy.wait(1000);
      const currentValue = parseInt($input.val() as string) || 1;
      const newValue = currentValue + 1 > 365 ? 5 : currentValue + 1;
      cy.wrap($input).clear().type(newValue.toString());
      cy.get('[data-cy="primary-button"]').contains("Save").click();
      cy.contains("Scrum settings have been updated").should("be.visible");
    });
  });
});
