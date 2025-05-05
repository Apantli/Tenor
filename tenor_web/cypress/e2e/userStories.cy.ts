import type { TestProjectInfo, TestUserStory } from "cypress/fixtures/types";

describe("User Stories", () => {
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

  it("TC029: Create empty user story", () => {
    cy.fixture("TestUserStory").then((data: TestUserStory) => {
      cy.get('[data-cy="primary-button"]').contains("+ New Story").click();
      cy.get('[data-cy="primary-button"]').contains("Create story").click();

      cy.contains("Please enter a name for the user story.").should(
        "be.visible",
      );
    });
  });

  it("TC031: Create user story", () => {
    cy.fixture("TestUserStory").then((data: TestUserStory) => {
      cy.get('[data-cy="primary-button"]').contains("+ New Story").click();

      cy.get('[data-cy="popup"]').within(() => {
        cy.get('[placeholder="Short summary of the story..."]').type(
          data.title,
        );
        cy.get('[placeholder="Explain the story in detail..."]').type(
          data.description,
        );
        cy.get(
          '[placeholder="Describe the work that needs to be done..."]',
        ).type(data.acceptanceCriteria);
        cy.get('[data-cy="primary-button"]').contains("Create story").click();
      });

      cy.get('[data-cy="popup"]').within(() => {
        cy.contains(data.title).should("be.visible");
      });
    });
  });

  it("TC017: User story appears on table", () => {
    cy.fixture("TestUserStory").then((data: TestUserStory) => {
      cy.contains("US01").should("be.visible");
      cy.contains(data.title).should("be.visible");
      cy.contains("No Epic").should("be.visible");
    });
  });

  it("TC028: See user story details", () => {
    cy.fixture("TestUserStory").then((data: TestUserStory) => {
      cy.contains(data.title).click();

      cy.get('[data-cy="popup"]').within(() => {
        cy.contains(data.title).should("be.visible");
        cy.contains(data.description).should("be.visible");
        cy.get('[data-cy="tertiary-button"]').contains("Show").click();
        cy.contains(data.acceptanceCriteria.replace("-", "").trim()).should(
          "be.visible",
        );
      });
    });
  });
});
