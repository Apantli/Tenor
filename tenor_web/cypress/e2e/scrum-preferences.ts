import type { TestProjectInfo } from "cypress/fixtures/types";

describe("Test Scrum preferences", () => {
  // Create a project to view it
  before(() => {
    cy.createEmptyProject();
  });

  beforeEach(() => {
    cy.signIn("/");
    cy.contains("Test project setting").click();
  });

  it("Requirements pop up", () => {
    cy.fixture("testProjectInfo").then((data: TestProjectInfo) => {
      cy.contains(data.name).click();
      cy.contains("Requirements").click();
      cy.get(".gap-1 > .bg-app-primary").click();
      cy.get('[data-cy="requirement-popup-footer"]').should("be.visible");
    });
  });
});
