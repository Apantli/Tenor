describe("Test edit user stories", () => {
  // Create a project to view it
  before(() => {
    cy.signIn("/");
    // Dummy test example to view it
    cy.get(".mr-10 > .justify-between > .flex").click();
    cy.get('[placeholder="What is your project called..."]').type(
      "Test project",
    );

    // Create the project
    cy.get(".header > .flex").click();

    // Navigate to the homepage
    cy.visit("/");
    // Check if the logos exists
    cy.get(".flex-row > .flex").should("be.visible");
    cy.contains("Test project").should("be.visible");
    cy.contains("Test project").click();
  });

  beforeEach(() => {
    cy.signIn("/");
  });

  it("TC026: Change de title of a user story", () => {
    cy.contains("Test project").click();
    cy.contains("User Stories").click();
    cy.contains("New Story").click();
    cy.get('[placeholder="Short summary of the story..."]').click();
    cy.get('[placeholder="Short summary of the story..."]').type(
      "Test story",
    );
    cy.get('.shrink-0 > [data-cy="primary-button"]').click();
    cy.wait(2000);
    cy.get('.justify-between.gap-2 > .flex').click();
    cy.get('[placeholder="Short summary of the story..."]').click();
    cy.get('[placeholder="Short summary of the story..."]').clear().type("Test story edited", { force: true });
    cy.get('.shrink-0 > [data-cy="primary-button"]').click();
  });
});