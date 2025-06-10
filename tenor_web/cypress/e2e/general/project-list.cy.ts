import type { TestProjectInfo } from "cypress/fixtures/types";

describe("test list projects", () => {
  beforeEach(() => {
    cy.signIn("/");
  });

  it("TC001: Create a project and view it", () => {
    // Dummy test example to view it
    cy.get('[data-cy="new-project-button"]').click();
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

  it("TC003: Filter projects", () => {
    cy.openSharedProject();
    cy.visit("/");
    // Navigate to the homepage
    cy.fixture("testProjectInfo").then((data: TestProjectInfo) => {
      cy.get(
        '.lg\\:mr-10 > .justify-between > .relative > [data-cy="search-bar"]',
      ).type(data.name);
      cy.contains(data.name).should("be.visible");
      cy.get(
        '.lg\\:mr-10 > .justify-between > .relative > [data-cy="search-bar"]',
      )
        .clear()
        .type(data.name.toUpperCase());
      cy.contains(data.name).should("be.visible");
    });
  });
});
