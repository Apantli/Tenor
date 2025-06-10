describe("Test Project Creation", () => {
  beforeEach(() => {
    cy.signIn("/");
  });

  it("TC004:Verify mandatory fields", () => {
    // Go to project creation page
    cy.get('[data-cy="new-project-button"]').click();
    // Try creating the project
    cy.get(".header > .flex").click();
    cy.contains("Please enter a project name");
  });
});
