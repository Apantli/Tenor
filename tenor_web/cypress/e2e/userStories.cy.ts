import type { TestUserStory } from "cypress/fixtures/types";

describe("User Stories", () => {
  beforeEach(() => {
    cy.openSharedProject();
    cy.get('[data-cy="userStories"]').click();
    cy.window().then((window) => {
      window.localStorage.removeItem("persistent_value:showEpics");
    });
    cy.get('[data-cy="dismiss-sidebar"]').click();
  });

  it("TC016: No user stories message", () => {
    cy.contains("No user stories found").should("exist");
  });

  it("TC029: Create empty user story", () => {
    cy.get('[data-cy="primary-button"]').contains("+ New Story").click();
    cy.get('[data-cy="primary-button"]').contains("Create story").click();

    cy.contains("Please enter a name for the user story.").should("be.visible");
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

        cy.contains(data.title).should("be.visible");
      });
    });
  });

  it("TC017: User story appears on table", () => {
    cy.fixture("TestUserStory").then((data: TestUserStory) => {
      // FIXME: Check for the other fields
      cy.contains("US01").should("be.visible");
      cy.contains(data.title).should("be.visible");
      cy.contains("No Epic").should("be.visible");
    });
  });

  it("TC018: Find User story", () => {
    cy.fixture("TestUserStory").then((data: TestUserStory) => {
      cy.get('[placeholder="Find a user story by title or Id..."]').type(
        data.title,
      );
      cy.contains(data.title).should("be.visible");
    });
  });

  it("TC028: See user story details", () => {
    cy.fixture("TestUserStory").then((data: TestUserStory) => {
      cy.get(".h-12").contains(data.title).click();

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

  it("TC026: Change de title of a user story", () => {
    cy.fixture("TestUserStory").then((data: TestUserStory) => {
      cy.get(".h-12").contains(data.title).click();
      cy.get(".justify-between.gap-2 > .flex").click();
      cy.get('[placeholder="Short summary of the story..."]')
        .clear()
        .type("Test story edited", { force: true });
      cy.get('.shrink-0 > [data-cy="primary-button"]').click();
    });
  });
});
