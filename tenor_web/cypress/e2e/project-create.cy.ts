describe("Test Project Creation", () => {
  beforeEach(() => {
    cy.signIn("/");
  });

  it("Verify mandatory fields", () => {
    // Go to project creation page
    cy.get(".mr-10 > .justify-between > .flex").click();
    // Try creating the project
    cy.get(".header > .flex").click();
    cy.contains("Project Name must have a value");
  });
});
