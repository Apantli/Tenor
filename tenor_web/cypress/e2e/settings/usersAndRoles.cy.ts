
let projectPath = "";
describe("Settings: Users and roles", () => {
  before(() => {
    cy.ensureSharedProjectExists().then((url) => {
      projectPath = url;
    });
  });

  // Return to dashboard and select the project
  beforeEach(() => {
    cy.visit(projectPath);
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
    cy.contains("• • •").click();
    cy.contains("Remove").click();
    cy.contains("You cannot remove the owner of the project.").should(
      "be.visible",
    );
  });
});
