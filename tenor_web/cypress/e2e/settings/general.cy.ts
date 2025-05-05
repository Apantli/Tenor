import type { TestProjectInfo } from "cypress/fixtures/types";

describe("Settings: General", () => {
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
    cy.get('[data-cy="settings"]').click();
  });

  it("TC049: Delete Project", () => {
    cy.get('[data-cy="delete-button"]').contains("Delete project").click();
    cy.get('[data-cy="popup"]').within(() => {
      cy.get('[data-cy="confirm-button"]').click();
    });
    cy.fixture("testProjectInfo").then((data: TestProjectInfo) => {
      cy.get('[data-cy="project-list"]')
        .find("li")
        .contains(data.name)
        .should("not.exist");
      cy.contains("No projects found.").should("be.visible");
    });
  });
});
