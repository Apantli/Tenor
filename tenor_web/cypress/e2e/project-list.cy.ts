describe("test list projects", () => {
  beforeEach(() => {
    cy.signIn("/");
  });

  it("Create a project and view it", () => {
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

  it("Filter projects", () => {
    // Dummy test example to view it
    cy.get(".mr-10 > .justify-between > .flex").click();
    cy.get('[placeholder="What is your project called..."]').type(
      "Test project",
    );
    // Create the project
    cy.get(".header > .flex").click();

    // Navigate to the homepage
    cy.visit("/");
    cy.get(".relative > .h-10").type("Test project");
    // Check if the logos exists
    cy.contains("Test project").should("be.visible");

    cy.get(".relative > .h-10").clear().type("TesT PROJECT");

    cy.contains("Test project").should("be.visible");
  });
});
