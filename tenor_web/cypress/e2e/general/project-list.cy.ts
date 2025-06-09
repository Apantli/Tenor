import type { TestProjectInfo } from "cypress/fixtures/types";

describe("test list projects", () => {
  beforeEach(() => {
    cy.openSharedProject();
  });

  it("TC001: Create a project and view it", () => {
    // Navigate to the homepage
    cy.visit("/");
    // Check if the logos exists
    cy.get(".flex-row > .flex").should("be.visible");
    cy.contains("Test Project").should("be.visible");
    cy.contains("Test Project").click();
  });

  it("TC003: Filter projects", () => {
    // Navigate to the homepage
    cy.visit("/");
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
