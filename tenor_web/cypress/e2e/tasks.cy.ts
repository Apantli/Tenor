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

  it("TC035: Create user story alert message", () => {
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
    cy.get('[data-cy="primary-button"]').contains("Create Task").click();
    cy.contains("Oops").should("be.visible");
  });

  it("TC036: Create task", () => {
    cy.contains("US01").click();

    cy.get('[data-cy="primary-button"]').contains("+ Add task").click();

    cy.fixture("TestTask").then((data: TestTask) => {
      cy.get('[data-cy="popup"]').within(() => {
        cy.get('[placeholder="Enter task name..."]').type(data.name);
        cy.get('[placeholder="Task description"]').type(data.description);

        cy.get('[data-cy="primary-button"]').contains("Create Task").click();
      });
    });
  });

  it("TC038: Open tasks", () => {
    cy.contains("US01").click();

    cy.fixture("TestTask").then((data: TestTask) => {
      cy.get('[data-cy="popup"]').within(() => {
        cy.contains("TS01").click();
        cy.contains(data.description).should("be.visible");
      });
    });
  });
});