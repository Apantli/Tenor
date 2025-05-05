describe("Test edit epics", () => {
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

  it("TC023: Delete Epic", () => {
    cy.contains("Test project").click();
    cy.contains("User Stories").click();
    cy.contains("New Epic").click();
    cy.get(".pt-0").should("be.visible");
    cy.get('[placeholder="Briefly describe your epic..."]').click();
    cy.get('[placeholder="Briefly describe your epic..."]').type(
      "Test epic",
    );
    cy.contains("Create epic").click();
    cy.wait(1000);
    cy.contains("EP01").click();
    cy.get('[data-cy="delete-button"]').click();
    cy.wait(1000);
    cy.get('[data-cy="confirm-button"]').click();
    
  });
});