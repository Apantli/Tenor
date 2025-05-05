import type {
  TestProjectInfo,
  TestUserStory,
  TestTask,
} from "cypress/fixtures/types";

describe("Tasks", () => {
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

  it("TC031: Create user story alert message", () => {
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
    });

    cy.get('[data-cy="primary-button"]').contains("+ Add task").click();
  });
});