import type { TestProjectInfo, TestEpic } from "cypress/fixtures/types";

describe("Epics", () => {
  before(() => {
    cy.signIn("/");
    cy.createEmptyProject();
  });

  // Return to dashboard and select the project
  beforeEach(() => {
    cy.signIn("/");
    cy.fixture("testProjectInfo").then((data: TestProjectInfo) => {
      cy.get('[data-cy="project-list"]').find("li").contains(data.name).click();
    });
    cy.get('[data-cy="userStories"]').click();
  });

  it("TC020: Filter Epics", () => {
    cy.fixture("testEpic").then((data: TestEpic) => {
        cy.get('[data-cy="primary-button"]').contains("+ New Epic").click();
        cy.get('[data-cy="popup"]').within(() => {
          cy.get('[placeholder="Briefly describe your epic..."]').type(
            data.title,
          )
          cy.get('[placeholder="Explain the purpose of this epic..."]').type(
            data.description,
          )
          cy.get('[data-cy="primary-button"]').contains("Create epic").click();
        });
        cy.wait(1000);
        cy.get('[data-cy="primary-button"]').contains("+ New Epic").click();
        cy.get('[data-cy="popup"]').within(() => {
          cy.get('[placeholder="Briefly describe your epic..."]').type(
            "User Register"
          )
          cy.get('[data-cy="primary-button"]').contains("Create epic").click();
        });
        cy.wait(1000);
        cy.get('.mb-3 > .relative > [data-cy="search-bar"]').type("Login");
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

  it("TC021: Epic detail", () => {
    cy.fixture("testEpic").then((data: TestEpic) => {
        cy.contains(data.title).click();
        cy.contains(data.title).should("be.visible");
        cy.contains(data.description).should("be.visible");
    });
  });
  
});