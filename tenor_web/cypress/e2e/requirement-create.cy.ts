describe("Requirement Creation", () => {
  // Create a project to view it
  before(() => {
    cy.signIn("/");
    cy.createEmptyProject();
  });

  beforeEach(() => {
    cy.signIn("/");
  });

  it("TC010: Requirements pop up", () => {
    cy.contains("Test Project").click();
    cy.contains("Requirements").click();
    cy.get(".gap-1 > .bg-app-primary").click();
    cy.get('[data-cy="requirement-popup-footer"]').should("be.visible");
  });
});
