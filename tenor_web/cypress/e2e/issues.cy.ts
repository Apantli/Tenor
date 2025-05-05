import type { TestProjectInfo, TestIssue } from "cypress/fixtures/types";

describe("Issues", () => {
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
    cy.get('[data-cy="issues"]').click();
  });

  it("TC055: Create new issue", () => {
    cy.fixture("testIssue").then((data: TestIssue) => {
      cy.get('[data-cy="primary-button"]').contains("+ New Issue").click();

      cy.get('[data-cy="popup"]').within(() => {
        cy.get('[placeholder="Short summary of the issue..."]').type(
          data.title,
        );
        cy.get('[placeholder="Explain the issue in detail..."]').type(
          data.description,
        );
        cy.get(
          '[placeholder="Describe the steps to recreate the issue..."]',
        ).type(data.stepsToRecreate);
        cy.get('[data-cy="primary-button"]').contains("Create Issue").click();
      });

      cy.get('[data-cy="popup"]').within(() => {
        cy.contains(data.title).should(
          "be.visible",
        );
      });
    });
  });

  it("TC056: Find issue", () => {
    cy.fixture("testIssue").then((data: TestIssue) => {
        cy.get('[data-cy="primary-button"]').contains("+ New Issue").click();
        cy.get('[data-cy="popup"]').within(() => {
          cy.get('[placeholder="Short summary of the issue..."]').type(
            "Non-important issue"
          )
          cy.get('[data-cy="primary-button"]').contains("Create Issue").click();
        });
        cy.wait(1000);
        cy.get('[data-cy="popup-close-button"]').click();
        cy.get('[data-cy="search-bar"]').type(data.title);
        cy.contains(data.title).should("be.visible");
    });
  });
  
});