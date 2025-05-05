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

  it("TC034: Delete task", () => {
    cy.contains("Test project").click();
    cy.contains("User Stories").click();
    cy.contains("New Story").click();
    cy.get('[placeholder="Short summary of the story..."]').click();
    cy.get('[placeholder="Short summary of the story..."]').type(
      "Test story",
    );
    cy.get('.shrink-0 > [data-cy="primary-button"]').click();
    cy.wait(2000);
    cy.get('.mt-4.flex > .gap-3 > .gap-1 > [data-cy="primary-button"]').click();
    cy.get('[placeholder="Enter task name..."]').click();
    cy.get('[placeholder="Enter task name..."]').clear().type("Test task edited", { force: true });
    cy.get('.mt-4 > [data-cy="primary-button"]').click();
    cy.get('.font-sm > .overflow-x-auto > .p-2 > .h-full > :nth-child(1) > .flex').click();
    cy.get('.font-sm > .overflow-x-auto > .p-2 > .h-full > [data-cy="dropdown"] > .border-b > .w-full').click();
    cy.get('[data-cy="confirm-button"]').click();
  });
});