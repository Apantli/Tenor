describe("Requirement Creation", () => {
  // Create a project to view it
  before(() => {
    cy.createEmptyProject();
  });

  beforeEach(() => {
    cy.signIn("/");
  });

  it("Requirements pop up", () => {
    cy.contains("Test project").click();
    cy.contains("Requirements").click();
    cy.get(".gap-1 > .bg-app-primary").click();
    cy.get('[data-cy="requirement-popup-footer"]').should("be.visible");
  });
});
