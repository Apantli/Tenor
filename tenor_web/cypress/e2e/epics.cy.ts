import type { TestEpic } from "cypress/fixtures/types";


describe("Epics", () => {

  // Return to dashboard and select the project
  beforeEach(() => {
    cy.navigateToSharedProject();
    cy.get('[data-cy="userStories"]').click();
  });

  it("TC020: Filter Epics", () => {
    cy.fixture("testEpic").then((data: TestEpic) => {
      cy.get('[data-cy="primary-button"]').contains("+ New Epic").click();
      cy.get('[data-cy="popup"]').within(() => {
        cy.get('[placeholder="Briefly describe your epic..."]').type(
          data.title,
        );
        cy.get('[placeholder="Explain the purpose of this epic..."]').type(
          data.description,
        );
        cy.get('[data-cy="primary-button"]').contains("Create epic").click();
      });
      cy.get('[data-cy="primary-button"]', { timeout: 5000 }).contains("+ New Epic").click();
      cy.get('[data-cy="popup"]').within(() => {
        cy.get('[placeholder="Briefly describe your epic..."]').type(
          "User Register",
        );
        cy.get('[data-cy="primary-button"]').contains("Create epic").click();
      });
      cy.get('.mb-3 > .relative > [data-cy="search-bar"]', {timeout: 5000 }).type("Login");
      cy.contains(data.title).should("be.visible");
      cy.get('.mb-3 > .relative > [data-cy="search-bar"]').clear();
      cy.get('.mb-3 > .relative > [data-cy="search-bar"]').type("Register");
      cy.contains("User Register").should("be.visible");
      cy.get('.mb-3 > .relative > [data-cy="search-bar"]').clear();
      cy.get('.mb-3 > .relative > [data-cy="search-bar"]').type("User");
      cy.contains(data.title).should("be.visible");
      cy.contains("User Register").should("be.visible");
      cy.get('.mb-3 > .relative > [data-cy="search-bar"]').clear();
      cy.get('.mb-3 > .relative > [data-cy="search-bar"]').type("1");
      cy.contains(data.title).should("be.visible");
    });
  });

  it("TC021: Epic Detail", () => {
    cy.fixture("testEpic").then((data: TestEpic) => {
      cy.contains(data.title).click();
      cy.contains(data.title).should("be.visible");
      cy.contains(data.description).should("be.visible");
    });
  });

  it("TC022: Edit Epic", () => {
    cy.contains("EP01").click();
    cy.get(".shrink > .overflow-hidden > .justify-between > .flex").click();
    cy.get('[placeholder="Your epic name"]').click();
    cy.get('[placeholder="Your epic name"]')
      .clear()
      .type("Test epic edited", { force: true });
    cy.get(".pr-9").click();
    cy.get(".pr-9")
      .clear()
      .type("Test epic description edited", { force: true });
    cy.contains("Save").click();
  });

  it("TC023: Delete Epic", () => {
    cy.contains("EP01").click();
    cy.get('[data-cy="delete-button"]').click();
    cy.get('[data-cy="confirm-button"]').click();
  });
});
