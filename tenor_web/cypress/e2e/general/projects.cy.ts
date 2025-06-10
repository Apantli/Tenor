describe("Projects", () => {
  before(() => {
    cy.signIn("/");
  });

  it("TC005: Create a new project", () => {
    cy.get('[data-cy="new-project-button"]').click();
    cy.get('[data-cy="project-name-input"]').type("Create Test Project");
    cy.get('[data-cy="project-description-input"]').type(
      "Description of a test project",
    );
    cy.get('[data-cy="create-project-button"]').click();
    cy.visit("/");
    cy.contains("Create Test Project").should("exist");
    cy.contains("Description of a test project").should("exist");
  });
});
