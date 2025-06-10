describe("Settings: Users and roles", () => {
  // Return to dashboard and select the project
  beforeEach(() => {
    cy.openSharedProject();
    cy.get('[data-cy="settings"]').click();
  });

  it("TC062: Add role", () => {
    cy.get('[data-cy="toggle-sidebar"]').click();
    cy.contains("Users & Permissions").click();
    cy.get('[data-cy="segmented-control"]').contains("Roles").click();
    cy.get('[data-cy="primary-button"]').click();
    cy.get('[placeholder="New Role Name"]').type("Scrum Master");
    cy.get('[data-cy="dropdown"]').contains("Add Role").click();
    cy.contains("Scrum Master").should("be.visible");
  });

  it("TC063: Attempt to delete owner", () => {
    cy.get('[data-cy="toggle-sidebar"]').click();
    cy.contains("Users & Permissions").click();
    cy.contains("• • •").click();
    cy.contains("Delete").click();
    cy.get('[data-cy="confirm-button"]').click();
    cy.contains("You cannot remove the owner of the project.").should(
      "be.visible",
    );
  });
});
