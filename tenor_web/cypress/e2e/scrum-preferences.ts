describe("Test Scrum preferences", () => {
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
    cy.contains("Test project settings").should("be.visible");
    cy.contains("Test project settings").click();
  });

  beforeEach(() => {
    cy.signIn("/");
    cy.contains("Test project setting").click();
  });

  it("Requirements pop up", () => {
    cy.contains("Test project").click();
    cy.contains("Requirements").click();
    cy.get(".gap-1 > .bg-app-primary").click();
    cy.get('[data-cy="requirement-popup-footer"]').should("be.visible");
  });
});
